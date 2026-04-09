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
  <div className="w-full h-full"><Img src={photos[0].url} /></div>
);

/** Matted — photo centered with white space around it */
const PageMatted = ({ photos }: { photos: Photo[] }) => (
  <div className="w-full h-full flex items-center justify-center bg-white">
    <div className="w-[72%] h-[78%] shadow-[0_2px_8px_rgba(0,0,0,0.1)] overflow-hidden rounded-sm">
      <Img src={photos[0].url} />
    </div>
  </div>
);

/** Hero (large) + Detail (small), side by side */
const PageHeroDetail = ({ photos }: { photos: Photo[] }) => (
  <div className="flex gap-[2px] h-full w-full">
    <div className="w-[63%] h-full overflow-hidden"><Img src={photos[0].url} /></div>
    <div className="w-[37%] h-full overflow-hidden"><Img src={photos[1].url} /></div>
  </div>
);

/** 3 portrait photos side by side */
const Page3Portraits = ({ photos }: { photos: Photo[] }) => (
  <div className="flex gap-[2px] h-full w-full">
    {photos.slice(0, 3).map((p) => (
      <div key={p.id} className="flex-1 h-full overflow-hidden">
        <Img src={p.url} />
      </div>
    ))}
  </div>
);

/** 1 portrait left + 2 landscape stacked right */
const PagePortraitAndLandscapes = ({ photos }: { photos: Photo[] }) => (
  <div className="flex gap-[2px] h-full w-full">
    <div className="w-[40%] h-full overflow-hidden"><Img src={photos[0].url} /></div>
    <div className="w-[60%] h-full flex flex-col gap-[2px]">
      <div className="flex-1 overflow-hidden"><Img src={photos[1].url} /></div>
      <div className="flex-1 overflow-hidden"><Img src={photos[2].url} /></div>
    </div>
  </div>
);

/** 2 photos stacked vertically */
const Page2Stack = ({ photos }: { photos: Photo[] }) => (
  <div className="flex flex-col gap-[2px] h-full w-full">
    <div className="flex-1 overflow-hidden"><Img src={photos[0].url} /></div>
    <div className="flex-1 overflow-hidden"><Img src={photos[1].url} /></div>
  </div>
);

/** 2×2 grid on a page */
const Page4Grid = ({ photos }: { photos: Photo[] }) => (
  <div className="grid grid-cols-2 grid-rows-2 gap-[2px] h-full w-full">
    {photos.slice(0, 4).map((p) => (
      <div key={p.id} className="overflow-hidden"><Img src={p.url} /></div>
    ))}
  </div>
);

/** 3 photos: 1 top row full width, 2 bottom row */
const Page1Top2Bottom = ({ photos }: { photos: Photo[] }) => (
  <div className="flex flex-col gap-[2px] h-full w-full">
    <div className="flex-1 overflow-hidden"><Img src={photos[0].url} /></div>
    <div className="flex-1 flex gap-[2px]">
      <div className="flex-1 overflow-hidden"><Img src={photos[1].url} /></div>
      <div className="flex-1 overflow-hidden"><Img src={photos[2].url} /></div>
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
  fullBleed?: boolean; // no padding on pages
}

const buildSpread = (event: PhotoEvent): SpreadPages => {
  const p = event.photos;
  const count = p.length;

  switch (count) {
    case 1:
      // Full bleed across entire spread
      return {
        left: <Page1 photos={[p[0]]} />,
        right: <PageEmpty />,
        fullBleed: true,
      };
    case 2:
      // Matted photo on each page
      return {
        left: <PageMatted photos={[p[0]]} />,
        right: <PageMatted photos={[p[1]]} />,
      };
    case 3:
      // Portrait + 2 landscapes on left, empty right
      return {
        left: <PagePortraitAndLandscapes photos={[p[0], p[1], p[2]]} />,
        right: <PageEmpty />,
      };
    case 4:
      // Left: 2 stacked, Right: 2 stacked
      return {
        left: <Page2Stack photos={[p[0], p[1]]} />,
        right: <Page2Stack photos={[p[2], p[3]]} />,
      };
    case 5:
      // Left: hero + detail, Right: 3 portraits
      return {
        left: <PageHeroDetail photos={[p[0], p[1]]} />,
        right: <Page3Portraits photos={[p[2], p[3], p[4]]} />,
      };
    default: {
      // 6+: 3 per page (1 top + 2 bottom)
      const left = p.slice(0, 3);
      const right = p.slice(3, 6);
      return {
        left: <Page1Top2Bottom photos={left} />,
        right: right.length >= 3
          ? <Page1Top2Bottom photos={right} />
          : right.length === 2
            ? <Page2Stack photos={right} />
            : right.length === 1
              ? <Page1 photos={right} />
              : <PageEmpty />,
      };
    }
  }
};

/* ── Cover page ──────────────────────────────────── */

const CoverSpread = ({ photos }: { photos: Photo[] }) => {
  const coverPhoto = photos[0];
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className="w-full rounded-md overflow-hidden shadow-[0_8px_30px_-6px_rgba(0,0,0,0.18)] border border-border/40 bg-white"
        style={{ aspectRatio: "297 / 105" }}
      >
        <div className="flex h-full">
          {/* Left: cover photo */}
          <div className="flex-1 overflow-hidden">
            {coverPhoto && <Img src={coverPhoto.url} />}
          </div>
          <div className="w-px bg-border/30 flex-shrink-0" />
          {/* Right: title */}
          <div className="flex-1 flex flex-col items-center justify-center gap-3 bg-white px-6">
            <h2 className="text-sm font-bold text-foreground tracking-wide text-center">
              Our Trip to Greece
            </h2>
            <p className="text-[10px] text-muted-foreground">April 2026</p>
          </div>
        </div>
      </div>
      <div className="flex justify-between w-full px-1">
        <span className="text-[10px] text-muted-foreground">Cover</span>
        <span className="text-[10px] text-muted-foreground"></span>
      </div>
    </div>
  );
};

/* ── Spread component ────────────────────────────── */

const SpreadLayout = ({ event, pageNum }: { event: PhotoEvent; pageNum: number }) => {
  const { left, right, fullBleed } = buildSpread(event);
  const padding = fullBleed ? "" : "p-1.5";

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
          <div className={`flex-1 overflow-hidden ${padding}`}>
            <div className="w-full h-full rounded-sm overflow-hidden">{left}</div>
          </div>
          <div className="w-px bg-border/30 flex-shrink-0" />
          <div className={`flex-1 overflow-hidden ${padding}`}>
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
  const allPhotos = events.flatMap((e) => e.photos);
  const totalPages = events.length * 2 + 2; // +2 for cover

  return (
    <div className="flex flex-col gap-6 pb-8">
      <span className="text-xs text-muted-foreground font-medium">
        {events.length} events · {totalPages} pages
      </span>

      {/* Cover */}
      <CoverSpread photos={allPhotos} />

      {/* Spreads */}
      {events.map((event, i) => (
        <SpreadLayout key={`${event.date}-${event.location}`} event={event} pageNum={i * 2 + 3} />
      ))}
    </div>
  );
};

export default PhotobookPreview;
