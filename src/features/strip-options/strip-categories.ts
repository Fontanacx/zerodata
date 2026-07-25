import type { StripCategory, StripCategoryId } from "@/features/metadata-parser/types";

export const STRIP_CATEGORIES: StripCategory[] = [
  { id: "all", defaultEnabled: true },
  { id: "exif", defaultEnabled: true },
  { id: "iptc", defaultEnabled: false },
  { id: "xmp", defaultEnabled: false },
  { id: "ai-signature", defaultEnabled: false },
  { id: "copyright", defaultEnabled: false },
];

export function getDefaultSelection(): Set<StripCategoryId> {
  const selection = new Set<StripCategoryId>();
  for (const cat of STRIP_CATEGORIES) {
    if (cat.defaultEnabled) {
      selection.add(cat.id);
    }
  }
  return selection;
}
