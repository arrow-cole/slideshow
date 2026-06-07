import { useState } from "react";
import { DropZone } from "./components/DropZone";
import { SlidePreview } from "./components/SlidePreview";
import { SlideList } from "./components/SlideList";
import { Editor } from "./components/Editor";
import { processImage } from "./lib/image";
import { buildPptx } from "./lib/pptx";
import type { Slide } from "./types";

export default function App() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isImporting, setIsImporting] = useState(false);
  const [importStatus, setImportStatus] = useState("or choose images from your computer");
  const [isBuilding, setIsBuilding] = useState(false);

  const selectedSlide = slides[selectedIndex] ?? null;

  async function addFiles(fileList: FileList | null) {
    if (!fileList || isImporting) return;
    const files = [...fileList].filter((file) => file.type.startsWith("image/"));
    if (!files.length) return;

    const startCount = slides.length;
    setIsImporting(true);
    setImportStatus(`Adding ${files.length} photo${files.length === 1 ? "" : "s"}...`);

    const added: Slide[] = [];
    for (let i = 0; i < files.length; i++) {
      const processed = await processImage(files[i]);
      added.push({
        ...processed,
        background: "#111827",
        fit: "contain",
        note: "",
        rotate: 0,
        title: "",
      });
      setImportStatus(`Added ${i + 1} of ${files.length} photo${files.length === 1 ? "" : "s"}...`);
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    const total = startCount + added.length;
    setSlides((prev) => [...prev, ...added]);
    setSelectedIndex((current) => (current === -1 && total ? 0 : current));
    setIsImporting(false);
    setImportStatus(`${total} photo${total === 1 ? "" : "s"} ready. Add more anytime.`);
  }

  function updateSelected(patch: Partial<Slide>) {
    if (selectedIndex < 0) return;
    setSlides((prev) => prev.map((slide, index) => (index === selectedIndex ? { ...slide, ...patch } : slide)));
  }

  function moveSelected(direction: number) {
    const nextIndex = selectedIndex + direction;
    if (nextIndex < 0 || nextIndex >= slides.length) return;
    setSlides((prev) => {
      const next = [...prev];
      const [slide] = next.splice(selectedIndex, 1);
      next.splice(nextIndex, 0, slide);
      return next;
    });
    setSelectedIndex(nextIndex);
  }

  function removeSelected() {
    if (selectedIndex < 0) return;
    setSlides((prev) => prev.filter((_, index) => index !== selectedIndex));
    setSelectedIndex((current) => {
      const remaining = slides.length - 1;
      return remaining ? Math.min(current, remaining - 1) : -1;
    });
  }

  async function downloadPowerPoint() {
    if (!slides.length || isImporting) return;
    setIsBuilding(true);
    try {
      const blob = await buildPptx(slides);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "photo-slideshow.pptx";
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsBuilding(false);
    }
  }

  return (
    <main className="app-shell">
      <section className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">Photo deck builder</p>
            <h1>Make a PowerPoint slideshow from your photos</h1>
          </div>
          <button className="primary" disabled={!slides.length || isImporting || isBuilding} onClick={downloadPowerPoint}>
            {isBuilding ? `Building ${slides.length} slides...` : "Download PowerPoint"}
          </button>
        </header>

        <DropZone importStatus={importStatus} isImporting={isImporting} onFiles={addFiles} />

        <section className="stage" aria-live="polite">
          <SlidePreview slide={selectedSlide} />
        </section>
      </section>

      <aside className="sidebar">
        <div className="panel">
          <h2>Slides</h2>
          <SlideList slides={slides} selectedIndex={selectedIndex} onSelect={setSelectedIndex} />
        </div>

        <Editor
          slide={selectedSlide}
          selectedIndex={selectedIndex}
          slidesLength={slides.length}
          onChange={updateSelected}
          onMove={moveSelected}
          onRemove={removeSelected}
        />
      </aside>
    </main>
  );
}
