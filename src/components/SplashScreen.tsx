import { useEffect, useRef } from "react";

interface SplashScreenProps {
  onComplete: () => void;
}

const SplashScreen = ({ onComplete }: SplashScreenProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleEnded = () => {
      onComplete();
    };

    video.addEventListener("ended", handleEnded);
    video.play().catch(() => {
      // Autoplay blocked — skip splash
      onComplete();
    });

    return () => video.removeEventListener("ended", handleEnded);
  }, [onComplete]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black flex items-center justify-center"
      onClick={onComplete}
    >
      <video
        ref={videoRef}
        src="/tangible-splash.mp4"
        className="w-full h-full object-cover"
        muted
        playsInline
        preload="auto"
      />
    </div>
  );
};

export default SplashScreen;
