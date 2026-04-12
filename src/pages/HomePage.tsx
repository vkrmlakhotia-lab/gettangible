import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBooks } from '@/context/BookContext';
import { useAuth } from '@/context/AuthContext';
import { Gift } from 'lucide-react';
import SignInSheet from '@/components/SignInSheet';

const HomePage = () => {
  const { projects } = useBooks();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [showSignIn, setShowSignIn] = useState(false);
  const isReturningUnauthenticated =
    !isAuthenticated &&
    localStorage.getItem('hasSignedInBefore') === 'true';

  const activeProjects = projects.filter(p => p.status !== 'archived');
  const firstName = user?.user_metadata?.full_name?.split(' ')[0]
    || user?.user_metadata?.name?.split(' ')[0]
    || 'there';

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  // ── Empty state (SG-8) ─────────────────────────────────────────────────────
  if (activeProjects.length === 0) {
    return (
      <div className="min-h-screen bg-background pb-24">
        {/* Sign-back-in banner for returning unauthenticated users */}
        {isReturningUnauthenticated && (
          <div className="mx-4 mt-4 bg-[#43aa8b]/10 border border-[#43aa8b]/30 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
            <p className="text-sm text-[#43aa8b] font-medium leading-snug">
              Sign back in to access your books
            </p>
            <button
              onClick={() => setShowSignIn(true)}
              className="text-sm font-semibold text-white bg-[#43aa8b] px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity flex-shrink-0"
            >
              Sign in
            </button>
          </div>
        )}
        <header className="flex items-center justify-center px-6 pt-14 pb-4 border-b border-border">
          <h1 className="text-[17px] font-semibold text-foreground">My Books</h1>
        </header>

        <div className="px-4 pt-6 animate-fade-in">
          <p className="text-[22px] font-semibold text-foreground">Welcome, {firstName} 👋</p>
          <p className="text-[14px] text-muted-foreground mt-1">Let's create your first book</p>

          {/* Illustration */}
          <div className="mt-6 mx-8 bg-[#e0f7f5] rounded-[20px] h-[168px] flex flex-col items-center justify-center">
            <span className="text-[52px]">📚</span>
            <p className="text-[14px] text-[#666] mt-2">No books yet</p>
          </div>

          {/* 3 steps */}
          <p className="text-[15px] font-medium text-foreground mt-8 mb-3">Your first book in 3 steps</p>
          {[
            'Choose a style & paper finish',
            'Pick your favourite photos',
            'Review, then order — delivered in 5-7 days',
          ].map((text, i) => (
            <div key={i} className="flex items-center gap-3 bg-card rounded-[10px] border border-border px-4 h-[46px] mb-2">
              <div className="w-[22px] h-[22px] bg-[#e0f7f5] rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-[12px] font-bold text-[#2eccb2]">{i + 1}</span>
              </div>
              <p className="text-[13px] text-foreground">{text}</p>
            </div>
          ))}

          {/* Main CTA */}
          <button
            onClick={() => navigate('/create')}
            className="w-full mt-6 bg-[#2eccb2] rounded-[16px] py-5 flex flex-col items-center hover:opacity-90 transition-opacity"
          >
            <p className="text-[18px] font-semibold text-white">Create My First Book</p>
            <p className="text-[12px] text-[#b2f2ed] mt-1">Takes about 2 minutes · From £24</p>
          </button>

          {/* Social proof */}
          <div className="mt-4 bg-[#f7f7f7] rounded-[10px] px-4 py-3">
            <p className="text-[11px] text-[#666]">⭐⭐⭐⭐⭐ "My mum cried when she opened it"</p>
            <p className="text-[10px] text-muted-foreground mt-1">— Sarah, London</p>
          </div>
        </div>
        <SignInSheet isOpen={showSignIn} onClose={() => setShowSignIn(false)} />
      </div>
    );
  }

  // ── Main state (04 / GIFT-1) ───────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Sign-back-in banner for returning unauthenticated users */}
      {isReturningUnauthenticated && (
        <div className="mx-4 mt-4 bg-[#43aa8b]/10 border border-[#43aa8b]/30 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
          <p className="text-sm text-[#43aa8b] font-medium leading-snug">
            Sign back in to access your books
          </p>
          <button
            onClick={() => setShowSignIn(true)}
            className="text-sm font-semibold text-white bg-[#43aa8b] px-3 py-1.5 rounded-lg hover:opacity-90 transition-opacity flex-shrink-0"
          >
            Sign in
          </button>
        </div>
      )}
      <header className="flex items-center justify-center px-6 pt-14 pb-4 border-b border-border">
        <h1 className="text-[17px] font-semibold text-foreground">My Books</h1>
      </header>

      <div className="px-4 pt-5">
        <p className="text-[20px] font-semibold text-foreground">{greeting}, {firstName} 👋</p>
        <p className="text-[13px] text-muted-foreground mt-1">
          {activeProjects.length} book{activeProjects.length !== 1 ? 's' : ''} in progress
        </p>

        {/* Create new book CTA */}
        <button
          onClick={() => navigate('/create')}
          className="w-full mt-4 bg-[#e5f5ff] border-[1.5px] border-[#007aff] rounded-[14px] px-4 py-4 text-left hover:opacity-90 transition-opacity"
        >
          <p className="text-[15px] font-semibold text-[#007aff]">+ Create a new book</p>
          <p className="text-[12px] text-[#007aff]/80 mt-0.5">From your Apple Photos</p>
        </button>

        {/* Gift a book CTA */}
        <button
          onClick={() => navigate('/gift')}
          className="w-full mt-3 bg-[#f5ebff] border-[1.5px] border-[#8033d9] rounded-[14px] px-4 py-4 flex items-center gap-3 hover:opacity-90 transition-opacity"
        >
          <div className="w-8 h-8 bg-[#8033d9] rounded-lg flex items-center justify-center flex-shrink-0">
            <Gift size={16} strokeWidth={1.5} className="text-white" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-[15px] font-semibold text-[#8033d9]">Gift a book to someone</p>
            <p className="text-[12px] text-[#804dbf] mt-0.5">From £24 · they just pay shipping</p>
          </div>
          <span className="text-[#8033d9] text-lg">→</span>
        </button>

        {/* Book list */}
        <p className="text-[15px] font-semibold text-foreground mt-6 mb-3">Your books</p>
        <div className="space-y-3">
          {activeProjects.map(project => (
            <button
              key={project.id}
              onClick={() => navigate('/editor/' + project.id)}
              className="w-full bg-card rounded-[12px] border border-border p-3 flex items-center gap-4 text-left hover:bg-accent transition-colors animate-fade-in"
            >
              {/* Cover thumb */}
              <div className="w-[76px] h-[76px] rounded-lg overflow-hidden bg-muted flex-shrink-0">
                {project.coverPhoto ? (
                  <img src={project.coverPhoto} alt={project.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-[#e0f7f5] flex items-center justify-center">
                    <span className="text-2xl">📷</span>
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-foreground truncate">{project.title}</p>
                <p className="text-[12px] text-muted-foreground mt-0.5">
                  {project.pages.length} pages · {project.status === 'draft' ? 'Draft' : project.status === 'ordered' ? 'Ordered' : 'Completed'}
                </p>
                <div className="mt-2 inline-flex">
                  <span className="bg-[#e0f7f5] text-[#2eccb2] text-[11px] font-medium px-3 py-0.5 rounded-md">
                    {project.status === 'ordered' ? 'View order' : 'Continue'}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
      <SignInSheet isOpen={showSignIn} onClose={() => setShowSignIn(false)} />
    </div>
  );
};

export default HomePage;
