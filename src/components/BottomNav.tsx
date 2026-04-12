import { useLocation, useNavigate } from 'react-router-dom';
import { Home, BookOpen, ShoppingBag, User } from 'lucide-react';

const tabs = [
  { path: '/home', icon: Home, label: 'Home' },
  { path: '/creations', icon: BookOpen, label: 'Creations' },
  { path: '/basket', icon: ShoppingBag, label: 'Basket' },
  { path: '/account', icon: User, label: 'Account' },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Hide nav on certain routes
  const hiddenRoutes = ['/', '/onboarding', '/editor', '/preview'];
  if (hiddenRoutes.some(r => location.pathname.startsWith(r) && r !== '/home')) {
    if (location.pathname === '/') return null;
    if (location.pathname !== '/home' && location.pathname !== '/creations' && location.pathname !== '/basket' && location.pathname !== '/account') return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-t border-border/50">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-4">
        {tabs.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="flex flex-col items-center gap-1 py-1 px-3 transition-colors"
            >
              <Icon
                size={22}
                strokeWidth={isActive ? 2 : 1.5}
                className={isActive ? 'text-primary' : 'text-muted-foreground'}
              />
              <span className={`text-[10px] font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
