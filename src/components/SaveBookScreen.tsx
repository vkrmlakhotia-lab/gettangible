import { toast } from "sonner";
import { samplePhotos } from "@/data/samplePhotos";

interface SaveBookScreenProps {
  onSkip: () => void;
}

const SaveBookScreen = ({ onSkip }: SaveBookScreenProps) => {
  const handleApple = () => {
    toast("Apple sign-in coming soon");
  };

  const handleGoogle = () => {
    toast("Google sign-in coming soon");
  };

  // Mini book cover preview using first photo
  const coverPhoto = samplePhotos[0]?.url;

  return (
    <div className="fixed inset-0 z-40 bg-background flex flex-col">
      {/* Top section with visual */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-10 pb-4">
        {/* Floating book mockup */}
        <div className="relative mb-8">
          <div className="w-36 rounded-lg overflow-hidden shadow-xl border border-border/30" style={{ aspectRatio: "3/4" }}>
            <img
              src={coverPhoto}
              alt="Your photobook"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            <div className="absolute bottom-3 left-3 right-3">
              <p className="text-[8px] font-medium text-white/90 tracking-wide uppercase">Tangible</p>
            </div>
          </div>
          {/* Decorative shadow beneath book */}
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-28 h-3 bg-black/8 rounded-full blur-md" />
        </div>

        {/* Logo + heading */}
        <div className="w-12 h-12 rounded-2xl bg-[hsl(var(--tangible-teal))] flex items-center justify-center shadow-md mb-5">
          <span className="text-white text-lg font-bold">T</span>
        </div>

        <h2 className="text-xl font-semibold text-foreground mb-1.5">Save your book</h2>
        <p className="text-sm text-muted-foreground text-center max-w-[260px] leading-relaxed">
          Sign in to save your progress and continue to checkout.
        </p>
      </div>

      {/* Bottom section with buttons */}
      <div className="px-6 pb-8 pt-2 space-y-3">
        <button
          onClick={handleApple}
          className="w-full py-4 rounded-2xl bg-foreground text-background font-medium text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2.5"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
          </svg>
          Continue with Apple
        </button>

        <button
          onClick={handleGoogle}
          className="w-full py-4 rounded-2xl border border-border bg-card text-foreground font-medium text-sm hover:bg-muted/50 transition-colors flex items-center justify-center gap-2.5"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Continue with Google
        </button>

        <button
          onClick={onSkip}
          className="w-full py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Skip for now
        </button>

        <p className="text-[11px] text-muted-foreground/60 text-center pt-2 leading-relaxed">
          By continuing you agree to our{" "}
          <span className="underline cursor-pointer">Terms of Service</span>
          {" "}and{" "}
          <span className="underline cursor-pointer">Privacy Policy</span>
        </p>
      </div>
    </div>
  );
};

export default SaveBookScreen;
