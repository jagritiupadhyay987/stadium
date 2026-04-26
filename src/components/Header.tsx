import { useMemo, useState } from "react";
import { Activity, LayoutDashboard, Sparkles, Smartphone, Globe2, GitCompare } from "lucide-react";
import { cn } from "../lib/utils";
import { useStadium } from "../StadiumContext";

interface HeaderProps {
  currentView: 'ops' | 'fan' | 'roadmap' | 'world';
  onViewChange: (view: 'ops' | 'fan' | 'roadmap' | 'world') => void;
}

export function Header({ currentView, onViewChange }: HeaderProps) {
  const { stadiums, selectedStadium, selectStadium } = useStadium();
  const [showCompare, setShowCompare] = useState(false);
  const topComparable = useMemo(
    () => stadiums.filter((item) => item.id !== selectedStadium?.id).slice(0, 3),
    [stadiums, selectedStadium]
  );

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0A1628] shrink-0">
      <div className="flex items-center gap-3">
        <div className="bg-[#00E676] p-2 rounded-lg">
          <Activity className="w-5 h-5 text-[#0A1628]" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            StadiumFlow AI {selectedStadium ? `· ${selectedStadium.name} ${selectedStadium.flag || '🏟️'}` : ''}
          </h1>
          <p className="text-xs text-white/60 font-mono tracking-wider uppercase">
            {currentView === 'ops' ? 'Ops Command Center' : currentView === 'world' ? 'Global Stadium Network' : 'Guest Experience'}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-4 bg-[#112240] p-1 rounded-lg border border-white/10">
        <button 
          onClick={() => onViewChange('ops')}
          className={cn("px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-colors", 
            currentView === 'ops' ? "bg-[#0A1628] text-white shadow-sm" : "text-white/50 hover:text-white/80"
          )}
        >
          <LayoutDashboard className="w-4 h-4" />
          Ops Dashboard
        </button>
        <button 
          onClick={() => onViewChange('fan')}
          className={cn("px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-colors", 
            currentView === 'fan' ? "bg-[#0A1628] text-white shadow-sm" : "text-white/50 hover:text-white/80"
          )}
        >
          <Smartphone className="w-4 h-4" />
          Fan App
        </button>
        <button 
          onClick={() => onViewChange('roadmap')}
          className={cn("px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-colors", 
            currentView === 'roadmap' ? "bg-[#0A1628] text-white shadow-sm" : "text-white/50 hover:text-white/80"
          )}
        >
          <Sparkles className="w-4 h-4" />
          Roadmap
        </button>
        <button
          onClick={() => onViewChange('world')}
          className={cn("px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-colors", 
            currentView === 'world' ? "bg-[#0A1628] text-white shadow-sm" : "text-white/50 hover:text-white/80"
          )}
        >
          <Globe2 className="w-4 h-4" />
          World Map
        </button>
      </div>

      <div className="flex items-center gap-3">
        <select
          value={selectedStadium?.id || 'aca-vdca'}
          onChange={(event) => {
            const target = stadiums.find((item) => item.id === event.target.value);
            if (target) selectStadium(target);
          }}
          className="bg-[#112240] border border-white/15 rounded-lg px-3 py-2 text-xs font-semibold text-white min-w-[230px]"
        >
          {stadiums.map((stadium) => (
            <option key={stadium.id} value={stadium.id}>
              {stadium.name} ({stadium.city}, {stadium.country})
            </option>
          ))}
        </select>
        <button
          onClick={() => setShowCompare(true)}
          className="px-3 py-2 rounded-lg bg-[#112240] border border-white/15 text-xs font-semibold uppercase tracking-wider flex items-center gap-2"
        >
          <GitCompare className="w-4 h-4 text-[#29B6F6]" />
          Compare Stadiums
        </button>
        <div className="flex items-center gap-6">
        <div className="flex flex-col items-end">
          <div className="text-sm text-white/70">Match: <span className="text-white font-medium">APL Final</span></div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF1744] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#FF1744]"></span>
            </span>
            <span className="font-mono text-sm text-[#FF1744] font-bold">Live: Over 12.4</span>
          </div>
        </div>
      </div>
      </div>

      {showCompare && (
        <div className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowCompare(false)}>
          <div className="w-full max-w-4xl rounded-2xl border border-white/10 bg-[#112240] p-5" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Stadium Comparison</h3>
              <button className="text-sm text-white/60 hover:text-white" onClick={() => setShowCompare(false)}>Close</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              {[selectedStadium, ...topComparable].filter(Boolean).map((stadium: any) => (
                <div key={stadium.id} className="rounded-xl border border-white/10 bg-[#0A1628] p-3">
                  <div className="text-xs text-white/40">{stadium.country}</div>
                  <div className="font-semibold text-sm">{stadium.name}</div>
                  <div className="text-xs text-white/60 mt-2">Capacity: {stadium.capacity?.toLocaleString()}</div>
                  <div className="text-xs text-white/60">City: {stadium.city}</div>
                  <div className="text-xs text-white/60">Floodlights: {stadium.floodlights ? 'Yes' : 'No'}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
