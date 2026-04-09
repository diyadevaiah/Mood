export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  createdAt: string;
  lastLogin: string;
  preferences?: {
    theme: 'light' | 'dark' | 'system';
    notifications: boolean;
  };
}

export type MoodType = 'happy' | 'sad' | 'tired' | 'stressed' | 'calm' | 'energetic';
export type MoodSource = 'face' | 'voice' | 'text' | 'manual';

export interface MoodEntry {
  id?: string;
  userId: string;
  timestamp: any; // Firestore Timestamp
  mood: MoodType;
  source: MoodSource;
  confidence: number;
  note?: string;
  aiSuggestions?: string[];
}
