import { useState } from "react";
import PhotoToggle from "@/components/PhotoToggle";
import ShortlistedPhotos from "@/components/ShortlistedPhotos";
import PhotobookPreview from "@/components/PhotobookPreview";
import { samplePhotos, Photo } from "@/data/samplePhotos";
import { toast } from "sonner";

const Index = () => {
  const [activeTab, setActiveTab] = useState<"shortlisted" | "preview">("shortlisted");
  const [photos, setPhotos] = useState<Photo[]>(samplePhotos);

  const handleRemove = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
    toast("Photo removed from shortlist");
  };

  const handleAddPhotos = () => {
    toast("Add photos flow coming soon");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto px-4 py-6">
        {/* Header */}
        <h1 className="text-lg font-semibold text-foreground text-center mb-4">
          Your Photobook
        </h1>

        {/* Toggle */}
        <PhotoToggle activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Content */}
        <div className="mt-5">
          {activeTab === "shortlisted" ? (
            <ShortlistedPhotos
              photos={photos}
              onRemove={handleRemove}
              onAddPhotos={handleAddPhotos}
            />
          ) : (
            <PhotobookPreview photos={photos} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
