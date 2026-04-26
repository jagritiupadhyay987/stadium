import { useState, useEffect } from "react";
import { AlertOctagon, CheckCircle2 } from "lucide-react";
import { mockAlerts } from "../data";
import { Alert } from "../types";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";

const getSeverityColor = (sev: string) => {
  switch(sev) {
    case 'CRITICAL': return 'border-[#FF1744] bg-[#FF1744]/10 text-[#FF1744]';
    case 'WARNING': return 'border-[#FFD600] bg-[#FFD600]/10 text-[#FFD600]';
    case 'INFO': return 'border-[#29B6F6] bg-[#29B6F6]/10 text-[#29B6F6]';
    default: return 'border-white/20 bg-white/5 text-white';
  }
};

const DYNAMIC_ALERTS: Partial<Alert>[] = [
  {
    type: 'CROWD_SURGE',
    severity: 'WARNING',
    location: 'Concourse West',
    description: 'Sudden crowd movement detected. Possible bottleneck forming.',
    recommendation: 'Deploy crowd control team to disperse crowd towards North exits.',
  },
  {
    type: 'Medical',
    severity: 'CRITICAL',
    location: 'Stand C, Row 12',
    description: 'Medical emergency reported via Fan App.',
    recommendation: 'Dispatch Med-Team Alpha immediately. Clear pathway at Gate 4.',
  },
  {
    type: 'MAINTENANCE',
    severity: 'INFO',
    location: 'Restroom East',
    description: 'Restroom supplies low. Maintenance required.',
    recommendation: 'Notify Janitorial Staff Sector B.',
  }
];

export function AlertsPanel() {
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts);

  useEffect(() => {
    // Simulate real-time alerts
    let alertIndex = 0;
    const interval = setInterval(() => {
      if (alertIndex < DYNAMIC_ALERTS.length) {
        const newAlert = DYNAMIC_ALERTS[alertIndex];
        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        const alertToAdd: Alert = {
          id: `rt_inc_${Date.now()}`,
          type: newAlert.type as string,
          severity: newAlert.severity as any,
          location: newAlert.location as string,
          time: timeStr,
          description: newAlert.description as string,
          recommendation: newAlert.recommendation as string,
          status: 'OPEN'
        };

        setAlerts(prev => [alertToAdd, ...prev]);
        alertIndex++;
      } else {
        clearInterval(interval);
      }
    }, 8000); // add a new alert every 8 seconds for demo purposes

    return () => clearInterval(interval);
  }, []);

  const criticalCount = alerts.filter(a => a.severity === 'CRITICAL' && a.status === 'OPEN').length;

  const handleAcknowledge = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'ACKNOWLEDGED' } : a));
  };

  return (
    <div className="bg-[#112240] rounded-xl border border-white/5 flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-white/5 flex items-center justify-between sticky top-0 bg-[#112240] z-10 rounded-t-xl">
        <h2 className="text-lg font-semibold tracking-tight text-white flex items-center gap-2">
          <AlertOctagon className={cn("w-5 h-5", criticalCount > 0 ? "text-[#FF1744] animate-pulse" : "text-[#00E676]")} />
          Active Incidents
        </h2>
        {criticalCount > 0 && (
          <span className="bg-[#ff1744]/20 text-[#FF1744] text-xs px-2 py-0.5 rounded font-mono font-bold animate-pulse">
            {criticalCount} CRITICAL
          </span>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        <AnimatePresence>
          {alerts.map((alert, idx) => (
            <motion.div 
              layout
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              key={alert.id} className={cn("p-4 rounded-lg border relative overflow-hidden group", getSeverityColor(alert.severity))}
            >
              {alert.severity === 'CRITICAL' && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#FF1744]"></div>
              )}
              
              <div className="flex justify-between items-start mb-2">
                <div className="flex gap-2 items-center">
                  <span className="font-bold text-sm tracking-wide">{alert.location}</span>
                  <span className="text-xs opacity-70 font-mono">{alert.time}</span>
                  {alert.id.startsWith('rt_') && alert.status === 'OPEN' && (
                    <span className="text-[9px] bg-white/20 px-1 rounded uppercase tracking-widest font-bold ml-2 animate-pulse">New</span>
                  )}
                </div>
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded border border-current">{alert.status}</span>
              </div>
              <p className="text-sm opacity-90 mb-3">{alert.description}</p>
              
              <div className="bg-[#0A1628]/50 p-2.5 rounded border border-white/5 mb-3 group-hover:bg-[#0A1628]/70 transition-colors">
                <span className="text-[10px] text-white/50 uppercase block mb-1">AI Recommendation</span>
                <p className="text-xs text-white/90">{alert.recommendation}</p>
              </div>
              
              {alert.status === 'OPEN' && (
                <button 
                  onClick={() => handleAcknowledge(alert.id)}
                  className="w-full py-2 bg-current hover:brightness-125 transition-all text-[#112240] font-bold text-xs rounded uppercase tracking-wider flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Dispatch & Acknowledge
                </button>
              )}
              {alert.status !== 'OPEN' && (
                <div className="text-xs opacity-60 flex items-center gap-1 uppercase tracking-widest">
                  <CheckCircle2 className="w-3 h-3" />
                  Acknowledged / In Progress
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
