import { PhotoEvent } from "@/data/samplePhotos";

interface PhotobookPreviewProps {
  events: PhotoEvent[];
}

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
};

/** Render photos in a layout that adapts to count */
const SpreadLayout = ({ event, pageNum }: { event: PhotoEvent; pageNum: number }) => {
  const photos = event.photos;
  const count = photos.length;

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="w-full rounded-md overflow-hidden shadow-[0_4px_20px_-4px_rgba(0,0,0,0.12)] border border-border/40"
        style={{ aspectRatio: "297 / 105" }}
      >
        <div className="flex h-full bg-white relative">
          {/* Left page */}
          <div className="flex-1 p-1.5 flex flex-col gap-1">
            {/* Date/location label */}
            <div className="absolute top-2 left-3 z-10">
              <p className="text-[8px] font-semibold text-foreground/70 tracking-wide">
                {formatDate(event.date)}
              </p>
              {event.location && (
                <p className="text-[7px] text-muted-foreground">{event.location}</p>
              )}
            </div>

            {count === 1 ? (
              <img src={photos[0].url} alt="" className="w-full h-full object-cover rounded-sm" loading="lazy" />
            ) : count === 2 ? (
              <img src={photos[0].url} alt="" className="w-full h-full object-cover rounded-sm" loading="lazy" />
            ) : count <= 4 ? (
              <div className="grid grid-cols-1 gap-1 h-full">
                <img src={photos[0].url} alt="" className="w-full h-full object-cover rounded-sm" loading="lazy" />
                {photos[2] && (
                  <img src={photos[2].url} alt="" className="w-full h-full object-cover rounded-sm" loading="lazy" />
                )}
              </div>
            ) : (
              /* 5+ photos: left side gets a hero + grid */
              <div className="flex flex-col gap-1 h-full">
                <div className="flex-[2]">
                  <img src={photos[0].url} alt="" className="w-full h-full object-cover rounded-sm" loading="lazy" />
                </div>
                <div className="flex-1 grid grid-cols-2 gap-1">
                  {photos.slice(1, 3).map((p) => (
                    <img key={p.id} src={p.url} alt="" className="w-full h-full object-cover rounded-sm" loading="lazy" />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Center seam */}
          <div className="w-px bg-border/30" />

          {/* Right page */}
          <div className="flex-1 p-1.5">
            {count === 1 ? (
              <div className="w-full h-full bg-muted/30 rounded-sm" />
            ) : count === 2 ? (
              <img src={photos[1].url} alt="" className="w-full h-full object-cover rounded-sm" loading="lazy" />
            ) : count <= 4 ? (
              <div className="grid grid-cols-1 gap-1 h-full">
                <img src={photos[1].url} alt="" className="w-full h-full object-cover rounded-sm" loading="lazy" />
                {photos[3] && (
                  <img src={photos[3].url} alt="" className="w-full h-full object-cover rounded-sm" loading="lazy" />
                )}
              </div>
            ) : (
              /* 5+ photos: right side grid */
              <div className="flex flex-col gap-1 h-full">
                <div className="flex-1 grid grid-cols-2 gap-1">
                  {photos.slice(3, 5).map((p) => (
                    <img key={p.id} src={p.url} alt="" className="w-full h-full object-cover rounded-sm" loading="lazy" />
                  ))}
                </div>
                <div className="flex-[2]">
                  {photos[5] ? (
                    <img src={photos[5].url} alt="" className="w-full h-full object-cover rounded-sm" loading="lazy" />
                  ) : (
                    <div className="w-full h-full bg-muted/30 rounded-sm" />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Page numbers */}
      <div className="flex justify-between w-full px-1">
        <span className="text-[10px] text-muted-foreground">{pageNum}</span>
        <span className="text-[10px] text-muted-foreground">{pageNum + 1}</span>
      </div>
    </div>
  );
};

const PhotobookPreview = ({ events }: PhotobookPreviewProps) => {
  const totalPages = events.length * 2;

  return (
    <div className="flex flex-col gap-5 pb-8">
      <span className="text-xs text-muted-foreground font-medium">
        {events.length} events · {totalPages} pages
      </span>

      {events.map((event, i) => (
        <SpreadLayout key={`${event.date}-${event.location}`} event={event} pageNum={i * 2 + 1} />
      ))}
    </div>
  );
};

export default PhotobookPreview;
