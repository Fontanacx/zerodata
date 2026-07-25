import type { ParsedXmp } from "./types";

export async function parseXmp(
  input: ArrayBuffer | Uint8Array | File
): Promise<ParsedXmp | null> {
  const { parse } = await import("exifr");

  const output = (await parse(input, {
    xmp: true,
    exif: false,
    iptc: false,
    tiff: false,
    translateKeys: true,
    translateValues: true,
    reviveValues: true,
  })) as { data?: Record<string, unknown> } | null;

  const d = output?.data ?? (output as Record<string, unknown> | null);
  if (!d || Object.keys(d).length === 0) return null;

  return {
    creator: getStr(d, "Creator"),
    creatorTool: getStr(d, "CreatorTool"),
    description: getStr(d, "Description"),
    rights: getStr(d, "Rights"),
    title: getStr(d, "Title"),
    createDate: getStr(d, "CreateDate"),
    modifyDate: getStr(d, "ModifyDate"),
    rating: getNum(d, "Rating"),
    label: getStr(d, "Label"),
    raw: d as Record<string, unknown> | null,
  };
}

function getStr(obj: Record<string, unknown>, key: string): string | null {
  const val = obj[key];
  if (val === undefined || val === null) return null;
  if (typeof val === "string") return val || null;
  if (typeof val === "number") return String(val);
  return null;
}

function getNum(obj: Record<string, unknown>, key: string): number | null {
  const val = obj[key];
  if (val === undefined || val === null) return null;
  if (typeof val === "number") return val;
  if (typeof val === "string") {
    const n = Number(val);
    return Number.isNaN(n) ? null : n;
  }
  return null;
}
