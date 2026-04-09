export interface Photo {
  id: string;
  url: string;
  date: string;
  location?: string;
  isScreenshot?: boolean;
  isBlurry?: boolean;
  isDuplicate?: boolean;
  isSelfie?: boolean;
}

export interface PhotoEvent {
  date: string;
  location?: string;
  photos: Photo[];
}

/** Group photos into events by date + location proximity */
export const groupIntoEvents = (photos: Photo[]): PhotoEvent[] => {
  const key = (p: Photo) => `${p.date}::${p.location || "unknown"}`;
  const map = new Map<string, Photo[]>();

  photos.forEach((p) => {
    const k = key(p);
    const arr = map.get(k) || [];
    arr.push(p);
    map.set(k, arr);
  });

  return Array.from(map.entries())
    .map(([k, photos]) => {
      const [date, location] = k.split("::");
      return { date, location: location === "unknown" ? undefined : location, photos };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
};

const BASE = "https://picsum.photos/seed";

export const samplePhotos: Photo[] = [
  // April 5 — Beach trip
  { id: "1", url: `${BASE}/a1/300/300`, date: "2026-04-05", location: "Brighton Beach" },
  { id: "2", url: `${BASE}/a2/300/300`, date: "2026-04-05", location: "Brighton Beach" },
  { id: "3", url: `${BASE}/a3/300/300`, date: "2026-04-05", location: "Brighton Beach", isBlurry: true },
  { id: "4", url: `${BASE}/a4/300/300`, date: "2026-04-05", location: "Brighton Beach" },
  { id: "5", url: `${BASE}/a5/300/300`, date: "2026-04-05", location: "Brighton Beach", isScreenshot: true },
  { id: "6", url: `${BASE}/a6/300/300`, date: "2026-04-05", location: "Brighton Beach" },
  // April 5 — Dinner
  { id: "7", url: `${BASE}/b1/300/300`, date: "2026-04-05", location: "The Ivy Restaurant" },
  { id: "8", url: `${BASE}/b2/300/300`, date: "2026-04-05", location: "The Ivy Restaurant" },
  // April 6 — City walk
  { id: "9", url: `${BASE}/b3/300/300`, date: "2026-04-06", location: "London" },
  { id: "10", url: `${BASE}/b4/300/300`, date: "2026-04-06", location: "London", isDuplicate: true },
  { id: "11", url: `${BASE}/b5/300/300`, date: "2026-04-06", location: "London", isSelfie: true },
  { id: "12", url: `${BASE}/b6/300/300`, date: "2026-04-06", location: "London" },
  { id: "13", url: `${BASE}/b7/300/300`, date: "2026-04-06", location: "London" },
  // April 7 — Park
  { id: "14", url: `${BASE}/c1/300/300`, date: "2026-04-07", location: "Hyde Park" },
  { id: "15", url: `${BASE}/c2/300/300`, date: "2026-04-07", location: "Hyde Park", isSelfie: true },
  { id: "16", url: `${BASE}/c3/300/300`, date: "2026-04-07", location: "Hyde Park" },
  { id: "17", url: `${BASE}/c4/300/300`, date: "2026-04-07", location: "Hyde Park", isBlurry: true },
  { id: "18", url: `${BASE}/c5/300/300`, date: "2026-04-07", location: "Hyde Park" },
];
