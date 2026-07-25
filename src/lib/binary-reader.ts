export class BinaryReader {
  private view: DataView;
  private offset: number;

  constructor(buffer: ArrayBuffer) {
    this.view = new DataView(buffer);
    this.offset = 0;
  }

  get length(): number {
    return this.view.byteLength;
  }

  get position(): number {
    return this.offset;
  }

  seek(pos: number): void {
    if (pos < 0 || pos > this.view.byteLength) {
      throw new Error(`Seek out of bounds: ${pos}`);
    }
    this.offset = pos;
  }

  skip(bytes: number): void {
    this.seek(this.offset + bytes);
  }

  readUint8(): number {
    return this.view.getUint8(this.offset++);
  }

  readUint16(le: boolean = false): number {
    const val = this.view.getUint16(this.offset, le);
    this.offset += 2;
    return val;
  }

  readUint32(le: boolean = false): number {
    const val = this.view.getUint32(this.offset, le);
    this.offset += 4;
    return val;
  }

  readBytes(count: number): Uint8Array {
    const bytes = new Uint8Array(this.view.buffer, this.offset, count);
    this.offset += count;
    return bytes;
  }

  readString(length: number): string {
    const bytes = this.readBytes(length);
    return new TextDecoder("utf-8").decode(bytes);
  }

  readNullTerminatedString(maxLength: number = 1024): string {
    const bytes: number[] = [];
    for (let i = 0; i < maxLength; i++) {
      const b = this.readUint8();
      if (b === 0) break;
      bytes.push(b);
    }
    return new TextDecoder("utf-8").decode(new Uint8Array(bytes));
  }

  peekByte(): number {
    return this.view.getUint8(this.offset);
  }

  hasRemaining(): boolean {
    return this.offset < this.view.byteLength;
  }

  remaining(): number {
    return this.view.byteLength - this.offset;
  }

  slice(offset: number, length: number): Uint8Array {
    return new Uint8Array(this.view.buffer as ArrayBuffer, offset, length);
  }

  static fromBytes(bytes: Uint8Array): BinaryReader {
    return new BinaryReader((bytes.buffer as ArrayBuffer).slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
  }
}

export function bytesToString(bytes: Uint8Array): string {
  return new TextDecoder("utf-8").decode(bytes);
}
