import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const Index = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [splashDone, setSplashDone] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const fallback = setTimeout(() => setSplashDone(true), 2000);
    return () => clearTimeout(fallback);
  }, []);

  useEffect(() => {
    if (!splashDone || isLoading) return;
    const hasSignedInBefore = localStorage.getItem('hasSignedInBefore') === 'true';
    if (isAuthenticated || hasSignedInBefore) {
      navigate('/home', { replace: true });
    } else {
      navigate('/onboarding', { replace: true });
    }
  }, [splashDone, isAuthenticated, isLoading, navigate]);

  return (
    <div className="min-h-screen relative overflow-hidden bg-black">
      <video
        ref={videoRef}
        src="/tangible-splash.mp4"
        autoPlay
        muted
        playsInline
        onEnded={() => setSplashDone(true)}
        onError={() => setSplashDone(true)}
        className="absolute inset-0 w-full h-full object-cover"
      />
    </div>
  );
};

export default Index;
