import { useState, useEffect, useMemo } from "react";
import { Users, Clock, AlertOctagon, Globe, TrendingUp, Mic } from "lucide-react";
import { currentMetrics } from "../data";
import { cn } from "../lib/utils";
import { motion } from "motion/react";
import { useStadium } from "../StadiumContext";

export function KPICards() {
  const { selectedStadium, stadiums } = useStadium();
  
  const totalCapacity = selectedStadium?.capacity || currentMetrics.attendanceCapacity;
  const initialAttendance = selectedStadium?.zones?.reduce((sum, z) => sum + z.currentAttendance, 0) || currentMetrics.attendanceTotal;

  const [attendance, setAttendance] = useState(initialAttendance);
  const [voiceStats, setVoiceStats] = useState<any>(null);

  useEffect(() => {
    const API_BASE = ((import.meta as any).env?.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:8000";
    fetch(`${API_BASE}/api/v1/voice/analytics`)
      .then((response) => response.json())
      .then((data) => setVoiceStats(data))
      .catch(() => setVoiceStats(null));
  }, []);

  useEffect(() => {
    setAttendance(initialAttendance);
  }, [initialAttendance]);

  useEffect(() => {
    const interval = setInterval(() => {
      const change = Math.floor(Math.random() * 9) - 2; 
      setAttendance(prev => {
        const next = prev + change;
        return Math.min(Math.max(next, 0), totalCapacity);
      });
    }, 2500);
    return () => clearInterval(interval);
  }, [totalCapacity]);

  const pct = Math.round((attendance / totalCapacity) * 100);

  // Comparison logic
  const otherStadiums = useMemo(() => {
    if (!stadiums || stadiums.length === 0) return [];
    return stadiums
      .filter(s => s.id !== selectedStadium?.id)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);
  }, [stadiums, selectedStadium]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 p-4 border-b border-white/10 bg-[#0A1628]/50">
      
      {/* Attendance & Comparison */}
      <div className="bg-[#112240] rounded-xl p-4 border border-white/5 flex flex-col gap-2 relative overflow-hidden group">
        <div className="flex items-center justify-between text-white/60">
          <span className="text-sm font-medium uppercase tracking-wider flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00E676] animate-pulse relative top-[0.5px]"></span>
            Live Attendance
          </span>
          <Users className="w-4 h-4" />
        </div>
        <div className="flex items-end gap-2">
          <span className="text-3xl font-bold font-sans">{attendance.toLocaleString()}</span>
          <span className="text-sm mb-1 text-white/50 font-mono">/ {Math.round(totalCapacity / 1000)}k</span>
        </div>
        
        {/* Comparison mini-view on hover */}
        <div className="mt-1">
          <div className="w-full bg-[#0A1628] h-1.5 rounded-full overflow-hidden relative">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="bg-[#00E676] h-full" 
            />
          </div>
          <div className="flex justify-between mt-2 text-[10px] font-mono text-white/30">
            <span>{pct}% OCCUPANCY</span>
            <span className="text-[#00E676] flex items-center gap-0.5">
              <TrendingUp className="w-2.5 h-2.5" /> +2.4% vs AVG
            </span>
          </div>
        </div>
      </div>

      {/* Network Comparison */}
      <div className="bg-[#112240] rounded-xl p-4 border border-white/5 flex flex-col gap-2">
        <div className="flex items-center justify-between text-white/60">
          <span className="text-sm font-medium uppercase tracking-wider flex items-center gap-1">
            <Globe className="w-3.5 h-3.5" /> Network Status
          </span>
          <span className="text-[10px] font-bold text-[#00E676] bg-[#00E676]/10 px-1.5 py-0.5 rounded">LIVE</span>
        </div>
        <div className="flex flex-col gap-2 mt-1">
          {otherStadiums.map(s => (
            <div key={s.id} className="flex items-center justify-between text-[11px]">
              <span className="text-white/60 truncate max-w-[100px]">{s.name}</span>
              <div className="flex items-center gap-2">
                <div className="w-16 bg-[#0A1628] h-1 rounded-full overflow-hidden">
                  <div className="bg-[#29B6F6] h-full" style={{ width: `${Math.floor(Math.random() * 40 + 40)}%` }} />
                </div>
                <span className="text-white/40 font-mono w-6 text-right">{Math.floor(Math.random() * 40 + 40)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Avg Wait */}
      <div className="bg-[#112240] rounded-xl p-4 border border-white/5 flex flex-col gap-2">
        <div className="flex items-center justify-between text-white/60">
          <span className="text-sm font-medium uppercase tracking-wider">Avg Wait</span>
          <Clock className="w-4 h-4" />
        </div>
        <div className="grid grid-cols-2 gap-2 mt-1">
          <div>
            <div className="text-xs text-white/50 mb-1 leading-none">Entry</div>
            <div className="text-2xl font-bold font-mono text-[#00E676] flex items-center gap-1">
              {currentMetrics.avgWaitEntry}m
            </div>
          </div>
          <div>
            <div className="text-xs text-white/50 mb-1 leading-none">Food</div>
            <div className="text-2xl font-bold font-mono text-[#FFD600]">{currentMetrics.avgWaitFB}m</div>
          </div>
        </div>
      </div>

      {/* Incidents */}
      <div className={cn("bg-[#112240] rounded-xl p-4 border flex flex-col gap-2 transition-colors", 
        currentMetrics.activeIncidents > 0 ? "border-[#FF1744]/40 bg-[#FF1744]/5" : "border-white/5"
      )}>
        <div className="flex items-center justify-between text-white/60">
          <span className="text-sm font-medium uppercase tracking-wider">Incidents</span>
          <AlertOctagon className={cn("w-4 h-4", currentMetrics.activeIncidents > 0 ? "text-[#FF1744]" : "")} />
        </div>
        <div className="flex items-end gap-2 mt-1">
          <span className={cn("text-3xl font-bold font-sans", currentMetrics.activeIncidents > 0 ? "text-[#FF1744]" : "")}>
            {currentMetrics.activeIncidents}
          </span>
          <span className="text-sm mb-1 text-[#FF1744]/80 font-medium tracking-wide">Critical</span>
        </div>
      </div>

      {/* Voice Guidance Analytics */}
      <div className={cn("bg-[#112240] rounded-xl p-4 border flex flex-col gap-2", voiceStats?.overload_alert ? "border-[#FF1744]/60" : "border-white/5")}>
        <div className="flex items-center justify-between text-white/60">
          <span className="text-sm font-medium uppercase tracking-wider">Voice Guidance</span>
          <Mic className={cn("w-4 h-4", voiceStats?.overload_alert ? "text-[#FF1744]" : "text-[#29B6F6]")} />
        </div>
        <div className="text-2xl font-bold">{voiceStats?.active_voice_users ?? "--"}</div>
        <div className="text-xs text-white/50">Fans using voice navigation</div>
        <div className="text-[10px] text-white/40 uppercase tracking-widest">
          Top cmd: {voiceStats?.most_common_commands?.[0]?.command ?? "n/a"}
        </div>
        <div className="text-[10px] text-white/40 uppercase tracking-widest">
          N-Stand completion: {Math.round((voiceStats?.completion_rate_per_stand?.["N-Stand"] ?? 0.89) * 100)}%
        </div>
      </div>
    </div>
  );
}
