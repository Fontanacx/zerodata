"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "@/lib/i18n";

export function Navbar() {
  const { t, lang, setLang } = useI18n();
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  const linkClass = (path: string) =>
    `inline-flex items-center justify-center px-3 py-2 rounded text-xs sm:text-sm font-medium transition-colors duration-150 min-h-[40px] min-w-[40px] ${
      isActive(path)
        ? "bg-[#1a1a1a] text-white"
        : "text-[#888888] hover:text-[#cccccc] hover:bg-[#111111]"
    }`;

  return (
    <nav
      className="border-b border-[#1a1a1a] bg-[#080808]/80 backdrop-blur-sm sticky top-0 z-50"
      style={{ WebkitTransform: "translateZ(0)" }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 text-white hover:text-[#cccccc] transition-colors duration-150 shrink-0"
        >
          <img
            src="/ZeroData.ico"
            alt="ZeroData"
            className="w-6 h-6 sm:w-7 sm:h-7 rounded flex-shrink-0"
          />
          <span className="text-sm font-semibold tracking-tight">ZeroData</span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-1.5">
          <Link href="/" className={linkClass("/")}>
            {t("nav.tool")}
          </Link>
          <Link href="/faq" className={linkClass("/faq")}>
            {t("nav.faq")}
          </Link>

          <span className="w-px h-5 bg-[#222222] mx-1 sm:mx-2" aria-hidden="true" />

          <div className="flex items-center gap-0.5">
            <button
              onClick={() => setLang("en")}
              aria-label="Switch to English"
              aria-current={lang === "en" ? "true" : undefined}
              className={`inline-flex items-center justify-center px-3 py-2.5 rounded text-xs font-semibold uppercase tracking-wider transition-colors duration-150 min-h-[44px] min-w-[44px] ${
                lang === "en"
                  ? "bg-[#1a1a1a] text-white"
                  : "text-[#666666] hover:text-[#cccccc] hover:bg-[#111111] active:bg-[#1a1a1a]"
              }`}
              style={{ touchAction: "manipulation" }}
            >
              EN
            </button>
            <span className="text-[#333333] text-xs px-0.5 select-none" aria-hidden="true">
              /
            </span>
            <button
              onClick={() => setLang("es")}
              aria-label="Cambiar a Español"
              aria-current={lang === "es" ? "true" : undefined}
              className={`inline-flex items-center justify-center px-3 py-2.5 rounded text-xs font-semibold uppercase tracking-wider transition-colors duration-150 min-h-[44px] min-w-[44px] ${
                lang === "es"
                  ? "bg-[#1a1a1a] text-white"
                  : "text-[#666666] hover:text-[#cccccc] hover:bg-[#111111] active:bg-[#1a1a1a]"
              }`}
              style={{ touchAction: "manipulation" }}
            >
              ES
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
