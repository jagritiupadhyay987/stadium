import { useState, useEffect } from "react";
import { User, QrCode, ShoppingBag, Map, Clock, Zap, Ticket } from "lucide-react";
import { LiveMatchContext } from "./LiveMatchContext";
import { RouteFinder } from "./RouteFinder";
import { TicketVerificationPanel } from "./TicketVerificationPanel";
import { FanMessenger } from "./FanMessenger";
import { VoiceGuidance } from "./VoiceGuidance";
import { VoiceCommandModal } from "./VoiceCommandModal";
import { IndoorStadiumMap } from "./IndoorStadiumMap";
import { SeatFinder } from "./SeatFinder";
import { WalkingDirections } from "./WalkingDirections";
import { cn } from "../lib/utils";
import { useStadium } from "../StadiumContext";
import { auth, db } from "../firebase";
import { collection, addDoc, onSnapshot, query, where, orderBy } from "firebase/firestore";
import { OperationType, handleFirestoreError } from "../firebaseUtils";

const GUJARAT_MENU = [
  { id: '1', name: 'Khaman Dhokla Set', price: '₹120', prepTime: 5, category: 'Snacks' },
  { id: '2', name: 'Fafda JalebiCombo', price: '₹150', prepTime: 8, category: 'Snacks' },
  { id: '3', name: 'Gujarati Thali (Mini)', price: '₹250', prepTime: 12, category: 'Meals' },
  { id: '4', name: 'Masala Chaas', price: '₹50', prepTime: 2, category: 'Beverages' }
];

