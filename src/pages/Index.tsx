import { useState, useMemo, useCallback, useEffect } from "react";
import confetti from "canvas-confetti";
import { arrayMove } from "@dnd-kit/sortable";
import SplashScreen from "@/components/SplashScreen";
import OnboardingScreens from "@/components/OnboardingScreens";
import SaveBookScreen from "@/components/SaveBookScreen";
import CheckoutPage from "@/components/CheckoutPage";
import OrderConfirmation from "@/components/OrderConfirmation";
import OrderTracking from "@/components/OrderTracking";
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

type AppState = "splash" | "onboarding" | "celebrate" | "main" | "save" | "checkout" | "confirmed" | "tracking";

const Index = () => {
  const [appState, setAppState] = useState<AppState>("splash");
  const [activeTab, setActiveTab] = useState<"shortlisted" | "preview">("preview");
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
  const totalPages = events.length * 2 + 4;

  const toggleFilter = (id: string) => {
    setFilters((prev) => prev.map((f) => (f.id === id ? { ...f, enabled: !f.enabled } : f)));
  };

  const handleRemove = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
    toast("Photo removed from shortlist");
  };

  const handleReorder = (oldIndex: number, newIndex: number) => {
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

  const handleAddPhotos = () => toast("Add photos flow coming soon");
  const handleSplashComplete = useCallback(() => setAppState("onboarding"), []);
  const handleOnboardingComplete = useCallback(() => setAppState("celebrate"), []);

  // Confetti celebration
  useEffect(() => {
    if (appState !== "celebrate") return;
    const colors = ["#f8961e", "#43aa8b", "#f9c74f", "#90be6d", "#577590"];
    const end = Date.now() + 2000;
    const frame = () => {
      confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0, y: 0.6 }, colors });
      confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1, y: 0.6 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
    confetti({ particleCount: 100, spread: 100, origin: { y: 0.5 }, colors });
    const timer = setTimeout(() => setAppState("main"), 2500);
    return () => clearTimeout(timer);
  }, [appState]);

  // Screens
  if (appState === "splash") return <SplashScreen onComplete={handleSplashComplete} />;
  if (appState === "onboarding") return <OnboardingScreens onComplete={handleOnboardingComplete} />;

  if (appState === "celebrate") {
    return (
      <div className="fixed inset-0 z-40 bg-background flex flex-col items-center justify-center px-8">
        <div className="text-center space-y-3 animate-scale-in">
          <div className="text-4xl">🎉</div>
          <h2 className="text-xl font-semibold text-foreground">Your book is ready!</h2>
          <p className="text-sm text-muted-foreground">We found your best photos and created a photobook.</p>
        </div>
      </div>
    );
  }

  if (appState === "save") {
    return <SaveBookScreen onSkip={() => setAppState("checkout")} coverUrl={filteredPhotos[0]?.url} title={bookTitle} subtitle={bookSubtitle} />;
  }

  if (appState === "checkout") {
    return (
      <CheckoutPage
        coverUrl={filteredPhotos[0]?.url}
        title={bookTitle}
        pageCount={totalPages}
        onBack={() => setAppState("save")}
        onComplete={() => setAppState("confirmed")}
      />
    );
  }

  if (appState === "confirmed") {
    return (
      <OrderConfirmation
        title={bookTitle}
        pageCount={totalPages}
        total={27.99}
        onViewOrders={() => setAppState("tracking")}
        onBackHome={() => setAppState("main")}
      />
    );
  }

  if (appState === "tracking") {
    return (
      <OrderTracking
        coverUrl={filteredPhotos[0]?.url}
        title={bookTitle}
        total={27.99}
        onBack={() => setAppState("confirmed")}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto px-4 py-6">
        <h1 className="text-lg font-semibold text-foreground text-center mb-4">Your Photobook</h1>
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
        <div className="sticky bottom-0 pt-3 pb-6 bg-gradient-to-t from-background via-background to-transparent">
          <button
            onClick={() => setAppState("save")}
            className="w-full py-3.5 rounded-full bg-[hsl(var(--tangible-orange))] text-white font-medium text-sm hover:opacity-90 transition-opacity"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default Index;
