"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function recordCashAdvance(data: {
  workerId: string;
  amount: number;
  notes?: string;
}) {
  const tenant = await prisma.tenant.findFirst();
  if (!tenant) throw new Error("Tenant tidak ditemukan.");

  const advance = await prisma.cashAdvance.create({
    data: {
      tenantId: tenant.id,
      workerId: data.workerId,
      amount: data.amount,
      notes: data.notes || "Kasbon pekerja",
      isSettled: false,
    },
  });

  revalidatePath("/owner/cash-advance");
  revalidatePath("/owner/payroll");
  return advance;
}

export async function getCashAdvances(filter?: { isSettled?: boolean; workerId?: string }) {
  const tenant = await prisma.tenant.findFirst();
  if (!tenant) return [];

  return await prisma.cashAdvance.findMany({
    where: {
      tenantId: tenant.id,
      ...(filter?.isSettled !== undefined ? { isSettled: filter.isSettled } : {}),
      ...(filter?.workerId ? { workerId: filter.workerId } : {}),
    },
    include: {
      worker: true,
    },
    orderBy: { issueDate: "desc" },
  });
}

export async function deleteCashAdvance(id: string) {
  await prisma.cashAdvance.delete({
    where: { id },
  });
  revalidatePath("/owner/cash-advance");
  revalidatePath("/owner/payroll");
  return { success: true };
}

