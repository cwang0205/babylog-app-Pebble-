export enum EventType {
  FEED = 'feed',
  SLEEP = 'sleep',
  DIAPER = 'diaper',
  SYMPTOM = 'symptom',
  MOVEMENT = 'movement',
  MEASUREMENT = 'measurement',
  NOTE = 'note'
}

export enum Gender {
  BOY = 'boy',
  GIRL = 'girl'
}

export interface BabyProfile {
  id: string;
  name: string;
  birthDate: string; // ISO Date
  gender: Gender;
  weight?: number; // in kg
}

export interface BabyEvent {
  id: string;
  babyId: string;
  type: EventType;
  startTime: string; // ISO string
  endTime?: string; // ISO string (for sleep/feed duration)
  details: Record<string, any>; // Flexible payload based on type
  notes?: string;
  createdAt: string;
}

// Specific detail interfaces for type safety in UI
export interface FeedDetails {
  method: 'bottle' | 'breast';
  amountml?: number;
  side?: 'left' | 'right' | 'both';
}

export interface DiaperDetails {
  status: 'wet' | 'dirty' | 'mixed';
  color?: string;
  texture?: string;
}

export interface MeasurementDetails {
  type: 'weight' | 'height' | 'temperature';
  value: number;
  unit: string;
}

export type ParseResult = Omit<BabyEvent, 'id' | 'babyId' | 'createdAt'>;

export interface DashboardStats {
  totalSleep: number; // minutes
  totalFeed: number; // ml or count
  diaperCount: number;
}