import React, { useState, useMemo } from 'react';
import { useStadium } from '../StadiumContext';
import { BarChart3, Users, TrendingUp, MapPin, Check, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export function StadiumComparison() {
  const { stadiums, selectedStadium } = useStadium();
  const [comparisonList, setComparisonList] = useState<string[]>(
    selectedStadium ? [selectedStadium.id] : []
  );

  const selectedStadiums = useMemo(() => {
    return stadiums.filter(s => comparisonList.includes(s.id));
  }, [stadiums, comparisonList]);

  const toggleStadium = (id: string) => {
    setComparisonList(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id].slice(-4) // Limit to 4 for UI clarity
    );
  };

  const maxCapacity = Math.max(...selectedStadiums.map(s => s.capacity), 100000);

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-[#00E676]" />
            Multi-Stadium Analytics
          </h2>
          <p className="text-white/40 text-sm">Compare real-time performance and capacity across the network</p>
        </div>

        <div className="flex items-center gap-2 bg-[#112240] p-1 rounded-lg border border-white/5">
          <span className="text-[10px] font-bold text-white/30 px-3 uppercase tracking-widest">Select up to 4</span>
        </div>
      </div>

      {/* Stadium Selection Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {stadiums.slice(0, 12).map(stadium => {
          const isSelected = comparisonList.includes(stadium.id);
          return (
            <button
              key={stadium.id}
              onClick={() => toggleStadium(stadium.id)}
              className={cn(
                "p-3 rounded-xl border transition-all text-left relative overflow-hidden group",
                isSelected 
                  ? "bg-[#00E676]/10 border-[#00E676]/30" 
                  : "bg-[#112240] border-white/5 hover:border-white/10"
              )}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="text-[9px] font-bold text-white/30 uppercase truncate">{stadium.country}</span>
                {isSelected && <Check className="w-3 h-3 text-[#00E676]" />}
              </div>
              <h4 className="font-bold text-xs truncate">{stadium.name}</h4>
              
              {isSelected && (
                <motion.div 
                  layoutId={`bg-${stadium.id}`}
                  className="absolute inset-0 bg-[#00E676]/5 pointer-events-none"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Comparison Dashboard */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
        {/* Main Charts */}
        <div className="lg:col-span-8 bg-[#112240] rounded-2xl border border-white/5 p-6 flex flex-col gap-8 overflow-y-auto scrollbar-hide">
          
          {/* Capacity Comparison */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white/60 flex items-center gap-2">
                <Users className="w-4 h-4" /> Capacity Benchmarking
              </h3>
            </div>
            
            <div className="space-y-6">
              {selectedStadiums.map((s, i) => (
                <div key={s.id} className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-white/80">{s.name}</span>
                    <span className="text-white/40 font-mono">{s.capacity.toLocaleString()} seats</span>
                  </div>
                  <div className="h-3 bg-[#0A1628] rounded-full overflow-hidden flex">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(s.capacity / maxCapacity) * 100}%` }}
                      transition={{ duration: 1, delay: i * 0.1 }}
                      className={cn(
                        "h-full rounded-full",
                        i === 0 ? "bg-[#00E676]" : i === 1 ? "bg-[#29B6F6]" : i === 2 ? "bg-[#FFD600]" : "bg-[#FF1744]"
                      )}
                    />
                  </div>
                </div>
              ))}
              {selectedStadiums.length === 0 && (
                <div className="py-12 text-center border-2 border-dashed border-white/5 rounded-2xl">
                  <Plus className="w-8 h-8 text-white/10 mx-auto mb-3" />
                  <p className="text-white/30 text-sm">Select stadiums above to start comparing</p>
                </div>
              )}
            </div>
          </section>

          {/* Efficiency & Growth */}
          <section>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white/60 flex items-center gap-2 mb-6">
              <TrendingUp className="w-4 h-4" /> Operational Efficiency
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedStadiums.map((s, i) => (
                <div key={s.id} className="bg-[#0A1628]/50 border border-white/5 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-bold text-white/40 uppercase">{s.city}</span>
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      i === 0 ? "bg-[#00E676]" : i === 1 ? "bg-[#29B6F6]" : i === 2 ? "bg-[#FFD600]" : "bg-[#FF1744]"
                    )} />
                  </div>
                  <h4 className="text-xs font-bold mb-4 truncate">{s.name}</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-[10px] text-white/30 mb-1">OCCUPANCY</div>
                      <div className="text-lg font-bold font-mono">
                        {Math.floor(Math.random() * 30 + 60)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-white/30 mb-1">UTILITY</div>
                      <div className="text-lg font-bold font-mono text-[#00E676]">
                        +{Math.floor(Math.random() * 10 + 2)}%
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Comparison Stats Sidebar */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className="bg-[#112240] rounded-2xl border border-white/5 p-5 flex-1">
            <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">Network Insights</h3>
            
            <div className="space-y-4">
              <div className="p-4 bg-[#0A1628]/50 rounded-xl border border-white/5">
                <div className="text-[10px] text-white/30 mb-1 uppercase">Avg. Capacity</div>
                <div className="text-xl font-bold font-mono">
                  {selectedStadiums.length > 0 
                    ? Math.round(selectedStadiums.reduce((a, b) => a + b.capacity, 0) / selectedStadiums.length).toLocaleString()
                    : "0"
                  }
                </div>
              </div>

              <div className="p-4 bg-[#0A1628]/50 rounded-xl border border-white/5">
                <div className="text-[10px] text-white/30 mb-1 uppercase">Total Network Reach</div>
                <div className="text-xl font-bold font-mono text-[#29B6F6]">
                  {selectedStadiums.reduce((a, b) => a + b.capacity, 0).toLocaleString()}
                </div>
              </div>

              <div className="mt-6">
                <h4 className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-3">Geographic Spread</h4>
                <div className="flex flex-wrap gap-2">
                  {Array.from(new Set(selectedStadiums.map(s => s.country))).map(c => (
                    <span key={c} className="px-2 py-1 bg-white/5 rounded text-[10px] text-white/60">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <button 
            className="w-full py-4 bg-[#00E676] text-[#0A1628] font-bold rounded-xl hover:bg-[#00c864] transition-all flex items-center justify-center gap-2"
            onClick={() => setComparisonList([])}
          >
            <X className="w-4 h-4" /> Reset Comparison
          </button>
        </div>
      </div>
    </div>
  );
}
