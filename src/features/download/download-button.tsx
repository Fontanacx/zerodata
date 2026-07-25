"use client";

import { DownloadSimple } from "@phosphor-icons/react";
import { useI18n } from "@/lib/i18n";
import { getFileExtension } from "@/lib/file-utils";

interface DownloadButtonProps {
  buffer: ArrayBuffer;
  originalFileName: string;
  mimeType: string;
  disabled: boolean;
}

export function DownloadButton({
  buffer,
  originalFileName,
  mimeType,
  disabled,
}: DownloadButtonProps) {
  const { t } = useI18n();

  const handleDownload = () => {
    const blob = new Blob([buffer], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const parts = originalFileName.split(".");
    const name = parts.slice(0, -1).join(".") || originalFileName;
    const ext = getFileExtension(mimeType);
    const newName = `${name}_cleaned.${ext}`;
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = newName;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <button
      onClick={handleDownload}
      disabled={disabled}
      className="
        w-full flex items-center justify-center gap-2 py-3.5 rounded-lg
        text-sm font-medium transition-all duration-150
        bg-white text-black hover:bg-[#e0e0e0] active:scale-[0.98]
        disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100
      "
    >
      <DownloadSimple size={16} color="#000000" weight="regular" />
      {t("download.button")}
    </button>
  );
}
