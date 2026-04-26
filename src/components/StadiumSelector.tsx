import { Globe, MapPin, Users, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { Stadium } from '../stadiums';
import { useStadium } from '../StadiumContext';

export function StadiumSelector() {
  const { stadiums, selectStadium, isLoading, error } = useStadium();

  if (error) {
    return (
      <div className="min-h-[100dvh] w-full bg-[#0A1628] text-white p-6 flex flex-col items-center justify-center">
        <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-xl flex flex-col items-center gap-4 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-500" />
          <h2 className="text-xl font-bold">Database Connection Error</h2>
          <p className="text-white/60">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors font-bold"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] w-full bg-[#0A1628] text-white p-6 flex flex-col items-center justify-center">
      <div className="max-w-6xl w-full">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00E676]/10 border border-[#00E676]/20 text-[#00E676] text-xs font-bold uppercase tracking-widest mb-4">
            <Globe className="w-3 h-3" /> Global Venue Selection
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Select a Stadium</h1>
          <p className="text-white/60 max-w-xl mx-auto">
            Choose from 40+ international cricket venues to initialize AI agents and live satellite data feeds for real-time operations.
          </p>
        </div>

        {isLoading && stadiums.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 text-[#00E676] animate-spin" />
            <p className="text-lg font-medium animate-pulse">Loading Stadium Database...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-h-[60vh] overflow-y-auto p-2 scrollbar-hide">
            {stadiums.map((stadium) => (
              <button
                key={stadium.id}
                onClick={() => selectStadium(stadium)}
                disabled={isLoading}
                className="group relative bg-[#112240] hover:bg-[#1a2f50] border border-white/5 hover:border-[#00E676]/30 p-4 rounded-xl transition-all duration-300 text-left overflow-hidden"
              >
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#00E676]/60">{stadium.country}</span>
                    <MapPin className="w-3 h-3 text-white/20 group-hover:text-[#00E676] transition-colors" />
                  </div>
                  <h3 className="font-bold text-sm mb-1 line-clamp-1">{stadium.name}</h3>
                  <div className="flex items-center gap-3 text-xs text-white/40">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" /> {stadium.capacity.toLocaleString()}
                    </span>
                    <span>{stadium.city}</span>
                  </div>
                </div>
                
                <div className="absolute bottom-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="w-4 h-4 text-[#00E676]" />
                </div>
              </button>
            ))}
          </div>
        )}

        {isLoading && stadiums.length > 0 && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-[#112240] p-8 rounded-2xl border border-[#00E676]/20 flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 text-[#00E676] animate-spin" />
              <div className="text-center">
                <h2 className="text-xl font-bold mb-1">Initializing AI Agents</h2>
                <p className="text-white/40 text-sm">Fetching live satellite data & crowd density...</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
