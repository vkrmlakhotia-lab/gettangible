import { toast } from "sonner";

interface SaveBookScreenProps {
  onSkip: () => void;
  coverUrl?: string;
  title?: string;
  subtitle?: string;
}

const SaveBookScreen = ({ onSkip, coverUrl, title, subtitle }: SaveBookScreenProps) => {
  const handleApple = () => {
    toast("Apple sign-in coming soon");
  };

  const handleGoogle = () => {
    toast("Google sign-in coming soon");
  };

  return (
    <div className="fixed inset-0 z-40 bg-background flex flex-col">
      {/* Book cover preview — mirrors the actual cover the user built */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="relative mb-10">
          <div
            className="w-36 rounded-lg overflow-hidden shadow-xl border border-border/30 bg-white"
            style={{ aspectRatio: "3/4" }}
          >
            {coverUrl ? (
              <>
                <img src={coverUrl} alt="Your photobook cover" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  {title && <p className="text-[10px] font-bold text-white tracking-wide leading-tight">{title}</p>}
                  {subtitle && <p className="text-[7px] text-white/70 mt-0.5">{subtitle}</p>}
                </div>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted/20">
                <span className="text-xs text-muted-foreground">No cover</span>
              </div>
            )}
          </div>
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-24 h-3 bg-black/8 rounded-full blur-md" />
        </div>

        <p className="text-sm text-muted-foreground text-center max-w-[260px] leading-relaxed">
          Sign in to save your progress and continue to checkout.
        </p>
      </div>

      {/* Auth buttons */}
      <div className="px-6 pb-10 pt-4 space-y-3">
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

        <p className="text-[11px] text-muted-foreground/60 text-center pt-3 leading-relaxed">
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
