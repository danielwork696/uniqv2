export interface ProcessSettings {
  copies: number;
  brightness: boolean;
  contrast: boolean;
  saturation: boolean;
  mirror: boolean;
  rotation: boolean;
  zoom: boolean;
  audioSpeed: boolean;
  audioVolume: boolean;
  audioPitch: boolean;
}

export interface GeneratedFileInfo {
  id: string;
  filename: string;
  url: string;
  filters: string;
}
