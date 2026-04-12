import { useNavigate } from 'react-router-dom';
import { useBooks } from '@/context/BookContext';
import { BookOpen, MoreHorizontal, Trash2, RotateCcw, ChevronRight } from 'lucide-react';
import { useState } from 'react';

type Filter = 'all' | 'draft' | 'ordered' | 'delivered';

const STATUS_LABEL: Record<string, string> = {
  draft: 'Draft',
  completed: 'Completed',
  ordered: 'Printing',
  archived: 'Delivered',
};

const STATUS_COLOR: Record<string, string> = {
  draft: 'text-[#999]',
  completed: 'text-[#007aff]',
  ordered: 'text-[#ff991a]',
  archived: 'text-[#33bf66]',
};

const Creations = () => {
  const { projects, deleteProject } = useBooks();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>('all');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const filtered = projects.filter(p => {
    if (filter === 'all') return true;
    if (filter === 'draft') return p.status === 'draft' || p.status === 'completed';
    if (filter === 'ordered') return p.status === 'ordered';
    if (filter === 'delivered') return p.status === 'archived';
    return true;
  });

  const tabs: { key: Filter; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'draft', label: 'Drafts' },
    { key: 'ordered', label: 'Ordered' },
    { key: 'delivered', label: 'Delivered' },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="flex items-center justify-center px-6 pt-14 pb-4 border-b border-border">
        <h1 className="text-[17px] font-semibold text-foreground">My Books</h1>
      </header>

      {/* Filter tabs */}
      <div className="flex gap-2 px-2 py-2 border-b border-border overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`flex-shrink-0 h-7 px-5 rounded-lg text-[12px] font-medium transition-colors ${
              filter === tab.key
                ? 'bg-[#007aff] text-white'
                : 'bg-[#f7f7f7] text-[#666] hover:bg-muted'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center pt-20 px-8 animate-fade-in">
          <BookOpen size={32} strokeWidth={1.2} className="text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground">No books yet</p>
        </div>
      ) : (
        <div className="px-4 pt-3 space-y-3">
          {filtered.map(project => (
            <div
              key={project.id}
              className="bg-card rounded-[12px] border border-border flex items-center gap-0 animate-fade-in relative"
            >
              <button
                onClick={() => navigate(project.status === 'ordered' ? '/preview/' + project.id : '/editor/' + project.id)}
                className="flex items-center gap-3 flex-1 text-left p-3"
              >
                {/* Cover */}
                <div className="w-[80px] h-[80px] rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  {project.coverPhoto ? (
                    <img src={project.coverPhoto} alt={project.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-[#e0f7f5] flex items-center justify-center">
                      <BookOpen size={20} strokeWidth={1.2} className="text-[#2eccb2]" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-[16px] font-semibold text-foreground truncate">{project.title}</p>
                  <p className="text-[12px] text-muted-foreground mt-0.5">
                    {project.pages.length} pages
                    {project.paperFinish ? ` · ${project.paperFinish.charAt(0).toUpperCase() + project.paperFinish.slice(1)}` : ''}
                    {' · '}{STATUS_LABEL[project.status] ?? project.status}
                  </p>
                  <div className="mt-1.5">
                    <span className={`text-[11px] font-medium bg-[#f7f7f7] px-2 py-0.5 rounded ${STATUS_COLOR[project.status] ?? 'text-muted-foreground'}`}>
                      {STATUS_LABEL[project.status] ?? project.status}
                    </span>
                  </div>
                </div>
              </button>

              {/* Chevron / more menu */}
              <div className="pr-3 flex items-center">
                <button
                  onClick={() => setMenuOpen(menuOpen === project.id ? null : project.id)}
                  className="p-2 text-[#d9d9d9]"
                >
                  <MoreHorizontal size={18} strokeWidth={1.5} />
                </button>
              </div>

              {menuOpen === project.id && (
                <div className="absolute right-4 top-14 bg-background rounded-xl border border-border shadow-lg p-1 z-10 animate-scale-in">
                  {project.status === 'ordered' && (
                    <button
                      onClick={() => { navigate('/checkout/' + project.id); setMenuOpen(null); }}
                      className="flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-muted rounded-lg w-full"
                    >
                      <RotateCcw size={14} strokeWidth={1.5} /> Reorder
                    </button>
                  )}
                  <button
                    onClick={() => { deleteProject(project.id); setMenuOpen(null); }}
                    className="flex items-center gap-2 px-3 py-2 text-xs text-destructive hover:bg-destructive/10 rounded-lg w-full"
                  >
                    <Trash2 size={14} strokeWidth={1.5} /> Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Creations;
