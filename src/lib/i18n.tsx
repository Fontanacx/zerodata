import { createContext, useContext, useState, useCallback, useMemo, useEffect } from "react";
import type { ReactNode } from "react";

export type Language = "en" | "es";

function getPreferredLang(): Language {
  try {
    const stored = localStorage.getItem("zerodata-lang");
    if (stored === "en" || stored === "es") return stored;
  } catch { /* unavailable */ }
  if (typeof navigator !== "undefined" && navigator.language?.startsWith("es")) return "es";
  return "en";
}

const translations = {
  en: {
    app: {
      title: "ZeroData",
      subtitle: "Image metadata remover · 100% client-side",
      privacy: "Nothing leaves your device",
    },
    upload: {
      dragIdle: "Drag & drop an image, or click to browse",
      dragOver: "Drop image here",
      formats: "JPEG, PNG, WebP · Max 100MB",
      unsupported: "Unsupported file type. Supported: JPEG, PNG, WebP",
      tooLarge: "File size exceeds 100MB limit",
    },
    fileInfo: {
      unknownFormat: "Unknown",
    },
    summary: {
      fileInfo: "File Information",
      deviceInfo: "Camera & Device",
      gpsLocation: "GPS Location",
      imageDetails: "Image Details",
      aiDetection: "AI Detection",
      noMetadata: "No metadata detected",
      cleanImage: "This image contains no embedded metadata",
      fileName: "File name",
      fileSize: "File size",
      fileType: "File type",
      dimensions: "Dimensions",
      colorSpace: "Color space",
      bitsPerSample: "Bits per sample",
      orientation: "Orientation",
      camera: "Camera",
      lens: "Lens",
      serialNumber: "Serial number",
      software: "Software",
      dateTaken: "Date taken",
      latitude: "Latitude",
      longitude: "Longitude",
      altitude: "Altitude",
      notAvailable: "n/a",
      aiDetected: "AI-generated content detected",
      aiNotDetected: "No AI markers detected",
      aiTool: "AI Tool",
      aiSource: "Source",
      aiConfidence: "Confidence",
      aiFlags: "AI detection flags",
      high: "High",
      medium: "Medium",
      low: "Low",
    },
    metadata: {
      inspection: "Metadata Inspection",
      gps: "GPS Location",
      device: "Camera & Device",
      timestamps: "Timestamps",
      camera: "Camera Settings",
      software: "Software & Attribution",
      userComment: "User Comment",
      iptc: "IPTC Metadata",
      xmp: "XMP Metadata",
      c2pa: "C2PA Provenance",
      keywords: "Keywords",
      fields: "fields",
      stripResult: "Strip Result",
      originalSize: "Original Size",
      cleanedSize: "Cleaned Size",
      bytesRemoved: "Bytes Removed",
      noMetadataFound: "No metadata found in this image",
      cleanDisclaimer: "The image appears to be clean",
      c2paDetected: "Content authenticity manifest detected",
      bytes: "bytes",
      label: {
        make: "Make",
        model: "Model",
        lensMake: "Lens Make",
        lensModel: "Lens Model",
        serialNumber: "Serial Number",
        latitude: "Latitude",
        longitude: "Longitude",
        altitude: "Altitude",
        dateTaken: "Date Taken",
        dateDigitized: "Date Digitized",
        timezone: "Timezone",
        iso: "ISO",
        aperture: "Aperture",
        shutterSpeed: "Shutter Speed",
        focalLength: "Focal Length",
        flash: "Flash",
        software: "Software",
        artist: "Artist",
        copyright: "Copyright",
        description: "Description",
        caption: "Caption",
        headline: "Headline",
        creator: "Creator",
        credit: "Credit",
        source: "Source",
        city: "City",
        country: "Country",
        title: "Title",
        created: "Created",
        modified: "Modified",
        rating: "Rating",
        rights: "Rights",
        creatorTool: "Creator Tool",
        claimGenerator: "Claim Generator",
        issuer: "Issuer",
      },
      flashFired: "Fired",
      flashNotFired: "Did not fire",
    },
    strip: {
      title: "Strip Options",
      strip: "Strip Selected Metadata",
      stripping: "Stripping...",
      selectHint: "Select at least one category to enable stripping",
      noMetadata: "No metadata detected in this image",
    },
    download: {
      button: "Download Cleaned Image",
    },
    processing: {
      parsing: "Parsing metadata...",
    },
    footer: {
      developed: "Developed by",
      rights: "All rights reserved.",
      noTelemetry: "No telemetry",
      openSource: "Open Source",
      deepScanPrivacy: "Deep scan downloads a model file once; your image is analyzed locally and never uploaded.",
    },
    nav: {
      tool: "Tool",
      faq: "FAQ",
    },
    reset: {
      tooltip: "Upload a different image",
    },
    faq: {
      title: "FAQ",
      subtitle: "Frequently asked questions about ZeroData",
      disclaimer: "Disclaimer",
      disclaimerText: "ZeroData is a metadata inspection and removal tool. Metadata removal from your own images is generally legal worldwide. However, removing metadata from images you do not own or with intent to conceal copyright infringement, evidence, or deceive others may violate applicable laws. Users are solely responsible for ensuring their use complies with local regulations.",
      q1: {
        q: "What is ZeroData?",
        a: "ZeroData is a 100% client-side tool that lets you inspect and remove hidden metadata from your images — including EXIF data (GPS location, camera model, timestamps), IPTC/XMP fields, C2PA provenance signatures, and AI-generation markers. Nothing ever leaves your device.",
      },
      q2: {
        q: "Is my image uploaded to any server?",
        a: "No. All processing happens entirely in your browser. ZeroData does not use a backend server, does not send your images anywhere, and collects no telemetry or analytics. You can verify this by disconnecting your internet after the page loads — everything still works.",
      },
      q3: {
        q: "Is it legal to remove metadata from images?",
        a: "Yes — removing metadata from your own images is legal in virtually all jurisdictions. Metadata removal is a common privacy practice recommended by privacy advocates, journalists, and security professionals. However, removing metadata with intent to commit fraud, infringe copyright, tamper with evidence, or violate platform terms of service may be illegal. Always ensure you have the right to modify the images you process.",
      },
      q4: {
        q: "Does stripping metadata affect image quality?",
        a: "No. ZeroData performs byte-level stripping — it removes only the metadata segments from the file without re-encoding or re-compressing the image. The pixel data remains bit-for-bit identical to the original. The file size decreases slightly because metadata bytes are removed.",
      },
      q5: {
        q: "What image formats are supported?",
        a: "JPEG, PNG, and WebP. Maximum file size is 100MB. ZeroData strips EXIF (APP1), IPTC/XMP (APP13), C2PA (APP11), and comment markers from JPEGs; eXIf, tEXt/iTXt/zTXt, and C2PA chunks from PNGs; and EXIF/XMP chunks from WebP files.",
      },
      q6: {
        q: "Which metadata can I choose to remove?",
        a: "You can selectively remove: EXIF Data (camera, GPS, timestamps, settings), IPTC Metadata (captions, keywords, credits), XMP Metadata (creator, rights, title), AI Signatures (C2PA provenance, PNG generation parameters), and Copyright & Attribution data. Or choose 'Remove Everything' to strip it all at once.",
      },
      q7: {
        q: "How accurate is the AI detection?",
        a: "The heuristic detection checks for C2PA provenance manifests (cryptographically signed by Adobe, Microsoft, etc.), PNG text chunk patterns from Stable Diffusion and ComfyUI, and EXIF UserComment patterns from Midjourney and DALL-E. The optional deep scan uses a local HuggingFace ONNX model. All detection is heuristic — false positives and false negatives are possible, especially if metadata has already been stripped.",
      },
      q8: {
        q: "What happens if I upload a file that already has no metadata?",
        a: "ZeroData will show 'No metadata found' and the strip button will be disabled. You can still analyze the file, but there is nothing to remove.",
      },
      q9: {
        q: "Is ZeroData open source?",
        a: "Yes. ZeroData is open source software. You can inspect the source code to verify its privacy claims and contribute on GitHub.",
      },
      backHome: "Back to ZeroData",
    },
    error: {
      parseFailed: "Failed to parse metadata",
      tryAgain: "Try again",
    },
    categories: {
      all: { label: "Remove Everything", desc: "Strip all metadata from the image. Maximum privacy, minimum file size." },
      exif: { label: "EXIF Data", desc: "Remove camera make, model, GPS, timestamps, camera settings, and software." },
      iptc: { label: "IPTC Metadata", desc: "Remove caption, keywords, credit, source, and other IPTC fields." },
      xmp: { label: "XMP Metadata", desc: "Remove creator, rights, title, and other XMP data." },
      "ai-signature": { label: "AI Signature", desc: "Remove C2PA provenance, PNG generation params, and other AI markers." },
      copyright: { label: "Copyright & Attribution", desc: "Remove copyright notices, artist names, and attribution data." },
    },
    ai: {
      sectionTitle: "AI Detection",
      verdict: {
        confirmed: "AI-generated — signed",
        likely: "Likely AI-generated",
        inconclusive: "Inconclusive",
        none: "No AI indicators found",
        confirmedSigned: "AI-generated — signed by {generator}",
        confirmedGenerator: "AI-generated by {generator}",
        likelyPercent: "Likely AI-generated ({percent}%)",
        likelyTool: "Likely generated by {tool}",
        noneDisclaimer: "Absence of evidence is not evidence of absence. Metadata may have been removed.",
      },
      why: "Why?",
      deepScan: "Deep scan (local AI model)",
      deepScanAgain: "Run deep scan again",
      loadingModel: "Loading AI model...",
      classifying: "Analyzing image...",
      heuristicDisclaimer: "Heuristic — can be wrong. Metadata may have been removed.",
    },
  },
  es: {
    app: {
      title: "ZeroData",
      subtitle: "Eliminador de metadatos de imágenes · 100% del lado del cliente",
      privacy: "Nada sale de tu dispositivo",
    },
    upload: {
      dragIdle: "Arrastra una imagen o haz clic para seleccionar",
      dragOver: "Suelta la imagen aquí",
      formats: "JPEG, PNG, WebP · Máx. 100MB",
      unsupported: "Formato no soportado. Formatos válidos: JPEG, PNG, WebP",
      tooLarge: "El archivo supera el límite de 100MB",
    },
    fileInfo: {
      unknownFormat: "Desconocido",
    },
    summary: {
      fileInfo: "Información del Archivo",
      deviceInfo: "Cámara y Dispositivo",
      gpsLocation: "Ubicación GPS",
      imageDetails: "Detalles de la Imagen",
      aiDetection: "Detección de IA",
      noMetadata: "Sin metadatos detectados",
      cleanImage: "Esta imagen no contiene metadatos incrustados",
      fileName: "Nombre",
      fileSize: "Tamaño",
      fileType: "Tipo",
      dimensions: "Dimensiones",
      colorSpace: "Espacio de color",
      bitsPerSample: "Bits por muestra",
      orientation: "Orientación",
      camera: "Cámara",
      lens: "Lente",
      serialNumber: "Número de serie",
      software: "Software",
      dateTaken: "Fecha de captura",
      latitude: "Latitud",
      longitude: "Longitud",
      altitude: "Altitud",
      notAvailable: "n/d",
      aiDetected: "Contenido generado por IA detectado",
      aiNotDetected: "Sin marcadores de IA detectados",
      aiTool: "Herramienta IA",
      aiSource: "Origen",
      aiConfidence: "Confianza",
      aiFlags: "Marcadores de detección IA",
      high: "Alta",
      medium: "Media",
      low: "Baja",
    },
    metadata: {
      inspection: "Inspección de Metadatos",
      gps: "Ubicación GPS",
      device: "Cámara y Dispositivo",
      timestamps: "Marcas de Tiempo",
      camera: "Configuración de Cámara",
      software: "Software y Atribución",
      userComment: "Comentario de Usuario",
      iptc: "Metadatos IPTC",
      xmp: "Metadatos XMP",
      c2pa: "Procedencia C2PA",
      keywords: "Palabras clave",
      fields: "campos",
      stripResult: "Resultado de Limpieza",
      originalSize: "Tamaño Original",
      cleanedSize: "Tamaño Limpio",
      bytesRemoved: "Bytes Eliminados",
      noMetadataFound: "No se encontraron metadatos en esta imagen",
      cleanDisclaimer: "La imagen parece estar limpia",
      c2paDetected: "Manifiesto de autenticidad de contenido detectado",
      bytes: "bytes",
      label: {
        make: "Fabricante",
        model: "Modelo",
        lensMake: "Fab. Lente",
        lensModel: "Modelo Lente",
        serialNumber: "Nº de Serie",
        latitude: "Latitud",
        longitude: "Longitud",
        altitude: "Altitud",
        dateTaken: "Fecha de Captura",
        dateDigitized: "Fecha Digitalización",
        timezone: "Zona Horaria",
        iso: "ISO",
        aperture: "Apertura",
        shutterSpeed: "Vel. Obturación",
        focalLength: "Dist. Focal",
        flash: "Flash",
        software: "Software",
        artist: "Artista",
        copyright: "Copyright",
        description: "Descripción",
        caption: "Leyenda",
        headline: "Titular",
        creator: "Creador",
        credit: "Crédito",
        source: "Origen",
        city: "Ciudad",
        country: "País",
        title: "Título",
        created: "Creado",
        modified: "Modificado",
        rating: "Valoración",
        rights: "Derechos",
        creatorTool: "Herramienta",
        claimGenerator: "Generador",
        issuer: "Emisor",
      },
      flashFired: "Disparado",
      flashNotFired: "No disparado",
    },
    strip: {
      title: "Opciones de Limpieza",
      strip: "Eliminar Metadatos Seleccionados",
      stripping: "Eliminando...",
      selectHint: "Selecciona al menos una categoría para habilitar",
      noMetadata: "No se detectaron metadatos en esta imagen",
    },
    download: {
      button: "Descargar Imagen Limpia",
    },
    processing: {
      parsing: "Analizando metadatos...",
    },
    footer: {
      developed: "Desarrollado por",
      rights: "Todos los derechos reservados.",
      noTelemetry: "Sin telemetría",
      openSource: "Código Abierto",
      deepScanPrivacy: "El análisis profundo descarga un modelo una vez; tu imagen se analiza localmente y nunca se sube.",
    },
    nav: {
      tool: "Herramienta",
      faq: "FAQ",
    },
    reset: {
      tooltip: "Cargar otra imagen",
    },
    faq: {
      title: "FAQ",
      subtitle: "Preguntas frecuentes sobre ZeroData",
      disclaimer: "Aviso Legal",
      disclaimerText: "ZeroData es una herramienta de inspección y eliminación de metadatos. La eliminación de metadatos de tus propias imágenes es generalmente legal en todo el mundo. Sin embargo, eliminar metadatos de imágenes que no te pertenecen o con la intención de ocultar infracciones de copyright, evidencia o engañar a terceros puede violar las leyes aplicables. Los usuarios son los únicos responsables de garantizar que su uso cumpla con las regulaciones locales.",
      q1: {
        q: "¿Qué es ZeroData?",
        a: "ZeroData es una herramienta 100% del lado del cliente que te permite inspeccionar y eliminar metadatos ocultos de tus imágenes — incluyendo datos EXIF (ubicación GPS, modelo de cámara, marcas de tiempo), campos IPTC/XMP, firmas de procedencia C2PA y marcadores de generación por IA. Nada sale de tu dispositivo.",
      },
      q2: {
        q: "¿Mi imagen se sube a algún servidor?",
        a: "No. Todo el procesamiento ocurre completamente en tu navegador. ZeroData no utiliza un servidor backend, no envía tus imágenes a ningún lugar y no recopila telemetría ni analíticas. Puedes verificarlo desconectando tu internet después de que la página cargue — todo seguirá funcionando.",
      },
      q3: {
        q: "¿Es legal eliminar metadatos de las imágenes?",
        a: "Sí — eliminar metadatos de tus propias imágenes es legal en prácticamente todas las jurisdicciones. La eliminación de metadatos es una práctica de privacidad común recomendada por defensores de la privacidad, periodistas y profesionales de seguridad. Sin embargo, eliminar metadatos con intención de cometer fraude, infringir derechos de autor, alterar evidencia o violar los términos de servicio de plataformas puede ser ilegal. Asegúrate siempre de tener derecho a modificar las imágenes que procesas.",
      },
      q4: {
        q: "¿Eliminar metadatos afecta la calidad de la imagen?",
        a: "No. ZeroData realiza una eliminación a nivel de bytes — elimina solo los segmentos de metadatos del archivo sin recodificar ni recomprimir la imagen. Los datos de píxeles permanecen idénticos bit a bit al original. El tamaño del archivo disminuye ligeramente porque se eliminan los bytes de metadatos.",
      },
      q5: {
        q: "¿Qué formatos de imagen son compatibles?",
        a: "JPEG, PNG y WebP. El tamaño máximo de archivo es de 100MB. ZeroData elimina EXIF (APP1), IPTC/XMP (APP13), C2PA (APP11) y marcadores de comentarios de JPEGs; chunks eXIf, tEXt/iTXt/zTXt y C2PA de PNGs; y chunks EXIF/XMP de archivos WebP.",
      },
      q6: {
        q: "¿Qué metadatos puedo elegir eliminar?",
        a: "Puedes eliminar selectivamente: Datos EXIF (cámara, GPS, marcas de tiempo, configuración), Metadatos IPTC (leyendas, palabras clave, créditos), Metadatos XMP (creador, derechos, título), Firmas de IA (procedencia C2PA, parámetros de generación PNG) y datos de Copyright y Atribución. O elige 'Eliminar Todo' para limpiar todo de una vez.",
      },
      q7: {
        q: "¿Qué tan precisa es la detección de IA?",
        a: "La detección heurística verifica manifiestos de procedencia C2PA (firmados criptográficamente por Adobe, Microsoft, etc.), patrones de chunks de texto PNG de Stable Diffusion y ComfyUI, y patrones de UserComment EXIF de Midjourney y DALL-E. El análisis profundo opcional utiliza un modelo ONNX local de HuggingFace. Toda la detección es heurística — los falsos positivos y falsos negativos son posibles, especialmente si los metadatos ya han sido eliminados.",
      },
      q8: {
        q: "¿Qué pasa si subo un archivo que ya no tiene metadatos?",
        a: "ZeroData mostrará 'No se encontraron metadatos' y el botón de limpieza estará deshabilitado. Aún puedes analizar el archivo, pero no hay nada que eliminar.",
      },
      q9: {
        q: "¿ZeroData es de código abierto?",
        a: "Sí. ZeroData es software de código abierto. Puedes inspeccionar el código fuente para verificar sus afirmaciones de privacidad y contribuir en GitHub.",
      },
      backHome: "Volver a ZeroData",
    },
    error: {
      parseFailed: "Error al analizar los metadatos",
      tryAgain: "Intentar de nuevo",
    },
    categories: {
      all: { label: "Eliminar Todo", desc: "Elimina todos los metadatos de la imagen. Máxima privacidad, mínimo tamaño." },
      exif: { label: "Datos EXIF", desc: "Elimina fabricante, modelo, GPS, marcas de tiempo, configuración de cámara y software." },
      iptc: { label: "Metadatos IPTC", desc: "Elimina leyenda, palabras clave, créditos, origen y otros campos IPTC." },
      xmp: { label: "Metadatos XMP", desc: "Elimina creador, derechos, título y otros datos XMP." },
      "ai-signature": { label: "Firma de IA", desc: "Elimina manifiestos C2PA, parámetros de generación PNG y otros marcadores de IA." },
      copyright: { label: "Copyright y Atribución", desc: "Elimina avisos de copyright, nombres de artistas y datos de atribución." },
    },
    ai: {
      sectionTitle: "Detección de IA",
      verdict: {
        confirmed: "Generado por IA — firmado",
        likely: "Probablemente generado por IA",
        inconclusive: "Inconcluso",
        none: "Sin indicadores de IA",
        confirmedSigned: "Generado por IA — firmado por {generator}",
        confirmedGenerator: "Generado por IA por {generator}",
        likelyPercent: "Probablemente generado por IA ({percent}%)",
        likelyTool: "Probablemente generado por {tool}",
        noneDisclaimer: "La ausencia de evidencia no es evidencia de ausencia. Los metadatos pudieron haber sido eliminados.",
      },
      why: "¿Por qué?",
      deepScan: "Análisis profundo (modelo IA local)",
      deepScanAgain: "Ejecutar análisis profundo de nuevo",
      loadingModel: "Cargando modelo IA...",
      classifying: "Analizando imagen...",
      heuristicDisclaimer: "Heurístico — puede fallar. Los metadatos pudieron haber sido eliminados.",
    },
  },
} as const;

