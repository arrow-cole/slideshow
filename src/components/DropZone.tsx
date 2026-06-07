import { useRef, useState } from "react";

interface DropZoneProps {
  importStatus: string;
  isImporting: boolean;
  onFiles: (files: FileList | null) => void;
}

export function DropZone({ importStatus, isImporting, onFiles }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  return (
    <section
      className={`drop-zone ${isDragging ? "is-dragging" : ""}`}
      onDragEnter={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragging(false);
        onFiles(event.dataTransfer.files);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(event) => {
          onFiles(event.target.files);
          event.target.value = "";
        }}
      />
      <div className="drop-copy">
        <strong>Drop photos here</strong>
        <span>{importStatus}</span>
      </div>
      <button className="secondary" disabled={isImporting} onClick={() => inputRef.current?.click()}>
        Choose Photos
      </button>
    </section>
  );
}
