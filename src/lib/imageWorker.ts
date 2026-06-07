// @ts-nocheck
const EXPORT_MAX = 1600;
const THUMB_MAX = 240;

async function encode(bitmap, maxSide, quality) {
  const w = bitmap.width;
  const h = bitmap.height;
  const scale = Math.min(1, maxSide / Math.max(w, h));
  const cw = Math.max(1, Math.round(w * scale));
  const ch = Math.max(1, Math.round(h * scale));
  const canvas = new OffscreenCanvas(cw, ch);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(bitmap, 0, 0, cw, ch);
  const blob = await canvas.convertToBlob({ type: "image/jpeg", quality });
  return { blob, width: cw, height: ch };
}

async function blobToDataUrl(blob) {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return "data:image/jpeg;base64," + btoa(binary);
}

self.onmessage = async (event) => {
  const { id, file } = event.data;
  try {
    const bitmap = await createImageBitmap(file);
    const exported = await encode(bitmap, EXPORT_MAX, 0.85);
    const thumb = await encode(bitmap, THUMB_MAX, 0.7);
    bitmap.close();
    const thumbnail = await blobToDataUrl(thumb.blob);
    self.postMessage({
      id,
      blob: exported.blob,
      thumbnail,
      width: exported.width,
      height: exported.height,
    });
  } catch (error) {
    self.postMessage({ id, error: String(error) });
  }
};
