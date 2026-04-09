import { useState, useMemo } from "react";
import { Plus, X } from "lucide-react";
import PhotoFilters from "./PhotoFilters";
import { Photo } from "@/data/samplePhotos";

interface ShortlistedPhotosProps {
  photos: Photo[];
  onRemove: (id: string) => void;
  onAddPhotos: () => void;
}

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
};

const ShortlistedPhotos = ({ photos, onRemove, onAddPhotos }: ShortlistedPhotosProps) => {
  const [filters, setFilters] = useState([
    { id: "screenshots", label: "Remove screenshots", count: 0, enabled: false },
    { id: "blurry", label: "Remove blurry photos", count: 0, enabled: false },
    { id: "duplicates", label: "Remove near-duplicates", count: 0, enabled: false },
    { id: "selfies", label: "Include selfies", count: 0, enabled: true },
  ]);

  // Count detections
  const filtersWithCounts = useMemo(() => {
    const counts: Record<string, number> = {
      screenshots: photos.filter((p) => p.isScreenshot).length,
      blurry: photos.filter((p) => p.isBlurry).length,
      duplicates: photos.filter((p) => p.isDuplicate).length,
      selfies: photos.filter((p) => p.isSelfie).length,
    };
    return filters.map((f) => ({ ...f, count: counts[f.id] || 0 }));
  }, [photos, filters]);

  const filteredPhotos = useMemo(() => {
    return photos.filter((p) => {
      if (filters.find((f) => f.id === "screenshots")?.enabled && p.isScreenshot) return false;
      if (filters.find((f) => f.id === "blurry")?.enabled && p.isBlurry) return false;
      if (filters.find((f) => f.id === "duplicates")?.enabled && p.isDuplicate) return false;
      if (!filters.find((f) => f.id === "selfies")?.enabled && p.isSelfie) return false;
      return true;
    });
  }, [photos, filters]);

  const toggleFilter = (id: string) => {
    setFilters((prev) => prev.map((f) => (f.id === id ? { ...f, enabled: !f.enabled } : f)));
  };

  // Group by date
  const grouped = useMemo(() => {
    const map = new Map<string, Photo[]>();
    filteredPhotos.forEach((p) => {
      const existing = map.get(p.date) || [];
      existing.push(p);
      map.set(p.date, existing);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredPhotos]);

  return (
    <div className="flex flex-col gap-4 pb-24">
      <PhotoFilters filters={filtersWithCounts} onToggle={toggleFilter} />

      {grouped.map(([date, datePhotos]) => (
        <div key={date}>
          <h3 className="text-sm font-semibold text-foreground mb-2">{formatDate(date)}</h3>
          <div className="grid grid-cols-3 gap-1.5">
            {datePhotos.map((photo) => (
              <div key={photo.id} className="relative aspect-square rounded-lg overflow-hidden group">
                <img
                  src={photo.url}
                  alt=""
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <button
                  onClick={() => onRemove(photo.id)}
                  className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Summary + Add */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 flex items-center justify-between">
        <span className="text-sm text-foreground font-medium">
          {filteredPhotos.length} photos shortlisted
        </span>
        <button
          onClick={onAddPhotos}
          className="flex items-center gap-1.5 bg-accent text-accent-foreground rounded-full px-4 py-2 text-sm font-medium shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add photos
        </button>
      </div>
    </div>
  );
};

export default ShortlistedPhotos;
