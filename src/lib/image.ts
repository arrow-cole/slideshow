import type { ProcessedImage } from "../types";

const EXPORT_MAX = 1600;
const THUMB_MAX = 240;

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function scaleToCanvas(image: HTMLImageElement, maxSide: number): HTMLCanvasElement {
  const w = image.naturalWidth;
  const h = image.naturalHeight;
  const scale = Math.min(1, maxSide / Math.max(w, h));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(w * scale));
  canvas.height = Math.max(1, Math.round(h * scale));
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Could not encode image"))), type, quality);
  });
}

export async function processImage(file: File): Promise<ProcessedImage> {
  const source = URL.createObjectURL(file);
  try {
    const image = await loadImage(source);
    const exportCanvas = scaleToCanvas(image, EXPORT_MAX);
    const thumbCanvas = scaleToCanvas(image, THUMB_MAX);
    const blob = await canvasToBlob(exportCanvas, "image/jpeg", 0.85);
    const thumbnail = thumbCanvas.toDataURL("image/jpeg", 0.7);
    return {
      blob,
      thumbnail,
      extension: "jpg",
      imageType: "image/jpeg",
      width: exportCanvas.width,
      height: exportCanvas.height,
    };
  } finally {
    URL.revokeObjectURL(source);
  }
}
