import type { ProcessedImage } from "../types";
import { processImage as processOnMain } from "./image";

interface WorkerResult {
  id: number;
  blob?: Blob;
  thumbnail?: string;
  width?: number;
  height?: number;
  error?: string;
}

interface ProcessOptions {
  onProgress: (done: number, total: number) => void;
  onCommit: (batch: ProcessedImage[]) => void;
}

const BATCH_SIZE = 50;

export async function processFiles(
  files: File[],
  { onProgress, onCommit }: ProcessOptions,
): Promise<{ ok: number; failed: number }> {
  const total = files.length;
  const results: Array<ProcessedImage | null | undefined> = new Array(total);
  let done = 0;
  let ok = 0;
  let failed = 0;
  let commitPtr = 0;
  let pending: ProcessedImage[] = [];

  function flush(force: boolean) {
    while (commitPtr < total && results[commitPtr] !== undefined) {
      const ready = results[commitPtr];
      if (ready) pending.push(ready);
      commitPtr += 1;
    }
    if (pending.length && (force || pending.length >= BATCH_SIZE)) {
      onCommit(pending);
      pending = [];
    }
  }

  function handle(index: number, image: ProcessedImage | null) {
    results[index] = image;
    if (image) ok += 1;
    else failed += 1;
    done += 1;
    onProgress(done, total);
    flush(false);
  }

  const supported =
    typeof Worker !== "undefined" && typeof OffscreenCanvas !== "undefined";

  if (supported) {
    const poolSize = Math.min(navigator.hardwareConcurrency || 4, 8);
    const workers = Array.from(
      { length: poolSize },
      () =>
        new Worker(new URL("./imageWorker.ts", import.meta.url), {
          type: "module",
        }),
    );

    let next = 0;
    let active = 0;

    try {
      await new Promise<void>((resolve) => {
        const assign = (worker: Worker) => {
          if (next >= total) {
            if (active === 0) resolve();
            return;
          }
          const index = next;
          next += 1;
          active += 1;

          let settled = false;
          const finish = (image: ProcessedImage | null) => {
            if (settled) return;
            settled = true;
            handle(index, image);
            active -= 1;
            assign(worker);
          };

          worker.onmessage = (event: MessageEvent<WorkerResult>) => {
            const data = event.data;
            if (data.error || !data.blob || !data.thumbnail) {
              finish(null);
            } else {
              finish({
                blob: data.blob,
                thumbnail: data.thumbnail,
                extension: "jpg",
                imageType: "image/jpeg",
                width: data.width ?? 0,
                height: data.height ?? 0,
              });
            }
          };
          worker.onerror = () => finish(null);
          worker.onmessageerror = () => finish(null);

          try {
            worker.postMessage({ id: index, file: files[index] });
          } catch {
            finish(null);
          }
        };
        workers.forEach(assign);
      });
    } finally {
      workers.forEach((worker) => worker.terminate());
    }
  } else {
    for (let i = 0; i < total; i += 1) {
      try {
        handle(i, await processOnMain(files[i]));
      } catch {
        handle(i, null);
      }
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  }

  flush(true);
  return { ok, failed };
}
