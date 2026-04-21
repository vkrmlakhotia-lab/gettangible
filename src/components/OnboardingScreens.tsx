import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { samplePhotos } from "@/data/samplePhotos";

async function requestPhotosPermission() {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { Camera } = await import("@capacitor/camera");
    await Camera.requestPermissions({ permissions: ["photos"] });
  } catch {}
}

interface OnboardingScreensProps {
  onComplete: () => void;
  initialStep?: "curate" | "import" | "analyzing";
  onBack?: () => void;
}

/* ── Book cover carousel — shows finished book mockups ─── */

const bookCovers = [
  { url: samplePhotos[0]?.url, title: "Our Trip to Greece", subtitle: "April 2026" },
  { url: samplePhotos[3]?.url, title: "Summer Memories", subtitle: "July 2025" },
  { url: samplePhotos[5]?.url, title: "Family Weekend", subtitle: "March 2026" },
];

const PhotoCarousel = () => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % bookCovers.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full flex flex-col items-center">
      {/* Book mockup */}
      <div className="relative w-72" style={{ aspectRatio: "297/210" }}>
        {bookCovers.map((book, i) => (
          <div
            key={i}
            className="absolute inset-0 rounded-xl overflow-hidden shadow-2xl border border-border/30 transition-all duration-700"
            style={{ opacity: i === current ? 1 : 0, transform: i === current ? "scale(1)" : "scale(0.95)" }}
          >
            <img src={book.url} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10" />
            <div className="absolute bottom-4 left-4 right-4">
              <p className="text-sm font-bold text-white tracking-wide">{book.title}</p>
              <p className="text-[10px] text-white/70 mt-0.5">{book.subtitle}</p>
            </div>
            {/* Spine effect */}
            <div className="absolute top-0 bottom-0 left-0 w-1 bg-gradient-to-r from-black/20 to-transparent" />
          </div>
        ))}
        {/* Book shadow */}
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-40 h-4 bg-black/10 rounded-full blur-lg" />
      </div>
      {/* Dots */}
      <div className="flex justify-center gap-1.5 mt-5">
        {bookCovers.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-1.5 rounded-full transition-all ${
              i === current ? "bg-[hsl(var(--tangible-orange))] w-5" : "bg-muted-foreground/30 w-1.5"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

/* ── Onboarding flow ────────────────────────────── */

const OnboardingScreens = ({ onComplete, initialStep = "curate", onBack }: OnboardingScreensProps) => {
  const [step, setStep] = useState<"curate" | "import" | "analyzing">(initialStep);

  if (step === "curate") {
    return (
      <div className="fixed inset-0 z-40 bg-background flex items-center justify-center">
        <div className="max-w-sm w-full flex flex-col items-center px-6 py-8 gap-5">
          <PhotoCarousel />
          <div className="space-y-1.5 text-center">
            <h2 className="text-xl font-semibold text-foreground">Build your album</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Takes just 2 minutes, starting at £25.
            </p>
          </div>
          <button
            onClick={() => setStep("import")}
            className="w-full py-3 rounded-full bg-tangible-orange text-white font-medium text-sm hover:opacity-90 transition-opacity"
          >
            Get Started
          </button>
          <button className="text-sm text-tangible-orange hover:underline">
            Already have an account? Sign in
          </button>
          <a
            href="/privacy"
            className="text-[11px] text-muted-foreground hover:underline"
          >
            Privacy Policy
          </a>
        </div>
      </div>
    );
  }

  if (step === "import") {
    const gridPhotos = samplePhotos.slice(0, 8).map((p) => p.url);

    return (
      <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm flex items-end justify-center sm:items-center">
        <div className="max-w-sm w-full bg-card/95 backdrop-blur-xl rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="flex flex-col items-start text-left px-6 pt-7 pb-3 gap-3">
            {/* Photos icon — mimics Apple Photos sunflower */}
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[hsl(var(--tangible-orange))] via-[hsl(var(--tangible-gold))] to-[hsl(var(--tangible-green))] flex items-center justify-center shadow-md">
                <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="12" r="3.5" />
                  <ellipse cx="12" cy="5.5" rx="2.2" ry="3.5" />
                  <ellipse cx="12" cy="18.5" rx="2.2" ry="3.5" />
                  <ellipse cx="5.5" cy="12" rx="3.5" ry="2.2" />
                  <ellipse cx="18.5" cy="12" rx="3.5" ry="2.2" />
                  <ellipse cx="7.4" cy="7.4" rx="2.2" ry="3.5" transform="rotate(45 7.4 7.4)" />
                  <ellipse cx="16.6" cy="16.6" rx="2.2" ry="3.5" transform="rotate(45 16.6 16.6)" />
                  <ellipse cx="16.6" cy="7.4" rx="2.2" ry="3.5" transform="rotate(-45 16.6 7.4)" />
                  <ellipse cx="7.4" cy="16.6" rx="2.2" ry="3.5" transform="rotate(-45 7.4 16.6)" />
                </svg>
              </div>
            </div>

            <div className="space-y-1.5">
              <h2 className="text-base font-semibold text-foreground leading-snug">
                "Tangible" would like full access to your Photo Library.
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                This is necessary to curate your best photos into a photobook.
              </p>
            </div>
          </div>

          {/* Photo grid preview */}
          <div className="px-6 pb-3">
            <div className="grid grid-cols-4 gap-0.5 rounded-xl overflow-hidden">
              {gridPhotos.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt=""
                  className="w-full aspect-square object-cover"
                />
              ))}
            </div>
            <div className="mt-2.5 space-y-0.5">
              <p className="text-xs font-semibold text-foreground">
                {samplePhotos.length} Photos
              </p>
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Photos may contain data associated with location, depth information, captions and audio.
              </p>
            </div>
          </div>

          {/* 3 buttons */}
          <div className="px-6 py-4 space-y-2.5">
            <button
              onClick={async () => { await requestPhotosPermission(); onComplete(); }}
              className="w-full py-3.5 rounded-xl bg-[hsl(var(--tangible-teal))] text-white font-medium text-sm hover:opacity-90 transition-opacity"
            >
              Allow Full Access
            </button>
            <button
              onClick={onComplete}
              className="w-full py-3.5 rounded-xl border border-border text-muted-foreground text-sm hover:bg-muted/40 transition-colors"
            >
              Don't Allow
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <AnalyzingScreen onComplete={onComplete} />;
};

const analyzeMessages = [
  "Finding your best smiles...",
  "Curating the best scenes...",
  "Removing duplicates...",
  "Discarding screenshots...",
  "Cropping the best parts...",
];

const AnalyzingScreen = ({ onComplete }: { onComplete: () => void }) => {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((prev) => {
        if (prev >= analyzeMessages.length - 1) {
          clearInterval(interval);
          setTimeout(onComplete, 600);
          return prev;
        }
        return prev + 1;
      });
    }, 1200);
    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-40 bg-background flex flex-col items-center justify-center px-8">
      <div className="max-w-sm w-full flex flex-col items-center text-center gap-8">
        <h3 className="text-base font-semibold text-foreground">Analysing Photos</h3>
        <div className="w-24 h-24 rounded-full bg-tangible-teal/10 flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-tangible-teal animate-spin" />
        </div>
        <p className="text-sm font-medium text-tangible-teal">
          {analyzeMessages[msgIndex]}
        </p>
      </div>
    </div>
  );
};

export default OnboardingScreens;
