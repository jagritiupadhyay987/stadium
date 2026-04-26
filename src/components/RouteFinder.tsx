import { useEffect, useState } from "react";
import { User, Map as MapIcon, Coffee, Droplet, LogOut, Navigation, AlertTriangle, Ticket, Zap } from "lucide-react";
import { cn } from "../lib/utils";
import { mockZones } from "../data";
import { motion, AnimatePresence } from "motion/react";
import { Stadium3D } from "./Stadium3D";

type RouteFinderProps = {
  initialTargetType?: 'food' | 'restroom' | 'exit' | 'seat';
  initialSelectedDest?: string | null;
};

export function RouteFinder({ initialTargetType = 'food', initialSelectedDest }: RouteFinderProps) {
  const [targetType, setTargetType] = useState<'food' | 'restroom' | 'exit' | 'seat'>(initialTargetType);
  
  const getDestinations = (type: 'food' | 'restroom' | 'exit' | 'seat' = targetType) => {
    switch(type) {
      case 'food': return mockZones.filter(z => z.type === 'FB_COURT');
      case 'restroom': return mockZones.filter(z => z.type === 'RESTROOM');
      case 'exit': {
        const exits = mockZones.filter(z => z.type === 'GATE');
        // Sort by least dense/lowest wait time to find the "shortest" route conceptually
        return exits.sort((a, b) => a.density - b.density);
      }
      case 'seat': return [
        { id: 'seat_n_42', name: 'N-Stand / Row G / 42', type: 'STAND', capacity: 1, currentAttendance: 0, density: 0.1, waitTimeMin: 0, status: 'GREEN' } as any
      ];
      default: return [];
    }
  };

  const destinations = getDestinations();
  const [selectedDest, setSelectedDest] = useState<string | null>(initialSelectedDest ?? destinations[0]?.id ?? null);
  const [mapMode, setMapMode] = useState<'2d' | '3d'>('2d');

  const stadiumDensities = {
    pavilion: mockZones.find((z) => z.id === 'stand_a')?.density ?? 0.4,
    l: mockZones.find((z) => z.id === 'stand_c')?.density ?? 0.55,
    m: mockZones.find((z) => z.id === 'gate_7')?.density ?? 0.72,
    n: mockZones.find((z) => z.id === 'gate_3')?.density ?? 0.48,
    general: mockZones.find((z) => z.id === 'con_main')?.density ?? 0.66,
  };

  useEffect(() => {
    const nextDestinations = getDestinations(initialTargetType);
    setTargetType(initialTargetType);
    setSelectedDest(initialSelectedDest ?? nextDestinations[0]?.id ?? null);
  }, [initialTargetType, initialSelectedDest]);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'GREEN': return 'text-[#00E676] bg-[#00E676]/10 border-[#00E676]/50';
      case 'YELLOW': return 'text-[#FFD600] bg-[#FFD600]/10 border-[#FFD600]/50';
      case 'RED': return 'text-[#FF1744] bg-[#FF1744]/10 border-[#FF1744]/50';
      default: return 'text-white bg-white/10 border-white/50';
    }
  };

  return (
    <div className="bg-[#112240] rounded-2xl border border-white/5 p-6 flex flex-col h-[350px]">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
          <MapIcon className="w-4 h-4 text-[#FF1744]" />
          Facility Heatmap & Routing
        </h3>
      </div>
      
      <div className="flex gap-2 mb-4 flex-wrap">
        <button onClick={() => { setTargetType('seat'); setSelectedDest('seat_n_42'); }} className={cn("flex-1 py-2 text-xs font-bold uppercase rounded-lg border flex justify-center items-center gap-1.5 transition-colors", targetType === 'seat' ? "bg-white/10 border-white/30 text-white" : "border-white/5 text-white/50 hover:bg-white/5")}><Ticket className="w-3.5 h-3.5" /> Seat</button>
        <button onClick={() => { setTargetType('food'); setSelectedDest(null); }} className={cn("flex-1 py-2 text-xs font-bold uppercase rounded-lg border flex justify-center items-center gap-1.5 transition-colors", targetType === 'food' ? "bg-white/10 border-white/30 text-white" : "border-white/5 text-white/50 hover:bg-white/5")}><Coffee className="w-3.5 h-3.5" /> Food</button>
        <button onClick={() => { setTargetType('restroom'); setSelectedDest(null); }} className={cn("flex-1 py-2 text-xs font-bold uppercase rounded-lg border flex justify-center items-center gap-1.5 transition-colors", targetType === 'restroom' ? "bg-white/10 border-white/30 text-white" : "border-white/5 text-white/50 hover:bg-white/5")}><Droplet className="w-3.5 h-3.5" /> Rest</button>
        <button onClick={() => { setTargetType('exit'); setSelectedDest(null); }} className={cn("flex-1 py-2 text-xs font-bold uppercase rounded-lg border flex justify-center items-center gap-1.5 transition-colors", targetType === 'exit' ? "bg-white/10 border-white/30 text-white" : "border-white/5 text-white/50 hover:bg-white/5")}><LogOut className="w-3.5 h-3.5" /> Exit</button>
      </div>

      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="text-xs uppercase tracking-[0.3em] text-white/50">Stadium View</div>
        <div className="flex gap-2">
          <button
            onClick={() => setMapMode('2d')}
            className={cn("px-3 py-2 text-xs font-semibold uppercase rounded-lg border transition-colors", mapMode === '2d' ? "bg-white/10 border-white/30 text-white" : "border-white/10 text-white/60 hover:bg-white/5")}
          >
            2D Map
          </button>
          <button
            onClick={() => setMapMode('3d')}
            className={cn("px-3 py-2 text-xs font-semibold uppercase rounded-lg border transition-colors", mapMode === '3d' ? "bg-white/10 border-white/30 text-white" : "border-white/10 text-white/60 hover:bg-white/5")}
          >
            3D Stadium
          </button>
        </div>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* List of Destinations */}
        <div className="w-1/3 flex flex-col gap-2 overflow-y-auto pr-2">
          <AnimatePresence mode="popLayout">
          {destinations.map((dest, i) => (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: i * 0.05 }}
              key={dest.id} 
              onClick={() => setSelectedDest(dest.id)}
              className={cn("p-2 rounded-lg border cursor-pointer border-white/10 hover:border-white/20 transition-all text-left", selectedDest === dest.id && "border-[#29B6F6] bg-[#29B6F6]/5")}
            >
              <div className="text-xs font-bold mb-1 truncate flex items-center justify-between">
                {dest.name}
                {targetType === 'exit' && i === 0 && (
                  <Zap className="w-3 h-3 text-[#FFD600] inline-block ml-1" />
                )}
              </div>
              <div className="flex justify-between items-center">
                <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-mono font-bold uppercase", getStatusColor(dest.status))}>
                  {targetType === 'seat' ? 'YOUR SEAT' : `${Math.round(dest.density * 100)}% Full`}
                </span>
                {targetType !== 'seat' && (
                  <span className="text-[10px] text-white/50 font-mono">{dest.waitTimeMin}m Wait</span>
                )}
              </div>
            </motion.div>
          ))}
          </AnimatePresence>
        </div>

        {/* Heatmap Visualization */}
        <div className="flex-1 bg-[#0A1628] rounded-xl border border-white/5 relative overflow-hidden flex flex-col">
          {mapMode === '3d' ? (
            <div className="relative flex-1 p-4">
              <Stadium3D densities={stadiumDensities} />
            </div>
          ) : (
            <>
              <div className="absolute inset-0 z-0 opacity-20" style={{
                backgroundImage: 'radial-gradient(circle at 50% 50%, #29B6F6 1px, transparent 1px)',
                backgroundSize: '15px 15px'
              }}></div>
              {selectedDest ? (
                <motion.div 
                  key={selectedDest}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative z-10 flex-1 flex flex-col items-center justify-center p-4">
                  {/* Minimal 2D top-down abstract map */}
                  <div className="w-full flex items-center justify-between relative px-8 mt-4">
                    
                    {/* The Path */}
                    <div className="absolute top-1/2 left-10 right-10 h-2 bg-white/5 -translate-y-1/2 rounded-full overflow-hidden">
                       {destinations.find(d => d.id === selectedDest)?.status === 'RED' ? (
                         <>
                         <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} transition={{ duration: 0.5 }} className="h-full bg-gradient-to-r from-[#00E676] via-[#FFD600] to-[#FF1744] w-full opacity-60"></motion.div>
                         <div className="absolute inset-0 flex space-x-1 p-0.5 opacity-50">
                           {[...Array(10)].map((_, i) => <div key={i} className="h-full flex-1 bg-[#FF1744] rounded-sm mix-blend-color-dodge"></div>)}
                         </div>
                         </>
                       ) : (
                         <motion.div initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 0.5 }} className="h-full bg-gradient-to-r from-[#00E676] to-[#00E676]/30 opacity-60"></motion.div>
                       )}
                    </div>

                    <div className="flex flex-col items-center gap-2 z-10">
                      <div className="w-8 h-8 rounded-full bg-[#00E676] border-2 border-[#112240] flex items-center justify-center shadow-lg">
                        <User className="w-4 h-4 text-[#112240]" />
                      </div>
                      <span className="text-[10px] bg-[#112240] px-1.5 py-0.5 rounded border border-white/10 uppercase tracking-widest text-[#00E676] font-bold">You</span>
                    </div>

                    {destinations.find(d => d.id === selectedDest)?.status === 'RED' && (
                      <div className="flex flex-col items-center gap-1 z-10 -translate-y-8 absolute left-1/2 -translate-x-1/2">
                        <AlertTriangle className="w-5 h-5 text-[#FF1744] animate-pulse" />
                        <span className="text-[9px] text-[#FF1744] uppercase font-bold tracking-wider">Bottleneck</span>
                      </div>
                    )}

                    <div className="flex flex-col items-center gap-2 z-10">
                      <div className={cn("w-8 h-8 rounded-full border-2 border-[#112240] flex items-center justify-center shadow-lg text-[#112240]", destinations.find(d => d.id === selectedDest)?.status === 'RED' ? 'bg-[#FF1744]' : destinations.find(d => d.id === selectedDest)?.status === 'YELLOW' ? 'bg-[#FFD600]' : 'bg-[#00E676]')}>
                        <Navigation className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] bg-[#112240] px-1.5 py-0.5 rounded border border-white/10 text-white truncate max-w-[80px]">
                        {destinations.find(d => d.id === selectedDest)?.name}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-auto text-center">
                    {targetType === 'seat' ? (
                      <div className="text-xs text-[#29B6F6] font-mono bg-[#29B6F6]/10 px-3 py-1 rounded inline-block border border-[#29B6F6]/20">
                        Route to your seat. Est. walk 4 mins.
                      </div>
                    ) : targetType === 'exit' && destinations[0]?.id === selectedDest ? (
                      <div className="text-xs text-[#FFD600] font-mono bg-[#FFD600]/10 px-3 py-1 rounded inline-block border border-[#FFD600]/20">
                        Shortest Exit Route. Est. walk 3 mins.
                      </div>
                    ) : destinations.find(d => d.id === selectedDest)?.status === 'RED' ? (
                      <div className="text-xs text-[#FF1744] font-mono bg-[#FF1744]/10 px-3 py-1 rounded inline-block border border-[#FF1744]/20 animate-pulse">
                        High congestion. Est. walk 8 mins.
                      </div>
                    ) : (
                      <div className="text-xs text-[#00E676] font-mono bg-[#00E676]/10 px-3 py-1 rounded inline-block border border-[#00E676]/20">
                        Clear route. Est. walk 2 mins.
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-xs text-white/30 uppercase tracking-widest">
                  Select a destination
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
