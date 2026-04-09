import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Photo } from "@/data/samplePhotos";

interface PhotobookPreviewProps {
  photos: Photo[];
}

const PhotobookPreview = ({ photos }: PhotobookPreviewProps) => {
  const [currentSpread, setCurrentSpread] = useState(0);

  // 2 photos per spread (left page + right page), A4 landscape
  const photosPerSpread = 2;
  const totalSpreads = Math.ceil(photos.length / photosPerSpread);
  const totalPages = totalSpreads * 2;

  const spreadPhotos = photos.slice(
    currentSpread * photosPerSpread,
    currentSpread * photosPerSpread + photosPerSpread
  );

  const leftPage = currentSpread * 2 + 1;
  const rightPage = leftPage + 1;

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      {/* Page counter */}
      <p className="text-xs text-muted-foreground">
        Pages {leftPage}–{Math.min(rightPage, totalPages)} of {totalPages}
      </p>

      {/* Layflat spread */}
      <div className="w-full">
        <div
          className="relative mx-auto rounded-sm overflow-hidden shadow-[0_8px_30px_-6px_rgba(0,0,0,0.15)]"
          style={{ aspectRatio: "297 / 105" /* A4 landscape double spread ~2.83:1 */ }}
        >
          {/* Two-page spread */}
          <div className="flex h-full bg-white">
            {/* Left page */}
            <div className="flex-1 p-2">
              {spreadPhotos[0] ? (
                <img
                  src={spreadPhotos[0].url}
                  alt=""
                  className="w-full h-full object-cover rounded-sm"
                />
              ) : (
                <div className="w-full h-full bg-muted rounded-sm" />
              )}
            </div>
            {/* Center line — subtle for layflat */}
            <div className="w-px bg-border/40" />
            {/* Right page */}
            <div className="flex-1 p-2">
              {spreadPhotos[1] ? (
                <img
                  src={spreadPhotos[1].url}
                  alt=""
                  className="w-full h-full object-cover rounded-sm"
                />
              ) : (
                <div className="w-full h-full bg-muted rounded-sm" />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-6">
        <button
          onClick={() => setCurrentSpread((s) => Math.max(0, s - 1))}
          disabled={currentSpread === 0}
          className="p-2 rounded-full bg-muted text-foreground disabled:opacity-30 transition-opacity"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Spread dots */}
        <div className="flex gap-1.5">
          {Array.from({ length: totalSpreads }).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSpread(i)}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === currentSpread ? "bg-primary" : "bg-border"
              }`}
            />
          ))}
        </div>

        <button
          onClick={() => setCurrentSpread((s) => Math.min(totalSpreads - 1, s + 1))}
          disabled={currentSpread === totalSpreads - 1}
          className="p-2 rounded-full bg-muted text-foreground disabled:opacity-30 transition-opacity"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default PhotobookPreview;
