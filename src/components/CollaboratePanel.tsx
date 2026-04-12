import { useState } from 'react';
import { Link2, Copy, Check, UserPlus, Users } from 'lucide-react';
import type { Collaborator } from '@/types/book';

interface CollaboratePanelProps {
  shareLink?: string;
  collaborators: Collaborator[];
  onGenerateLink: () => Promise<string>;
  onAddCollaborator: (name: string, email: string) => void;
}

const CollaboratePanel = ({ shareLink, collaborators, onGenerateLink, onAddCollaborator }: CollaboratePanelProps) => {
  const [link, setLink] = useState(shareLink || '');
  const [copied, setCopied] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const handleGenerateLink = async () => {
    const newLink = await onGenerateLink();
    setLink(newLink);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAdd = () => {
    if (name && email) {
      onAddCollaborator(name, email);
      setName('');
      setEmail('');
      setShowAdd(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Users size={16} strokeWidth={1.5} className="text-primary" />
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Collaborate</p>
      </div>

      {/* Share Link */}
      {!link ? (
        <button
          onClick={handleGenerateLink}
          className="w-full bg-card rounded-xl p-4 card-shadow flex items-center gap-3 hover:bg-accent transition-colors"
        >
          <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
            <Link2 size={18} strokeWidth={1.5} className="text-muted-foreground" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-foreground">Create Share Link</p>
            <p className="text-[11px] text-muted-foreground">Invite others to contribute photos</p>
          </div>
        </button>
      ) : (
        <div className="bg-card rounded-xl p-4 card-shadow">
          <p className="text-[11px] text-muted-foreground mb-2">Share this link with contributors:</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-10 px-3 bg-muted rounded-lg flex items-center">
              <p className="text-xs text-foreground truncate">{link}</p>
            </div>
            <button
              onClick={handleCopy}
              className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center"
            >
              {copied ? <Check size={16} className="text-primary-foreground" /> : <Copy size={16} className="text-primary-foreground" />}
            </button>
          </div>
        </div>
      )}

      {/* Collaborators list */}
      {collaborators.length > 0 && (
        <div className="space-y-2">
          <p className="text-[11px] text-muted-foreground">{collaborators.length} contributor{collaborators.length !== 1 ? 's' : ''}</p>
          {collaborators.map(c => (
            <div key={c.id} className="flex items-center gap-3 bg-card rounded-lg p-3 card-shadow">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-primary">{c.name[0]}</span>
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-foreground">{c.name}</p>
                <p className="text-[10px] text-muted-foreground">{c.photosAdded} photos added</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add collaborator */}
      {!showAdd ? (
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 text-xs text-primary font-medium"
        >
          <UserPlus size={14} strokeWidth={1.5} /> Add contributor manually
        </button>
      ) : (
        <div className="bg-card rounded-xl p-4 card-shadow space-y-3 animate-fade-in">
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Name"
            className="w-full h-10 px-3 bg-muted rounded-lg text-sm text-foreground focus:outline-none"
          />
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full h-10 px-3 bg-muted rounded-lg text-sm text-foreground focus:outline-none"
          />
          <button
            onClick={handleAdd}
            disabled={!name || !email}
            className="w-full h-10 bg-primary text-primary-foreground rounded-lg text-xs font-medium disabled:opacity-30"
          >
            Add Contributor
          </button>
        </div>
      )}
    </div>
  );
};

export default CollaboratePanel;
