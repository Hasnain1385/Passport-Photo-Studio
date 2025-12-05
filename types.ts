
export interface AppSettings {
  removeBgApiKey: string;
  geminiApiKey: string;
}

export type ThemeMode = 'light' | 'dark' | 'system';

export enum PaperSize {
  A4 = 'A4',
  LETTER = 'Letter',
  PHOTO_4X6 = '4x6',
}

export interface PaperDimensions {
  width: number; // in mm
  height: number; // in mm
  name: string;
}

export interface GridConfig {
  paperSize: PaperSize;
  orientation: 'portrait' | 'landscape';
  gap: number; // mm
  margin: number; // mm
  photoCount: number;
  photoWidth: number; // mm
  photoHeight: number; // mm
  alignment: 'top-left' | 'center';
  autoScale: boolean;
}

export interface PhotoStandard {
  width: number;
  height: number;
  name: string;
  ratio: number;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export const PAPER_DIMENSIONS: Record<PaperSize, PaperDimensions> = {
  [PaperSize.A4]: { width: 210, height: 297, name: 'A4 (210x297mm)' },
  [PaperSize.LETTER]: { width: 215.9, height: 279.4, name: 'Letter (8.5x11")' },
  [PaperSize.PHOTO_4X6]: { width: 101.6, height: 152.4, name: '4x6" (10x15cm)' },
};

export const PHOTO_STANDARDS: Record<string, PhotoStandard> = {
  CUSTOM_15_18: { width: 38.1, height: 45.72, name: 'Passport (1.5 x 1.8")', ratio: 1.5/1.8 },
  US_PASSPORT: { width: 50.8, height: 50.8, name: 'US Passport (2x2")', ratio: 1 },
  EU_PASSPORT: { width: 35, height: 45, name: 'EU/UK (35x45mm)', ratio: 35/45 },
  ID_PHOTO: { width: 30, height: 40, name: 'ID Photo (30x40mm)', ratio: 30/40 },
};

export const DEFAULT_PHOTO_WIDTH_MM = 38.1;
export const DEFAULT_PHOTO_HEIGHT_MM = 45.72;

export const calculateMaxPhotos = (
  paperSize: PaperSize, 
  orientation: 'portrait' | 'landscape',
  margin: number,
  gap: number,
  photoW: number,
  photoH: number
): number => {
  const paper = PAPER_DIMENSIONS[paperSize];
  const pWidth = orientation === 'portrait' ? paper.width : paper.height;
  const pHeight = orientation === 'portrait' ? paper.height : paper.width;

  const areaPaper = pWidth * pHeight;
  const areaPhoto = (photoW + gap) * (photoH + gap);
  
  return Math.floor(areaPaper / areaPhoto);
};
