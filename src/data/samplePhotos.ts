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

export const groupIntoEvents = (photos: Photo[]): PhotoEvent[] => {
  const key = (p: Photo) => `${p.date}::${p.location || "unknown"}`;
  const map = new Map<string, Photo[]>();
  photos.forEach((p) => {
    const arr = map.get(key(p)) || [];
    arr.push(p);
    map.set(key(p), arr);
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
  // Event 1: 1 photo — Full Bleed Hero
  { id: "1", url: `${BASE}/sunset1/300/300`, date: "2026-04-03", location: "Santorini" },

  // Event 2: 2 photos — Matted
  { id: "2", url: `${BASE}/cafe1/300/300`, date: "2026-04-04", location: "Athens Café" },
  { id: "3", url: `${BASE}/cafe2/300/300`, date: "2026-04-04", location: "Athens Café" },

  // Event 3: 3 photos — Portrait + Landscapes
  { id: "4", url: `${BASE}/hike1/300/300`, date: "2026-04-05", location: "Mount Olympus" },
  { id: "5", url: `${BASE}/hike2/300/300`, date: "2026-04-05", location: "Mount Olympus" },
  { id: "6", url: `${BASE}/hike3/300/300`, date: "2026-04-05", location: "Mount Olympus", isBlurry: true },

  // Event 4: 4 photos — 2 stacked per page
  { id: "7", url: `${BASE}/market1/300/300`, date: "2026-04-05", location: "Monastiraki Market" },
  { id: "8", url: `${BASE}/market2/300/300`, date: "2026-04-05", location: "Monastiraki Market" },
  { id: "9", url: `${BASE}/market3/300/300`, date: "2026-04-05", location: "Monastiraki Market", isScreenshot: true },
  { id: "10", url: `${BASE}/market4/300/300`, date: "2026-04-05", location: "Monastiraki Market" },

  // Event 5: 5 photos — Hero+Detail / 3 Portraits
  { id: "11", url: `${BASE}/beach1/300/300`, date: "2026-04-06", location: "Navagio Beach" },
  { id: "12", url: `${BASE}/beach2/300/300`, date: "2026-04-06", location: "Navagio Beach" },
  { id: "13", url: `${BASE}/beach3/300/300`, date: "2026-04-06", location: "Navagio Beach", isDuplicate: true },
  { id: "14", url: `${BASE}/beach4/300/300`, date: "2026-04-06", location: "Navagio Beach" },
  { id: "15", url: `${BASE}/beach5/300/300`, date: "2026-04-06", location: "Navagio Beach", isSelfie: true },

  // Event 6: 6 photos — 3×2
  { id: "16", url: `${BASE}/ruins1/300/300`, date: "2026-04-07", location: "Acropolis" },
  { id: "17", url: `${BASE}/ruins2/300/300`, date: "2026-04-07", location: "Acropolis" },
  { id: "18", url: `${BASE}/ruins3/300/300`, date: "2026-04-07", location: "Acropolis" },
  { id: "19", url: `${BASE}/ruins4/300/300`, date: "2026-04-07", location: "Acropolis", isSelfie: true },
  { id: "20", url: `${BASE}/ruins5/300/300`, date: "2026-04-07", location: "Acropolis" },
  { id: "21", url: `${BASE}/ruins6/300/300`, date: "2026-04-07", location: "Acropolis", isBlurry: true },

  // Event 7: 2 photos — Evening
  { id: "22", url: `${BASE}/dinner1/300/300`, date: "2026-04-07", location: "Plaka Dinner" },
  { id: "23", url: `${BASE}/dinner2/300/300`, date: "2026-04-07", location: "Plaka Dinner" },

  // Event 8: 4 photos — Island hopping
  { id: "24", url: `${BASE}/island1/300/300`, date: "2026-04-08", location: "Mykonos" },
  { id: "25", url: `${BASE}/island2/300/300`, date: "2026-04-08", location: "Mykonos" },
  { id: "26", url: `${BASE}/island3/300/300`, date: "2026-04-08", location: "Mykonos" },
  { id: "27", url: `${BASE}/island4/300/300`, date: "2026-04-08", location: "Mykonos" },

  // Event 9: 3 photos — Sunset
  { id: "28", url: `${BASE}/mysunset1/300/300`, date: "2026-04-08", location: "Mykonos Sunset" },
  { id: "29", url: `${BASE}/mysunset2/300/300`, date: "2026-04-08", location: "Mykonos Sunset" },
  { id: "30", url: `${BASE}/mysunset3/300/300`, date: "2026-04-08", location: "Mykonos Sunset" },

  // Event 10: 1 photo — Final
  { id: "31", url: `${BASE}/farewell1/300/300`, date: "2026-04-09", location: "Athens Airport" },
];
