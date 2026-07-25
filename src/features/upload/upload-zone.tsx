"use client";

import { useCallback, useRef, useState, useEffect, type DragEvent } from "react";
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

  /**
   * Native change listener — bypasses React's synthetic event delegation.
   *
   * On iOS Safari, React 18's event delegation (attached at the root container)
   * does NOT reliably capture the `change` event from <input type="file"> elements
   * that are hidden or positioned off-screen. Adding a native addEventListener
   * directly on the DOM node guarantees the event is received regardless of
   * React's delegation chain.
   *
   * We capture the File object immediately, then defer the value reset to avoid
   * clearing the input before FileReader has consumed the file reference.
   */
  useEffect(() => {
    const input = fileInputRef.current;
    if (!input) return;

    const onNativeChange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      const files = target.files;
      if (files && files.length > 0) {
        const file = files[0]; // capture before any reset
        handleFile(file);
        // Defer reset so re-selecting the same file works
        setTimeout(() => {
          if (fileInputRef.current) fileInputRef.current.value = "";
        }, 300);
      }
    };

    input.addEventListener("change", onNativeChange, { passive: true });
    return () => input.removeEventListener("change", onNativeChange);
  }, [handleFile]);

  /**
   * Programmatic trigger — called from the native <button>.
   * On iOS Safari, a programmatic .click() on a file input works reliably
   * when called synchronously inside a native button's click handler.
   * Using a <button type="button"> (not a div) is critical for iOS to
   * recognize it as a "trusted user gesture".
   */
  const openFilePicker = useCallback(() => {
    if (!disabled) fileInputRef.current?.click();
  }, [disabled]);

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

  return (
    <div className="w-full">
      {/*
        The input is NOT aria-hidden and NOT positioned overlay.
        It's simply display:none — triggered only programmatically via the
        native <button> below. This avoids ALL iOS Safari event capture issues.
        The native addEventListener above handles the change event reliably.
      */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        tabIndex={-1}
        aria-hidden="true"
        style={{ display: "none" }}
      />

      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        aria-label={t("upload.dragIdle")}
        className={`
          relative flex flex-col items-center justify-center
          border-2 border-dashed rounded-xl
          transition-all duration-200 p-8 sm:p-12 md:p-16 min-h-[220px] sm:min-h-[280px] md:min-h-[320px]
          ${
            isDragOver
              ? "border-[#00e5a0] bg-[#00e5a008]"
              : "border-[#1a1a1a] bg-transparent"
          }
          ${disabled ? "opacity-50 pointer-events-none" : ""}
        `}
      >
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

        {/*
          Native <button type="button"> — the only reliable way to trigger
          a file input programmatically on iOS Safari.
          - Must be type="button" (not submit)
          - Must be a real <button>, not a div/span
          - The .click() call inside onClick runs synchronously within the
            user gesture context, which iOS Safari requires to open the picker
        */}
        <button
          type="button"
          onClick={openFilePicker}
          disabled={disabled}
          style={{ WebkitTapHighlightColor: "transparent", touchAction: "manipulation" }}
          className={`
            mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg
            bg-[#141414] border border-[#2a2a2a] text-[#888888] text-xs font-medium
            hover:bg-[#1a1a1a] hover:border-[#333333] hover:text-[#cccccc]
            active:bg-[#222222] transition-all duration-150 cursor-pointer
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        >
          <UploadSimple size={14} weight="regular" />
          {t("upload.browse")}
        </button>

        {error && (
          <p
            role="alert"
            className="mt-4 text-xs text-red-400/90 bg-[#ef444408] px-3 py-2 rounded-lg border border-red-400/15"
          >
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
