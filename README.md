<h1 align="center">ZeroData</h1>
<p align="center"><strong>Inspect &amp; strip image metadata. 100% client-side. Nothing leaves your device.</strong></p>
<p align="center"><em>Inspeccioná y eliminá metadatos de imágenes. 100% en el cliente. Nada sale de tu dispositivo.</em></p>

<p align="center">
  <img src="https://img.shields.io/badge/next.js-16.2-black?logo=next.js" alt="Next.js 16.2">
  <img src="https://img.shields.io/badge/react-19.2-blue?logo=react" alt="React 19.2">
  <img src="https://img.shields.io/badge/typescript-strict-blue?logo=typescript" alt="TypeScript strict">
  <img src="https://img.shields.io/badge/tailwind-4.0-06B6D4?logo=tailwindcss" alt="Tailwind CSS 4">
  <img src="https://img.shields.io/badge/privacy--first-green" alt="Privacy-first">
  <img src="https://img.shields.io/badge/license-MIT-brightgreen" alt="MIT License">
  <img src="https://img.shields.io/badge/languages-EN%20%7C%20ES-00e5a0" alt="EN | ES">
</p>

---

## What is ZeroData?

ZeroData is a **privacy-first browser tool** that lets you inspect and remove metadata from JPEG, PNG, and WebP images — entirely on your device. Nothing is ever uploaded to a server.

- **Inspect** EXIF (GPS, camera, device, timestamps, capture settings), IPTC, and XMP metadata
- **Detect** AI-generated images via C2PA provenance, heuristics, and an opt-in ONNX deep scan
- **Strip** metadata at the byte level with zero quality loss (no re-encoding)
- **Download** a clean copy — ready to share safely

---

## ¿Qué es ZeroData?

ZeroData es una **herramienta de navegador centrada en la privacidad** que te permite inspeccionar y eliminar metadatos de imágenes JPEG, PNG y WebP — completamente en tu dispositivo. Nada se sube jamás a un servidor.

- **Inspeccioná** metadatos EXIF (GPS, cámara, dispositivo, marcas de tiempo, ajustes), IPTC y XMP
- **Detectá** imágenes generadas por IA vía procedencia C2PA, heurísticas y un escaneo profundo ONNX opcional
- **Eliminá** metadatos a nivel de bytes sin pérdida de calidad (sin recodificación)
- **Descargá** una copia limpia — lista para compartir de forma segura

---

## Table of Contents

