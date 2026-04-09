import { useState, useEffect, useCallback } from "react";
import { Camera, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { samplePhotos } from "@/data/samplePhotos";

interface OnboardingScreensProps {
  onComplete: () => void;
}

/* ── Carousel of sample book covers ─────────────── */

const carouselPhotos = samplePhotos.slice(0, 6).map((p) => p.url);

const PhotoCarousel = () => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % carouselPhotos.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full relative overflow-hidden rounded-2xl" style={{ aspectRatio: "3/4" }}>
      {carouselPhotos.map((url, i) => (
        <img
          key={url}
          src={url}
          alt=""
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
          style={{ opacity: i === current ? 1 : 0 }}
        />
      ))}
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10" />
      {/* Dots */}
      <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
        {carouselPhotos.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-1.5 h-1.5 rounded-full transition-all ${
              i === current ? "bg-white w-4" : "bg-white/50"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

/* ── Onboarding flow ────────────────────────────── */

const OnboardingScreens = ({ onComplete }: OnboardingScreensProps) => {
  const [step, setStep] = useState<"curate" | "import" | "analyzing">("curate");

  if (step === "curate") {
    return (
      <div className="fixed inset-0 z-40 bg-background flex items-center justify-center">
        <div className="max-w-sm w-full flex flex-col items-center px-6 py-8 gap-5">
          <PhotoCarousel />
          <div className="space-y-1.5 text-center">
            <h2 className="text-xl font-semibold text-foreground">Build your album</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We curate your best photos into a photo album
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
        </div>
      </div>
    );
  }

  if (step === "import") {
    return (
      <div className="fixed inset-0 z-40 bg-black/50 flex items-end justify-center sm:items-center">
        <div className="max-w-sm w-full bg-card rounded-t-2xl sm:rounded-2xl overflow-hidden">
          {/* Header section */}
          <div className="flex flex-col items-center text-center px-6 pt-8 pb-4 gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[hsl(var(--tangible-green))] to-[hsl(var(--tangible-teal))] flex items-center justify-center shadow-lg">
              <Camera className="w-8 h-8 text-white" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-base font-semibold text-foreground">
                "Tangible" Would Like to Access Your Photos
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                This lets Tangible find your best photos and curate them into a photobook. Photos are analysed locally on your device.
              </p>
            </div>
          </div>

          {/* Action buttons — iOS-style stacked */}
          <div className="border-t border-border">
            <button
              onClick={() => setStep("analyzing")}
              className="w-full py-3.5 text-sm font-medium text-[hsl(var(--tangible-teal))] hover:bg-muted/50 transition-colors border-b border-border"
            >
              Allow Full Access
            </button>
            <button
              onClick={() => setStep("analyzing")}
              className="w-full py-3.5 text-sm text-[hsl(var(--tangible-teal))] hover:bg-muted/50 transition-colors border-b border-border"
            >
              Limit Access…
            </button>
            <button
              onClick={onComplete}
              className="w-full py-3.5 text-sm text-muted-foreground hover:bg-muted/50 transition-colors"
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
          setTimeout(onComplete, 1500);
          return prev;
        }
        return prev + 1;
      });
    }, 2500);
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
        <div className="space-y-1 text-xs text-muted-foreground/60">
          {analyzeMessages.map((m, i) => (
            <p key={m} className={i <= msgIndex ? "text-muted-foreground" : ""}>
              {m}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OnboardingScreens;
