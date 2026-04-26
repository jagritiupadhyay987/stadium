export interface LiveMatchContextData {
  score: string;
  battingTeam: string;
  crr: number;
  projectedScore: number;
  decibels: number;
  weather: {
    temp: number;
    condition: string;
    humidity: number;
  };
}

export type SeverityLevel = 'CRITICAL' | 'WARNING' | 'INFO' | 'NORMAL';
export type IncidentStatus = 'OPEN' | 'ACKNOWLEDGED' | 'DISPATCHED' | 'RESOLVED';

export interface Alert {
  id: string;
  type: string;
  severity: SeverityLevel;
  location: string;
  time: string;
  description: string;
  recommendation: string;
  status: IncidentStatus;
}

export interface ZoneData {
  id: string;
  name: string;
  type: 'GATE' | 'STAND' | 'FB_COURT' | 'CONCOURSE' | 'PARKING' | 'RESTROOM';
  capacity: number;
  currentAttendance: number;
  density: number; // 0 to 1
  waitTimeMin?: number;
  status: 'GREEN' | 'YELLOW' | 'RED' | 'BLACK';
}

export interface PredictiveEvent {
  id: string;
  time: string;
  title: string;
  action: string;
  type: 'warning' | 'action' | 'info';
}

export interface SystemHealth {
  latencyMs: number;
  uptime: number;
  modelInferenceMs: number;
  status: 'Healthy' | 'Degraded';
}
