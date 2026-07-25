import type { ParsedIptc } from "./types";

export async function parseIptc(
  input: ArrayBuffer | Uint8Array | File
): Promise<ParsedIptc | null> {
  const { parse } = await import("exifr");

  const output = (await parse(input, {
    iptc: true,
    exif: false,
    xmp: false,
    tiff: false,
    translateKeys: true,
    translateValues: true,
    reviveValues: true,
  })) as { data?: Record<string, unknown> } | null;

  const d = output?.data ?? (output as Record<string, unknown> | null);
  if (!d || Object.keys(d).length === 0) return null;

  return {
    caption: getStr(d, "Caption") ?? getStr(d, "Description"),
    headline: getStr(d, "Headline"),
    keywords: getArrayStr(d, "Keywords"),
    copyrightNotice: getStr(d, "CopyrightNotice"),
    creditLine: getStr(d, "CreditLine"),
    source: getStr(d, "Source"),
    byline: getStr(d, "Byline") ?? getStr(d, "Creator"),
    bylineTitle: getStr(d, "BylineTitle"),
    city: getStr(d, "City"),
    provinceState: getStr(d, "ProvinceState"),
    country: getStr(d, "Country"),
    countryCode: getStr(d, "CountryCode"),
    category: getStr(d, "Category"),
    supplementalCategories: getArrayStr(d, "SupplementalCategories"),
    urgency: getNum(d, "Urgency"),
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

function getArrayStr(obj: Record<string, unknown>, key: string): string[] {
  const val = obj[key];
  if (val === undefined || val === null) return [];
  if (Array.isArray(val)) {
    return val.map((v: unknown) => String(v)).filter(Boolean);
  }
  if (typeof val === "string") return val.split(";").map((s) => s.trim()).filter(Boolean);
  return [];
}
