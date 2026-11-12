/**
 * ESC/POS binary command encoder for 58mm and 80mm portable Bluetooth thermal printers
 */

export interface PrintTicketPayload {
  shopName: string;
  orderNumber: string;
  customerName: string;
  serviceName: string;
  itemQrCode: string;
  itemNotes?: string | null;
  dateStr: string;
}

export class EscPosEncoder {
  private buffer: number[] = [];

  init() {
    this.buffer.push(0x1b, 0x40); // ESC @ (Initialize printer)
    return this;
  }

  alignCenter() {
    this.buffer.push(0x1b, 0x61, 0x01); // ESC a 1
    return this;
  }

  alignLeft() {
    this.buffer.push(0x1b, 0x61, 0x00); // ESC a 0
    return this;
  }

  bold(enable: boolean) {
    this.buffer.push(0x1b, 0x45, enable ? 0x01 : 0x00); // ESC E n
    return this;
  }

  doubleSize(enable: boolean) {
    // ESC ! n (bit 4: double height, bit 5: double width)
    this.buffer.push(0x1b, 0x21, enable ? 0x30 : 0x00);
    return this;
  }

  text(str: string) {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);
    for (let i = 0; i < bytes.length; i++) {
      this.buffer.push(bytes[i]);
    }
    return this;
  }

  newLine(count = 1) {
    for (let i = 0; i < count; i++) {
      this.buffer.push(0x0a);
    }
    return this;
  }

  divider(width = 32) {
    this.alignCenter();
    this.text("-".repeat(width));
    this.newLine();
    return this;
  }

  feedAndCut() {
    this.newLine(4);
    this.buffer.push(0x1d, 0x56, 0x41, 0x10); // GS V 65 16 (Cut paper partial)
    return this;
  }

  getBytes(): Uint8Array {
    return new Uint8Array(this.buffer);
  }
}

/**
 * Builds the binary ESC/POS payload for an item ticket
 */
export function buildThermalTicketBytes(payload: PrintTicketPayload, paperWidth = 32): Uint8Array {
  const enc = new EscPosEncoder();
  enc.init();

  // Header
  enc.alignCenter().bold(true).doubleSize(true);
  enc.text(payload.shopName);
  enc.newLine().doubleSize(false).bold(false);

  enc.divider(paperWidth);

  // Order & Item Info
  enc.alignLeft().bold(true);
  enc.text(`NOTA: ${payload.orderNumber}`);
  enc.newLine();
  enc.text(`ITEM: ${payload.itemQrCode}`);
  enc.newLine().bold(false);

  enc.text(`PLG : ${payload.customerName}`);
  enc.newLine();
  enc.text(`TGL : ${payload.dateStr}`);
  enc.newLine();
  enc.text(`LAY : ${payload.serviceName}`);
  enc.newLine();

  if (payload.itemNotes) {
    enc.text(`KET : ${payload.itemNotes}`);
    enc.newLine();
  }

  enc.divider(paperWidth);

  // QR Code token placeholder
  enc.alignCenter().bold(true);
  enc.text(`[ SCAN QR KODE DI BAWAH ]`);
  enc.newLine();
  enc.doubleSize(true);
  enc.text(payload.itemQrCode);
  enc.newLine().doubleSize(false).bold(false);

  enc.divider(paperWidth);
  enc.alignCenter();
  enc.text("* Tempelkan label ini pada fisik barang *");
  enc.feedAndCut();

  return enc.getBytes();
}

/**
 * Connects to Bluetooth Thermal Printer via Web Bluetooth API and writes bytes
 */
export async function printViaWebBluetooth(data: Uint8Array): Promise<boolean> {
  if (typeof window === "undefined" || !("bluetooth" in navigator)) {
    throw new Error("Web Bluetooth API tidak didukung di peramban ini. Silakan gunakan Chrome/Edge.");
  }

  try {
    const nav = navigator as unknown as {
      bluetooth: {
        requestDevice: (options: unknown) => Promise<{
          gatt: {
            connect: () => Promise<{
              getPrimaryService: (service: string | number) => Promise<{
                getCharacteristic: (char: string | number) => Promise<{
                  writeValue: (val: Uint8Array) => Promise<void>;
                }>;
              }>;
            }>;
          };
        }>;
      };
    };

    const device = await nav.bluetooth.requestDevice({
      filters: [{ services: ["000018f0-0000-1000-8000-00805f9b34fb"] }],
      optionalServices: [
        "000018f0-0000-1000-8000-00805f9b34fb",
        "e7810a71-73ae-499d-8c15-faa9aef0c3f2",
        "49535343-fe7d-4ae5-8fa9-9fafd205e455",
      ],
    });

    if (!device.gatt) throw new Error("GATT server tidak ditemukan pada perangkat.");
    const server = await device.gatt.connect();
    const service = await server.getPrimaryService("000018f0-0000-1000-8000-00805f9b34fb");
    const characteristic = await service.getCharacteristic("00002af1-0000-1000-8000-00805f9b34fb");

    // Send in chunks of 100 bytes to avoid Bluetooth buffer overflows
    const chunkSize = 100;
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      await characteristic.writeValue(chunk);
    }

    return true;
  } catch (error) {
    console.error("Bluetooth print error:", error);
    throw error;
  }
}

