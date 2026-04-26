import { ZoneData } from "./types";

export interface Stadium {
  id: string;
  name: string;
  city: string;
  country: string;
  flag?: string;
  capacity: number;
  coordinates: { lat: number; lng: number };
  established?: number;
  homeTeam?: string;
  ends?: string[];
  floodlights: boolean;
  match_schedule?: Array<{ type: string; time: string; status: string; time_of_day?: string }>;
  image?: string;
  zones?: ZoneData[];
  layout?: {
    pitch: { rx: number; ry: number };
    stands: { id: string; label: string; path: string; color?: string }[];
    gates: { id: string; cx: number; cy: number; label: string }[];
    food: { id: string; x: number; y: number; label: string }[];
  };
}

// Default stadium is ACA-VDCA Vizag
export const DEFAULT_STADIUM_ID = 'aca-vdca';

export const STADIUMS: Stadium[] = []; // Will be populated from backend
