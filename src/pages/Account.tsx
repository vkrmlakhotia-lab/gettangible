import { useAuth } from '@/context/AuthContext';
import { useBooks } from '@/context/BookContext';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, Package, ChevronRight, Truck } from 'lucide-react';

const Account = () => {
  const { user, signOut } = useAuth();
  const { projects } = useBooks();
  const navigate = useNavigate();

  const orderedCount = projects.filter(p => p.status === 'ordered').length;

  const handleSignOut = () => {
    signOut();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="px-6 pt-14 pb-6">
        <h1 className="text-2xl font-semibold text-foreground tracking-tight">Account</h1>
      </header>

      {/* Profile */}
      <div className="px-6 mb-8">
        <div className="bg-card rounded-xl p-5 card-shadow flex items-center gap-4">
          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
            <User size={20} strokeWidth={1.5} className="text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{user?.user_metadata?.full_name || user?.user_metadata?.name || 'User'}</p>
            <p className="text-xs text-muted-foreground">{user?.email || ''}</p>
          </div>
        </div>
      </div>

      {/* Menu */}
      <div className="px-6 space-y-2">
        <button
          onClick={() => navigate('/order-tracking')}
          className="w-full bg-card rounded-xl p-4 card-shadow flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <Truck size={18} strokeWidth={1.5} className="text-muted-foreground" />
            <span className="text-sm text-foreground">Order Tracking</span>
          </div>
          <div className="flex items-center gap-2">
            {orderedCount > 0 && (
              <span className="text-[10px] bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-medium">
                {orderedCount}
              </span>
            )}
            <ChevronRight size={16} strokeWidth={1.5} className="text-muted-foreground" />
          </div>
        </button>

        <button
          onClick={() => navigate('/creations')}
          className="w-full bg-card rounded-xl p-4 card-shadow flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <Package size={18} strokeWidth={1.5} className="text-muted-foreground" />
            <span className="text-sm text-foreground">All Creations</span>
          </div>
          <ChevronRight size={16} strokeWidth={1.5} className="text-muted-foreground" />
        </button>

        <button
          onClick={handleSignOut}
          className="w-full bg-card rounded-xl p-4 card-shadow flex items-center gap-3"
        >
          <LogOut size={18} strokeWidth={1.5} className="text-muted-foreground" />
          <span className="text-sm text-foreground">Sign Out</span>
        </button>
      </div>
    </div>
  );
};

export default Account;
