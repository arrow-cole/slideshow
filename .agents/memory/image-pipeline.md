---
name: image pipeline memory model
description: Why slides store Blobs + small thumbnails instead of full-res data URLs
---

Slides must NOT hold full-resolution base64 data URLs in React state. Doing so froze the tab after ~10 large phone photos (each full-res `<img>`/thumbnail decode is a multi-MB bitmap; base64 strings also bloat the JS heap).

**Rule:** on import, downscale once via canvas — store a compressed JPEG `Blob` (kept off the JS heap) for export at ~1600px, and a tiny ~240px JPEG data-URL `thumbnail` for the list. Preview builds a transient `URL.createObjectURL(blob)` and revokes it. Export reads bytes lazily via `blob.arrayBuffer()`; the ZIP writer streams parts into the `Blob` constructor rather than concatenating one giant `Uint8Array`.

**Why:** this is what makes 1000+ photos viable. SlideList is `memo`-ized and uses tiny thumbnails + `content-visibility:auto` so import status ticks don't re-render the whole list.

**How to apply:** never reintroduce a `dataUrl` field on Slide or render full-res images in the list/preview. Keep the downscale caps and the Blob-based export path.

## Bulk import (1000+ photos)
Decode/resize/encode runs in a pool of Web Workers (`createImageBitmap` + `OffscreenCanvas`), sized to `navigator.hardwareConcurrency` (cap 8), with a main-thread fallback when Worker/OffscreenCanvas are unavailable. Results are kept ordered via a commit pointer and flushed to React state in batches.

**Two non-obvious rules:**
- A single undecodable image (e.g. iPhone HEIC — Chrome can't decode it) must be skipped, never fatal. One thrown decode used to abort the whole import (froze at "Added 33 of 1281").
- The pool's completion promise resolves only when the in-flight `active` count hits 0. You MUST also wire `worker.onerror` / `worker.onmessageerror` and a `try/catch` around `postMessage` to a single guarded `finish()` per task — otherwise a worker-level crash leaks `active` and the import hangs forever in "Processing…". Always `terminate()` workers in a `finally`.
