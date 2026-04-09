import { Photo } from "@/data/samplePhotos";

interface PhotobookPreviewProps {
  photos: Photo[];
}

const PhotobookPreview = ({ photos }: PhotobookPreviewProps) => {
  const photosPerSpread = 2;
  const totalSpreads = Math.ceil(photos.length / photosPerSpread);

  const spreads = Array.from({ length: totalSpreads }, (_, i) => ({
    leftPhoto: photos[i * photosPerSpread],
    rightPhoto: photos[i * photosPerSpread + 1],
    leftPage: i * 2 + 1,
    rightPage: i * 2 + 2,
  }));

  return (
    <div className="flex flex-col gap-5 pb-8">
      {/* Close / undo-redo bar */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground font-medium">
          {photos.length} photos · {totalSpreads * 2} pages
        </span>
      </div>

      {spreads.map((spread, i) => (
        <div key={i} className="flex flex-col items-center gap-1">
          {/* Spread */}
          <div
            className="w-full rounded-md overflow-hidden shadow-[0_4px_20px_-4px_rgba(0,0,0,0.12)] border border-border/40"
            style={{ aspectRatio: "297 / 105" }}
          >
            <div className="flex h-full bg-white">
              {/* Left page */}
              <div className="flex-1 p-1.5">
                {spread.leftPhoto ? (
                  <img
                    src={spread.leftPhoto.url}
                    alt=""
                    className="w-full h-full object-cover rounded-sm"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-muted rounded-sm" />
                )}
              </div>
              <div className="w-px bg-border/30" />
              {/* Right page */}
              <div className="flex-1 p-1.5">
                {spread.rightPhoto ? (
                  <img
                    src={spread.rightPhoto.url}
                    alt=""
                    className="w-full h-full object-cover rounded-sm"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-muted rounded-sm" />
                )}
              </div>
            </div>
          </div>

          {/* Page numbers */}
          <div className="flex justify-between w-full px-1">
            <span className="text-[10px] text-muted-foreground">{spread.leftPage}</span>
            <span className="text-[10px] text-muted-foreground">{spread.rightPage}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PhotobookPreview;
