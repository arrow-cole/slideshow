import type { Fit, Slide } from "../types";

interface EditorProps {
  slide: Slide | null;
  selectedIndex: number;
  slidesLength: number;
  onChange: (patch: Partial<Slide>) => void;
  onMove: (direction: number) => void;
  onRemove: () => void;
}

export function Editor({ slide, selectedIndex, slidesLength, onChange, onMove, onRemove }: EditorProps) {
  const disabled = !slide;

  return (
    <div className="panel controls">
      <h2>Edit selected photo</h2>
      <label>
        Slide title
        <input
          type="text"
          placeholder="Optional title"
          disabled={disabled}
          value={slide?.title ?? ""}
          onChange={(event) => onChange({ title: event.target.value })}
        />
      </label>
      <label>
        Speaker note
        <textarea
          rows={3}
          placeholder="Optional note for this slide"
          disabled={disabled}
          value={slide?.note ?? ""}
          onChange={(event) => onChange({ note: event.target.value })}
        />
      </label>
      <label>
        Photo style
        <select
          disabled={disabled}
          value={slide?.fit ?? "contain"}
          onChange={(event) => onChange({ fit: event.target.value as Fit })}
        >
          <option value="contain">Fit whole photo</option>
          <option value="cover">Fill slide</option>
        </select>
      </label>
      <label>
        Background
        <input
          type="color"
          disabled={disabled}
          value={slide?.background ?? "#111827"}
          onChange={(event) => onChange({ background: event.target.value })}
        />
      </label>
      <label>
        Rotation
        <input
          type="range"
          min={-180}
          max={180}
          step={1}
          disabled={disabled}
          value={slide?.rotate ?? 0}
          onChange={(event) => onChange({ rotate: Number(event.target.value) })}
        />
        <output>{slide?.rotate ?? 0} degrees</output>
      </label>
      <div className="button-row">
        <button className="secondary" disabled={disabled || selectedIndex <= 0} onClick={() => onMove(-1)}>
          Move up
        </button>
        <button
          className="secondary"
          disabled={disabled || selectedIndex >= slidesLength - 1}
          onClick={() => onMove(1)}
        >
          Move down
        </button>
      </div>
      <button className="danger" disabled={disabled} onClick={onRemove}>
        Remove slide
      </button>
    </div>
  );
}
