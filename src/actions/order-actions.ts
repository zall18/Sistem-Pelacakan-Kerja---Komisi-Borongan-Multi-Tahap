"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createOrder(data: {
  customerName: string;
  customerPhone: string;
  items: {
    serviceId: string;
    itemNotes?: string;
    initialPhotos?: string[];
  }[];
}) {
  const tenant = await prisma.tenant.findFirst();
  if (!tenant) throw new Error("Tenant tidak ditemukan.");

  // Generate Nomor Nota berurutan (TRX-YYMM-XXXX)
  const now = new Date();
  const yearMonth = `${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, "0")}`;
  
  const countThisMonth = await prisma.order.count({
    where: {
      tenantId: tenant.id,
      orderNumber: { startsWith: `TRX-${yearMonth}-` },
    },
  });

  const nextSeq = String(countThisMonth + 1).padStart(4, "0");
  const orderNumber = `TRX-${yearMonth}-${nextSeq}`;

  // Ambil harga layanan untuk kalkulasi total transaksi
  const serviceIds = data.items.map((i) => i.serviceId);
  const services = await prisma.service.findMany({
    where: { id: { in: serviceIds } },
  });
  const serviceMap = new Map(services.map((s) => [s.id, s.basePrice]));

  let totalAmount = 0;
  for (const item of data.items) {
    totalAmount += serviceMap.get(item.serviceId) || 0;
  }

  // Buat Order beserta OrderItems dengan token QR unik per barang
  const order = await prisma.order.create({
    data: {
      tenantId: tenant.id,
      orderNumber,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      totalAmount,
      paymentStatus: "PAID",
      items: {
        create: data.items.map((item, index) => ({
          serviceId: item.serviceId,
          itemQrCode: `${orderNumber}-${index + 1}`,
          itemNotes: item.itemNotes || null,
          initialPhotos: JSON.stringify(item.initialPhotos || []),
          currentStatus: "RECEIVED",
        })),
      },
    },
    include: {
      items: {
        include: { service: true },
      },
    },
  });

  revalidatePath("/cashier");
  revalidatePath("/cashier/kanban");
  return order;
}

export async function getOrderById(orderId: string) {
  return await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      tenant: true,
      items: {
        include: {
          service: {
            include: {
              stages: { orderBy: { stepOrder: "asc" } },
            },
          },
          taskLogs: {
            include: {
              worker: true,
              serviceStage: true,
            },
          },
        },
      },
    },
  });
}

export async function getOrderItemByQr(itemQrCode: string) {
  const item = await prisma.orderItem.findUnique({
    where: { itemQrCode: itemQrCode.trim() },
    include: {
      order: {
        include: { tenant: true },
      },
      service: {
        include: {
          stages: { orderBy: { stepOrder: "asc" } },
        },
      },
      taskLogs: {
        include: {
          worker: true,
          serviceStage: true,
        },
        orderBy: { completedAt: "asc" },
      },
    },
  });

  return item;
}

export async function getKanbanOrders() {
  const tenant = await prisma.tenant.findFirst();
  if (!tenant) return [];

  const items = await prisma.orderItem.findMany({
    where: { order: { tenantId: tenant.id } },
    include: {
      order: true,
      service: {
        include: {
          stages: { orderBy: { stepOrder: "asc" } },
        },
      },
      taskLogs: {
        include: { worker: true, serviceStage: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return items;
}

export async function updateOrderItemStatus(itemId: string, newStatus: string) {
  const updated = await prisma.orderItem.update({
    where: { id: itemId },
    data: { currentStatus: newStatus },
  });
  revalidatePath("/cashier/kanban");
  revalidatePath("/cashier/qc");
  return updated;
}

export async function reportItemRedFlag(itemId: string, redFlagNotes: string) {
  const updated = await prisma.orderItem.update({
    where: { id: itemId },
    data: {
      hasRedFlag: true,
      redFlagNotes,
    },
  });
  revalidatePath("/cashier/kanban");
  return updated;
}

export async function resolveItemRedFlag(itemId: string) {
  const updated = await prisma.orderItem.update({
    where: { id: itemId },
    data: {
      hasRedFlag: false,
    },
  });
  revalidatePath("/cashier/kanban");
  return updated;
}