interface I18nContextValue {
  lang: Language;
  setLang: (l: Language) => void;
  t: (key: string) => string;
  tc: (key: string) => { label: string; desc: string };
}

const I18nContext = createContext<I18nContextValue | null>(null);

function getNested(obj: Record<string, unknown>, path: string): string {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current === undefined || current === null) return path;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === "string" ? current : path;
}

function getNestedObj(obj: Record<string, unknown>, path: string): { label: string; desc: string } {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current === undefined || current === null) return { label: path, desc: "" };
    current = (current as Record<string, unknown>)[part];
  }
  const c = current as Record<string, unknown>;
  if (!c || typeof c !== "object") return { label: path, desc: "" };
  return {
    label: typeof c.label === "string" ? c.label : path,
    desc: typeof c.desc === "string" ? c.desc : "",
  };
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>("en");

  useEffect(() => {
    // Apply user preference only after mount to avoid SSR hydration mismatch
    const preferred = getPreferredLang();
    setLangState(preferred);
    document.documentElement.lang = preferred;
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((l: Language) => {
    setLangState(l);
    try { localStorage.setItem("zerodata-lang", l); } catch { /* */ }
  }, []);

  const t = useCallback(
    (key: string) => {
      const strings = translations[lang] as unknown as Record<string, unknown>;
      return getNested(strings, key);
    },
    [lang]
  );

  const tc = useCallback(
    (key: string) => {
      const strings = translations[lang] as unknown as Record<string, unknown>;
      return getNestedObj(strings, key);
    },
    [lang]
  );

  const value = useMemo(() => ({ lang, setLang, t, tc }), [lang, setLang, t, tc]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
