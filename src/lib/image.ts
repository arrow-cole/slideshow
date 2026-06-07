import type { NormalizedImage } from "../types";

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

export async function getImageDimensions(src: string): Promise<{ width: number; height: number }> {
  const image = await loadImage(src);
  return { height: image.naturalHeight, width: image.naturalWidth };
}

export async function normalizeImage(file: File): Promise<NormalizedImage> {
  const source = await fileToDataUrl(file);
  if (file.type === "image/png" || file.type === "image/jpeg") {
    const dims = await getImageDimensions(source);
    return {
      dataUrl: source,
      extension: file.type === "image/png" ? "png" : "jpg",
      height: dims.height,
      imageType: file.type,
      width: dims.width,
    };
  }

  const image = await loadImage(source);
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  canvas.getContext("2d")!.drawImage(image, 0, 0);
  return {
    dataUrl: canvas.toDataURL("image/jpeg", 0.92),
    extension: "jpg",
    height: image.naturalHeight,
    imageType: "image/jpeg",
    width: image.naturalWidth,
  };
}
