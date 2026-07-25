<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# ZeroData — Agent Guide · Guía para Agentes

> **EN** — ZeroData is a 100% client-side image metadata inspector and remover. It supports JPEG, PNG, and WebP. No image data ever leaves the device.
>
> **ES** — ZeroData es un inspector y removedor de metadatos de imágenes 100% en el cliente. Soporta JPEG, PNG y WebP. Ningún dato de imagen sale del dispositivo.

---

## 1. Hard Rules · Reglas estrictas

| # | EN | ES |
|---|----|----|
| 1 | **No `any`** — TypeScript strict mode is always on. Every type must be explicit. `strict: true` in `tsconfig.json`. | **Prohibido `any`** — TypeScript en modo estricto siempre. Todo tipo debe ser explícito. `strict: true` en `tsconfig.json`. |
| 2 | **No image uploads** — user images must NEVER leave the device. No telemetry, no external APIs for analysis, no analytics. | **No subir imágenes** — las imágenes del usuario NUNCA deben salir del dispositivo. Sin telemetría, sin APIs externas de análisis, sin analytics. |
| 3 | **i18n is mandatory** — every new user-facing string must be added in BOTH EN and ES inside `src/lib/i18n.tsx`. Never hardcode strings in components. | **i18n es obligatorio** — toda cadena nueva visible al usuario debe agregarse en AMBOS idiomas (EN y ES) dentro de `src/lib/i18n.tsx`. Nunca hardcodear strings en componentes. |
| 4 | **No external HTTP requests** — the only allowed `connect-src` targets are HuggingFace CDN domains (`*.huggingface.co`) for ML model download. CSP is enforced in `next.config.ts`. | **Sin peticiones HTTP externas** — los únicos destinos `connect-src` permitidos son los dominios CDN de HuggingFace (`*.huggingface.co`) para la descarga del modelo ML. El CSP se aplica en `next.config.ts`. |
| 5 | **Pure functions for parsers/strippers** — metadata parsing (`src/features/metadata-parser/`) and stripping (`src/features/metadata-stripper/`) must have zero React dependencies. They operate on raw `ArrayBuffer`/`Uint8Array` and return typed objects only. | **Funciones puras para parsers/strippers** — el parseo de metadatos (`src/features/metadata-parser/`) y la eliminación (`src/features/metadata-stripper/`) no deben tener dependencias de React. Operan sobre `ArrayBuffer`/`Uint8Array` y retornan solo objetos tipados. |

---

## 2. Project Overview · Resumen del Proyecto

**EN** — ZeroData runs entirely in the browser. Its capabilities:

- **Metadata inspection**: EXIF (GPS, camera, device, timestamps, capture settings, software, copyright), IPTC (caption, headline, keywords, credits), XMP (creator, rights, title, description, rating).
- **AI generation detection**: Three-tier verdict system — C2PA cryptographically-signed provenance (Confirmed), heuristic keyword/pattern detection (Likely), and optional local ONNX deep scan via HuggingFace transformers.js (opt-in, runs in Web Worker).
- **Metadata stripping**: Byte-level removal without re-encoding (no quality loss). Granular category selection or "Remove Everything."
- **Download**: Generates a `_cleaned` copy via blob URL.

**ES** — ZeroData se ejecuta completamente en el navegador. Sus capacidades:

- **Inspección de metadatos**: EXIF (GPS, cámara, dispositivo, marcas de tiempo, ajustes de captura, software, copyright), IPTC (leyenda, titular, palabras clave, créditos), XMP (creador, derechos, título, descripción, calificación).
- **Detección de generación por IA**: Sistema de veredicto en tres niveles — procedencia firmada criptográficamente con C2PA (Confirmado), detección heurística por palabras clave/patrones (Probable), y escaneo profundo opcional con modelo ONNX local vía transformers.js de HuggingFace (opt-in, se ejecuta en Web Worker).
- **Eliminación de metadatos**: Eliminación a nivel de bytes sin recodificación (sin pérdida de calidad). Selección granular por categorías o "Eliminar todo."
- **Descarga**: Genera una copia `_limpiada` mediante URL blob.

---

## 3. Tech Stack · Stack Tecnológico

