import { AlertTriangle, Copy, Eye, EyeOff } from 'lucide-react';
import type { BookPhoto } from '@/types/book';

interface SmartCurationProps {
  photos: BookPhoto[];
  onRemove: (id: string) => void;
  onToggleHide: (id: string) => void;
  hiddenIds: Set<string>;
}

function detectIssues(photos: BookPhoto[]): BookPhoto[] {
  // Mock: flag some photos as low-res or duplicate
  return photos.map((p, i) => ({
    ...p,
    isLowRes: i % 7 === 0 && i > 0, // Every 7th photo is "low-res"
    isDuplicate: i > 2 && photos[i - 1]?.url === p.url, // Actual duplicates
  }));
}

const SmartCuration = ({ photos, onRemove, onToggleHide, hiddenIds }: SmartCurationProps) => {
  const analyzed = detectIssues(photos);
  const issues = analyzed.filter(p => p.isLowRes || p.isDuplicate);

  if (issues.length === 0) {
    return (
      <div className="bg-card rounded-xl p-4 card-shadow flex items-center gap-3">
        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
          <Eye size={14} className="text-primary" />
        </div>
        <p className="text-xs text-muted-foreground">All photos look great! No issues detected.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <AlertTriangle size={14} strokeWidth={1.5} className="text-destructive" />
        <p className="text-xs text-muted-foreground font-medium">
          {issues.length} issue{issues.length !== 1 ? 's' : ''} found
        </p>
      </div>

      {issues.map(photo => (
        <div key={photo.id} className="bg-card rounded-xl p-3 card-shadow flex items-center gap-3 animate-fade-in">
          <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 relative">
            <img src={photo.url} alt="" className={`w-full h-full object-cover ${hiddenIds.has(photo.id) ? 'opacity-30' : ''}`} />
          </div>
          <div className="flex-1">
            {photo.isLowRes && (
              <p className="text-[11px] text-destructive font-medium">Low resolution</p>
            )}
            {photo.isDuplicate && (
              <div className="flex items-center gap-1">
                <Copy size={10} className="text-muted-foreground" />
                <p className="text-[11px] text-muted-foreground">Possible duplicate</p>
              </div>
            )}
          </div>
          <button
            onClick={() => onToggleHide(photo.id)}
            className="p-2 text-muted-foreground hover:text-foreground"
          >
            {hiddenIds.has(photo.id) ? <EyeOff size={14} strokeWidth={1.5} /> : <Eye size={14} strokeWidth={1.5} />}
          </button>
        </div>
      ))}
    </div>
  );
};

export default SmartCuration;
