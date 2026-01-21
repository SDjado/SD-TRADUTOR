
export enum UrgencyLevel {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
  CRITICAL = 'Critical'
}

export interface DocumentSummary {
  type: string;
  sender: string;
  dueDate?: string;
  value?: string;
  urgency: UrgencyLevel;
  briefExplanation: string;
  requiredActions: string[];
}

export interface SavedDocument {
  id: string;
  timestamp: number;
  image: string;
  summary: DocumentSummary;
  originalLanguage: string;
  targetLanguage: string;
}

export interface AppState {
  view: 'home' | 'camera' | 'processing' | 'result';
  currentImage?: string;
  currentSummary?: DocumentSummary;
  history: SavedDocument[];
  targetLanguage: string;
}

export const SUPPORTED_LANGUAGES = [
  { code: 'pt', name: 'Português', flag: '🇧🇷' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' },
  { code: 'zh', name: 'Mandarin', flag: '🇨🇳' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'uk', name: 'Ukrainian', flag: '🇺🇦' },
];
