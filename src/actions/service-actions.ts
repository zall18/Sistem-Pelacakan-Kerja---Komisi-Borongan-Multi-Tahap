"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getServicesWithStages() {
  const tenant = await prisma.tenant.findFirst();
  if (!tenant) return [];

  return await prisma.service.findMany({
    where: { tenantId: tenant.id, isActive: true },
    include: {
      stages: {
        orderBy: { stepOrder: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createService(formData: {
  name: string;
  description?: string;
  basePrice: number;
  stages: {
    stageName: string;
    stepOrder: number;
    pieceRateAmount: number;
    estimatedMinutes: number;
    isPhotoRequired: boolean;
  }[];
}) {
  const tenant = await prisma.tenant.findFirst();
  if (!tenant) throw new Error("Tenant tidak ditemukan.");

  const service = await prisma.service.create({
    data: {
      tenantId: tenant.id,
      name: formData.name,
      description: formData.description,
      basePrice: formData.basePrice,
      stages: {
        create: formData.stages.map((st, idx) => ({
          stageName: st.stageName,
          stepOrder: idx + 1,
          pieceRateAmount: st.pieceRateAmount,
          estimatedMinutes: st.estimatedMinutes || 30,
          isPhotoRequired: st.isPhotoRequired || false,
        })),
      },
    },
    include: { stages: true },
  });

  revalidatePath("/owner/services");
  revalidatePath("/cashier");
  return service;
}

export async function deleteService(serviceId: string) {
  await prisma.service.update({
    where: { id: serviceId },
    data: { isActive: false },
  });
  revalidatePath("/owner/services");
  return { success: true };
}

