export interface Photo {
  id: string;
  url: string;
  date: string;
  isScreenshot?: boolean;
  isBlurry?: boolean;
  isDuplicate?: boolean;
  isSelfie?: boolean;
}

const BASE = "https://picsum.photos/seed";

export const samplePhotos: Photo[] = [
  // April 5, 2026
  { id: "1", url: `${BASE}/a1/300/300`, date: "2026-04-05" },
  { id: "2", url: `${BASE}/a2/300/300`, date: "2026-04-05" },
  { id: "3", url: `${BASE}/a3/300/300`, date: "2026-04-05", isBlurry: true },
  { id: "4", url: `${BASE}/a4/300/300`, date: "2026-04-05" },
  { id: "5", url: `${BASE}/a5/300/300`, date: "2026-04-05", isScreenshot: true },
  { id: "6", url: `${BASE}/a6/300/300`, date: "2026-04-05" },
  // April 6, 2026
  { id: "7", url: `${BASE}/b1/300/300`, date: "2026-04-06" },
  { id: "8", url: `${BASE}/b2/300/300`, date: "2026-04-06", isDuplicate: true },
  { id: "9", url: `${BASE}/b3/300/300`, date: "2026-04-06" },
  { id: "10", url: `${BASE}/b4/300/300`, date: "2026-04-06", isSelfie: true },
  { id: "11", url: `${BASE}/b5/300/300`, date: "2026-04-06" },
  { id: "12", url: `${BASE}/b6/300/300`, date: "2026-04-06" },
  { id: "13", url: `${BASE}/b7/300/300`, date: "2026-04-06" },
  // April 7, 2026
  { id: "14", url: `${BASE}/c1/300/300`, date: "2026-04-07" },
  { id: "15", url: `${BASE}/c2/300/300`, date: "2026-04-07", isSelfie: true },
  { id: "16", url: `${BASE}/c3/300/300`, date: "2026-04-07" },
  { id: "17", url: `${BASE}/c4/300/300`, date: "2026-04-07", isBlurry: true },
  { id: "18", url: `${BASE}/c5/300/300`, date: "2026-04-07" },
];
