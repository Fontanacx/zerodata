import { pipeline, env } from "@huggingface/transformers";

env.allowLocalModels = false;
env.useBrowserCache = true;

type WorkerMessage =
  | { type: "load" }
  | { type: "classify"; imageData: ArrayBuffer; width: number; height: number }
  | { type: "dispose" };

type WorkerResponse =
  | { type: "progress"; status: string; progress: number; file?: string }
  | { type: "ready" }
  | { type: "result"; probability: number }
  | { type: "error"; message: string };

type ClassifierFn = (input: OffscreenCanvas | Blob, options?: { topk?: number }) => Promise<Array<{ label: string; score: number }>>;

let classifier: ClassifierFn | null = null;

function post(data: WorkerResponse): void {
  self.postMessage(data);
}

async function loadModel(): Promise<void> {
  if (classifier) return;

  classifier = await pipeline("image-classification", "umm-maybe/AI-image-detector", {
    progress_callback: (progress: { status: string; progress?: number; file?: string }) => {
      post({
        type: "progress",
        status: progress.status,
        progress: progress.progress ?? 0,
        file: progress.file,
      });
    },
  }) as unknown as ClassifierFn;

  post({ type: "ready" });
}

async function classifyImage(imageData: ArrayBuffer, width: number, height: number): Promise<number> {
  if (!classifier) {
    throw new Error("Model not loaded");
  }

  const bitmap = await createImageBitmap(new Blob([imageData]));

  const targetSize = 224;
  const canvas = new OffscreenCanvas(targetSize, targetSize);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get canvas context");

  const scale = Math.min(targetSize / width, targetSize / height);
  const scaledWidth = Math.round(width * scale);
  const scaledHeight = Math.round(height * scale);
  const offsetX = Math.round((targetSize - scaledWidth) / 2);
  const offsetY = Math.round((targetSize - scaledHeight) / 2);

  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, targetSize, targetSize);
  ctx.drawImage(bitmap, offsetX, offsetY, scaledWidth, scaledHeight);
  bitmap.close();

  const results = await classifier(canvas, { topk: 2 });
  const aiResult = results.find(
    (r) => r.label.toLowerCase().includes("ai") || r.label.toLowerCase().includes("artificial")
  );

  if (aiResult) {
    return aiResult.score;
  }

  const firstResult = results[0];
  if (firstResult && (firstResult.label === "0" || firstResult.label === "1")) {
    return firstResult.label === "1" ? firstResult.score : 1 - firstResult.score;
  }

  return results[0]?.score ?? 0;
}

self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const msg = event.data;

  try {
    switch (msg.type) {
      case "load":
        await loadModel();
        break;
      case "classify":
        if (!classifier) await loadModel();
        const probability = await classifyImage(msg.imageData, msg.width, msg.height);
        post({ type: "result", probability });
        break;
      case "dispose":
        classifier = null;
        break;
    }
  } catch (error) {
    post({
      type: "error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
};
