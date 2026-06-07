# Photo PowerPoint Slideshow Maker

A fully client-side web app for turning photos into a downloadable PowerPoint (`.pptx`) deck. Users add images, set per-slide titles, speaker notes, background color, fit (contain/cover), and rotation, reorder slides, then export a real `.pptx` file — all generated in the browser with no backend.

## Tech Stack

- **Vite** + **React 18** + **TypeScript** (single-page app, no backend)
- PPTX/OOXML and ZIP generation are hand-rolled in the browser (no external libraries)

## Project Structure

- `index.html` — Vite entry
- `src/main.tsx` — React root
- `src/App.tsx` — top-level state and handlers (slides, selection, import, export)
- `src/components/` — `DropZone`, `SlidePreview`, `SlideList`, `Editor`
- `src/lib/`
  - `pptx.ts` — builds the OOXML presentation parts
  - `zip.ts` — minimal ZIP writer (CRC32 + byte helpers) and `dataUrlToBytes`
  - `image.ts` — file→dataURL normalization and dimension reading
  - `xml.ts` — XML escaping
- `src/types.ts` — `Slide` / `Fit` types
- `src/styles.css` — global styles

## Development

- Workflow `Start application` runs `npm run dev` on port 5000 (webview).
- Build: `npm run build` (`tsc --noEmit && vite build`), output in `dist/`.

## Deployment

- Static deployment: build command `npm run build`, public dir `dist`.

## User preferences

- (none recorded yet)
