export function writeUleb128(value: number, writer: Buffer, offset: number = 0): number {
    let v = value;
    let currentOffset = offset;
    while (v >= 0x80) {
        writer.writeUInt8((v & 0x7f) | 0x80, currentOffset);
        v >>= 7;
        currentOffset++;
    }
    writer.writeUInt8(v, currentOffset);
    return currentOffset + 1 - offset;
}

export function writeOsuString(value: string | null, writer: Buffer, offset: number = 0): number {
    if (value === null || value.length === 0) {
        writer.writeUInt8(0, offset);
        return 1;
    }

    let currentOffset = offset;
    writer.writeUInt8(0x0b, currentOffset);
    currentOffset++;
    
    const lengthBytes = writeUleb128(value.length, writer, currentOffset);
    currentOffset += lengthBytes;
    
    writer.write(value, currentOffset);
    return currentOffset + value.length - offset;
}

export class BinaryWriter {
    private buffer: Buffer;
    private offset: number = 0;

    constructor(initialSize: number = 1024) {
        this.buffer = Buffer.alloc(initialSize);
    }

    private ensureCapacity(length: number) {
        if (this.offset + length > this.buffer.length) {
            const newBuffer = Buffer.alloc(Math.max(this.buffer.length * 2, this.offset + length));
            newBuffer.set(this.buffer);
            this.buffer = newBuffer;
        }
    }

    writeU8(value: number): this {
        this.ensureCapacity(1);
        this.buffer.writeUInt8(value, this.offset);
        this.offset += 1;
        return this;
    }

    writeI16LE(value: number): this {
        this.ensureCapacity(2);
        this.buffer.writeInt16LE(value, this.offset);
        this.offset += 2;
        return this;
    }

    writeI32LE(value: number): this {
        this.ensureCapacity(4);
        this.buffer.writeInt32LE(value, this.offset);
        this.offset += 4;
        return this;
    }

    writeI64LE(value: bigint | number): this {
        this.ensureCapacity(8);
        this.buffer.writeBigInt64LE(BigInt(value), this.offset);
        this.offset += 8;
        return this;
    }

    writeOsuString(value: string | null): this {
        // Upper bound for ULEB128 length + string content
        this.ensureCapacity((value?.length ?? 0) + 11);
        const written = writeOsuString(value, this.buffer, this.offset);
        this.offset += written;
        return this;
    }

    writeRaw(data: Buffer): this {
        this.ensureCapacity(data.length);
        this.buffer.set(data, this.offset);
        this.offset += data.length;
        return this;
    }

    get data(): Buffer {
        return this.buffer.subarray(0, this.offset);
    }
}
