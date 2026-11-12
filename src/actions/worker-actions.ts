"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface ClaimTaskResult {
  success: boolean;
  message: string;
  earnedRate?: number;
  stageName?: string;
  nextStatus?: string;
  workerStats?: {
    todayEarnings: number;
    weeklyEarnings: number;
    todayTasksCount: number;
  };
}

export async function claimStageTask(input: {
  itemQrCode: string;
  serviceStageId: string;
  workerId: string;
  photoProofUrl?: string;
}): Promise<ClaimTaskResult> {
  const { itemQrCode, serviceStageId, workerId, photoProofUrl } = input;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Ambil OrderItem beserta Service, Stages, dan TaskLogs yang sudah ada
      const item = await tx.orderItem.findUnique({
        where: { itemQrCode: itemQrCode.trim() },
        include: {
          service: {
            include: {
              stages: { orderBy: { stepOrder: "asc" } },
            },
          },
          taskLogs: true,
        },
      });

      if (!item) {
        throw new Error("Item tidak ditemukan. Pastikan kode QR valid.");
      }

      if (item.currentStatus === "COMPLETED") {
        throw new Error("Item ini sudah berstatus selesai/diambil oleh pelanggan.");
      }

      // 2. Cari tahap yang ingin diklaim
      const targetStage = item.service.stages.find((s) => s.id === serviceStageId);
      if (!targetStage) {
        throw new Error("Tahap yang dipilih tidak valid untuk layanan ini.");
      }

      // 3. ATURAN KRITIS 1: Pencegahan Klaim Ganda (Anti-Double Claim)
      const alreadyClaimed = item.taskLogs.some(
        (log) => log.serviceStageId === serviceStageId
      );
      if (alreadyClaimed) {
        throw new Error("Tahapan ini sudah pernah diselesaikan dan diklaim sebelumnya.");
      }

      // 4. ATURAN KRITIS 2: Pencegahan Loncat Tahap (Sequential Dependency Check)
      if (targetStage.stepOrder > 1) {
        const previousStages = item.service.stages.filter(
          (s) => s.stepOrder < targetStage.stepOrder
        );
        const completedStageIds = new Set(item.taskLogs.map((l) => l.serviceStageId));

        const uncompletedPrevStage = previousStages.find(
          (s) => !completedStageIds.has(s.id)
        );

        if (uncompletedPrevStage) {
          throw new Error(
            `Tahapan sebelumnya (${uncompletedPrevStage.stageName}) belum selesai dikerjakan.`
          );
        }
      }

      // 5. Simpan TaskLog dengan SNAPSHOT tarif komisi saat ini (Immutable)
      const taskLog = await tx.taskLog.create({
        data: {
          orderItemId: item.id,
          serviceStageId: targetStage.id,
          workerId: workerId,
          earnedRate: targetStage.pieceRateAmount, // Mengunci nilai upah
          photoProofUrl: photoProofUrl || null,
        },
      });

      // 6. Evaluasi Status OrderItem Selanjutnya
      const totalStagesCount = item.service.stages.length;
      const completedCount = item.taskLogs.length + 1;

      let nextStatus = "IN_PROGRESS";
      if (completedCount >= totalStagesCount) {
        nextStatus = "QC_PENDING"; // Semua tahap tuntas, masuk meja QC
      }

      await tx.orderItem.update({
        where: { id: item.id },
        data: { currentStatus: nextStatus },
      });

      return {
        earnedRate: targetStage.pieceRateAmount,
        stageName: targetStage.stageName,
        nextStatus,
      };
    });

    // Ambil statistik terkini pekerja
    const stats = await getWorkerStats(workerId);

    revalidatePath("/worker");
    revalidatePath("/cashier/kanban");
    revalidatePath("/owner/payroll");

    return {
      success: true,
      message: `Berhasil menyelesaikan tahap "${result.stageName}"! Komisi bertambah.`,
      earnedRate: result.earnedRate,
      stageName: result.stageName,
      nextStatus: result.nextStatus,
      workerStats: stats,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Terjadi kesalahan internal.";
    return {
      success: false,
      message,
    };
  }
}

export async function getWorkerStats(workerId: string) {
  const now = new Date();
  
  // Awal hari ini (00:00:00)
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Awal minggu ini (Senin 00:00:00)
  const day = now.getDay();
  const diffToMonday = (day === 0 ? -6 : 1) - day;
  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday);

  const logs = await prisma.taskLog.findMany({
    where: {
      workerId,
      completedAt: { gte: startOfWeek },
    },
  });

  let todayEarnings = 0;
  let weeklyEarnings = 0;
  let todayTasksCount = 0;

  for (const log of logs) {
    weeklyEarnings += log.earnedRate;
    if (new Date(log.completedAt) >= startOfDay) {
      todayEarnings += log.earnedRate;
      todayTasksCount += 1;
    }
  }

  return {
    todayEarnings,
    weeklyEarnings,
    todayTasksCount,
  };
}

export async function getWorkerHistory(workerId: string) {
  return await prisma.taskLog.findMany({
    where: { workerId },
    include: {
      serviceStage: true,
      orderItem: {
        include: {
          order: true,
          service: true,
        },
      },
    },
    orderBy: { completedAt: "desc" },
    take: 50,
  });
}

