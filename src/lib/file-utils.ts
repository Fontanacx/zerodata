export interface FileTypeResult {
  mime: string;
  extension: string;
}

const SIGNATURES: { mime: string; extension: string; bytes: number[]; offset: number }[] = [
  {
    mime: "image/jpeg",
    extension: "jpg",
    bytes: [0xff, 0xd8, 0xff],
    offset: 0,
  },
  {
    mime: "image/png",
    extension: "png",
    bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
    offset: 0,
  },
  {
    mime: "image/webp",
    extension: "webp",
    bytes: [0x52, 0x49, 0x46, 0x46],
    offset: 0,
  },
];

export function detectFileType(buffer: Uint8Array): FileTypeResult | null {
  for (const sig of SIGNATURES) {
    if (buffer.length < sig.offset + sig.bytes.length) continue;
    let match = true;
    for (let i = 0; i < sig.bytes.length; i++) {
      if (buffer[sig.offset + i] !== sig.bytes[i]) {
        match = false;
        break;
      }
    }
    if (match) {
      if (sig.mime === "image/webp") {
        if (
          buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
        ) {
          return { mime: "image/webp", extension: "webp" };
        }
        continue;
      }
      return { mime: sig.mime, extension: sig.extension };
    }
  }
  return null;
}

export function getFileExtension(mimeType: string): string {
  const ext = mimeType.split("/")[1];
  if (ext === "jpeg") return "jpg";
  return ext;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
