"use client";

import { useCallback, useRef, useState, type DragEvent } from "react";
import { Image as ImageIcon, UploadSimple } from "@phosphor-icons/react";
import { useI18n } from "@/lib/i18n";
import { readAndValidateFile, type ReadFileResult } from "./file-reader";

interface UploadZoneProps {
  onFileRead: (result: ReadFileResult) => void;
  disabled: boolean;
}

export function UploadZone({ onFileRead, disabled }: UploadZoneProps) {
  const { t } = useI18n();
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      const result = await readAndValidateFile(file);
      if (result.error) {
        const errMap: Record<string, string> = {
          unsupported_type: "upload.unsupported",
          file_too_large: "upload.tooLarge",
        };
        const i18nKey = result.errorCode ? errMap[result.errorCode] : null;
        setError(i18nKey ? t(i18nKey) : (result.error ?? "Unknown error"));
        return;
      }
      onFileRead(result);
    },
    [onFileRead, t],
  );

  const onDragOver = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) setIsDragOver(true);
    },
    [disabled],
  );

  const onDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const onDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      if (disabled) return;
      const files = e.dataTransfer.files;
      if (files.length > 0) handleFile(files[0]);
    },
    [disabled, handleFile],
  );

  const onFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) handleFile(files[0]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [handleFile],
  );

  const triggerFilePicker = useCallback(() => {
    if (!disabled) fileInputRef.current?.click();
  }, [disabled]);

  return (
    <div className="w-full">
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={triggerFilePicker}
        onKeyDown={(e) => {
          if (disabled) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        aria-label={t("upload.dragIdle")}
        style={{ touchAction: "manipulation" }}
        className={`
          relative flex flex-col items-center justify-center
          border-2 border-dashed rounded-xl cursor-pointer
          transition-all duration-200 p-8 sm:p-12 md:p-16 min-h-[220px] sm:min-h-[280px] md:min-h-[320px]
          focus-visible:outline-none focus-visible:border-[#00e5a0] focus-visible:bg-[#00e5a008]
          ${
            isDragOver
              ? "border-[#00e5a0] bg-[#00e5a008]"
              : "border-[#1a1a1a] hover:border-[#2a2a2a] hover:bg-[#0a0a0a] bg-transparent"
          }
          ${disabled ? "opacity-50 pointer-events-none" : ""}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={onFileSelect}
          className="hidden"
          tabIndex={-1}
          aria-hidden="true"
        />

        {isDragOver ? (
          <UploadSimple size={36} color="#00e5a0" weight="thin" className="sm:size-[44px]" />
        ) : (
          <ImageIcon size={36} color="#555555" weight="thin" className="sm:size-[44px]" />
        )}

        <p className="mt-4 sm:mt-5 text-xs sm:text-sm text-[#999999] font-medium text-center px-2">
          {isDragOver ? t("upload.dragOver") : t("upload.dragIdle")}
        </p>
        <p className="mt-1 sm:mt-1.5 text-[11px] sm:text-xs text-[#777777] text-center">
          {t("upload.formats")}
        </p>
        {error && (
          <p className="mt-4 text-xs text-red-400/90 bg-[#ef444408] px-3 py-2 rounded-lg border border-red-400/15">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
