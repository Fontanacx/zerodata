"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { AIAnalysisResult } from "@/features/metadata-parser/types";
import { applyMlResult } from "@/features/metadata-parser/ai-detection";

export type MlDetectorStatus = "idle" | "loading" | "ready" | "classifying" | "error";

export interface MlDetectorState {
  status: MlDetectorStatus;
  progress: number;
  progressMessage: string;
  probability: number | null;
  error: string | null;
}

export function useMlDetector() {
  const [state, setState] = useState<MlDetectorState>({
    status: "idle",
    progress: 0,
    progressMessage: "",
    probability: null,
    error: null,
  });

  const workerRef = useRef<Worker | null>(null);

  const getWorker = useCallback(() => {
    if (!workerRef.current) {
      workerRef.current = new Worker(
        new URL("./worker.ts", import.meta.url),
        { type: "module" }
      );
    }
    return workerRef.current;
  }, []);

  const loadModel = useCallback(async () => {
    const worker = getWorker();
    setState((prev) => ({ ...prev, status: "loading", progress: 0, progressMessage: "", error: null }));

    return new Promise<void>((resolve, reject) => {
      const handler = (event: MessageEvent) => {
        const msg = event.data;
        switch (msg.type) {
          case "progress":
            setState((prev) => ({
              ...prev,
              progress: msg.progress,
              progressMessage: msg.status === "download"
                ? `Downloading model${msg.file ? `: ${msg.file}` : ""}`
                : msg.status,
            }));
            break;
          case "ready":
            worker.removeEventListener("message", handler);
            worker.removeEventListener("error", errorHandler);
            setState((prev) => ({ ...prev, status: "ready", progress: 100, progressMessage: "Model loaded" }));
            resolve();
            break;
          case "error":
            worker.removeEventListener("message", handler);
            worker.removeEventListener("error", errorHandler);
            setState((prev) => ({ ...prev, status: "error", error: msg.message }));
            reject(new Error(msg.message));
            break;
        }
      };

      const errorHandler = (event: ErrorEvent) => {
        worker.removeEventListener("message", handler);
        worker.removeEventListener("error", errorHandler);
        setState((prev) => ({ ...prev, status: "error", error: event.message }));
        reject(new Error(event.message));
      };

      worker.addEventListener("message", handler);
      worker.addEventListener("error", errorHandler);
      worker.postMessage({ type: "load" });
    });
  }, [getWorker]);

  const classify = useCallback(
    async (imageBuffer: ArrayBuffer, currentAnalysis: AIAnalysisResult): Promise<AIAnalysisResult> => {
      const worker = getWorker();

      const img = new Image();
      const blob = new Blob([imageBuffer]);
      const url = URL.createObjectURL(blob);

      try {
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error("Failed to load image for classification"));
          img.src = url;
        });

        const width = img.naturalWidth;
        const height = img.naturalHeight;

        setState((prev) => ({ ...prev, status: "classifying", error: null, probability: null }));

        return new Promise<AIAnalysisResult>((resolve, reject) => {
          const handler = (event: MessageEvent) => {
            worker.removeEventListener("message", handler);
            const msg = event.data;

            if (msg.type === "result") {
              setState((prev) => ({
                ...prev,
                status: "ready",
                probability: msg.probability,
              }));
              resolve(applyMlResult(currentAnalysis, msg.probability));
            } else if (msg.type === "error") {
              setState((prev) => ({ ...prev, status: "error", error: msg.message }));
              reject(new Error(msg.message));
            }
          };

          worker.addEventListener("message", handler);
          worker.postMessage({ type: "classify", imageData: imageBuffer, width, height });
        });
      } finally {
        URL.revokeObjectURL(url);
      }
    },
    [getWorker]
  );

  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.postMessage({ type: "dispose" });
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, []);

  return {
    ...state,
    loadModel,
    classify,
  };
}
