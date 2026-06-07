interface ZipEntry {
  name: string;
  bytes: Uint8Array;
}

export class SimpleZip {
  private files: ZipEntry[] = [];

  file(name: string, content: string | Uint8Array): void {
    const bytes = typeof content === "string" ? new TextEncoder().encode(content) : content;
    this.files.push({ name, bytes });
  }

  generate(type: string): Blob {
    const parts: Uint8Array[] = [];
    const central: Uint8Array[] = [];
    let offset = 0;

    for (const entry of this.files) {
      const nameBytes = new TextEncoder().encode(entry.name);
      const crc = crc32(entry.bytes);
      const header = concatBytes([
        u32(0x04034b50),
        u16(20),
        u16(0),
        u16(0),
        u16(0),
        u16(0),
        u32(crc),
        u32(entry.bytes.length),
        u32(entry.bytes.length),
        u16(nameBytes.length),
        u16(0),
        nameBytes,
      ]);
      parts.push(header, entry.bytes);
      central.push(
        concatBytes([
          u32(0x02014b50),
          u16(20),
          u16(20),
          u16(0),
          u16(0),
          u16(0),
          u16(0),
          u32(crc),
          u32(entry.bytes.length),
          u32(entry.bytes.length),
          u16(nameBytes.length),
          u16(0),
          u16(0),
          u16(0),
          u16(0),
          u32(0),
          u32(offset),
          nameBytes,
        ]),
      );
      offset += header.length + entry.bytes.length;
    }

    const centralBytes = concatBytes(central);
    const end = concatBytes([
      u32(0x06054b50),
      u16(0),
      u16(0),
      u16(this.files.length),
      u16(this.files.length),
      u32(centralBytes.length),
      u32(offset),
      u16(0),
    ]);

    parts.push(centralBytes, end);
    return new Blob(parts as unknown as BlobPart[], { type });
  }
}

const crcTable: Uint32Array = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let crc = -1;
  for (let i = 0; i < bytes.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ bytes[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

function u16(value: number): Uint8Array {
  return Uint8Array.of(value & 255, (value >>> 8) & 255);
}

function u32(value: number): Uint8Array {
  return Uint8Array.of(value & 255, (value >>> 8) & 255, (value >>> 16) & 255, (value >>> 24) & 255);
}

function concatBytes(parts: Uint8Array[]): Uint8Array {
  const size = parts.reduce((total, part) => total + part.length, 0);
  const output = new Uint8Array(size);
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
}
