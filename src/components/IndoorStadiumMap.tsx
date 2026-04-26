import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Navigation, Info, Layers, Accessibility, Camera, Users } from 'lucide-react';
import { cn } from '../lib/utils';

interface Point {
  x: number;
  y: number;
}

interface Node {
  id: string;
  name: string;
  type: string;
  level: number;
  pos: Point;
}

interface IndoorStadiumMapProps {
  currentLevel: number;
  userPos?: Point;
  navigationPath?: Node[];
  showHeatmap?: boolean;
  accessibilityMode?: boolean;
}

export function IndoorStadiumMap({ 
  currentLevel, 
  userPos = { x: 400, y: 300 }, 
  navigationPath = [],
  showHeatmap = false,
  accessibilityMode = false
}: IndoorStadiumMapProps) {
  const [arMode, setArMode] = useState(false);
  const [fromNode, setFromNode] = useState('gate1');
  const [toNode, setToNode] = useState('stand_north_l1');
  const [walkingEstimate, setWalkingEstimate] = useState(2);

  // Mock heatmap data
  const heatmapData = useMemo(() => {
    return Array.from({ length: 20 }).map((_, i) => ({
      x: 100 + Math.random() * 600,
      y: 100 + Math.random() * 400,
      intensity: Math.random()
    }));
  }, []);

  const walkingPaths = useMemo(() => {
    const base = {
      0: "M 100 100 L 260 100 L 400 200 L 410 200 L 520 220",
      1: "M 410 200 L 400 300 L 320 270 L 300 250",
      2: "M 420 230 L 530 240 L 620 260"
    } as Record<number, string>;
    return base[currentLevel] || base[0];
  }, [currentLevel]);

  useEffect(() => {
    const dx = Math.abs((userPos?.x || 400) - 400);
    const dy = Math.abs((userPos?.y || 300) - 300);
    setWalkingEstimate(Math.max(1, Math.round((dx + dy) / 120)));
  }, [userPos?.x, userPos?.y, fromNode, toNode]);

  return (
    <div className="relative w-full h-full bg-[#0A1628] rounded-2xl border border-white/5 overflow-hidden">
      {/* AR Mode Overlay */}
      <AnimatePresence>
        {arMode && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Camera className="w-12 h-12 text-white/20 mb-4" />
              <p className="text-white/40 text-sm">AR Mode Active - Point camera at surroundings</p>
              
              {/* Simulated AR direction arrows */}
              <motion.div 
                animate={{ y: [0, -20, 0], opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="mt-12 flex flex-col items-center"
              >
                <Navigation className="w-16 h-16 text-[#00E676] rotate-0" />
                <span className="text-[#00E676] font-bold mt-2">Walk Straight 15m</span>
              </motion.div>
            </div>
            
            <button 
              onClick={() => setArMode(false)}
              className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
            >
              <Layers className="w-6 h-6" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SVG Map Container */}
      <div className="absolute inset-0 flex items-center justify-center p-8">
        <svg viewBox="0 0 800 600" className="w-full h-full drop-shadow-2xl">
          {/* Level Floor Plan */}
          <rect x="50" y="50" width="700" height="500" rx="40" fill="#112240" stroke="#ffffff0a" strokeWidth="2" />
          <circle cx="400" cy="300" r="180" fill="none" stroke="#ffffff05" strokeWidth="1" />
          {currentLevel === 0 && (
            <>
              <path d="M 90 90 L 710 90 L 710 180 L 90 180 Z" fill="#1A2F52" opacity="0.35" />
              <text x="110" y="120" fill="#fff" fontSize="11">Ground Level · Gates + Entry</text>
            </>
          )}
          {currentLevel === 1 && (
            <>
              <path d="M 90 210 L 710 210 L 710 340 L 90 340 Z" fill="#1F3C62" opacity="0.3" />
              <text x="110" y="240" fill="#fff" fontSize="11">Concourse Level · Stands + Amenities</text>
            </>
          )}
          {currentLevel === 2 && (
            <>
              <path d="M 90 360 L 710 360 L 710 500 L 90 500 Z" fill="#2A4669" opacity="0.25" />
              <text x="110" y="390" fill="#fff" fontSize="11">Upper Level · Premium Seating</text>
            </>
          )}
          
          {/* Mock Areas */}
          <g opacity="0.4">
            <rect x="100" y="100" width="120" height="80" rx="10" fill="#29B6F610" stroke="#29B6F630" />
            <text x="160" y="145" textAnchor="middle" fill="#29B6F6" fontSize="12" className="font-bold">Stand A</text>
            
            <rect x="580" y="100" width="120" height="80" rx="10" fill="#29B6F610" stroke="#29B6F630" />
            <text x="640" y="145" textAnchor="middle" fill="#29B6F6" fontSize="12" className="font-bold">Stand B</text>
            
            <rect x="340" y="80" width="120" height="40" rx="5" fill="#FFD60010" stroke="#FFD60030" />
            <text x="400" y="105" textAnchor="middle" fill="#FFD600" fontSize="10">Food Court</text>
          </g>

          {/* Heatmap Overlay */}
          {showHeatmap && heatmapData.map((p, i) => (
            <circle 
              key={i} 
              cx={p.x} cy={p.y} 
              r={20 + p.intensity * 40} 
              fill={p.intensity > 0.7 ? '#FF1744' : p.intensity > 0.4 ? '#FFD600' : '#00E676'} 
              opacity="0.1"
              className="animate-pulse"
              style={{ animationDelay: `${i * 100}ms` }}
            />
          ))}

          {/* Navigation Path */}
          {navigationPath.length > 1 && (
            <motion.path
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 2, ease: "easeInOut" }}
              d={`M ${navigationPath.map(n => `${n.pos.x} ${n.pos.y}`).join(' L ')}`}
              fill="none"
              stroke="#00E676"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="8 8"
            />
          )}
          {!navigationPath.length && (
            <motion.path
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.4 }}
              d={walkingPaths}
              fill="none"
              stroke={accessibilityMode ? "#FFD600" : "#00E676"}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={accessibilityMode ? "5 6" : "8 8"}
            />
          )}

          {/* User Location */}
          <g transform={`translate(${userPos.x}, ${userPos.y})`}>
            <motion.circle 
              animate={{ r: [10, 20, 10], opacity: [0.3, 0.1, 0.3] }}
              transition={{ repeat: Infinity, duration: 2 }}
              r="20" fill="#00E676" 
            />
            <circle r="6" fill="#00E676" stroke="white" strokeWidth="2" />
            <path d="M -10 -15 L 0 -25 L 10 -15 Z" fill="#00E676" />
            <text x="0" y="-32" textAnchor="middle" fill="#00E676" fontSize="11" fontWeight="700">YOU ARE HERE</text>
          </g>
        </svg>
      </div>

      {/* Map Controls */}
      <div className="absolute top-6 left-6 flex flex-col gap-3">
        <div className="bg-[#112240] border border-white/10 rounded-xl p-2 space-y-2">
          <div className="text-[10px] uppercase tracking-widest text-white/40">Path Planner</div>
          <div className="flex gap-2">
            <select value={fromNode} onChange={(e) => setFromNode(e.target.value)} className="bg-[#0A1628] border border-white/10 rounded px-2 py-1 text-[10px]">
              <option value="gate1">Gate 1</option>
              <option value="food_l0">Food Court</option>
              <option value="stair_a_l0">Stairs A</option>
            </select>
            <select value={toNode} onChange={(e) => setToNode(e.target.value)} className="bg-[#0A1628] border border-white/10 rounded px-2 py-1 text-[10px]">
              <option value="stand_north_l1">North Stand</option>
              <option value="restroom_l1">Restroom</option>
              <option value="elevator_a_l1">Elevator A</option>
            </select>
          </div>
          <div className="text-[10px] text-white/50">Est. walk: {walkingEstimate} min</div>
        </div>
        <div className="bg-[#112240] border border-white/10 rounded-xl p-1 flex flex-col gap-1">
          {[2, 1, 0].map(level => (
            <button
              key={level}
              className={cn(
                "w-10 h-10 rounded-lg text-xs font-bold transition-all",
                currentLevel === level ? "bg-[#00E676] text-[#0A1628]" : "text-white/40 hover:text-white/80"
              )}
            >
              L{level}
            </button>
          ))}
        </div>
        
        <button 
          onClick={() => setArMode(true)}
          className="w-10 h-10 bg-[#112240] border border-white/10 rounded-xl flex items-center justify-center text-white/60 hover:text-[#00E676] transition-colors"
        >
          <Camera className="w-5 h-5" />
        </button>
      </div>

      <div className="absolute bottom-6 right-6 flex items-center gap-3">
        <div className="bg-[#112240]/90 backdrop-blur border border-white/10 px-4 py-2 rounded-xl flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-white/40" />
            <span className="text-xs font-bold text-white/80">Crowd: Moderate</span>
          </div>
          <div className="w-px h-4 bg-white/10" />
          <div className="flex items-center gap-2">
            <Accessibility className={cn("w-4 h-4", accessibilityMode ? "text-[#00E676]" : "text-white/20")} />
            <span className="text-xs font-bold text-white/80">{accessibilityMode ? 'Step-Free' : 'Standard'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
