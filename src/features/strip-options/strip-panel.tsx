"use client";

import { Check, Trash } from "@phosphor-icons/react";
import { useI18n } from "@/lib/i18n";
import type { StripCategoryId } from "@/features/metadata-parser/types";
import { STRIP_CATEGORIES } from "./strip-categories";

interface StripPanelProps {
  selected: Set<StripCategoryId>;
  onChange: (selected: Set<StripCategoryId>) => void;
  onStrip: () => void;
  isStripping: boolean;
  hasMetadata: boolean;
  disabled: boolean;
}

export function StripPanel({
  selected,
  onChange,
  onStrip,
  isStripping,
  hasMetadata,
  disabled,
}: StripPanelProps) {
  const { t, tc } = useI18n();

  const toggle = (id: StripCategoryId) => {
    const next = new Set(selected);
    if (id === "all") {
      if (next.has("all")) {
        next.clear();
      } else {
        for (const cat of STRIP_CATEGORIES) next.add(cat.id);
      }
    } else {
      next.delete("all");
      if (next.has(id)) next.delete(id);
      else next.add(id);
    }
    onChange(next);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-medium text-[#cccccc] uppercase tracking-wider">
        {t("strip.title")}
      </h2>

      <div className="space-y-1.5">
        {STRIP_CATEGORIES.map((cat) => {
          const isSelected = selected.has(cat.id);
          const catLang = tc(`categories.${cat.id}`);
          return (
            <button
              key={cat.id}
              onClick={() => toggle(cat.id)}
              disabled={disabled || isStripping}
              style={{ touchAction: "manipulation" }}
              className={`
                w-full flex items-start gap-3 p-3 rounded-lg border text-left
                transition-all duration-150 min-h-[52px]
                ${
                  isSelected
                    ? "border-[#00e5a030] bg-[#00e5a008]"
                    : "border-[#1a1a1a] bg-transparent hover:border-[#2a2a2a] hover:bg-[#0a0a0a]"
                }
                ${
                  disabled || isStripping
                    ? "opacity-40 cursor-not-allowed"
                    : "cursor-pointer"
                }
              `}
              aria-pressed={isSelected}
            >
              <div
                className={`
                  w-4 h-4 rounded shrink-0 mt-0.5 flex items-center justify-center
                  border transition-colors duration-150
                  ${
                    isSelected
                      ? "bg-[#00e5a0] border-[#00e5a0]"
                      : "border-[#3a3a3a] bg-transparent group-hover:border-[#555555]"
                  }
                `}
              >
                {isSelected && <Check size={10} color="#000000" weight="bold" />}
              </div>
              <div className="min-w-0">
                <p className="text-xs text-[#cccccc] font-medium">{catLang.label}</p>
                <p className="text-[10px] text-[#777777] mt-0.5 leading-relaxed">
                  {catLang.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      <button
        onClick={onStrip}
        disabled={disabled || isStripping || selected.size === 0 || !hasMetadata}
        style={{ touchAction: "manipulation" }}
        className="
          w-full flex items-center justify-center gap-2 py-3 rounded-lg
          text-sm font-medium transition-all duration-150
          bg-[#00e5a0] text-black hover:bg-[#00cc8f] active:scale-[0.98]
          disabled:opacity-30 disabled:cursor-not-allowed disabled:active:scale-100
        "
      >
        {isStripping ? (
          <>
            <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            {t("strip.stripping")}
          </>
        ) : (
          <>
            <Trash size={16} color="#000000" weight="regular" />
            {t("strip.strip")}
          </>
        )}
      </button>

      {selected.size === 0 && !disabled && (
        <p className="text-[10px] text-[#777777] text-center">{t("strip.selectHint")}</p>
      )}
      {!hasMetadata && !disabled && (
        <p className="text-[10px] text-[#777777] text-center">{t("strip.noMetadata")}</p>
      )}
    </div>
  );
}
