import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Navigation, MapPin, Clock, ArrowRight, ArrowLeft, ArrowUp, CheckCircle2, RefreshCw, Volume2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface Step {
  id: string;
  name: string;
  type: string;
  level: number;
}

interface WalkingDirectionsProps {
  path: Step[];
  currentIndex: number;
  distanceToNextTurnM?: number;
  etaMin?: number;
  onNext: () => void;
  onPrev: () => void;
  onReroute: () => void;
  onArrived: () => void;
}

export function WalkingDirections({ path, currentIndex, distanceToNextTurnM = 20, etaMin = 2, onNext, onPrev, onReroute, onArrived }: WalkingDirectionsProps) {
  if (!path.length) return null;

  const currentStep = path[currentIndex];
  const nextStep = path[currentIndex + 1];
  const isLast = currentIndex === path.length - 1;

  return (
    <div className="bg-[#112240] rounded-2xl border border-white/5 overflow-hidden shadow-2xl">
      {/* Header Info */}
      <div className="bg-[#0A1628] px-6 py-4 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#00E676]/10 flex items-center justify-center">
            <Navigation className="w-4 h-4 text-[#00E676]" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest block">Heading to</span>
            <span className="text-sm font-bold text-white/90">{path[path.length - 1].name}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest block">ETA</span>
            <span className="text-sm font-bold text-[#00E676]">{etaMin} min</span>
          </div>
          <button className="p-2 text-white/40 hover:text-white transition-colors">
            <Volume2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Direction Card */}
      <div className="p-6">
        <div className="flex items-start gap-6 mb-8">
          <div className="w-16 h-16 bg-[#00E676] rounded-2xl flex items-center justify-center shadow-lg shadow-[#00E676]/20">
            {isLast ? (
              <CheckCircle2 className="w-10 h-10 text-[#0A1628]" />
            ) : nextStep?.type === 'stair' ? (
              <ArrowUp className="w-10 h-10 text-[#0A1628]" />
            ) : (
              <ArrowUp className="w-10 h-10 text-[#0A1628]" />
            )}
          </div>
          
          <div className="flex-1">
            <h3 className="text-2xl font-bold mb-1">
              {isLast ? "You've Arrived!" : `Walk ${distanceToNextTurnM}m to ${nextStep?.name || 'Destination'}`}
            </h3>
            <p className="text-white/40 text-sm">
              {isLast 
                ? "Your seat is right in front of you." 
                : `Currently passing ${currentStep.name}`}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="flex gap-1 h-1 bg-white/5 rounded-full mb-8 overflow-hidden">
          {path.map((_, i) => (
            <div 
              key={i}
              className={cn(
                "flex-1 transition-all duration-500",
                i <= currentIndex ? "bg-[#00E676]" : "bg-transparent"
              )}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          {isLast ? (
            <button 
              onClick={onArrived}
              className="w-full py-4 bg-[#00E676] text-[#0A1628] font-bold rounded-xl hover:bg-[#00c864] transition-all flex items-center justify-center gap-2"
            >
              Finish Navigation
            </button>
          ) : (
            <>
              <button 
                onClick={onPrev}
                disabled={currentIndex === 0}
                className="flex-1 py-4 bg-white/5 border border-white/5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-white/10 transition-all disabled:opacity-50"
              >
                <ArrowLeft className="w-4 h-4" />
                Previous
              </button>
              <button 
                onClick={onReroute}
                className="flex-1 py-4 bg-white/5 border border-white/5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-white/10 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                Reroute
              </button>
              <button 
                onClick={onNext}
                className="flex-[2] py-4 bg-[#00E676] text-[#0A1628] font-bold rounded-xl hover:bg-[#00c864] transition-all flex items-center justify-center gap-2"
              >
                Next Step
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
