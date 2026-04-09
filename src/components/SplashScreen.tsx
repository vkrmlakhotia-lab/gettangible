import { useEffect, useRef } from "react";

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleEnded = () => onComplete();

    video.addEventListener("ended", handleEnded);
    video.play().catch(() => onComplete());

    return () => video.removeEventListener("ended", handleEnded);
  }, [onComplete]);

  return (
    <div
      className="fixed inset-0 z-50 bg-background flex items-center justify-center"
      onClick={onComplete}
    >
      <div className="w-full max-w-md h-full max-h-[85vh] relative">
        <video
          ref={videoRef}
          src="/tangible-splash.mp4"
          className="w-full h-full object-contain"
          muted
          playsInline
          preload="auto"
        />
      </div>
    </div>
  );
};

export default SplashScreen;