| Dependency | Version | Purpose · Propósito |
|---|---|---|
| `next` | 16.2.11 | Framework (App Router) |
| `react` / `react-dom` | 19.2.4 | UI library |
| `typescript` | ^5 | Language · Lenguaje |
| `tailwindcss` / `@tailwindcss/postcss` | ^4 | Styling · Estilos |
| `exifr` | ^7.1.3 | EXIF / IPTC / XMP parsing |
| `@contentauth/c2pa-web` | ^0.13.0 | Adobe C2PA provenance SDK (WASM). Binary at `public/c2pa.wasm`. |
| `@huggingface/transformers` | ^4.2.0 | ML image classification (Web Worker). Model: `umm-maybe/AI-image-detector`. |
| `@phosphor-icons/react` | ^2.1.10 | Icons · Iconos |
| `eslint` / `eslint-config-next` | ^9 / 16.2.11 | Linting |
| `prettier` | (implied) | Formatting · Formateo |

**Dev dependencies**: `@types/node`, `@types/react`, `@types/react-dom`

---

## 4. Directory Structure · Estructura de Directorios

```
zerodata/
├── public/
│   └── c2pa.wasm                 # Adobe C2PA WASM binary
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── layout.tsx            # Root server layout (fonts, metadata, SEO, CSP headers)
│   │   ├── client-layout.tsx     # Client wrapper (I18nProvider + Navbar)
│   │   ├── page.tsx              # Main tool page (full app flow state machine)
│   │   ├── faq/page.tsx          # FAQ page (9 bilingual questions)
│   │   └── globals.css           # Tailwind directives + CSS custom properties + animations
│   ├── features/                 # Feature-based architecture
│   │   ├── ai-ml-detector/       # Opt-in ML deep scan (Web Worker + React hook)
│   │   │   ├── use-ml-detector.ts  # Hook managing worker lifecycle
│   │   │   └── worker.ts           # Worker: loads transformers.js, runs classifier
│   │   ├── download/
│   │   │   └── download-button.tsx  # Blob-based download trigger
│   │   ├── language/
│   │   │   └── language-toggle.tsx  # Standalone toggle (redundant; navbar has its own)
│   │   ├── metadata-parser/      # Pure functions — zero React deps
│   │   │   ├── types.ts          # All TypeScript interfaces (190 lines)
│   │   │   ├── exif.ts           # EXIF parser (41 fields) via exifr
│   │   │   ├── iptc.ts           # IPTC parser via exifr
│   │   │   ├── xmp.ts            # XMP parser via exifr
│   │   │   ├── c2pa.ts           # C2PA/JUMBF detection (byte-scan + Adobe SDK + fallback)
│   │   │   ├── ai-detection.ts   # Multi-source AI generation verdict
│   │   │   └── index.ts          # Barrel exports
│   │   ├── metadata-stripper/    # Pure functions — zero React deps
│   │   │   ├── strip.ts          # Byte-level JPEG/PNG/WebP stripper (no re-encoding)
│   │   │   └── index.ts          # Barrel exports
│   │   ├── navigation/
│   │   │   └── navbar.tsx        # Sticky navbar + integrated EN/ES toggle
│   │   ├── preview/              # Metadata display components
│   │   │   ├── ai-badge.tsx       # Standalone AI badge (currently unused in main flow)
│   │   │   ├── ai-verdict-card.tsx # Main AI detection verdict panel
│   │   │   ├── before-after.tsx   # Summary + metadata table + strip stats wrapper
│   │   │   ├── metadata-table.tsx  # Collapsible accordion metadata viewer
│   │   │   └── summary-card.tsx   # File info + EXIF summary badges
│   │   ├── strip-options/
│   │   │   ├── strip-categories.ts  # 6 category definitions + default selection
│   │   │   └── strip-panel.tsx      # Checkbox selector + strip button
│   │   └── upload/
│   │       ├── file-reader.ts       # File validation (magic bytes, size, ArrayBuffer)
│   │       └── upload-zone.tsx      # Drag-and-drop / click-to-browse zone
│   └── lib/                      # Shared utilities
│       ├── binary-reader.ts      # DataView wrapper with seekable cursor
│       ├── file-utils.ts         # Magic-byte detection, file extension, size formatting
│       └── i18n.tsx              # Full bilingual i18n system (context + hook + translations)
├── next.config.ts                # CSP headers + transpilePackages
├── tsconfig.json                 # strict, path alias @/ → src/
├── eslint.config.mjs             # Flat config (core-web-vitals + typescript)
├── postcss.config.mjs            # @tailwindcss/postcss plugin
└── package.json
```

---

## 5. Key Dependencies in Detail · Dependencias Clave en Detalle

