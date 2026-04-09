import { useState, useMemo } from "react";
import { arrayMove } from "@dnd-kit/sortable";
import PhotoToggle from "@/components/PhotoToggle";
import ShortlistedPhotos from "@/components/ShortlistedPhotos";
import PhotobookPreview from "@/components/PhotobookPreview";
import { samplePhotos, Photo, groupIntoEvents } from "@/data/samplePhotos";
import { toast } from "sonner";

export interface Filter {
  id: string;
  label: string;
  count: number;
  enabled: boolean;
}

const applyFilters = (photos: Photo[], filters: Filter[]): Photo[] => {
  return photos.filter((p) => {
    if (filters.find((f) => f.id === "screenshots")?.enabled && p.isScreenshot) return false;
    if (filters.find((f) => f.id === "blurry")?.enabled && p.isBlurry) return false;
    if (filters.find((f) => f.id === "duplicates")?.enabled && p.isDuplicate) return false;
    if (!filters.find((f) => f.id === "selfies")?.enabled && p.isSelfie) return false;
    return true;
  });
};

const Index = () => {
  const [activeTab, setActiveTab] = useState<"shortlisted" | "preview">("shortlisted");
  const [photos, setPhotos] = useState<Photo[]>(samplePhotos);
  const [bookTitle, setBookTitle] = useState("Our Trip to Greece");
  const [bookSubtitle, setBookSubtitle] = useState("April 2026");
  const [filters, setFilters] = useState<Filter[]>([
    { id: "screenshots", label: "Remove screenshots", count: 0, enabled: false },
    { id: "blurry", label: "Remove blurry photos", count: 0, enabled: false },
    { id: "duplicates", label: "Remove near-duplicates", count: 0, enabled: false },
    { id: "selfies", label: "Include selfies", count: 0, enabled: true },
  ]);

  const filtersWithCounts = useMemo(() => {
    const counts: Record<string, number> = {
      screenshots: photos.filter((p) => p.isScreenshot).length,
      blurry: photos.filter((p) => p.isBlurry).length,
      duplicates: photos.filter((p) => p.isDuplicate).length,
      selfies: photos.filter((p) => p.isSelfie).length,
    };
    return filters.map((f) => ({ ...f, count: counts[f.id] || 0 }));
  }, [photos, filters]);

  const filteredPhotos = useMemo(() => applyFilters(photos, filters), [photos, filters]);
  const events = useMemo(() => groupIntoEvents(filteredPhotos), [filteredPhotos]);

  const toggleFilter = (id: string) => {
    setFilters((prev) => prev.map((f) => (f.id === id ? { ...f, enabled: !f.enabled } : f)));
  };

  const handleRemove = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
    toast("Photo removed from shortlist");
  };

  const handleReorder = (oldIndex: number, newIndex: number) => {
    // We need to map filtered indices back to the full photos array
    const filteredIds = filteredPhotos.map((p) => p.id);
    const movedId = filteredIds[oldIndex];
    const targetId = filteredIds[newIndex];

    setPhotos((prev) => {
      const realOld = prev.findIndex((p) => p.id === movedId);
      const realNew = prev.findIndex((p) => p.id === targetId);
      if (realOld === -1 || realNew === -1) return prev;
      return arrayMove(prev, realOld, realNew);
    });
  };

  const handleAddPhotos = () => {
    toast("Add photos flow coming soon");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto px-4 py-6">
        <h1 className="text-lg font-semibold text-foreground text-center mb-4">
          Your Photobook
        </h1>
        <PhotoToggle activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="mt-5">
          {activeTab === "shortlisted" ? (
            <ShortlistedPhotos
              photos={filteredPhotos}
              filters={filtersWithCounts}
              onToggleFilter={toggleFilter}
              onRemove={handleRemove}
              onAddPhotos={handleAddPhotos}
              onReorder={handleReorder}
            />
          ) : (
            <PhotobookPreview
              events={events}
              title={bookTitle}
              subtitle={bookSubtitle}
              onTitleChange={setBookTitle}
              onSubtitleChange={setBookSubtitle}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
