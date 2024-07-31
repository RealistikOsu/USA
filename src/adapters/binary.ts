export function writeUleb128(value: number, writer: Buffer) {
  let v = value;
  while (v >= 0x80) {
    writer.writeUInt8(v | 0x80);
    v >>= 7;
  }
  writer.writeUInt8(v);
}

export function writeOsuString(value: string, writer: Buffer) {
  if (value.length === 0) {
    writer.writeUInt8(0);
    return;
  }

  writer.writeUint8(0x11);
  writeUleb128(value.length, writer);
  writer.write(value);
}
