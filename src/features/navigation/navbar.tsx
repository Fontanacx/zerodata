"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n";

export function Navbar() {
  const { t, lang, setLang } = useI18n();
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  const linkClass = (path: string) =>
    `inline-flex items-center justify-center px-3 py-2 rounded text-xs sm:text-sm font-medium transition-colors duration-150 min-h-[44px] min-w-[44px] ${
      isActive(path)
        ? "bg-[#1a1a1a] text-white"
        : "text-[#888888] hover:text-[#cccccc] hover:bg-[#111111]"
    }`;

  return (
    /*
      On iOS Safari, backdrop-filter on sticky elements creates a compositing layer
      that can intercept touch events on child elements. The fix is to:
      1. Put the blur on a pseudo-element via a sibling div (not the nav itself)
      2. Set explicit pointer-events: auto on all interactive children
    */
    <nav className="border-b border-[#1a1a1a] sticky top-0 z-50 relative">
      {/* Blur layer — sits behind content, pointer-events none so it never intercepts taps */}
      <div
        className="absolute inset-0 bg-[#080808]/80 backdrop-blur-sm"
        style={{ pointerEvents: "none" }}
        aria-hidden="true"
      />

      {/* Content layer — sits above blur, gets all touch/pointer events */}
      <div
        className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between"
        style={{ pointerEvents: "auto" }}
      >
        <Link
          href="/"
          className="flex items-center gap-2 text-white hover:text-[#cccccc] transition-colors duration-150 shrink-0"
          style={{ WebkitTapHighlightColor: "transparent" }}
        >
          <Image
            src="/ZeroData.ico"
            alt="ZeroData"
            width={28}
            height={28}
            className="w-6 h-6 sm:w-7 sm:h-7 rounded flex-shrink-0"
          />
          <span className="text-sm font-semibold tracking-tight">ZeroData</span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-1.5" style={{ pointerEvents: "auto" }}>
          <Link
            href="/"
            className={linkClass("/")}
            style={{ WebkitTapHighlightColor: "transparent" }}
          >
            {t("nav.tool")}
          </Link>
          <Link
            href="/faq"
            className={linkClass("/faq")}
            style={{ WebkitTapHighlightColor: "transparent" }}
          >
            {t("nav.faq")}
          </Link>

          <span className="w-px h-5 bg-[#222222] mx-1 sm:mx-2" aria-hidden="true" />

          <div className="flex items-center gap-0.5" style={{ pointerEvents: "auto" }}>
            <button
              type="button"
              onClick={() => setLang("en")}
              aria-label="Switch to English"
              aria-pressed={lang === "en"}
              style={{
                WebkitTapHighlightColor: "transparent",
                touchAction: "manipulation",
                pointerEvents: "auto",
                userSelect: "none",
                WebkitUserSelect: "none",
              }}
              className={`inline-flex items-center justify-center px-3 py-2.5 rounded text-xs font-semibold uppercase tracking-wider transition-colors duration-150 min-h-[44px] min-w-[44px] cursor-pointer ${
                lang === "en"
                  ? "bg-[#1a1a1a] text-white"
                  : "text-[#666666] hover:text-[#cccccc] hover:bg-[#111111] active:bg-[#1a1a1a]"
              }`}
            >
              EN
            </button>
            <span className="text-[#333333] text-xs px-0.5 select-none" aria-hidden="true">
              /
            </span>
            <button
              type="button"
              onClick={() => setLang("es")}
              aria-label="Cambiar a Español"
              aria-pressed={lang === "es"}
              style={{
                WebkitTapHighlightColor: "transparent",
                touchAction: "manipulation",
                pointerEvents: "auto",
                userSelect: "none",
                WebkitUserSelect: "none",
              }}
              className={`inline-flex items-center justify-center px-3 py-2.5 rounded text-xs font-semibold uppercase tracking-wider transition-colors duration-150 min-h-[44px] min-w-[44px] cursor-pointer ${
                lang === "es"
                  ? "bg-[#1a1a1a] text-white"
                  : "text-[#666666] hover:text-[#cccccc] hover:bg-[#111111] active:bg-[#1a1a1a]"
              }`}
            >
              ES
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
