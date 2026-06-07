import type { Slide } from "../types";

interface SlidePreviewProps {
  slide: Slide | null;
}

export function SlidePreview({ slide }: SlidePreviewProps) {
  if (!slide) {
    return (
      <div className="slide-preview" style={{ background: "#111827" }}>
        <div className="empty-state">
          <strong>Your slide will show here</strong>
          <span>Add photos to start building the deck.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="slide-preview" style={{ background: slide.background }}>
      <img
        className={`preview-photo ${slide.fit}`}
        src={slide.dataUrl}
        alt=""
        style={{ transform: `rotate(${slide.rotate}deg)` }}
      />
      {slide.title ? <div className="preview-title">{slide.title}</div> : null}
    </div>
  );
}