### `@contentauth/c2pa-web` (Adobe C2PA SDK)

- **WASM binary**: `public/c2pa.wasm` — must be served from `/c2pa.wasm` at runtime.
- **Lazy-loaded singleton**: The SDK is only loaded if a JUMBF signature is first detected via fast byte-scan (`hasJumbfSignature` in `src/features/metadata-parser/c2pa.ts`).
- **Two-phase detection**: (1) Fast byte-scan looks for JPEG APP11 markers with "JP"/"jumb" or PNG "c2pa"/"jumb" chunks. (2) If found, the WASM SDK is loaded to read the full manifest store. (3) If SDK fails, a manual JUMBF/C2PA box parser is used as fallback.
- **Transpile**: Listed in `next.config.ts` → `transpilePackages`.

### `@huggingface/transformers`

- **Model**: `umm-maybe/AI-image-detector` (ONNX image classification).
- **Execution**: Runs in a dedicated Web Worker (`src/features/ai-ml-detector/worker.ts`). The worker loads the pipeline, receives `classify` messages with ImageBitmap (downscaled to 224×224 via OffscreenCanvas), runs inference, and posts the probability back.
- **Opt-in only**: Deep scan is never automatic. The user must click the "Deep Scan" button in the AI verdict card.
- **Network**: Model files are downloaded from HuggingFace CDN. The browser Cache API caches them. The `connect-src` CSP directive is the only external HTTP allowance.

### `exifr`

- **Lazy-loaded**: Dynamically imported via `await import("exifr")` inside each parser function (EXIF, IPTC, XMP). NOT a top-level import.
- **Usage pattern**: `exifr.parse(input, options)` with selective `pick` for field filtering.

---

## 6. App State Machine · Máquina de Estados de la App

```
idle → processing → uploaded → stripping → done
```

| Phase · Fase | EN Description | ES Descripción |
|---|---|---|
| `idle` | Upload zone visible, no file selected | Zona de carga visible, sin archivo seleccionado |
| `processing` | Spinner shown while parsing metadata | Spinner mostrado durante el parseo de metadatos |
| `uploaded` | Metadata displayed, strip panel active | Metadatos mostrados, panel de eliminación activo |
| `stripping` | Strip in progress, button shows spinner | Eliminación en progreso, botón muestra spinner |
| `done` | Download button shown, strip stats visible | Botón de descarga mostrado, estadísticas visibles |

The state is managed via `useState<AppPhase>` in `src/app/page.tsx:272`. The `AppPhase` type is defined in `src/features/metadata-parser/types.ts`.

---

## 7. Conventions & Patterns · Convenciones y Patrones

### Feature-based architecture · Arquitectura por funcionalidad

Each domain is a self-contained folder under `src/features/`, NOT organized by type (components/hooks/utils). Every feature folder has an `index.ts` barrel export. New features follow this pattern:

```
src/features/my-feature/
├── my-feature.tsx       # Main implementation
├── related-util.ts      # Supporting pure functions (if needed)
└── index.ts             # Barrel exports
```

### Pure function separation · Separación de funciones puras

- `src/features/metadata-parser/` and `src/features/metadata-stripper/` contain **zero React imports**. They work exclusively on `ArrayBuffer`, `Uint8Array`, and typed plain objects.
- This makes them trivially testable, reusable in Web Workers, and framework-independent.

### Lazy loading · Carga diferida

- `exifr` is dynamically imported inside parser functions, not at the top level.
- C2PA WASM SDK is a lazy singleton — loaded only when JUMBF signature is confirmed.
- ML model Web Worker is created on demand via `use-ml-detector.ts` hook.

### Component conventions · Convenciones de componentes

- **Client components**: Marked with `"use client"` directive at the top. Used for interactivity (state, effects, event handlers).
- **Server components**: Default in App Router. Used for layout, metadata, static content.
- **Naming**: PascalCase for components, kebab-case for files. Hooks use `use-` prefix files (e.g., `use-ml-detector.ts`).
- **Styling**: Tailwind CSS v4 utility classes only. Dark theme via CSS custom properties in `globals.css`. Accent color: `#00e5a0` (green).
- **Icons**: `@phosphor-icons/react` exclusively. Import specific icons, not the full library.

### TypeScript · Tipado

