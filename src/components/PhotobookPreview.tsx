import { PhotoEvent } from "@/data/samplePhotos";

interface PhotobookPreviewProps {
  events: PhotoEvent[];
}

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
};

const PageLabel = ({ event }: { event: PhotoEvent }) => (
  <div className="absolute top-2.5 left-3 z-10 pointer-events-none">
    <p className="text-[8px] font-semibold text-foreground/60 tracking-wide uppercase">
      {formatDate(event.date)}
    </p>
    {event.location && (
      <p className="text-[7px] text-muted-foreground/80">{event.location}</p>
    )}
  </div>
);

const Img = ({ src }: { src: string }) => (
  <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" />
);

/** 1 photo — Full Bleed Hero */
const Layout1 = ({ event }: { event: PhotoEvent }) => {
  const [p1] = event.photos;
  return (
    <div className="relative w-full h-full">
      <Img src={p1.url} />
      <PageLabel event={event} />
    </div>
  );
};

/** 2 photos — Hero + Detail (65/35 split) */
const Layout2 = ({ event }: { event: PhotoEvent }) => {
  const [p1, p2] = event.photos;
  return (
    <div className="flex h-full gap-[2px] relative">
      <PageLabel event={event} />
      <div className="w-[63%] h-full"><Img src={p1.url} /></div>
      <div className="w-[37%] h-full"><Img src={p2.url} /></div>
    </div>
  );
};

/** 3 photos — Hero + Stack */
const Layout3 = ({ event }: { event: PhotoEvent }) => {
  const [p1, p2, p3] = event.photos;
  return (
    <div className="flex h-full gap-[2px] relative">
      <PageLabel event={event} />
      <div className="w-[58%] h-full"><Img src={p1.url} /></div>
      <div className="w-[42%] h-full flex flex-col gap-[2px]">
        <div className="flex-1"><Img src={p2.url} /></div>
        <div className="flex-1"><Img src={p3.url} /></div>
      </div>
    </div>
  );
};

/** 4 photos — 2×2 Grid */
const Layout4Grid = ({ event }: { event: PhotoEvent }) => {
  const [p1, p2, p3, p4] = event.photos;
  return (
    <div className="grid grid-cols-2 grid-rows-2 gap-[2px] h-full relative">
      <PageLabel event={event} />
      <div><Img src={p1.url} /></div>
      <div><Img src={p2.url} /></div>
      <div><Img src={p3.url} /></div>
      <div><Img src={p4.url} /></div>
    </div>
  );
};

/** 5 photos — Hero + Right Stack of 4 */
const Layout5 = ({ event }: { event: PhotoEvent }) => {
  const [p1, ...rest] = event.photos;
  return (
    <div className="flex h-full gap-[2px] relative">
      <PageLabel event={event} />
      <div className="w-[58%] h-full"><Img src={p1.url} /></div>
      <div className="w-[42%] h-full flex flex-col gap-[2px]">
        {rest.map((p) => (
          <div key={p.id} className="flex-1"><Img src={p.url} /></div>
        ))}
      </div>
    </div>
  );
};

/** 6 photos — 3×2 Grid */
const Layout6 = ({ event }: { event: PhotoEvent }) => {
  const photos = event.photos;
  return (
    <div className="grid grid-cols-3 grid-rows-2 gap-[2px] h-full relative">
      <PageLabel event={event} />
      {photos.map((p) => (
        <div key={p.id}><Img src={p.url} /></div>
      ))}
    </div>
  );
};

/** Pick the best layout based on photo count */
const SpreadLayout = ({ event, pageNum }: { event: PhotoEvent; pageNum: number }) => {
  const count = event.photos.length;

  const LayoutComponent = (() => {
    if (count === 1) return Layout1;
    if (count === 2) return Layout2;
    if (count === 3) return Layout3;
    if (count === 4) return Layout4Grid;
    if (count === 5) return Layout5;
    return Layout6; // 6+
  })();

  // For 7+ photos, only take first 6
  const trimmedEvent = count > 6
    ? { ...event, photos: event.photos.slice(0, 6) }
    : event;

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="w-full rounded-md overflow-hidden shadow-[0_4px_20px_-4px_rgba(0,0,0,0.12)] border border-border/40 bg-white"
        style={{ aspectRatio: "297 / 105" }}
      >
        <div className="w-full h-full p-1.5">
          <div className="w-full h-full rounded-sm overflow-hidden">
            <LayoutComponent event={trimmedEvent} />
          </div>
        </div>
      </div>
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
