import { useEffect, useState } from "react";
import type { Slide } from "../types";

interface SlidePreviewProps {
  slide: Slide | null;
}

export function SlidePreview({ slide }: SlidePreviewProps) {
  const blob = slide?.blob ?? null;
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (!blob) {
      setUrl("");
      return;
    }
    const objectUrl = URL.createObjectURL(blob);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [blob]);

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
      {url ? (
        <img
          className={`preview-photo ${slide.fit}`}
          src={url}
          alt=""
          style={{ transform: `rotate(${slide.rotate}deg)` }}
        />
      ) : null}
      {slide.title ? <div className="preview-title">{slide.title}</div> : null}
    </div>
  );
}