- `strict: true` in `tsconfig.json`. No exceptions.
- Path alias `@/*` maps to `./src/*`.
- All parser/stripper types live in `src/features/metadata-parser/types.ts`.
- Never use `any`. Use `unknown` for truly unknown types and narrow with type guards.

### i18n conventions · Convenciones de i18n

- Translations live in the `translations` object in `src/lib/i18n.tsx` (524 lines, `as const`).
- Structure: `translations.en.section.key` and `translations.es.section.key`.
- Access in components: `const { t } = useI18n()`, then `t("section.key")`.
- For category objects with `label` + `desc`: use `tc("categories.key")`.
- **String interpolation**: Translation strings contain `{placeholder}` tokens. Callers replace them: `t("key").replace("{placeholder}", value)`.
- **Adding a new string**: Add it to BOTH `en` and `es` sections. The key must be identical in both languages.
- **SSR safety**: The `I18nProvider` starts with `"en"`, then applies user preference in `useEffect` after mount to avoid hydration mismatches.
- **Storage**: `localStorage` key `zerodata-lang`. Falls back to `navigator.language.startsWith("es")`.

### Accessibility · Accesibilidad

- Skip-to-content link (hidden until focused).
- `aria-label`, `aria-expanded`, `aria-pressed`, `aria-current="page"`, `aria-live="polite"` throughout.
- `role="region"` and `role="alert"` where appropriate.
- Keyboard navigation: upload zone is focusable and responds to Enter/Space.
- `:focus-visible` custom styling.
- `prefers-reduced-motion` media query disables animations.
- `document.documentElement.lang` is set dynamically by `I18nProvider`.

### Formatting · Formateo

- Prettier config (`.prettierrc`): `semi: true`, `singleQuote: false`, `trailingComma: "es5"`, `tabWidth: 2`, `printWidth: 100`.
- ESLint flat config (`eslint.config.mjs`): extends `eslint-config-next` (core-web-vitals + typescript).

---

## 8. Security & Privacy · Seguridad y Privacidad

### CSP (Content Security Policy)

Defined in `next.config.ts` as custom HTTP headers:

```
default-src 'self'
script-src 'self' 'unsafe-eval' ['unsafe-inline' in dev]
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com
img-src 'self' data: blob:
font-src 'self' https://fonts.gstatic.com
connect-src 'self' https://huggingface.co https://cdn-lfs*.huggingface.co https://cdn-lfs-us-1.hf.co https://*.huggingface.co
worker-src 'self' blob:
media-src 'self' blob:
```

### Additional HTTP headers · Cabeceras HTTP adicionales

- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()` — all denied.

### Network safety checklist · Lista de verificación de seguridad de red

Before committing code, verify:

| EN | ES |
|----|----|
| Grep for `fetch(`, `XMLHttpRequest`, `sendBeacon` to confirm no image bytes are sent externally. | Buscar con grep `fetch(`, `XMLHttpRequest`, `sendBeacon` para confirmar que no se envían bytes de imagen externamente. |
| Verify the only external `connect-src` targets are HuggingFace CDN domains. | Verificar que los únicos destinos `connect-src` externos sean dominios CDN de HuggingFace. |
| No analytics, no telemetry, no error reporting services. | Sin analytics, sin telemetría, sin servicios de reporte de errores. |
| User images exist only in `ArrayBuffer`, `Uint8Array`, `Blob`, or `ObjectURL` — all in-memory and local. | Las imágenes del usuario existen solo en `ArrayBuffer`, `Uint8Array`, `Blob` u `ObjectURL` — todo en memoria y local. |

---

## 9. Verification Commands · Comandos de Verificación

```bash
npm run typecheck   # tsc --noEmit — must pass with zero errors
npm run lint        # eslint . — must pass with zero warnings/errors
npm run build       # next build — must produce a clean production build
npm run format      # prettier --write . — format all files before commit
```

**Pre-commit gate**: All three must pass clean before any commit. The build verifies that the CSP headers, WASM loading, and transpilePackages config are all correct.

---

## 10. Common Tasks · Tareas Comunes

### Adding a new metadata field

1. Define the field type in `src/features/metadata-parser/types.ts`.
2. Parse it in the relevant parser (`exif.ts`, `iptc.ts`, `xmp.ts`, `c2pa.ts`).
3. Add display logic in `src/features/preview/metadata-table.tsx` or `summary-card.tsx`.
4. Add translations for any new labels in `src/lib/i18n.tsx` (both EN and ES).
5. Run `npm run typecheck` and `npm run lint`.

### Adding a new strip category

1. Add the category ID to `StripCategoryId` in `types.ts`.
2. Add the category definition in `src/features/strip-options/strip-categories.ts`.
3. Add strip logic in `src/features/metadata-stripper/strip.ts`.
4. Add translations for the category `label` and `desc` in `src/lib/i18n.tsx` (both EN and ES, under `categories`).

### Adding a new page

1. Create `src/app/my-page/page.tsx` as a server component (or client if interactivity needed).
2. Add i18n strings for all page text in `src/lib/i18n.tsx` (both EN and ES).
3. Register the page in `src/features/navigation/navbar.tsx` if it should appear in the nav.
4. Use the `t()` hook for all user-facing strings — never hardcode.

### Adding a new npm dependency

1. Check that the dependency does not make external network requests beyond `*.huggingface.co`.
2. If it uses WASM or Web Workers, add it to `transpilePackages` in `next.config.ts`.
3. If it requires new CSP directives, update the headers in `next.config.ts`.
4. Run `npm run build` to verify the production build still passes.

### Updating C2PA WASM binary

1. Replace `public/c2pa.wasm` with the new binary.
2. Update `@contentauth/c2pa-web` npm package to the matching version.
3. Test that `hasJumbfSignature` and `parseC2PA` still work on C2PA-signed test images.
4. Run `npm run build` to verify WASM is properly served.

---

## 11. Code Review Checklist · Lista de Revisión de Código

| # | EN | ES |
|---|----|----|
| 1 | No `any` types anywhere. | Sin tipos `any` en ninguna parte. |
| 2 | All user-facing strings are in BOTH EN and ES in `i18n.tsx`. | Todas las cadenas visibles están en AMBOS idiomas en `i18n.tsx`. |
| 3 | No `fetch()`, `XMLHttpRequest`, or `sendBeacon` sending image data externally. | Sin `fetch()`, `XMLHttpRequest` ni `sendBeacon` que envíen datos de imagen externamente. |
| 4 | Parser/stripper code has zero React imports. | El código de parser/stripper no tiene imports de React. |
| 5 | New WASM/Worker dependencies are in `transpilePackages`. | Las nuevas dependencias WASM/Worker están en `transpilePackages`. |
| 6 | Accessibility: `aria-*`, keyboard nav, `prefers-reduced-motion` respected. | Accesibilidad: `aria-*`, navegación por teclado, `prefers-reduced-motion` respetado. |
| 7 | `npm run typecheck` passes clean. | `npm run typecheck` pasa limpio. |
| 8 | `npm run lint` passes clean. | `npm run lint` pasa limpio. |
| 9 | `npm run build` passes clean. | `npm run build` pasa limpio. |
| 10 | New translations use the correct section and follow existing patterns. | Las nuevas traducciones usan la sección correcta y siguen los patrones existentes. |

---

## 12. Footer & Privacy Messaging · Pie de Página y Mensajes de Privacidad

Every page must include a footer (currently rendered in `src/app/page.tsx` and `src/app/faq/page.tsx`) with:

- A shield icon + "No telemetry" / "Sin telemetría"
- "Open Source" label
- A note that the deep scan downloads the AI model locally and never uploads images / "El escaneo profundo descarga el modelo de IA localmente y nunca sube imágenes"
- "100% client-side" / "100% en el cliente"

---

## 13. Known Limitations · Limitaciones Conocidas

| EN | ES |
|----|----|
| No server-side rendering for the main tool — the entire flow is client-side. | Sin server-side rendering para la herramienta principal — todo el flujo es del lado del cliente. |
| C2PA WASM binary is ~1.2 MB and loaded on demand (only if JUMBF signature detected). | El binario WASM de C2PA pesa ~1.2 MB y se carga bajo demanda (solo si se detecta firma JUMBF). |
| ML model files are downloaded from HuggingFace CDN on first deep scan (~50-100 MB cached). | Los archivos del modelo ML se descargan del CDN de HuggingFace en el primer escaneo profundo (~50-100 MB en caché). |
| No testing framework is configured. `typecheck` + `lint` + `build` serve as quality gates. | No hay framework de testing configurado. `typecheck` + `lint` + `build` funcionan como controles de calidad. |
| Language toggle in navbar replaces the standalone `LanguageToggle` component (which is kept but unused). | El toggle de idioma en la navbar reemplaza el componente `LanguageToggle` independiente (que se conserva pero no se usa). |
