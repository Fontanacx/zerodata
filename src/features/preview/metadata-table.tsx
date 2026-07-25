"use client";

import { CaretDown, CaretRight } from "@phosphor-icons/react";
import { useState } from "react";
import { useI18n } from "@/lib/i18n";
import type { ImageMetadata } from "@/features/metadata-parser/types";

interface MetadataTableProps {
  metadata: ImageMetadata;
}

function Row({ label, value }: { label: string; value: string | number | null }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="flex justify-between py-1.5 border-b border-[#1a1a1a] last:border-0">
      <span className="text-xs text-[#777777] min-w-[130px] shrink-0">{label}</span>
      <span className="text-xs text-[#cccccc] text-right break-all ml-3 font-mono">
        {String(value)}
      </span>
    </div>
  );
}

function SectionGroup({ section, defaultOpen }: { section: { id: string; label: string; count: number; content: React.ReactNode }; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);

  if (section.count === 0) return null;

  return (
    <div className="border border-[#1a1a1a] rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-[#0d0d0d] hover:bg-[#111111] transition-colors duration-150 text-left min-h-[40px]"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          {open ? (
            <CaretDown size={12} color="#777777" weight="regular" />
          ) : (
            <CaretRight size={12} color="#777777" weight="regular" />
          )}
          <span className="text-xs font-medium text-[#999999] uppercase tracking-wider">
            {section.label}
          </span>
        </div>
        <span className="text-[10px] text-[#777777]">{section.count} {section.count === 1 ? "field" : "fields"}</span>
      </button>
      {open && <div className="px-4 pb-3 pt-1 animate-slide-down">{section.content}</div>}
    </div>
  );
}