- [Features](#features)
- [How It Works](#how-it-works)
- [Getting Started](#getting-started)
- [How to Use](#how-to-use)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [AI Detection](#ai-detection)
- [Supported Formats](#supported-formats)
- [Privacy & Security](#privacy--security)
- [Contributing](#contributing)
- [License](#license)

---

<a name="features"></a>
## Features

| Feature | Description |
|---|---|
| **Full metadata inspection** | EXIF (GPS, camera, device, timestamps, capture settings, software, copyright), IPTC (caption, headline, keywords, credits), XMP (creator, rights, title, description, rating) |
| **AI generation detection** | Three-tier verdict system — C2PA cryptographic provenance, heuristic keyword/pattern detection, and optional local ONNX deep scan |
| **Byte-level stripping** | Removes metadata chunks without re-encoding the image. Zero quality loss — pixel data is untouched |
| **Granular categories** | Choose what to remove: EXIF, IPTC, XMP, AI signatures, copyright notices, or everything at once |
| **Drag & drop** | Simple, fast upload zone with file validation (magic bytes, size limit) |
| **Bilingual UI** | Full English and Spanish support (`en` / `es`), auto-detected from browser language |
| **Dark theme** | Custom dark UI with green accent (`#00e5a0`), reduced-motion support |
| **Accessibility** | Keyboard navigation, ARIA attributes, skip-to-content, `prefers-reduced-motion` respected |
| **100% client-side** | No server, no uploads, no telemetry, no analytics. Free and open source |

---

<a name="how-it-works"></a>
## How It Works

### Metadata Inspection

1. **Upload** — Drag & drop (or browse) any JPEG, PNG, or WebP file. The file is validated via magic bytes and read into an `ArrayBuffer` in memory.
2. **Parse** — `exifr` lazily extracts EXIF, IPTC, and XMP fields. A fast byte-scan checks for C2PA/JUMBF signatures; if found, the Adobe C2PA SDK (WASM, ~1.2 MB) decodes the provenance manifest.
3. **AI Detection** — A multi-source engine checks C2PA signatures (Confirmed verdict), PNG text chunks and EXIF patterns for Stable Diffusion/ComfyUI/Midjourney/DALL-E markers (Likely verdict), and optionally runs a local ONNX model in a Web Worker (opt-in deep scan).
4. **View** — Results are displayed in collapsible accordion sections: GPS, Device, Timestamps, Camera Settings, Software, IPTC, XMP, C2PA, and an AI verdict card with evidence.

### Metadata Stripping

1. **Select categories** — Choose which metadata to remove (EXIF, IPTC, XMP, AI signatures, copyright, or everything).
2. **Strip** — Byte-level removal:
   - **JPEG**: Removes selected APPn markers, preserving image data unchanged.
   - **PNG**: Removes ancillary chunks (tEXt, iTXt, zTXt, eXIf, tIME, c2pa, etc.) while keeping critical chunks.
   - **WebP**: Removes EXIF/XMP/ICCP/C2PA RIFF chunks, updates VP8X flags.
3. **Download** — Generates a `_cleaned` copy via blob URL. Stats show bytes removed and size reduction.

---

<a name="getting-started"></a>
## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9

### Install & Run

```bash
# Clone the repo
git clone https://github.com/Fontanacx/zerodata.git
cd zerodata

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Verification Commands

```bash
npm run typecheck   # TypeScript strict mode check (tsc --noEmit)
npm run lint        # ESLint (flat config, core-web-vitals + TypeScript)
npm run format      # Prettier
npm run build       # Production build (verifies CSP, WASM, transpilePackages)
```

All three (`typecheck` + `lint` + `build`) must pass clean before committing.

---

<a name="how-to-use"></a>
## How to Use

### Inspect an image
1. Open [zerodata](https://zerodata-two.vercel.app) (or your local `http://localhost:3000`).
2. Drag & drop a JPEG, PNG, or WebP file onto the upload zone, or click to browse.
3. Browse the metadata sections — GPS location, camera model, capture settings, timestamps, IPTC credits, XMP rights, and C2PA provenance.
4. Check the AI verdict card to see if the image was generated by AI.

### Remove metadata
1. After inspection, select which metadata categories to remove (or choose "Remove Everything").
2. Click the strip button.
3. Download the cleaned image — it will have the same visual quality but without the metadata you selected.

### Deep scan for AI (optional)
1. In the AI verdict card, click "Deep Scan" to download and run the local ONNX model.
2. The model (~50-100 MB) is downloaded once and cached by your browser.
3. Results are merged with the existing heuristic analysis.
4. **Note:** The deep scan runs entirely on your device. The image never leaves your browser.

---

<a name="tech-stack"></a>
## Tech Stack

| Concern | Choice | Why |
|---|---|---|
| Framework | **Next.js 16** (App Router) | Server components for layout/SEO, client components for the tool |
| Language | **TypeScript** (`strict: true`) | Type safety, no `any`, self-documenting |
| EXIF/IPTC/XMP | **exifr** ^7.1.3 | Fast, selective field parsing, lazy-loaded |
| C2PA provenance | **@contentauth/c2pa-web** ^0.13 | Adobe C2PA SDK (WASM), verified manifests |
| ML detection | **@huggingface/transformers** ^4.2 | ONNX image classifier in Web Worker |
| Styling | **Tailwind CSS v4** | Utility-first, zero-runtime CSS, dark theme |
| Icons | **@phosphor-icons/react** ^2.1 | Tree-shakable, thin, consistent |
| Linting | **ESLint 9** (flat config) | `eslint-config-next` (core-web-vitals + TypeScript) |
| Formatting | **Prettier** | Consistent code style |

---

<a name="architecture"></a>
## Architecture

```
zerodata/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── layout.tsx                # Root server layout (fonts, SEO, CSP)
│   │   ├── client-layout.tsx         # Client wrapper (I18nProvider + Navbar)
│   │   ├── page.tsx                  # Main tool (full app flow)
│   │   ├── faq/page.tsx              # FAQ (9 bilingual questions)
│   │   └── globals.css               # Tailwind + CSS custom properties
│   ├── features/
│   │   ├── metadata-parser/          # Pure functions — zero React deps
│   │   │   ├── exif.ts               #   41 EXIF fields via exifr
│   │   │   ├── iptc.ts               #   IPTC parsing
│   │   │   ├── xmp.ts                #   XMP parsing
│   │   │   ├── c2pa.ts               #   C2PA/JUMBF (byte-scan + Adobe SDK)
│   │   │   ├── ai-detection.ts       #   Multi-source AI verdict engine
│   │   │   └── types.ts              #   All TypeScript interfaces
│   │   ├── metadata-stripper/        # Pure functions — zero React deps
│   │   │   └── strip.ts              #   Byte-level JPEG/PNG/WebP stripping
│   │   ├── ai-ml-detector/           # Opt-in ONNX deep scan
│   │   │   ├── worker.ts             #   Web Worker (transformers.js)
│   │   │   └── use-ml-detector.ts    #   React hook
│   │   ├── upload/                   # File upload + validation
│   │   ├── preview/                  # Metadata display components
│   │   ├── strip-options/            # Granular category selector
│   │   ├── download/                 # Blob-based download
│   │   └── navigation/               # Navbar + language toggle
│   └── lib/                          # Shared utilities
│       ├── i18n.tsx                  # Full EN/ES i18n system
│       ├── binary-reader.ts          # DataView seekable cursor
│       └── file-utils.ts             # Magic bytes, file type, formatting
├── public/
│   └── c2pa.wasm                     # Adobe C2PA WASM binary
├── next.config.ts                    # CSP headers + transpilePackages
├── tsconfig.json                     # strict mode, @/ path alias
└── eslint.config.mjs                 # Flat config
```

### Design Principles

- **Feature-based** — Each domain is a self-contained feature folder with barrel exports. Not type-based (no `components/`, `hooks/`, `utils/` dumping grounds).
- **Pure functions** — Metadata parsing and stripping have zero React dependencies. They operate on `ArrayBuffer`/`Uint8Array` and return typed plain objects. Trivially testable, reusable in Web Workers.
- **Lazy loading** — `exifr` is dynamically imported in parser functions. C2PA WASM SDK is loaded only when a JUMBF signature is detected. ML model runs on demand in a Web Worker.
- **No UI library** — Pure Tailwind CSS v4 with CSS custom properties. No runtime cost, full control.
- **No external requests** — The only allowed network call is the ML model download from HuggingFace CDN (`*.huggingface.co`). Enforced via CSP in `next.config.ts`.

---

<a name="ai-detection"></a>
## AI Detection

ZeroData uses a three-tier verdict system:

### Tier 1 — Confirmed (C2PA cryptographic provenance)

Uses the official **Adobe C2PA SDK** (WASM, fully local). Verifies and decodes C2PA/JUMBF provenance manifests embedded in JPEG APP11 markers or PNG c2pa chunks. Extracts:

- **Generator & vendor** (OpenAI DALL-E, Google Imagen, Adobe Firefly, Microsoft Bing, Midjourney)
- **Digital source type** (`trainedAlgorithmicMedia`, `compositeWithTrainedAlgorithmicMedia`)
- **Cryptographic signature info** and validation state
- **Actions** and claims from the assertion store

The SDK is loaded lazily — only when a JUMBF signature is detected via a fast byte-scan pre-check.

### Tier 2 — Likely (heuristics + optional ML)

- **Metadata heuristics** — Scans PNG text chunks (`parameters`, `prompt`, `comfy`, `workflow`) from Stable Diffusion, ComfyUI, Automatic1111; EXIF UserComment patterns (Midjourney, DALL-E); XMP CreatorTool (Adobe Firefly)
- **Deep scan (opt-in)** — Downloads a quantized ONNX model ([umm-maybe/AI-image-detector](https://huggingface.co/umm-maybe/AI-image-detector)) once (~50-100 MB, cached via Cache API). Runs in a Web Worker using [transformers.js](https://huggingface.co/docs/transformers.js). Resizes image to 224×224 via OffscreenCanvas, classifies locally. Probability ≥ 80% → "Likely AI‑generated".

### Tier 3 — No indicators

"No AI indicators found" — ZeroData **never** claims an image is "real" or "authentic". Absence of evidence is not evidence of absence.

> **Accuracy disclaimer:** AI detection is inherently imperfect. C2PA signatures can be absent, metadata can be stripped, and ML models can produce false positives/negatives. ZeroData provides signals, not guarantees.

---

<a name="supported-formats"></a>
## Supported Formats

| Format | Metadata Read | Stripping Method | Quality Loss |
|---|---|---|---|
| **JPEG** | EXIF (APP1), IPTC/XMP (APP13), C2PA (APP11), COM | APPn marker removal | None |
| **PNG** | eXIf chunk, tEXt/iTXt/zTXt chunks, c2pa chunk | Chunk removal + CRC update | None |
| **WebP** | EXIF, XMP, ICCP, C2PA RIFF chunks | RIFF chunk removal | None |

---

<a name="privacy--security"></a>
## Privacy & Security

ZeroData is designed with privacy as a core constraint, not an afterthought.

### What happens on your device
- ALL metadata parsing, AI detection, and stripping runs in your browser.
- Images exist only as `ArrayBuffer`, `Uint8Array`, `Blob`, or `ObjectURL` — in memory, never stored.

### What NEVER happens
- No image uploads — never, for any reason.
- No telemetry, no analytics, no error reporting services.
- No external API calls for metadata analysis.

### The one allowed network call
- The opt-in ML deep scan downloads the ONNX model from HuggingFace CDN (`*.huggingface.co`). This is the **only** external `connect-src` target, enforced via Content Security Policy in `next.config.ts`.

### Security headers

| Header | Value |
|---|---|
| `Content-Security-Policy` | Strict CSP — only `*.huggingface.co` allowed for `connect-src` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` — all denied |

---

<a name="contributing"></a>
## Contributing

Contributions are welcome. ZeroData is designed for extensibility.

### Before you start
1. Read `AGENTS.md` for the full agent guide and code review checklist.
2. Run `npm run typecheck`, `npm run lint`, and `npm run build` before committing — all must pass clean.

### Adding a new metadata field
1. Define the type in `src/features/metadata-parser/types.ts`
2. Parse it in the relevant parser (`exif.ts`, `iptc.ts`, `xmp.ts`, `c2pa.ts`)
3. Add display logic in `src/features/preview/metadata-table.tsx` or `summary-card.tsx`
4. Add translations in `src/lib/i18n.tsx` (both EN and ES)

### Adding a new strip category
1. Add the category ID to `StripCategoryId` in `types.ts`
2. Define the category in `src/features/strip-options/strip-categories.ts`
3. Add strip logic in `src/features/metadata-stripper/strip.ts`
4. Add translations for `label` + `desc` in `src/lib/i18n.tsx`

### Hard rules
- No `any` types. `strict: true` always.
- No `fetch()` sending image data externally.
- All user-facing strings in both EN and ES.
- Parser/stripper code must have zero React imports.
- New WASM/Worker dependencies must be added to `transpilePackages` in `next.config.ts`.

---

<a name="license"></a>
## License

MIT © [Fontanacx](https://github.com/Fontanacx)

---

<p align="center">
  <sub>Built with TypeScript · React · Next.js · Tailwind CSS · ❤️</sub>
  <br>
  <sub>100% client-side · No telemetry · Open source</sub>
  <br>
  <sub>100% en el cliente · Sin telemetría · Código abierto</sub>
</p>
