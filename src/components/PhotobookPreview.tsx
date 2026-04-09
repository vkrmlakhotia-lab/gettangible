import { PhotoEvent, Photo } from "@/data/samplePhotos";

interface PhotobookPreviewProps {
  events: PhotoEvent[];
}

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
};

const Img = ({ src }: { src: string }) => (
  <img src={src} alt="" className="w-full h-full object-cover" loading="lazy" />
);

/* ── Single-page layouts ─────────────────────────── */

/** Full bleed — photo fills the entire page */
const Page1 = ({ photos }: { photos: Photo[] }) => (
  <div className="w-full h-full">
    <Img src={photos[0].url} />
  </div>
);

/** Matted — photo centered with white space around it */
const PageMatted = ({ photos }: { photos: Photo[] }) => (
  <div className="w-full h-full flex items-center justify-center bg-white">
    <div className="w-[72%] h-[78%] shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
      <Img src={photos[0].url} />
    </div>
  </div>
);

/** Hero + Detail — large photo (65%) + small detail (35%), side by side */
const PageHeroDetail = ({ photos }: { photos: Photo[] }) => (
  <div className="flex gap-[2px] h-full">
    <div className="w-[63%] h-full"><Img src={photos[0].url} /></div>
    <div className="w-[37%] h-full"><Img src={photos[1].url} /></div>
  </div>
);

/** 3 portrait photos side by side */
const Page3Portraits = ({ photos }: { photos: Photo[] }) => (
  <div className="flex gap-[2px] h-full">
    {photos.slice(0, 3).map((p) => (
      <div key={p.id} className="flex-1 h-full flex items-center justify-center">
        <div className="w-[85%] h-full">
          <Img src={p.url} />
        </div>
      </div>
    ))}
  </div>
);

/** 1 portrait left + 2 landscape stacked right */
const PagePortraitAndLandscapes = ({ photos }: { photos: Photo[] }) => (
  <div className="flex gap-[2px] h-full">
    <div className="w-[40%] h-full"><Img src={photos[0].url} /></div>
    <div className="w-[60%] h-full flex flex-col gap-[2px]">
      <div className="flex-1"><Img src={photos[1].url} /></div>
      <div className="flex-1"><Img src={photos[2].url} /></div>
    </div>
  </div>
);

/** 2 photos stacked vertically */
const Page2Stack = ({ photos }: { photos: Photo[] }) => (
  <div className="flex flex-col gap-[2px] h-full">
    <div className="flex-1"><Img src={photos[0].url} /></div>
    <div className="flex-1"><Img src={photos[1].url} /></div>
  </div>
);

/** 1 large top, 2 small bottom */
const Page3 = ({ photos }: { photos: Photo[] }) => (
  <div className="flex flex-col gap-[2px] h-full">
    <div className="flex-[2]"><Img src={photos[0].url} /></div>
    <div className="flex-1 flex gap-[2px]">
      <div className="flex-1"><Img src={photos[1].url} /></div>
      <div className="flex-1"><Img src={photos[2].url} /></div>
    </div>
  </div>
);

/** Empty page */
const PageEmpty = () => (
  <div className="w-full h-full bg-muted/20" />
);

/* ── Spread strategies per event photo count ─────── */

interface SpreadPages {
  left: React.ReactNode;
  right: React.ReactNode;
}

const buildSpread = (event: PhotoEvent): SpreadPages => {
  const p = event.photos;
  const count = p.length;

  switch (count) {
    case 1:
      // Spread 1: Full bleed left, empty right
      return {
        left: <Page1 photos={[p[0]]} />,
        right: <PageEmpty />,
      };
    case 2:
      // Spread 2: Matted photo on each page
      return {
        left: <PageMatted photos={[p[0]]} />,
        right: <PageMatted photos={[p[1]]} />,
      };
    case 3:
      // 1 portrait + 2 landscape on left page, empty right
      return {
        left: <PagePortraitAndLandscapes photos={[p[0], p[1], p[2]]} />,
        right: <PageEmpty />,
      };
    case 4:
      // 2 stacked per page
      return {
        left: <Page2Stack photos={[p[0], p[1]]} />,
        right: <Page2Stack photos={[p[2], p[3]]} />,
      };
    case 5:
      // Left: hero + detail (2 photos), Right: 3 portraits
      return {
        left: <PageHeroDetail photos={[p[0], p[1]]} />,
        right: <Page3Portraits photos={[p[2], p[3], p[4]]} />,
      };
    default: {
      // 6+: 3 per page
      const left = p.slice(0, 3);
      const right = p.slice(3, 6);
      return {
        left: <Page3 photos={left} />,
        right: right.length >= 3
          ? <Page3 photos={right} />
          : right.length === 2
            ? <Page2Stack photos={right} />
            : right.length === 1
              ? <Page1 photos={right} />
              : <PageEmpty />,
      };
    }
  }
};

const SpreadLayout = ({ event, pageNum }: { event: PhotoEvent; pageNum: number }) => {
  const { left, right } = buildSpread(event);

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="w-full px-1">
        <p className="text-[10px] font-semibold text-foreground/60 tracking-wide">
          {formatDate(event.date)}
          {event.location && <span className="text-muted-foreground font-normal"> · {event.location}</span>}
        </p>
      </div>

      <div
        className="w-full rounded-md overflow-hidden shadow-[0_4px_20px_-4px_rgba(0,0,0,0.12)] border border-border/40 bg-white"
        style={{ aspectRatio: "297 / 105" }}
      >
        <div className="flex h-full">
          <div className="flex-1 p-1.5 overflow-hidden">
            <div className="w-full h-full rounded-sm overflow-hidden">{left}</div>
          </div>
          <div className="w-px bg-border/30 flex-shrink-0" />
          <div className="flex-1 p-1.5 overflow-hidden">
            <div className="w-full h-full rounded-sm overflow-hidden">{right}</div>
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
    <div className="flex flex-col gap-6 pb-8">
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
