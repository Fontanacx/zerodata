"use client";

import { MapPin, Camera, Image as ImageIcon, Clock, Cpu } from "@phosphor-icons/react";
import { useI18n } from "@/lib/i18n";
import { formatFileSize } from "@/lib/file-utils";
import type { ImageMetadata } from "@/features/metadata-parser/types";

interface SummaryCardProps {
  metadata: ImageMetadata;
}

function Badge({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5 p-2.5 rounded bg-[#0d0d0d] border border-[#1a1a1a]">
      <div className="text-[#666666] shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] text-[#777777] uppercase tracking-wider">{label}</p>
        <p className="text-xs text-[#cccccc] mt-0.5 truncate font-mono">{value}</p>
      </div>
    </div>
  );
}

export function SummaryCard({ metadata }: SummaryCardProps) {
  const { t } = useI18n();
  const exif = metadata.exif;

  const hasExif = exif !== null;
  const hasGPS = hasExif && (exif.gps.latitude !== null || exif.gps.longitude !== null);
  const hasDevice = hasExif && (exif.device.make !== null || exif.device.model !== null);
  const hasImageInfo = hasExif && (exif.image.width !== null || exif.image.height !== null);
  const hasTimestamps = hasExif && exif.timestamps.dateTimeOriginal !== null;
  const hasCamera = hasExif && (exif.capture.iso !== null || exif.capture.aperture !== null || exif.capture.focalLength !== null);
  const hasSoftware = hasExif && (exif.software !== null || exif.processingSoftware !== null);

  const format = metadata.mimeType.split("/")[1]?.toUpperCase() ?? t("fileInfo.unknownFormat");
  const orientationLabels: Record<number, string> = { 1: "1 (Normal)", 3: "3 (180°)", 6: "6 (90° CW)", 8: "8 (90° CCW)" };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-sm font-medium text-[#cccccc] uppercase tracking-wider mb-3">
          {t("summary.fileInfo")}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Badge
            icon={<ImageIcon size={14} weight="thin" />}
            label={t("summary.fileName")}
            value={metadata.fileName}
          />
          <Badge
            icon={<Cpu size={14} weight="thin" />}
            label={t("summary.fileSize")}
            value={formatFileSize(metadata.fileSize)}
          />
          <Badge
            icon={<ImageIcon size={14} weight="thin" />}
            label={t("summary.fileType")}
            value={format}
          />
          <Badge
            icon={<ImageIcon size={14} weight="thin" />}
            label={t("summary.dimensions")}
            value={
              hasImageInfo && exif.image.width && exif.image.height
                ? `${exif.image.width} × ${exif.image.height}`
                : t("summary.notAvailable")
            }
          />
        </div>
      </div>

      {hasExif && (
        <div>
          <h2 className="text-sm font-medium text-[#cccccc] uppercase tracking-wider mb-3">
            {t("summary.imageDetails")}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {exif.image.colorSpace !== null && (
              <Badge
                icon={<ImageIcon size={14} weight="thin" />}
                label={t("summary.colorSpace")}
                value={exif.image.colorSpace === 1 ? "sRGB" : exif.image.colorSpace === 0xffff ? "Uncalibrated" : `#${exif.image.colorSpace}`}
              />
            )}
            {exif.image.bitsPerSample !== null && (
              <Badge
                icon={<ImageIcon size={14} weight="thin" />}
                label={t("summary.bitsPerSample")}
                value={`${exif.image.bitsPerSample} bit`}
              />
            )}
            {exif.image.orientation !== null && (
              <Badge
                icon={<ImageIcon size={14} weight="thin" />}
                label={t("summary.orientation")}
                value={orientationLabels[exif.image.orientation] ?? String(exif.image.orientation)}
              />
            )}
          </div>
        </div>
      )}

      {hasDevice && (
        <div>
          <h2 className="text-sm font-medium text-[#cccccc] uppercase tracking-wider mb-3">
            {t("summary.deviceInfo")}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {exif.device.make && exif.device.model && (
              <Badge
                icon={<Camera size={14} weight="thin" />}
                label={t("summary.camera")}
                value={`${exif.device.make} ${exif.device.model}`}
              />
            )}
            {exif.device.lensModel && (
              <Badge
                icon={<Camera size={14} weight="thin" />}
                label={t("summary.lens")}
                value={exif.device.lensModel}
              />
            )}
            {exif.device.serialNumber && (
              <Badge
                icon={<Camera size={14} weight="thin" />}
                label={t("summary.serialNumber")}
                value={exif.device.serialNumber}
              />
            )}
          </div>
        </div>
      )}

      {hasCamera && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {exif.capture.iso !== null && (
            <Badge icon={<Camera size={14} weight="thin" />} label="ISO" value={`${exif.capture.iso}`} />
          )}
          {exif.capture.aperture !== null && (
            <Badge icon={<Camera size={14} weight="thin" />} label="f/" value={`${exif.capture.aperture}`} />
          )}
          {exif.capture.shutterSpeed && (
            <Badge icon={<Camera size={14} weight="thin" />} label={t("metadata.label.shutterSpeed")} value={exif.capture.shutterSpeed} />
          )}
          {exif.capture.focalLength !== null && (
            <Badge icon={<Camera size={14} weight="thin" />} label={t("metadata.label.focalLength")} value={`${exif.capture.focalLength}mm`} />
          )}
        </div>
      )}

      {hasGPS && (
        <div>
          <h2 className="text-sm font-medium text-[#cccccc] uppercase tracking-wider mb-3">
            {t("summary.gpsLocation")}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {exif.gps.latitude !== null && (
              <Badge
                icon={<MapPin size={14} weight="thin" />}
                label={t("summary.latitude")}
                value={`${exif.gps.latitude.toFixed(6)}°`}
              />
            )}
            {exif.gps.longitude !== null && (
              <Badge
                icon={<MapPin size={14} weight="thin" />}
                label={t("summary.longitude")}
                value={`${exif.gps.longitude.toFixed(6)}°`}
              />
            )}
            {exif.gps.altitude !== null && (
              <Badge
                icon={<MapPin size={14} weight="thin" />}
                label={t("summary.altitude")}
                value={`${exif.gps.altitude}m`}
              />
            )}
          </div>
        </div>
      )}

      {hasTimestamps && exif.timestamps.dateTimeOriginal && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Badge
            icon={<Clock size={14} weight="thin" />}
            label={t("summary.dateTaken")}
            value={exif.timestamps.dateTimeOriginal}
          />
        </div>
      )}

      {hasSoftware && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {exif.software && (
            <Badge icon={<Cpu size={14} weight="thin" />} label={t("summary.software")} value={exif.software} />
          )}
        </div>
      )}
    </div>
  );
}
