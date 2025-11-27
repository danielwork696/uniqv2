export interface ProcessSettings {
  brightness: boolean;
  contrast: boolean;
  saturation: boolean;
  mirror: boolean;
  rotation: boolean;
  zoom: boolean;
  audioSpeed: boolean;
  audioVolume: boolean;
  audioPitch: boolean;
  copies: number;
}

export interface GeneratedFileInfo {
  id: string;
  filename: string;
  url: string;
  filters: string;
}

export async function unikalizeVideo(file: File, settings: ProcessSettings): Promise<GeneratedFileInfo[]> {
  const formData = new FormData();
  formData.append('file', file);
  
  // Append settings
  (Object.keys(settings) as Array<keyof ProcessSettings>).forEach(key => {
    formData.append(key, String(settings[key]));
  });

  const res = await fetch('http://localhost:4000/api/unikalize', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`Server responded with ${res.status}`);
  }

  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error || 'Unknown error');
  }

  return json.copies;
}
