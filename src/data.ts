import { Alert, PredictiveEvent, SystemHealth, ZoneData } from "./types";

export const mockZones: ZoneData[] = [
  { id: 'gate_1', name: 'Gate 1 (North)', type: 'GATE', capacity: 2000, currentAttendance: 1200, density: 0.6, waitTimeMin: 4, status: 'GREEN' },
  { id: 'gate_3', name: 'Gate 3 (East)', type: 'GATE', capacity: 1500, currentAttendance: 800, density: 0.53, waitTimeMin: 2, status: 'GREEN' },
  { id: 'gate_7', name: 'Gate 7 (South)', type: 'GATE', capacity: 2500, currentAttendance: 2300, density: 0.92, waitTimeMin: 18, status: 'RED' },
  { id: 'stand_a', name: 'Stand A', type: 'STAND', capacity: 5000, currentAttendance: 4800, density: 0.96, status: 'RED' },
  { id: 'stand_c', name: 'Stand C', type: 'STAND', capacity: 4000, currentAttendance: 2500, density: 0.62, status: 'YELLOW' },
  { id: 'fb_south', name: 'F&B South Court', type: 'FB_COURT', capacity: 800, currentAttendance: 750, density: 0.94, waitTimeMin: 16, status: 'RED' },
  { id: 'fb_north', name: 'F&B North Court', type: 'FB_COURT', capacity: 1000, currentAttendance: 300, density: 0.30, waitTimeMin: 3, status: 'GREEN' },
  { id: 'rr_east', name: 'Restroom East', type: 'RESTROOM', capacity: 80, currentAttendance: 78, density: 0.98, waitTimeMin: 12, status: 'RED' },
  { id: 'rr_west', name: 'Restroom West', type: 'RESTROOM', capacity: 80, currentAttendance: 20, density: 0.25, waitTimeMin: 0, status: 'GREEN' },
  { id: 'con_main', name: 'Main Concourse', type: 'CONCOURSE', capacity: 3000, currentAttendance: 2600, density: 0.86, status: 'YELLOW' },
  { id: 'con_west', name: 'West Concourse', type: 'CONCOURSE', capacity: 1500, currentAttendance: 400, density: 0.26, status: 'GREEN' },
];

export const mockAlerts: Alert[] = [
  {
    id: 'inc_001',
    type: 'OVERCROWDING',
    severity: 'CRITICAL',
    location: 'Gate 7',
    time: '15:28',
    description: 'Gate 7 is predicted to reach critical density in 8 mins.',
    recommendation: 'Open auxiliary Gate 7B and deploy 4 stewards. Redirect via WhatsApp.',
    status: 'OPEN'
  },
  {
    id: 'inc_002',
    type: 'WAIT_TIME',
    severity: 'WARNING',
    location: 'F&B South',
    time: '15:32',
    description: 'Queue length exceeding 15 mins.',
    recommendation: 'Deploy 2 additional staff to Counters 4 & 5.',
    status: 'ACKNOWLEDGED'
  },
  {
    id: 'inc_003',
    type: 'NORMAL_FLOW',
    severity: 'INFO',
    location: 'Gate 3',
    time: '15:35',
    description: 'Flow normal. Average wait time < 3 mins.',
    recommendation: 'Maintain current staffing.',
    status: 'RESOLVED'
  }
];

export const mockTimeline: PredictiveEvent[] = [
  { id: 'te01', time: '15:30', title: 'Innings Break Warning', action: 'Prepare F&B Staff', type: 'warning' },
  { id: 'te02', time: '15:45', title: 'Predicted F&B Surge', action: 'Deploy 8 F&B Staff to East Court', type: 'action' },
  { id: 'te03', time: '16:15', title: 'Pre-Exit Routine Starts', action: 'Send optimal exit route to Stand C', type: 'info' },
  { id: 'te04', time: '17:00', title: 'Peak Exit Wave', action: 'Open all exterior gates', type: 'action' },
];

export const currentMetrics = {
  attendanceTotal: 18432,
  attendanceCapacity: 22000,
  avgWaitEntry: 4,
  avgWaitFB: 11,
  activeIncidents: 2,
  exitForecastMin: 28
};

export const sysHealth: SystemHealth = {
  latencyMs: 142,
  uptime: 99.98,
  modelInferenceMs: 1240,
  status: 'Healthy'
};

export const liveContext = {
  score: "145/3 (12.4)",
  battingTeam: "Vizag Titans",
  crr: 11.45,
  projectedScore: 212,
  decibels: 102,
  weather: {
    temp: 28,
    condition: "Clear",
    humidity: 60
  }
};
