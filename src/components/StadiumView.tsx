import { memo } from "react";
import { motion } from "motion/react";
import { mockZones } from "../data";
import { useStadium } from "../StadiumContext";

const getColor = (status: string) => {
  switch(status) {
    case 'GREEN': return '#00E676';
    case 'YELLOW': return '#FFD600';
    case 'RED': return '#FF1744';
    case 'BLACK': return '#141414';
    default: return '#112240';
  }
};

export const StadiumView = memo(() => {
  const { selectedStadium } = useStadium();
  const zones = selectedStadium?.zones?.length ? selectedStadium.zones : mockZones;
  const standA = zones.find((z) => z.id.includes("stand_")) || zones.find((z) => z.type === "STAND");
  const standC = zones.filter((z) => z.type === "STAND")[1] || standA;
  const gate1 = zones.find((z) => z.id.includes("gate_1")) || zones.find((z) => z.type === "GATE");
  const gate3 = zones.filter((z) => z.type === "GATE")[1] || gate1;
  const gate7 = zones.filter((z) => z.type === "GATE")[2] || gate3;
  const fbSouth = zones.find((z) => z.type === "FB_COURT") || zones[0];

  return (
    <div className="relative w-full h-full max-h-[75vh] bg-[#08101E] rounded-xl overflow-hidden border border-white/10 flex items-center justify-center p-4">
      {/* Grid Background */}
      <div className="absolute inset-0 z-0 opacity-10" style={{
        backgroundImage: 'linear-gradient(#29B6F6 1px, transparent 1px), linear-gradient(90deg, #29B6F6 1px, transparent 1px)',
        backgroundSize: '40px 40px'
      }}></div>

      <div className="absolute top-4 left-4 z-10 flex gap-2">
        <h3 className="text-sm font-mono text-white/50 uppercase tracking-widest bg-[#0A1628]/80 px-2 py-1 rounded">
          Live Stadium Topo · {selectedStadium?.name || "ACA-VDCA Cricket Stadium"}
        </h3>
      </div>
      <div className="absolute top-4 right-4 z-10 bg-[#0A1628]/85 border border-white/10 px-3 py-2 rounded-lg text-[10px] uppercase tracking-widest text-white/60">
        <div>{selectedStadium?.city || "Visakhapatnam"}, {selectedStadium?.country || "India"}</div>
        <div>Cap: {(selectedStadium?.capacity || 25000).toLocaleString()} · Est: {selectedStadium?.established || 2003}</div>
        <div>Home: {selectedStadium?.homeTeam || "Andhra"} · Ends: {selectedStadium?.ends?.join(" / ") || "Vizag End / VDCA End"}</div>
        <div>Center: {selectedStadium?.coordinates?.lat?.toFixed(2) || "17.80"}, {selectedStadium?.coordinates?.lng?.toFixed(2) || "83.35"}</div>
      </div>

      <svg viewBox="0 0 800 600" className="w-full h-full z-10" preserveAspectRatio="xMidYMid meet">
        <defs>
          <radialGradient id="field-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#00E676" stopOpacity="0.1" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Pitch */}
        <ellipse cx="400" cy="300" rx="180" ry="140" fill="url(#field-glow)" stroke="#00E676" strokeWidth="1" strokeOpacity="0.4" />
        <rect x="385" y="270" width="30" height="60" fill="#ffffff" fillOpacity="0.1" stroke="#00E676" strokeOpacity="0.4" />

        {/* Stands (Doughnut segments) */}
        <g strokeWidth="2" strokeOpacity="0.8">
          {/* North Stand */}
          <motion.path 
            initial={{ fillOpacity: 0.1 }}
            animate={{ fillOpacity: 0.2 }}
            transition={{ repeat: Infinity, repeatType: "reverse", duration: 3 }}
            d="M 280 120 Q 400 80 520 120 L 460 180 Q 400 160 340 180 Z" 
            fill={getColor(standA?.status || 'GREEN')} 
            stroke={getColor(standA?.status || 'GREEN')} 
          />
          <text x="400" y="140" fill="#fff" fontSize="12" textAnchor="middle" opacity="0.8">STAND A</text>

          {/* South Stand */}
          <path d="M 280 480 Q 400 520 520 480 L 460 420 Q 400 440 340 420 Z" 
            fill={getColor(standC?.status || 'GREEN')} 
            fillOpacity="0.2" stroke={getColor(standC?.status || 'GREEN')} />
          <text x="400" y="470" fill="#fff" fontSize="12" textAnchor="middle" opacity="0.8">STAND C</text>

          {/* East Stand */}
          <path d="M 550 160 Q 620 300 550 440 L 490 390 Q 530 300 490 210 Z" 
            fill="#112240" fillOpacity="0.4" stroke="#1A365D" />

          {/* West Stand */}
          <path d="M 250 160 Q 180 300 250 440 L 310 390 Q 270 300 310 210 Z" 
            fill="#112240" fillOpacity="0.4" stroke="#1A365D" />
        </g>

        {/* Gates */}
        <g>
          {/* Gate 1 (North) */}
          <circle cx="400" cy="50" r="16" fill={getColor(gate1?.status || 'GREEN')} fillOpacity="0.2" stroke={getColor(gate1?.status || 'GREEN')} strokeWidth="2" />
          <text x="400" y="54" fill="#fff" fontSize="12" textAnchor="middle" fontWeight="bold">G1</text>
          
          {/* Gate 3 (East) */}
          <circle cx="680" cy="300" r="16" fill={getColor(gate3?.status || 'GREEN')} fillOpacity="0.2" stroke={getColor(gate3?.status || 'GREEN')} strokeWidth="2" />
          <text x="680" y="304" fill="#fff" fontSize="12" textAnchor="middle" fontWeight="bold">G3</text>

          {/* Gate 7 (South) */}
          <circle cx="400" cy="550" r="16" fill={getColor(gate7?.status || 'RED')} fillOpacity="0.2" stroke={getColor(gate7?.status || 'RED')} strokeWidth="2" />
          {gate7?.status === 'RED' && (
            <motion.circle 
              initial={{ r: 16, opacity: 1 }}
              animate={{ r: 35, opacity: 0 }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              cx="400" cy="550" fill="none" stroke="#FF1744" strokeWidth="2" 
            />
          )}
          <text x="400" y="554" fill="#fff" fontSize="12" textAnchor="middle" fontWeight="bold">G7</text>
        </g>

        {/* F&B Zones */}
        <g>
          <rect x="250" y="500" width="60" height="30" rx="4" fill={getColor(fbSouth?.status || 'YELLOW')} fillOpacity="0.2" stroke={getColor(fbSouth?.status || 'YELLOW')} strokeWidth="2" />
          <text x="280" y="519" fill="#fff" fontSize="10" textAnchor="middle">F&B (S)</text>
          {fbSouth?.status === 'RED' && (
             <motion.rect 
               initial={{ opacity: 1 }}
               animate={{ opacity: 0 }}
               transition={{ repeat: Infinity, duration: 1 }}
               x="245" y="495" width="70" height="40" rx="6" fill="none" stroke="#FF1744" strokeWidth="2" 
             />
          )}
        </g>
      </svg>
    </div>
  );
});
