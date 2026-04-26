import { CloudRain, Volume2, Trophy, Flame, MapPin } from "lucide-react";
import { liveContext } from "../data";
import { useStadium } from "../StadiumContext";

export function LiveMatchContext() {
  const { selectedStadium } = useStadium();

  return (
    <div className="flex flex-col gap-4">
      {/* Stadium Header */}
      <div className="flex items-center gap-2 px-1">
        <MapPin className="w-3.5 h-3.5 text-[#29B6F6]" />
        <span className="text-xs font-bold text-white/70 uppercase tracking-widest">{selectedStadium?.name} — {selectedStadium?.city}</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* Score */}
      <div className="bg-[#112240] rounded-xl p-3 border border-white/5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-white/50 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Live Score</span>
          <Trophy className="w-3.5 h-3.5" />
        </div>
        <div className="flex flex-col">
          <span className="text-lg font-bold text-white font-sans">{liveContext.score}</span>
          <span className="text-xs text-white/60 font-mono tracking-wide">{liveContext.battingTeam} Batting</span>
        </div>
      </div>

      {/* Match Stats */}
      <div className="bg-[#112240] rounded-xl p-3 border border-white/5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-white/50 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Match Stats</span>
          <Flame className="w-3.5 h-3.5" />
        </div>
        <div className="flex flex-col gap-1 text-sm font-mono text-white/90">
          <div className="flex justify-between">
            <span className="text-white/50">CRR</span>
            <span>{liveContext.crr}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white/50">Proj</span>
            <span>{liveContext.projectedScore}</span>
          </div>
        </div>
      </div>

      {/* Decibels */}
      <div className="bg-[#112240] rounded-xl p-3 border border-white/5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-white/50 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Atmosphere</span>
          <Volume2 className="w-3.5 h-3.5" />
        </div>
        <div className="flex items-end gap-1.5 mt-auto">
          <span className="text-2xl font-bold text-[#00E676]">{liveContext.decibels}</span>
          <span className="text-xs text-white/50 font-mono mb-1">dB</span>
        </div>
        <div className="w-full h-1 bg-[#0A1628] rounded-full mt-2 overflow-hidden">
          <div className="h-full bg-[#00E676]" style={{ width: `${Math.min(100, liveContext.decibels / 120 * 100)}%` }}></div>
        </div>
      </div>

      {/* Weather */}
      <div className="bg-[#112240] rounded-xl p-3 border border-white/5 flex flex-col justify-between">
        <div className="flex items-center justify-between text-white/50 mb-2">
          <span className="text-xs font-semibold uppercase tracking-wider">Weather</span>
          <CloudRain className="w-3.5 h-3.5" />
        </div>
        <div className="flex flex-col justify-between h-full pt-1">
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold text-white">{liveContext.weather.temp}°C</span>
            <span className="text-xs bg-white/10 px-2 py-0.5 rounded text-white/80">{liveContext.weather.condition}</span>
          </div>
          <div className="flex justify-between mt-auto">
            <span className="text-[10px] text-white/50 uppercase tracking-widest mt-1">Humidity</span>
            <span className="text-xs font-mono text-[#29B6F6]">{liveContext.weather.humidity}%</span>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
