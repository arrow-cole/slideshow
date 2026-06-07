import { memo } from "react";
import type { Slide } from "../types";

interface SlideListProps {
  slides: Slide[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

function SlideListImpl({ slides, selectedIndex, onSelect }: SlideListProps) {
  if (!slides.length) {
    return (
      <div className="slide-list">
        <p className="meta">No photos yet.</p>
      </div>
    );
  }

  return (
    <div className="slide-list">
      {slides.map((slide, index) => (
        <button
          key={index}
          type="button"
          className={`slide-card ${index === selectedIndex ? "is-selected" : ""}`}
          onClick={() => onSelect(index)}
        >
          <span className="thumb">
            <img src={slide.thumbnail} alt="" loading="lazy" />
          </span>
          <span>
            <span className="slide-name">{slide.title || `Slide ${index + 1}`}</span>
            <span className="meta">Slide {index + 1}</span>
          </span>
        </button>
      ))}
    </div>
  );
}

export const SlideList = memo(SlideListImpl);
