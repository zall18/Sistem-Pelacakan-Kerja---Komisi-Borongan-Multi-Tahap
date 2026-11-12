"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface WorkerPayrollSummary {
  workerId: string;
  workerName: string;
  taskCount: number;
  grossAmount: number;
  advanceAmount: number;
  netAmount: number;
  taskLogs: {
    id: string;
    stageName: string;
    serviceName: string;
    orderNumber: string;
    itemQrCode: string;
    earnedRate: number;
    completedAt: Date;
  }[];
  advances: {
    id: string;
    amount: number;
    notes: string | null;
    issueDate: Date;
  }[];
}

export async function getActivePayrollSummary(periodStart: Date, periodEnd: Date) {
  const tenant = await prisma.tenant.findFirst();
  if (!tenant) return [];

  // Ambil semua pekerja aktif
  const workers = await prisma.user.findMany({
    where: { tenantId: tenant.id, role: "WORKER", isActive: true },
    orderBy: { fullName: "asc" },
  });

  const summaries: WorkerPayrollSummary[] = [];

  for (const worker of workers) {
    // Ambil task logs yang belum ditutup payroll (payrollItemId is null) dan dalam rentang
    const logs = await prisma.taskLog.findMany({
      where: {
        workerId: worker.id,
        payrollItemId: null,
        completedAt: {
          gte: periodStart,
          lte: periodEnd,
        },
      },
      include: {
        serviceStage: true,
        orderItem: {
          include: {
            order: true,
            service: true,
          },
        },
      },
      orderBy: { completedAt: "asc" },
    });

    // Ambil kasbon yang belum lunas (isSettled: false)
    const advances = await prisma.cashAdvance.findMany({
      where: {
        workerId: worker.id,
        isSettled: false,
      },
      orderBy: { issueDate: "asc" },
    });

    const grossAmount = logs.reduce((acc, l) => acc + l.earnedRate, 0);
    const advanceAmount = advances.reduce((acc, a) => acc + a.amount, 0);
    const netAmount = Math.max(0, grossAmount - advanceAmount);

    summaries.push({
      workerId: worker.id,
      workerName: worker.fullName,
      taskCount: logs.length,
      grossAmount,
      advanceAmount,
      netAmount,
      taskLogs: logs.map((l) => ({
        id: l.id,
        stageName: l.serviceStage.stageName,
        serviceName: l.orderItem.service.name,
        orderNumber: l.orderItem.order.orderNumber,
        itemQrCode: l.orderItem.itemQrCode,
        earnedRate: l.earnedRate,
        completedAt: l.completedAt,
      })),
      advances: advances.map((a) => ({
        id: a.id,
        amount: a.amount,
        notes: a.notes,
        issueDate: a.issueDate,
      })),
    });
  }

  return summaries;
}

export async function closePayrollPeriod(data: {
  periodStart: Date;
  periodEnd: Date;
  closedByUserId: string;
}) {
  const tenant = await prisma.tenant.findFirst();
  if (!tenant) throw new Error("Tenant tidak ditemukan.");

  const summaries = await getActivePayrollSummary(data.periodStart, data.periodEnd);
  const eligibleWorkers = summaries.filter((s) => s.taskCount > 0 || s.advanceAmount > 0);

  if (eligibleWorkers.length === 0) {
    throw new Error("Tidak ada transaksi pekerjaan atau kasbon yang perlu ditutup pada periode ini.");
  }

  const totalGross = eligibleWorkers.reduce((acc, w) => acc + w.grossAmount, 0);
  const totalAdvances = eligibleWorkers.reduce((acc, w) => acc + w.advanceAmount, 0);
  const totalNetPayout = eligibleWorkers.reduce((acc, w) => acc + w.netAmount, 0);

  return await prisma.$transaction(async (tx) => {
    // 1. Buat PayrollRun
    const run = await tx.payrollRun.create({
      data: {
        tenantId: tenant.id,
        periodStart: data.periodStart,
        periodEnd: data.periodEnd,
        totalGross,
        totalAdvances,
        totalNetPayout,
        closedByUserId: data.closedByUserId,
      },
    });

    // 2. Buat PayrollItem per pekerja dan kunci TaskLogs serta CashAdvances
    for (const w of eligibleWorkers) {
      const payrollItem = await tx.payrollItem.create({
        data: {
          payrollRunId: run.id,
          workerId: w.workerId,
          grossAmount: w.grossAmount,
          advanceAmount: w.advanceAmount,
          netAmount: w.netAmount,
          taskCount: w.taskCount,
          isPaid: true,
        },
      });

      // Kunci seluruh taskLogs yang terkait
      const logIds = w.taskLogs.map((l) => l.id);
      if (logIds.length > 0) {
        await tx.taskLog.updateMany({
          where: { id: { in: logIds } },
          data: { payrollItemId: payrollItem.id },
        });
      }

      // Kunci & lunas seluruh kasbon yang dipotong
      const advanceIds = w.advances.map((a) => a.id);
      if (advanceIds.length > 0) {
        await tx.cashAdvance.updateMany({
          where: { id: { in: advanceIds } },
          data: {
            payrollItemId: payrollItem.id,
            isSettled: true,
          },
        });
      }
    }

    revalidatePath("/owner/payroll");
    revalidatePath("/owner/cash-advance");
    return run;
  });
}

export async function getPayrollRuns() {
  const tenant = await prisma.tenant.findFirst();
  if (!tenant) return [];

  return await prisma.payrollRun.findMany({
    where: { tenantId: tenant.id },
    include: {
      items: {
        include: { worker: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

