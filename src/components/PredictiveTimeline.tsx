import { mockTimeline } from "../data";
import { Clock, Cpu } from "lucide-react";
import { cn } from "../lib/utils";
import { motion } from "motion/react";

const getTypeColor = (t: string) => {
  switch (t) {
    case 'warning': return 'text-[#FFD600] border-[#FFD600] bg-[#FFD600]/10';
    case 'action': return 'text-[#00E676] border-[#00E676] bg-[#00E676]/10';
    default: return 'text-[#29B6F6] border-[#29B6F6] bg-[#29B6F6]/10';
  }
};

export function PredictiveTimeline() {
  return (
    <div className="bg-[#112240] rounded-xl border border-white/5 flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-white/5 flex items-center justify-between sticky top-0 bg-[#112240] z-10 rounded-t-xl">
        <h2 className="text-lg font-semibold tracking-tight text-white flex items-center gap-2">
          <Cpu className="w-5 h-5 text-[#29B6F6]" />
          Predictive Timeline
        </h2>
        <span className="text-xs text-white/50 font-mono">Next 90 mins</span>
      </div>
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-4 flex gap-4 items-start">
        {mockTimeline.map((item, i) => (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            key={item.id} className="relative flex-none min-w-[220px] max-w-[260px] flex flex-col justify-start"
          >
            {/* Horizontal Line connecting items */}
            {i !== mockTimeline.length - 1 && (
              <div className="absolute top-1/2 left-[100px] right-[-100px] h-px bg-white/10 z-0"></div>
            )}
            
            <div className="bg-[#0A1628] border border-white/10 rounded-lg p-3 min-h-[150px] relative z-10 hover:border-white/30 transition-colors cursor-default group hover:-translate-y-1 duration-300">
              <div className="flex items-center gap-1.5 text-xs font-mono text-white/60 mb-2">
                <Clock className="w-3 h-3 group-hover:text-white transition-colors" />
                <span className="group-hover:text-white transition-colors">{item.time}</span>
              </div>
              <div className={cn("text-sm font-semibold mb-1 whitespace-normal break-words", getTypeColor(item.type).split(' ')[0])}>
                {item.title}
              </div>
              <div className="text-xs text-white/70 leading-5 whitespace-normal break-words line-clamp-3">
                {item.action}
              </div>
            </div>
            {/* Timeline Dot */}
            <div className={cn("absolute top-1/2 left-[20px] -translate-y-1/2 w-3 h-3 rounded-full border-2 bg-[#0A1628] z-20 shadow-[0_0_10px_currentColor]", getTypeColor(item.type))}></div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
