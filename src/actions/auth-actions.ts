"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function verifyWorkerPin(pin: string) {
  const workers = await prisma.user.findMany({
    where: { role: "WORKER", isActive: true },
  });

  for (const worker of workers) {
    if (worker.pinCodeHash) {
      const match = await bcrypt.compare(pin, worker.pinCodeHash);
      if (match) {
        return {
          success: true,
          worker: {
            id: worker.id,
            fullName: worker.fullName,
            role: worker.role,
          },
        };
      }
    }
  }

  return { success: false, message: "PIN 4-digit tidak cocok." };
}

export async function getWorkersList() {
  return await prisma.user.findMany({
    where: { role: "WORKER", isActive: true },
    select: {
      id: true,
      fullName: true,
      role: true,
    },
    orderBy: { fullName: "asc" },
  });
}

export async function createWorker(fullName: string, pin: string) {
  const tenant = await prisma.tenant.findFirst();
  if (!tenant) throw new Error("Tenant tidak ditemukan.");

  const pinCodeHash = await bcrypt.hash(pin, 10);
  return await prisma.user.create({
    data: {
      tenantId: tenant.id,
      fullName,
      pinCodeHash,
      role: "WORKER",
    },
  });
}

