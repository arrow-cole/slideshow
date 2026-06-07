export type Fit = "contain" | "cover";

export interface NormalizedImage {
  dataUrl: string;
  extension: "png" | "jpg";
  imageType: string;
  width: number;
  height: number;
}

export interface Slide extends NormalizedImage {
  background: string;
  fit: Fit;
  note: string;
  rotate: number;
  title: string;
}
