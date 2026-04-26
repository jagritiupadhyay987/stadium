import React, { useState, useMemo, useEffect } from 'react';
import { useStadium } from '../StadiumContext';
import { MapPin, Search, Filter, Users, Globe, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

export function WorldMap() {
  const { stadiums, selectStadium, selectedStadium } = useStadium();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [capacityRange, setCapacityRange] = useState<[number, number]>([0, 140000]);
  const [floodlightsOnly, setFloodlightsOnly] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    const API_BASE = ((import.meta as any).env?.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:8000';
    fetch(`${API_BASE}/api/v1/stadiums/analytics`).then((r) => r.json()).then(setAnalytics).catch(() => setAnalytics(null));
  }, []);

  const countries = useMemo(() => {
    const set = new Set(stadiums.map(s => s.country));
    return Array.from(set).sort();
  }, [stadiums]);

  const filteredStadiums = useMemo(() => {
    return stadiums.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           s.city.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCountry = !selectedCountry || s.country === selectedCountry;
      const matchesCapacity = s.capacity >= capacityRange[0] && s.capacity <= capacityRange[1];
      const matchesFloodlights = !floodlightsOnly || s.floodlights;
      return matchesSearch && matchesCountry && matchesCapacity && matchesFloodlights;
    });
  }, [stadiums, searchQuery, selectedCountry, capacityRange, floodlightsOnly]);

  const stats = useMemo(() => {
    const total = filteredStadiums.reduce((sum, item) => sum + item.capacity, 0);
    const average = filteredStadiums.length ? Math.round(total / filteredStadiums.length) : 0;
    const byCountry: Record<string, number> = {};
    filteredStadiums.forEach((item) => {
      byCountry[item.country] = (byCountry[item.country] || 0) + 1;
    });
    return { total, average, byCountry };
  }, [filteredStadiums]);

  const countryColors: Record<string, string> = {
    India: '#00E676', Australia: '#FFD600', England: '#29B6F6', Pakistan: '#66BB6A', "South Africa": '#FFB300',
    "New Zealand": '#4FC3F7', "Sri Lanka": '#FFA726', Barbados: '#BA68C8', Trinidad: '#AB47BC',
    Bangladesh: '#81C784', UAE: '#26C6DA', Afghanistan: '#EC407A', Zimbabwe: '#FF7043', Ireland: '#9CCC65'
  };

  // Coordinate mapping for a simple world visualization
  // This is a simplified projection
  const getMapCoords = (lat: number, lng: number) => {
    const x = ((lng + 180) * 100) / 360;
    const y = ((90 - lat) * 100) / 180;
    return { x: `${x}%`, y: `${y}%` };
  };

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Globe className="w-6 h-6 text-[#00E676]" />
            Global Operations Map
          </h2>
          <p className="text-white/40 text-sm">Real-time monitoring across {stadiums.length} international venues</p>
        </div>

        <div className="flex flex-wrap gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input 
              type="text" 
              placeholder="Search stadiums..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#112240] border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm focus:border-[#00E676]/50 outline-none transition-colors"
            />
          </div>
          
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <select 
              value={selectedCountry || ''}
              onChange={(e) => setSelectedCountry(e.target.value || null)}
              className="bg-[#112240] border border-white/10 rounded-lg pl-10 pr-8 py-2 text-sm focus:border-[#00E676]/50 outline-none transition-colors appearance-none cursor-pointer"
            >
              <option value="">All Countries</option>
              {countries.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 text-xs bg-[#112240] border border-white/10 px-3 py-2 rounded-lg">
            <span>Cap</span>
            <input type="number" value={capacityRange[0]} onChange={(e) => setCapacityRange([Number(e.target.value || 0), capacityRange[1]])} className="w-20 bg-transparent border border-white/10 rounded px-2 py-1" />
            <span>-</span>
            <input type="number" value={capacityRange[1]} onChange={(e) => setCapacityRange([capacityRange[0], Number(e.target.value || 140000)])} className="w-20 bg-transparent border border-white/10 rounded px-2 py-1" />
          </div>
          <label className="text-xs flex items-center gap-2 bg-[#112240] border border-white/10 px-3 py-2 rounded-lg">
            <input type="checkbox" checked={floodlightsOnly} onChange={(e) => setFloodlightsOnly(e.target.checked)} />
            Floodlights only
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
        {/* Map Visualization */}
        <div className="lg:col-span-8 bg-[#112240] rounded-2xl border border-white/5 relative overflow-hidden flex flex-col">
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '32px 32px'
          }}></div>

          <div className="flex-1 relative m-8 border border-white/5 rounded-xl bg-[#0A1628]/50 overflow-hidden">
            {/* Simple stylized world map shape could go here, for now using markers on grid */}
            <div className="absolute inset-0 flex items-center justify-center opacity-5">
              <Globe className="w-96 h-96" />
            </div>

            {filteredStadiums.map((stadium) => {
              const { x, y } = getMapCoords(stadium.coordinates.lat, stadium.coordinates.lng);
              const isActive = selectedStadium?.id === stadium.id;
              const markerSize = Math.max(6, Math.min(20, Math.round(stadium.capacity / 10000)));
              
              return (
                <motion.button
                  key={stadium.id}
                  onClick={() => selectStadium(stadium)}
                  className="absolute -translate-x-1/2 -translate-y-1/2 group"
                  style={{ left: x, top: y }}
                  whileHover={{ scale: 1.2 }}
                >
                  <div className={cn(
                    "rounded-full border-2 transition-all shadow-[0_0_10px_rgba(0,0,0,0.5)]",
                    isActive ? "border-white scale-125" : "border-[#0A1628]"
                  )} style={{ width: markerSize, height: markerSize, backgroundColor: countryColors[stadium.country] || '#29B6F6' }} />
                  
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity z-50">
                    <div className="bg-[#112240] border border-white/10 px-3 py-1.5 rounded-lg shadow-2xl whitespace-nowrap">
                      <p className="text-xs font-bold text-white">{stadium.name}</p>
                      <p className="text-[10px] text-white/40">{stadium.city}, {stadium.country}</p>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>

          <div className="p-4 border-t border-white/5 bg-[#0A1628]/30 flex items-center justify-between text-[10px] font-mono text-white/30 uppercase tracking-widest">
            <span>Projection: Equirectangular</span>
            <span>Live Feed: {stadiums.length} Nodes Online</span>
            <span>GIS Resolution: 0.5m</span>
          </div>
        </div>

        {/* Stadium List */}
        <div className="lg:col-span-4 flex flex-col gap-4 overflow-hidden">
          <div className="bg-[#112240] border border-white/10 rounded-xl p-3 text-xs">
            <div className="text-white/70">Total Capacity: <span className="text-white font-semibold">{stats.total.toLocaleString()}</span></div>
            <div className="text-white/70">Average Capacity: <span className="text-white font-semibold">{stats.average.toLocaleString()}</span></div>
            <div className="text-white/70">Countries: <span className="text-white font-semibold">{Object.keys(stats.byCountry).length}</span></div>
            {analytics?.best_exit_stadium && (
              <div className="text-white/70">Best Exit: <span className="text-[#00E676] font-semibold">{analytics.best_exit_stadium.name}</span></div>
            )}
          </div>
          <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-3 scrollbar-hide">
            {filteredStadiums.map((stadium) => (
              <button
                key={stadium.id}
                onClick={() => selectStadium(stadium)}
                className={cn(
                  "p-4 rounded-xl border transition-all text-left group",
                  selectedStadium?.id === stadium.id 
                    ? "bg-[#00E676]/10 border-[#00E676]/30 shadow-[0_0_15px_rgba(0,230,118,0.05)]" 
                    : "bg-[#112240] border-white/5 hover:border-white/10"
                )}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-[#00E676]/60 uppercase tracking-widest">
                    {stadium.country}
                  </span>
                  <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-30 transition-opacity" />
                </div>
                <h4 className="font-bold text-sm mb-1">{stadium.name}</h4>
                <div className="flex items-center gap-3 text-[11px] text-white/40">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {stadium.city}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" /> {stadium.capacity.toLocaleString()}
                  </span>
                </div>
              </button>
            ))}
            
            {filteredStadiums.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Search className="w-8 h-8 text-white/10 mb-3" />
                <p className="text-white/40 text-sm">No stadiums found matching your search.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