export function FanDashboard() {
  const { stadiums, selectedStadium, selectStadium } = useStadium();
  const [cart, setCart] = useState<{id: string, qty: number}[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [liveAttendance, setLiveAttendance] = useState(54280);

  useEffect(() => {
    const interval = setInterval(() => {
      const change = Math.floor(Math.random() * 9) - 2;
      setLiveAttendance(prev => Math.min(Math.max(prev + change, 0), 100000));
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(collection(db, 'preorders'), where('userId', '==', auth.currentUser.uid));
    const unsub = onSnapshot(q, (snapshot) => {
      setOrders(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'preorders');
    });
    return unsub;
  }, []);

  const addToCart = (id: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === id);
      if (existing) {
        return prev.map(item => item.id === id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { id, qty: 1 }];
    });
  };

  const placeOrder = async () => {
    if (!auth.currentUser || cart.length === 0) return;
    setIsPlacingOrder(true);
    try {
      await addDoc(collection(db, 'preorders'), {
        userId: auth.currentUser.uid,
        items: cart,
        totalItems: cart.reduce((sum, item) => sum + item.qty, 0),
        status: 'PENDING',
        pickupTimeWindow: '16:15 - 16:20'
      });
      setCart([]);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'preorders');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const [routeFinderTarget, setRouteFinderTarget] = useState<'food' | 'restroom' | 'exit' | 'seat'>('food');
  const [voicePath, setVoicePath] = useState<any[]>([
    { name: "Concourse A" },
    { name: "Stairs A" },
    { name: "N-Stand / Row G / 42" }
  ]);
  const [voiceIndex, setVoiceIndex] = useState(0);
  const [voiceLanguage, setVoiceLanguage] = useState<'en' | 'hi' | 'te' | 'ta' | 'bn'>('en');
  const [nearestBanner, setNearestBanner] = useState<string | null>(null);
  const [navPath, setNavPath] = useState<any[]>([]);
  const [navIndex, setNavIndex] = useState(0);
  const [userPos, setUserPos] = useState({ x: 400, y: 300 });
  const [accessibilityMode, setAccessibilityMode] = useState(false);
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);

  useEffect(() => {
    if (!('geolocation' in navigator) || stadiums.length === 0) return;
    navigator.geolocation.getCurrentPosition((position) => {
      const { latitude, longitude } = position.coords;
      const scored = stadiums.map((stadium) => {
        const dx = latitude - stadium.coordinates.lat;
        const dy = longitude - stadium.coordinates.lng;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return { stadium, distance };
      }).sort((a, b) => a.distance - b.distance);
      const nearest = scored[0]?.stadium;
      if (nearest) {
        setNearestBanner(`You're at ${nearest.name}`);
        if (!selectedStadium || selectedStadium.id === 'aca-vdca') {
          selectStadium(nearest);
        }
      }
    });
  }, [stadiums.length]);

  const handleVoiceCommand = (action: string, data?: any) => {
    if (action === 'navigate' && ['food', 'restroom', 'exit', 'seat'].includes(data)) {
      setRouteFinderTarget(data as 'food' | 'restroom' | 'exit' | 'seat');
      const labels: Record<string, string[]> = {
        food: ["Concourse A", "Food Court North", "Counter 4"],
        restroom: ["Concourse B", "Restroom East", "Queue Free Lane"],
        exit: ["Stairs A", "Main Concourse", "Gate 3 Exit"],
        seat: ["Concourse A", "Stairs A", "N-Stand / Row G / 42"],
      };
      setVoicePath(labels[data].map((name) => ({ name })));
      setVoiceIndex(0);
    }
    if (action === 'language' && data) {
      setVoiceLanguage(data);
    }
    if (action === 'playback' && data === 'next') setVoiceIndex((p) => Math.min(p + 1, voicePath.length - 1));
    if (action === 'playback' && data === 'previous') setVoiceIndex((p) => Math.max(0, p - 1));
  };

  const handleSeatNavigation = async (from: string, to: string) => {
    const API_BASE = ((import.meta as any).env?.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:8000";
    try {
      const response = await fetch(`${API_BASE}/api/v1/navigation/path?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&accessible=${accessibilityMode ? 'true' : 'false'}`);
      if (!response.ok) return;
      const payload = await response.json();
      setNavPath(payload.nodes || []);
      setNavIndex(0);
      if (navigator.vibrate) navigator.vibrate([90, 80, 140]);
    } catch {
      // keep UI resilient
    }
  };

  useEffect(() => {
    if (!('devicemotion' in window)) return;
    const onMotion = (event: DeviceMotionEvent) => {
      const x = Math.abs(event.accelerationIncludingGravity?.x || 0);
      const y = Math.abs(event.accelerationIncludingGravity?.y || 0);
      if (x + y > 25) {
        setRouteFinderTarget((prev) => (prev === 'restroom' ? 'food' : 'restroom'));
      }
    };
    window.addEventListener('devicemotion', onMotion);
    return () => window.removeEventListener('devicemotion', onMotion);
  }, []);

  useEffect(() => {
    const API_BASE = ((import.meta as any).env?.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:8000";
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`${API_BASE}/api/v1/fan/friends-locations?user_id=guest_user`);
        if (response.ok) {
          const payload = await response.json();
          const me = payload?.friends?.[0];
          if (me?.pos) setUserPos({ x: me.pos.x, y: me.pos.y });
        }
      } catch {
        // silent
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="col-span-12 grid grid-cols-12 gap-6 h-full overflow-y-auto pr-2 pb-8">
      {nearestBanner && (
        <div className="col-span-12 bg-[#00E676]/10 border border-[#00E676]/40 text-[#00E676] rounded-xl px-4 py-2 text-sm font-semibold">
          {nearestBanner} · {selectedStadium?.flag || "🏟️"} {selectedStadium?.country || "India"}
        </div>
      )}
      {/* Dynamic Profile Column */}
      <div className="col-span-4 flex flex-col gap-6">
        
        {/* Live Attendance Banner */}
        <div className="bg-[#112240] rounded-2xl border border-[#00E676]/30 p-4 flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] uppercase tracking-widest text-[#00E676] font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00E676] animate-pulse"></span>
              Real-Time Attendance
            </span>
            <span className="text-xs text-white/50">Current persons in stadium</span>
          </div>
          <span className="text-2xl font-bold font-mono text-white">{liveAttendance.toLocaleString()}</span>
        </div>

        <div className={cn("rounded-2xl border p-6 relative overflow-hidden", selectedStadium?.country === 'India' ? "bg-[#112240] border-[#00E676]/20" : "bg-[#112240] border-[#29B6F6]/20")}>
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <QrCode className="w-32 h-32" />
          </div>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#29B6F6] to-[#00E676] p-1">
              <div className="w-full h-full bg-[#0A1628] rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-white/50" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-white mb-1">
                {auth.currentUser?.displayName || 'Guest User'}
              </h2>
              <div className="flex gap-2 text-xs font-mono">
                <span className="bg-white/10 px-2 py-0.5 rounded text-white/70">ID: APL-9482</span>
                <span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded">VIP Guest</span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-[#0A1628] p-3 rounded-xl border border-white/5 flex flex-col gap-4">
              <div>
                <span className="block text-[10px] text-white/50 uppercase tracking-widest mb-1">Digital Seat</span>
                <div className="flex items-center gap-2">
                  <Ticket className="w-4 h-4 text-[#FFD600]" />
                  <span className="font-mono font-bold text-[#FFD600]">N-Stand / Row G / 42</span>
                </div>
              </div>
              <button
                onClick={() => setRouteFinderTarget('seat')}
                className="mt-2 bg-[#FFD600]/10 border border-[#FFD600]/20 text-[#FFD600] text-xs uppercase font-semibold tracking-widest py-2 rounded-lg hover:bg-[#FFD600]/20 transition-colors"
              >
                Find Seat Route
              </button>
            </div>
            <div className="bg-[#0A1628] p-3 rounded-xl border border-white/5">
              <span className="block text-[10px] text-white/50 uppercase tracking-widest mb-1">Dietary Pref</span>
              <span className="text-sm text-white font-medium">Pure Veg / Jain</span>
            </div>
          </div>
          
          <div className="border-t border-white/5 pt-4">
            <span className="block text-[10px] text-white/50 uppercase tracking-widest mb-3">Order History ({orders.length})</span>
            <div className="flex flex-col gap-2">
              {orders.map(order => (
                <div key={order.id} className="flex flex-col gap-1 text-sm bg-white/5 p-2 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-white/80 font-bold">{order.totalItems} Items</span>
                    <span className="text-white/50 font-mono text-xs">{order.status}</span>
                  </div>
                  <span className="text-[#00E676] text-xs font-mono">Pickup: {order.pickupTimeWindow}</span>
                </div>
              ))}
              {orders.length === 0 && (
                <div className="text-sm text-white/40 italic">No previous orders</div>
              )}
            </div>
          </div>
        </div>

        {/* Live Context for Fan */}
        <TicketVerificationPanel />

        <div className="bg-[#112240] rounded-2xl border border-white/5 p-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#29B6F6]" />
            Live Event Context
          </h3>
          <LiveMatchContext />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="col-span-8 flex flex-col gap-6">
        
        {/* Voice-first Navigation */}
        <VoiceGuidance
          path={voicePath}
          currentIndex={voiceIndex}
          onNext={() => setVoiceIndex((prev) => Math.min(prev + 1, voicePath.length - 1))}
          onPrev={() => setVoiceIndex((prev) => Math.max(prev - 1, 0))}
          onReroute={() => {
            setVoiceIndex(0);
            setRouteFinderTarget('exit');
            setVoicePath([{ name: "Nearest Open Exit" }, { name: "Gate 3 Exit" }]);
          }}
          language={voiceLanguage}
        />

        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider">Find My Seat</h3>
              <button
                onClick={() => setAccessibilityMode((v) => !v)}
                className={cn("text-xs px-2 py-1 rounded border", accessibilityMode ? "border-[#00E676] text-[#00E676]" : "border-white/15 text-white/60")}
              >
                {accessibilityMode ? "Accessibility ON" : "Accessibility OFF"}
              </button>
            </div>
            <SeatFinder onNavigate={handleSeatNavigation} />
          </div>
          <div className="col-span-7 flex flex-col gap-4">
            <div className="h-[360px]">
              <IndoorStadiumMap
                currentLevel={1}
                userPos={userPos}
                navigationPath={navPath}
                showHeatmap
                accessibilityMode={accessibilityMode}
              />
            </div>
            {navPath.length > 0 && (
              <WalkingDirections
                path={navPath}
                currentIndex={navIndex}
                distanceToNextTurnM={Math.max(5, 30 - navIndex * 7)}
                etaMin={Math.max(1, 5 - navIndex)}
                onNext={() => {
                  setNavIndex((p) => Math.min(p + 1, navPath.length - 1));
                  if (navigator.vibrate) navigator.vibrate(120);
                }}
                onPrev={() => setNavIndex((p) => Math.max(0, p - 1))}
                onReroute={() => handleSeatNavigation(navPath[navIndex]?.id || 'gate1', navPath[navPath.length - 1]?.id || 'stand_north_l1')}
                onArrived={() => setNavPath([])}
              />
            )}
          </div>
        </div>

        {/* Secondary visual routing */}
        <RouteFinder
          key={routeFinderTarget}
          initialTargetType={routeFinderTarget}
          initialSelectedDest={routeFinderTarget === 'seat' ? 'seat_n_42' : null}
        />

        {/* Smart Concierge (F&B) */}
        <div className="bg-[#112240] rounded-2xl border border-white/5 p-6 flex-1 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#FFD600]" />
              Smart Concierge
            </h3>
            
            {/* Predictive Pickup */}
            <div className="bg-[#0A1628] border border-[#00E676]/30 px-3 py-1.5 rounded-lg flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#00E676]" />
              <div className="flex flex-col">
                <span className="text-[10px] text-white/50 uppercase leading-none mb-0.5">AI Optimal Pickup</span>
                <span className="text-xs font-mono font-bold text-[#00E676] leading-none">16:15 - 16:20</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            {GUJARAT_MENU.map(item => (
              <div key={item.id} className="bg-[#0A1628] border border-white/5 rounded-xl p-4 flex flex-col justify-between hover:border-white/20 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-white mb-1">{item.name}</h4>
                    <span className="text-xs text-white/40 uppercase tracking-wider">{item.category}</span>
                  </div>
                  <span className="font-mono text-[#FFD600] font-bold">{item.price}</span>
                </div>
                
                <div className="flex justify-between items-end">
                  <span className="text-xs text-white/50 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {item.prepTime}m prep
                  </span>
                  <button 
                    onClick={() => addToCart(item.id)}
                    className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Cart Summary */}
          {totalItems > 0 && (
            <div className="mt-auto bg-gradient-to-r from-[#00E676]/20 to-[#29B6F6]/20 border border-[#00E676]/50 rounded-xl p-4 flex justify-between items-center animate-in slide-in-from-bottom border-b-0 border-l-0 border-r-0">
              <div className="flex items-center gap-3">
                <div className="bg-[#00E676] text-[#0A1628] font-bold w-8 h-8 rounded-full flex items-center justify-center">
                  {totalItems}
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-white">Items in Cart</span>
                  <span className="text-xs text-[#00E676] font-mono">Will be ready by 16:15</span>
                </div>
              </div>
              <button 
                onClick={placeOrder}
                disabled={isPlacingOrder}
                className={cn("px-6 py-2 rounded-lg font-bold uppercase tracking-wider transition-colors", 
                  isPlacingOrder ? "bg-[#00E676]/50 text-[#0A1628]/50" : "bg-[#00E676] hover:bg-[#00E676]/90 text-[#0A1628]"
                )}>
                {isPlacingOrder ? "Placing..." : "Place Pre-Order"}
              </button>
            </div>
          )}

        </div>

        {/* Fan Messenger */}
        <FanMessenger currentStand="N-Stand" />

      </div>
      <VoiceCommandModal onCommand={handleVoiceCommand} />
    </div>
  );
}
