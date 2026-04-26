import { useState } from "react";
import { MessageSquare, Users, Server, Check, Navigation, AlertTriangle } from "lucide-react";
import { sysHealth } from "../data";
import { cn } from "../lib/utils";

export function FooterPanels() {
  const [activeRole, setActiveRole] = useState<string | null>(null);

  const toggleRole = (role: string) => {
    setActiveRole(prev => prev === role ? null : role);
  };

  const roleNames: Record<string, string> = {
    'sec': 'Security',
    'med': 'Medical',
    'fb': 'F&B'
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 border-t border-white/10 bg-[#0A1628]/80">
      
      {/* Staff Positions */}
      <div className="bg-[#112240] rounded-lg p-3 border border-white/5 flex gap-4 items-center">
        <div className="bg-[#0A1628] p-3 rounded-md">
          <Users className="w-5 h-5 text-white/70" />
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-semibold uppercase tracking-wider">Staff Overview</h3>
            {activeRole && (
              <span className="text-[10px] bg-[#29B6F6]/20 text-[#29B6F6] px-2 py-0.5 rounded font-mono tracking-widest uppercase animate-pulse flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#29B6F6]"></div>
                Filtering Map
              </span>
            )}
          </div>
          <div className="flex gap-2 text-xs font-mono mb-2">
            <button 
              onClick={() => toggleRole('sec')}
              className={cn("px-2 py-1 rounded border transition-colors flex items-center gap-1.5 cursor-pointer", 
                activeRole === 'sec' ? "bg-white/10 border-[#FF1744]/50 text-white shadow-[0_0_10px_rgba(255,23,68,0.2)]" : 
                activeRole ? "bg-transparent border-transparent text-white/30 hover:text-white/50" : 
                "bg-transparent border-white/10 text-white/70 hover:bg-white/5 hover:border-white/20")}
            >
              <span className={cn("w-1.5 h-1.5 rounded-full", activeRole === 'sec' || !activeRole ? "bg-[#FF1744]" : "bg-white/20")}></span>
              <strong className={cn(activeRole === 'sec' || !activeRole ? "text-white" : "font-normal")}>24</strong> 
              <span>Sec</span>
            </button>
            
            <button 
              onClick={() => toggleRole('med')}
              className={cn("px-2 py-1 rounded border transition-colors flex items-center gap-1.5 cursor-pointer", 
                activeRole === 'med' ? "bg-white/10 border-[#00E676]/50 text-white shadow-[0_0_10px_rgba(0,230,118,0.2)]" : 
                activeRole ? "bg-transparent border-transparent text-white/30 hover:text-white/50" : 
                "bg-transparent border-white/10 text-white/70 hover:bg-white/5 hover:border-white/20")}
            >
              <span className={cn("w-1.5 h-1.5 rounded-full", activeRole === 'med' || !activeRole ? "bg-[#00E676]" : "bg-white/20")}></span>
              <strong className={cn(activeRole === 'med' || !activeRole ? "text-white" : "font-normal")}>12</strong> 
              <span>Med</span>
            </button>
            
            <button 
              onClick={() => toggleRole('fb')}
              className={cn("px-2 py-1 rounded border transition-colors flex items-center gap-1.5 cursor-pointer", 
                activeRole === 'fb' ? "bg-white/10 border-[#FFD600]/50 text-white shadow-[0_0_10px_rgba(255,214,0,0.2)]" : 
                activeRole ? "bg-transparent border-transparent text-white/30 hover:text-white/50" : 
                "bg-transparent border-white/10 text-white/70 hover:bg-white/5 hover:border-white/20")}
            >
              <span className={cn("w-1.5 h-1.5 rounded-full", activeRole === 'fb' || !activeRole ? "bg-[#FFD600]" : "bg-white/20")}></span>
              <strong className={cn(activeRole === 'fb' || !activeRole ? "text-white" : "font-normal")}>45</strong> 
              <span>F&B</span>
            </button>
          </div>
          <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">
            {activeRole ? `Showing 1 role: ${roleNames[activeRole]}` : 'All staff visible'}
          </p>
        </div>
      </div>

      {/* Fan Msg Center */}
      <div className="bg-[#112240] rounded-lg p-3 border border-white/5 flex gap-4 items-center cursor-pointer hover:bg-white/5 transition-colors">
        <div className="bg-[#0A1628] p-3 rounded-md">
          <MessageSquare className="w-5 h-5 text-[#29B6F6]" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold mb-1 uppercase tracking-wider">Fan Messager</h3>
          <p className="text-xs text-white/60">Broadcast to segments via WhatsApp</p>
        </div>
      </div>

      {/* System Health */}
      <div className="bg-[#112240] rounded-lg p-3 border border-white/5 flex gap-4 items-center">
        <div className="bg-[#0A1628] p-3 rounded-md">
          <Server className="w-5 h-5 text-[#00E676]" />
        </div>
        <div className="flex-1 flex flex-col justify-center">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold uppercase tracking-wider">Sys Health</h3>
            <span className="flex items-center gap-1 text-[#00E676] text-xs font-mono">
              <Check className="w-3 h-3" /> {sysHealth.status}
            </span>
          </div>
          <p className="text-xs text-white/50 font-mono">
            Lat: {sysHealth.latencyMs}ms | Upltime: {sysHealth.uptime}%
          </p>
        </div>
      </div>

      {/* Indoor Navigation Ops */}
      <div className="bg-[#112240] rounded-lg p-3 border border-white/5 flex gap-4 items-center">
        <div className="bg-[#0A1628] p-3 rounded-md">
          <Navigation className="w-5 h-5 text-[#FFD600]" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold uppercase tracking-wider">Wayfinding Ops</h3>
          <p className="text-xs text-white/50">Avg seat-find: 4.2m · Lost hotspots: 3</p>
          <p className="text-[10px] text-[#FF1744] font-semibold uppercase tracking-widest flex items-center gap-1 mt-1">
            <AlertTriangle className="w-3 h-3" /> Congregation alert near Concourse C
          </p>
        </div>
      </div>

    </div>
  );
}
