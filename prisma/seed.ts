import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Memulai seeding data UMKM...");

  // 1. Bersihkan data lama jika ada
  await prisma.taskLog.deleteMany();
  await prisma.payrollItem.deleteMany();
  await prisma.payrollRun.deleteMany();
  await prisma.cashAdvance.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.serviceStage.deleteMany();
  await prisma.service.deleteMany();
  await prisma.user.deleteMany();
  await prisma.tenant.deleteMany();

  // 2. Buat Tenant UMKM
  const tenant = await prisma.tenant.create({
    data: {
      name: "Sneakers & Leather Care Pro",
      phone: "081234567890",
      address: "Jl. Gejayan No. 45, Sleman, DI Yogyakarta",
    },
  });
  console.log("✅ Tenant dibuat:", tenant.name);

  // 3. Buat Pengguna (Owner, Cashier, Workers)
  const defaultPasswordHash = await bcrypt.hash("password123", 10);
  const pin1111 = await bcrypt.hash("1111", 10);
  const pin2222 = await bcrypt.hash("2222", 10);
  const pin3333 = await bcrypt.hash("3333", 10);
  const pin4444 = await bcrypt.hash("4444", 10);
  const pin1234 = await bcrypt.hash("1234", 10);

  const owner = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      fullName: "Budi Pratama (Owner)",
      email: "owner@demo.com",
      passwordHash: defaultPasswordHash,
      pinCodeHash: pin1234,
      role: "OWNER",
    },
  });

  const cashier = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      fullName: "Siti Rahma (Kasir)",
      email: "cashier@demo.com",
      passwordHash: defaultPasswordHash,
      pinCodeHash: pin2222,
      role: "CASHIER",
    },
  });

  const worker1 = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      fullName: "Agus Cuci (Teknisi 1)",
      pinCodeHash: pin1111,
      role: "WORKER",
    },
  });

  const worker2 = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      fullName: "Bambang Repaint (Teknisi 2)",
      pinCodeHash: pin3333,
      role: "WORKER",
    },
  });

  const worker3 = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      fullName: "Doni Finishing & QC (Teknisi 3)",
      pinCodeHash: pin4444,
      role: "WORKER",
    },
  });
  console.log("✅ Pengguna & Role dibuat (Owner, Kasir, 3 Teknisi).");

  // 4. Buat Master Layanan & Tahapan Berantai
  const serviceDeepClean = await prisma.service.create({
    data: {
      tenantId: tenant.id,
      name: "Deep Clean Canvas & Suede",
      description: "Pembersihan menyeluruh noda membandel pada upper, insole, midsole & outsole.",
      basePrice: 35000,
      stages: {
        create: [
          {
            stageName: "Deep Cleaning & Washing",
            stepOrder: 1,
            pieceRateAmount: 8000,
            estimatedMinutes: 30,
            isPhotoRequired: true,
          },
          {
            stageName: "Unyellowing / Soling",
            stepOrder: 2,
            pieceRateAmount: 12000,
            estimatedMinutes: 45,
            isPhotoRequired: false,
          },
          {
            stageName: "Finishing & QC Packaging",
            stepOrder: 3,
            pieceRateAmount: 3000,
            estimatedMinutes: 15,
            isPhotoRequired: true,
          },
        ],
      },
    },
    include: { stages: true },
  });

  const serviceRepaint = await prisma.service.create({
    data: {
      tenantId: tenant.id,
      name: "Repaint Midsole & Leather Restoration",
      description: "Pengecatan ulang sol dan restorasi bahan kulit sintetis/asli.",
      basePrice: 75000,
      stages: {
        create: [
          {
            stageName: "Deglazing & Prep Bahan",
            stepOrder: 1,
            pieceRateAmount: 10000,
            estimatedMinutes: 20,
            isPhotoRequired: false,
          },
          {
            stageName: "Pewarnaan & Painting (2 Layer)",
            stepOrder: 2,
            pieceRateAmount: 25000,
            estimatedMinutes: 60,
            isPhotoRequired: true,
          },
          {
            stageName: "Top Coat Sealant & QC",
            stepOrder: 3,
            pieceRateAmount: 5000,
            estimatedMinutes: 15,
            isPhotoRequired: true,
          },
        ],
      },
    },
    include: { stages: true },
  });
  console.log("✅ Master Layanan & Tahapan berhasil dibuat.");

  // 5. Buat Transaksi Contoh (Orders & Order Items)
  const order1 = await prisma.order.create({
    data: {
      tenantId: tenant.id,
      orderNumber: "TRX-2611-0001",
      customerName: "Rian Hidayat",
      customerPhone: "081987654321",
      totalAmount: 110000,
      paymentStatus: "PAID",
      items: {
        create: [
          {
            serviceId: serviceDeepClean.id,
            itemQrCode: "TRX-2611-0001-1",
            itemNotes: "Sepatu Nike Air Force 1 Putih - noda lumpur di midsole",
            currentStatus: "IN_PROGRESS",
          },
          {
            serviceId: serviceRepaint.id,
            itemQrCode: "TRX-2611-0001-2",
            itemNotes: "Sepatu Adidas Stan Smith - cat kuning mengelupas di toe cap",
            currentStatus: "RECEIVED",
          },
        ],
      },
    },
    include: { items: true },
  });

  const order2 = await prisma.order.create({
    data: {
      tenantId: tenant.id,
      orderNumber: "TRX-2611-0002",
      customerName: "Dewi Lestari",
      customerPhone: "085712345678",
      totalAmount: 35000,
      paymentStatus: "PAID",
      items: {
        create: [
          {
            serviceId: serviceDeepClean.id,
            itemQrCode: "TRX-2611-0002-1",
            itemNotes: "Sepatu Vans Old Skool Hitam - kanvas berdebu tebal",
            currentStatus: "QC_PENDING",
          },
        ],
      },
    },
    include: { items: true },
  });
  console.log("✅ Data Pesanan Contoh (Orders & Items dengan QR) dibuat.");

  // 6. Buat Task Logs Selesai (Agar saldo pekerja langsung memiliki data awal yang realistis)
  const item1Order1 = order1.items[0]; // TRX-2611-0001-1
  const stage1DeepClean = serviceDeepClean.stages.find((s) => s.stepOrder === 1)!;
  const stage2DeepClean = serviceDeepClean.stages.find((s) => s.stepOrder === 2)!;
  const stage3DeepClean = serviceDeepClean.stages.find((s) => s.stepOrder === 3)!;

  // Agus mengerjakan Tahap 1 pada item 1
  await prisma.taskLog.create({
    data: {
      orderItemId: item1Order1.id,
      serviceStageId: stage1DeepClean.id,
      workerId: worker1.id,
      earnedRate: stage1DeepClean.pieceRateAmount,
    },
  });

  // Bambang mengerjakan Tahap 2 pada item 1
  await prisma.taskLog.create({
    data: {
      orderItemId: item1Order1.id,
      serviceStageId: stage2DeepClean.id,
      workerId: worker2.id,
      earnedRate: stage2DeepClean.pieceRateAmount,
    },
  });

  // Pada item order 2 (TRX-2611-0002-1), semua tahap sudah selesai sehingga masuk QC_PENDING
  const itemOrder2 = order2.items[0];
  await prisma.taskLog.create({
    data: {
      orderItemId: itemOrder2.id,
      serviceStageId: stage1DeepClean.id,
      workerId: worker1.id,
      earnedRate: stage1DeepClean.pieceRateAmount,
    },
  });

  await prisma.taskLog.create({
    data: {
      orderItemId: itemOrder2.id,
      serviceStageId: stage2DeepClean.id,
      workerId: worker2.id,
      earnedRate: stage2DeepClean.pieceRateAmount,
    },
  });

  await prisma.taskLog.create({
    data: {
      orderItemId: itemOrder2.id,
      serviceStageId: stage3DeepClean.id,
      workerId: worker3.id,
      earnedRate: stage3DeepClean.pieceRateAmount,
    },
  });

  // 7. Buat Kasbon Pekerja (Contoh: Agus pernah kasbon Rp100.000)
  await prisma.cashAdvance.create({
    data: {
      tenantId: tenant.id,
      workerId: worker1.id,
      amount: 100000,
      notes: "Kasbon untuk beli susu anak (disetujui Owner)",
      isSettled: false,
    },
  });
  console.log("✅ Data Kasbon Contoh dibuat untuk Agus (Rp100.000).");

  console.log("\n🚀 SEEDING SELESAI!");
  console.log("-------------------------------------------------------------");
  console.log("Akun Demo:");
  console.log("1. Owner   : Email 'owner@demo.com'   / PIN '1234' (Pass: password123)");
  console.log("2. Kasir   : Email 'cashier@demo.com' / PIN '2222' (Pass: password123)");
  console.log("3. Teknisi : Agus (PIN '1111'), Bambang (PIN '3333'), Doni (PIN '4444')");
  console.log("Contoh QR Item siap scan di bengkel: TRX-2611-0001-1, TRX-2611-0001-2, TRX-2611-0002-1");
  console.log("-------------------------------------------------------------");
}

main()
  .catch((e) => {
    console.error("❌ Gagal seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

