export interface BookPhoto {
  id: string;
  url: string;
  storagePath?: string;
  file?: File;
  isLowRes?: boolean;
  isDuplicate?: boolean;
}

export type PageLayout =
  // Photos Only
  | 'full-bleed'           // 1 photo — edge to edge, no margin
  | 'single-bordered'      // 1 photo — centered with white margin
  | 'two-stacked'          // 2 photos — stacked vertically
  | 'two-side'             // 2 photos — side by side
  | 'three-mixed'          // 3 photos — 1 large top + 2 small bottom
  | 'four-grid'            // 4 photos — 2×2 grid
  | 'five-collage'         // 5 photos — 2 top + 3 bottom
  // Photos & Text
  | 'photo-caption-below'  // photo (~70%) + caption text below
  | 'photo-caption-above'  // caption text above + photo below
  | 'text-left-photo-right'// text on left + photo on right
  | 'photo-left-text-right'// photo on left + text on right
  // Text Only
  | 'text-only'            // centered title + subtitle + divider
  // Cover
  | 'cover'                // full-bleed photo + title overlay at bottom
  // Legacy aliases
  | '1-up'                 // → full-bleed
  | '2-up'                 // → two-side
  | '3-up';                // → three-mixed

/** How many photos a given layout requires */
export const LAYOUT_PHOTO_COUNT: Record<PageLayout, number> = {
  'full-bleed': 1,
  'single-bordered': 1,
  'two-stacked': 2,
  'two-side': 2,
  'three-mixed': 3,
  'four-grid': 4,
  'five-collage': 5,
  'photo-caption-below': 1,
  'photo-caption-above': 1,
  'text-left-photo-right': 1,
  'photo-left-text-right': 1,
  'text-only': 0,
  'cover': 1,
  '1-up': 1,
  '2-up': 2,
  '3-up': 3,
};

export type PaperFinish = 'matte' | 'glossy' | 'layflat';

export type BookStyle = 'classic' | 'baby' | 'yearbook' | 'wedding' | 'travel' | 'minimal';

export interface BookPage {
  id: string;
  layout: PageLayout;
  photos: BookPhoto[];
  caption?: string;
}

export interface Collaborator {
  id: string;
  name: string;
  email: string;
  photosAdded: number;
  joinedAt: string;
}

export interface BookProject {
  id: string;
  title: string;
  coverPhoto?: string;
  pages: BookPage[];
  status: 'draft' | 'completed' | 'ordered' | 'archived';
  createdAt: string;
  updatedAt: string;
  paperFinish?: PaperFinish;
  style?: BookStyle;
  giftNote?: string;
  collaborators?: Collaborator[];
  shareLink?: string;
  aiPrompt?: string;
}

export interface OrderItem {
  id: string;
  bookId: string;
  bookTitle: string;
  pageCount: number;
  pricePerPage: number;
  deliveryFee: number;
  total: number;
  status: 'processing' | 'printed' | 'shipped' | 'delivered';
  orderedAt: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
}

export const PAPER_FINISHES: { value: PaperFinish; label: string; description: string }[] = [
  { value: 'matte', label: 'Matte', description: 'Soft, non-reflective finish' },
  { value: 'glossy', label: 'Glossy', description: 'Vibrant, high-shine finish' },
  { value: 'layflat', label: 'Lay-Flat', description: 'Pages lie completely flat (+£3)' },
];

export const BOOK_STYLES: { value: BookStyle; label: string; emoji: string }[] = [
  { value: 'classic', label: 'Classic', emoji: '📖' },
  { value: 'baby', label: 'Baby Book', emoji: '👶' },
  { value: 'yearbook', label: 'Year Book', emoji: '📅' },
  { value: 'wedding', label: 'Wedding', emoji: '💍' },
  { value: 'travel', label: 'Travel', emoji: '✈️' },
  { value: 'minimal', label: 'Minimal', emoji: '◻️' },
];

export const AI_PROMPTS: { prompt: string; label: string }[] = [
  { prompt: 'Minimalist wedding album with elegant white space', label: 'Elegant Wedding' },
  { prompt: 'Colorful baby milestone book with playful layouts', label: 'Baby Milestones' },
  { prompt: 'Cinematic travel journal with full-bleed photos', label: 'Travel Journal' },
  { prompt: 'Modern yearbook with clean grid layouts', label: 'Year in Review' },
  { prompt: 'Cozy family memories with warm tones', label: 'Family Memories' },
];
