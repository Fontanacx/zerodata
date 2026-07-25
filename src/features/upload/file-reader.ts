import { detectFileType } from "@/lib/file-utils";

export type FileReadErrorCode = "unsupported_type" | "file_too_large" | "read_error";

export interface ReadFileResult {
  buffer: ArrayBuffer;
  fileName: string;
  fileSize: number;
  mimeType: string;
  error?: string;
  errorCode?: FileReadErrorCode;
}

const MAX_FILE_SIZE = 100 * 1024 * 1024;
const MAGIC_BYTES_READ = 16;

export function readFileAsArrayBuffer(file: Blob): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to read file as ArrayBuffer"));
      }
    };
    reader.onerror = () => reject(new Error("File read error"));
    reader.readAsArrayBuffer(file);
  });
}

async function readMagicBytes(file: File): Promise<Uint8Array> {
  const slice = file.slice(0, MAGIC_BYTES_READ);
  const buffer = await readFileAsArrayBuffer(slice);
  return new Uint8Array(buffer);
}

export async function readAndValidateFile(file: File): Promise<ReadFileResult> {
  if (file.size > MAX_FILE_SIZE) {
    return {
      buffer: new ArrayBuffer(0),
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type || "unknown",
      error: "File size exceeds 100MB limit",
      errorCode: "file_too_large",
    };
  }

  const magic = await readMagicBytes(file);
  const fileType = detectFileType(magic);

  if (!fileType) {
    return {
      buffer: new ArrayBuffer(0),
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type || "unknown",
      error: `Unsupported file type: ${file.type || "unknown"}. Supported formats: JPEG, PNG, WebP`,
      errorCode: "unsupported_type",
    };
  }

  const buffer = await readFileAsArrayBuffer(file);

  return {
    buffer,
    fileName: file.name,
    fileSize: file.size,
    mimeType: fileType.mime,
  };
}
