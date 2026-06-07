export type Fit = "contain" | "cover";

export interface ProcessedImage {
  blob: Blob;
  thumbnail: string;
  extension: "jpg";
  imageType: string;
  width: number;
  height: number;
}

export interface Slide extends ProcessedImage {
  background: string;
  fit: Fit;
  note: string;
  rotate: number;
  title: string;
}