function buildSections(metadata: ImageMetadata, t: (key: string) => string) {
  const sections: Array<{ id: string; label: string; count: number; content: React.ReactNode }> = [];
  const exif = metadata.exif;

  if (exif) {
    const gpsHas = exif.gps.latitude !== null || exif.gps.longitude !== null || exif.gps.altitude !== null;
    if (gpsHas) {
      sections.push({
        id: "gps",
        label: t("metadata.gps"),
        count: [exif.gps.latitude, exif.gps.longitude, exif.gps.altitude].filter((v) => v !== null).length,
        content: (
          <>
            <Row label={t("metadata.label.latitude")} value={exif.gps.latitude?.toFixed(6) ?? null} />
            <Row label={t("metadata.label.longitude")} value={exif.gps.longitude?.toFixed(6) ?? null} />
            <Row label={t("metadata.label.altitude")} value={exif.gps.altitude != null ? `${exif.gps.altitude}m` : null} />
          </>
        ),
      });
    }

    const devHas = exif.device.make || exif.device.model || exif.device.lensMake || exif.device.lensModel || exif.device.serialNumber;
    if (devHas) {
      sections.push({
        id: "device",
        label: t("metadata.device"),
        count: [exif.device.make, exif.device.model, exif.device.lensModel, exif.device.serialNumber].filter(Boolean).length,
        content: (
          <>
            <Row label={t("metadata.label.make")} value={exif.device.make} />
            <Row label={t("metadata.label.model")} value={exif.device.model} />
            <Row label={t("metadata.label.lensMake")} value={exif.device.lensMake} />
            <Row label={t("metadata.label.lensModel")} value={exif.device.lensModel} />
            <Row label={t("metadata.label.serialNumber")} value={exif.device.serialNumber} />
          </>
        ),
      });
    }

    const tsHas = exif.timestamps.dateTimeOriginal || exif.timestamps.dateTimeDigitized;
    if (tsHas) {
      sections.push({
        id: "timestamps",
        label: t("metadata.timestamps"),
        count: [exif.timestamps.dateTimeOriginal, exif.timestamps.dateTimeDigitized].filter(Boolean).length,
        content: (
          <>
            <Row label={t("metadata.label.dateTaken")} value={exif.timestamps.dateTimeOriginal} />
            <Row label={t("metadata.label.dateDigitized")} value={exif.timestamps.dateTimeDigitized} />
            <Row label={t("metadata.label.timezone")} value={exif.timestamps.offsetTimeOriginal} />
          </>
        ),
      });
    }

    const camHas = exif.capture.iso !== null || exif.capture.aperture !== null || exif.capture.shutterSpeed !== null || exif.capture.focalLength !== null;
    if (camHas) {
      sections.push({
        id: "camera",
        label: t("metadata.camera"),
        count: [exif.capture.iso, exif.capture.aperture, exif.capture.shutterSpeed, exif.capture.focalLength].filter((v) => v !== null).length,
        content: (
          <>
            <Row label={t("metadata.label.iso")} value={exif.capture.iso} />
            <Row label={t("metadata.label.aperture")} value={exif.capture.aperture != null ? `f/${exif.capture.aperture}` : null} />
            <Row label={t("metadata.label.shutterSpeed")} value={exif.capture.shutterSpeed} />
            <Row label={t("metadata.label.focalLength")} value={exif.capture.focalLength != null ? `${exif.capture.focalLength}mm` : null} />
            <Row
              label={t("metadata.label.flash")}
              value={exif.capture.flash !== null ? (exif.capture.flash & 1 ? t("metadata.flashFired") : t("metadata.flashNotFired")) : null}
            />
          </>
        ),
      });
    }

    const miscHas = exif.software || exif.artist || exif.copyright || exif.imageDescription || exif.userComment;
    if (miscHas) {
      sections.push({
        id: "software",
        label: t("metadata.software"),
        count: [exif.software, exif.artist, exif.copyright, exif.imageDescription].filter(Boolean).length,
        content: (
          <>
            <Row label={t("metadata.label.software")} value={exif.software} />
            <Row label={t("metadata.label.artist")} value={exif.artist} />
            <Row label={t("metadata.label.copyright")} value={exif.copyright} />
            <Row label={t("metadata.label.description")} value={exif.imageDescription} />
            {exif.userComment && (
              <div className="mt-2">
                <p className="text-[10px] text-[#777777] uppercase tracking-wider mb-1">{t("metadata.userComment")}</p>
                <pre className="p-2 rounded bg-[#080808] text-[10px] text-[#777777] whitespace-pre-wrap break-all max-h-32 overflow-y-auto font-mono leading-relaxed border border-[#141414]">
                  {exif.userComment}
                </pre>
              </div>
            )}
          </>
        ),
      });
    }
  }

  const iptc = metadata.iptc;
  if (iptc && Object.keys(iptc).filter((k) => k !== "raw" && k !== "urgency" && k !== "supplementalCategories").some((k) => {
    const v = (iptc as unknown as Record<string, unknown>)[k];
    return v !== null && v !== undefined && v !== "" && !(Array.isArray(v) && v.length === 0);
  })) {
    const count = [iptc.caption, iptc.headline, iptc.byline, iptc.keywords.length > 0, iptc.copyrightNotice, iptc.country].filter(Boolean).length;
    sections.push({
      id: "iptc",
      label: t("metadata.iptc"),
      count,
      content: (
        <>
          <Row label={t("metadata.label.caption")} value={iptc.caption} />
          <Row label={t("metadata.label.headline")} value={iptc.headline} />
          <Row label={t("metadata.label.creator")} value={iptc.byline} />
          <Row label={t("metadata.label.credit")} value={iptc.creditLine} />
          <Row label={t("metadata.label.source")} value={iptc.source} />
          <Row label={t("metadata.label.city")} value={iptc.city} />
          <Row label={t("metadata.label.country")} value={iptc.country} />
          <Row label={t("metadata.label.copyright")} value={iptc.copyrightNotice} />
          {iptc.keywords.length > 0 && (
            <div className="mt-2">
              <p className="text-[10px] text-[#777777] uppercase tracking-wider mb-1">{t("metadata.keywords")}</p>
              <div className="flex flex-wrap gap-1">
                {iptc.keywords.map((kw, i) => (
                  <span key={i} className="px-2 py-0.5 rounded text-[10px] bg-[#111111] text-[#999999] border border-[#1a1a1a]">
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      ),
    });
  }

  const xmp = metadata.xmp;
  if (xmp && [xmp.creator, xmp.creatorTool, xmp.description, xmp.rights, xmp.title, xmp.createDate].some(Boolean)) {
    const count = [xmp.creator, xmp.creatorTool, xmp.description, xmp.rights, xmp.title, xmp.createDate].filter(Boolean).length;
    sections.push({
      id: "xmp",
      label: t("metadata.xmp"),
      count,
      content: (
        <>
          <Row label={t("metadata.label.creator")} value={xmp.creator} />
          <Row label={t("metadata.label.creatorTool")} value={xmp.creatorTool} />
          <Row label={t("metadata.label.title")} value={xmp.title} />
          <Row label={t("metadata.label.description")} value={xmp.description} />
          <Row label={t("metadata.label.rights")} value={xmp.rights} />
          <Row label={t("metadata.label.created")} value={xmp.createDate} />
          <Row label={t("metadata.label.modified")} value={xmp.modifyDate} />
          {xmp.rating !== null && <Row label={t("metadata.label.rating")} value={xmp.rating} />}
        </>
      ),
    });
  }

  if (metadata.c2pa?.detected) {
    sections.push({
      id: "c2pa",
      label: t("metadata.c2pa"),
      count: metadata.c2pa.manifests.length,
      content: (
        <>
          <p className="text-xs text-[#00e5a0] mb-2">
            {t("metadata.c2paDetected")} ({metadata.c2pa.rawSize} {t("metadata.bytes")})
          </p>
          {metadata.c2pa.manifests.map((m, i) => (
            <div key={i} className="text-xs text-[#999999]">
              {m.claimGenerator && <Row label={t("metadata.label.claimGenerator")} value={m.claimGenerator} />}
              {m.issuer && <Row label={t("metadata.label.issuer")} value={m.issuer} />}
              {m.assertions.map((a, j) => (
                <Row key={j} label={a.label} value={a.data ?? "present"} />
              ))}
            </div>
          ))}
        </>
      ),
    });
  }

  return sections;
}

export function MetadataTable({ metadata }: MetadataTableProps) {
  const { t } = useI18n();
  const sections = buildSections(metadata, t);

  if (sections.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-[#777777]">
        <p className="text-sm">{t("metadata.noMetadataFound")}</p>
        <p className="text-xs mt-1 text-[#666666]">{t("metadata.cleanDisclaimer")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sections.map((section) => (
        <SectionGroup
          key={section.id}
          section={section}
          defaultOpen={section.id === "gps" || section.id === "device"}
        />
      ))}
    </div>
  );
}
