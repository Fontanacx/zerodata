import type {
  ParsedExif,
  ExifGPS,
  ExifrOutput,
} from "./types";

export async function parseExif(
  input: ArrayBuffer | Uint8Array | File
): Promise<ParsedExif | null> {
  const { parse } = await import("exifr");

  const output = (await parse(input, {
    pick: [
      "Make",
      "Model",
      "LensMake",
      "LensModel",
      "BodySerialNumber",
      "ImageWidth",
      "ImageHeight",
      "Orientation",
      "ColorSpace",
      "BitsPerSample",
      "ISO",
      "ApertureValue",
      "FNumber",
      "ShutterSpeedValue",
      "ExposureTime",
      "FocalLength",
      "FocalLengthIn35mmFilm",
      "Flash",
      "ExposureProgram",
      "MeteringMode",
      "WhiteBalance",
      "DateTimeOriginal",
      "DateTimeDigitized",
      "OffsetTime",
      "OffsetTimeOriginal",
      "OffsetTimeDigitized",
      "Software",
      "Artist",
      "Copyright",
      "UserComment",
      "ImageDescription",
      "ProcessingSoftware",
      "HostComputer",
      "GPSLatitude",
      "GPSLatitudeRef",
      "GPSLongitude",
      "GPSLongitudeRef",
      "GPSAltitude",
      "GPSAltitudeRef",
    ],
    exif: true,
    gps: true,
    iptc: false,
    xmp: false,
    tiff: false,
    translateKeys: true,
    translateValues: true,
    reviveValues: true,
  })) as ExifrOutput | null;

  const d = output?.data ?? output as Record<string, unknown> | null;

  const result: ParsedExif = {
    gps: parseGps(
      getGpsVal(d, "GPSLatitude"),
      getStr(d, "GPSLatitudeRef"),
      getGpsVal(d, "GPSLongitude"),
      getStr(d, "GPSLongitudeRef"),
      getNum(d, "GPSAltitude")
    ),
    device: {
      make: getStr(d, "Make"),
      model: getStr(d, "Model"),
      lensMake: getStr(d, "LensMake"),
      lensModel: getStr(d, "LensModel"),
      serialNumber: getStr(d, "BodySerialNumber"),
    },
    image: {
      width: getNum(d, "ImageWidth"),
      height: getNum(d, "ImageHeight"),
      orientation: getNum(d, "Orientation"),
      colorSpace: getNum(d, "ColorSpace"),
      bitsPerSample: getNum(d, "BitsPerSample"),
    },
    capture: {
      iso: getNum(d, "ISO"),
      aperture: getNum(d, "FNumber") ?? getNum(d, "ApertureValue"),
      shutterSpeed:
        getStr(d, "ShutterSpeedValue") ?? getStr(d, "ExposureTime"),
      focalLength: getNum(d, "FocalLength"),
      focalLength35mm: getNum(d, "FocalLengthIn35mmFilm"),
      flash: getNum(d, "Flash"),
      exposureProgram: getNum(d, "ExposureProgram"),
      meteringMode: getNum(d, "MeteringMode"),
      whiteBalance: getNum(d, "WhiteBalance"),
    },
    timestamps: {
      dateTimeOriginal: getStr(d, "DateTimeOriginal"),
      dateTimeDigitized: getStr(d, "DateTimeDigitized"),
      offsetTime: getStr(d, "OffsetTime"),
      offsetTimeOriginal: getStr(d, "OffsetTimeOriginal"),
      offsetTimeDigitized: getStr(d, "OffsetTimeDigitized"),
    },
    software: getStr(d, "Software"),
    artist: getStr(d, "Artist"),
    copyright: getStr(d, "Copyright"),
    userComment: getStr(d, "UserComment"),
    imageDescription: getStr(d, "ImageDescription"),
    processingSoftware: getStr(d, "ProcessingSoftware"),
    hostComputer: getStr(d, "HostComputer"),
    raw: output as Record<string, unknown> | null,
  };

  if (!hasAnyExifData(result)) return null;
  return result;
}

function hasAnyExifData(e: ParsedExif): boolean {
  if (e.gps.latitude !== null || e.gps.longitude !== null || e.gps.altitude !== null) return true;
  if (e.device.make || e.device.model || e.device.lensMake || e.device.lensModel || e.device.serialNumber) return true;
  if (e.image.width !== null || e.image.height !== null || e.image.orientation !== null) return true;
  if (e.capture.iso !== null || e.capture.aperture !== null || e.capture.shutterSpeed !== null || e.capture.focalLength !== null || e.capture.flash !== null) return true;
  if (e.timestamps.dateTimeOriginal || e.timestamps.dateTimeDigitized) return true;
  if (e.software || e.artist || e.copyright || e.userComment || e.imageDescription || e.processingSoftware || e.hostComputer) return true;
  return false;
}

function getStr(obj: Record<string, unknown> | null, key: string): string | null {
  if (!obj) return null;
  const val = obj[key];
  if (val === undefined || val === null) return null;
  if (typeof val === "string") return val || null;
  if (typeof val === "number") return String(val);
  return null;
}

function getNum(obj: Record<string, unknown> | null, key: string): number | null {
  if (!obj) return null;
  const val = obj[key];
  if (val === undefined || val === null) return null;
  if (typeof val === "number") return val;
  if (typeof val === "string") {
    const n = Number(val);
    return Number.isNaN(n) ? null : n;
  }
  return null;
}

function getGpsVal(obj: Record<string, unknown> | null, key: string): number | number[] | null {
  if (!obj) return null;
  const val = obj[key];
  if (val === undefined || val === null) return null;
  if (typeof val === "number") return val;
  if (Array.isArray(val) && val.every((v: unknown) => typeof v === "number")) {
    return val as number[];
  }
  if (typeof val === "string") {
    const n = Number(val);
    return Number.isNaN(n) ? null : n;
  }
  return null;
}

function parseGps(
  lat: number | number[] | null,
  latRef: string | null,
  lon: number | number[] | null,
  lonRef: string | null,
  alt: number | null
): ExifGPS {
  return {
    latitude: coordsToDecimal(lat, latRef),
    longitude: coordsToDecimal(lon, lonRef),
    altitude: alt,
    latitudeRef: latRef ?? null,
    longitudeRef: lonRef ?? null,
  };
}

function coordsToDecimal(coord: number | number[] | null, ref: string | null): number | null {
  if (coord === null) return null;
  if (typeof coord === "number") {
    let decimal = coord;
    if (ref === "S" || ref === "W") decimal = -decimal;
    return decimal;
  }
  if (Array.isArray(coord) && coord.length >= 2) {
    const degrees = coord[0];
    const minutes = coord[1];
    const seconds = coord.length >= 3 ? coord[2] : 0;
    if (Number.isNaN(degrees) || Number.isNaN(minutes) || Number.isNaN(seconds)) return null;
    let decimal = degrees + minutes / 60 + seconds / 3600;
    if (ref === "S" || ref === "W") decimal = -decimal;
    return decimal;
  }
  return null;
}
