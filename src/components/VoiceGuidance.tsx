import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Navigation, MapPin, Battery, Clock, RotateCcw, AlertTriangle, Bluetooth, Download, Settings, ChevronRight, Compass, Vibrate } from 'lucide-react';
import { cn } from '../lib/utils';

interface VoiceGuidanceProps {
  path: any[];
  currentIndex: number;
  onNext: () => void;
  onPrev: () => void;
  onReroute: () => void;
  language?: string;
}

export function VoiceGuidance({ path, currentIndex, onNext, onPrev, onReroute, language = 'en' }: VoiceGuidanceProps) {
  const API_BASE = ((import.meta as any).env?.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:8000';
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceSettings, setVoiceSettings] = useState({ speed: 1.0, gender: 'FEMALE' as 'MALE' | 'FEMALE', pitch: 0 });
  const [eta, setEta] = useState(15); // minutes
  const [batterySaving, setBatterySaving] = useState(false);
  const [position, setPosition] = useState<{ lat: number; lng: number; heading: number }>({ lat: 17.385, lng: 78.4867, heading: 0 });
  const [distanceToTurn, setDistanceToTurn] = useState(20);
  const [countdownSec, setCountdownSec] = useState(900);
  const [offlineReady, setOfflineReady] = useState(false);
  const [textFallback, setTextFallback] = useState<string | null>(null);
  const [highContrast, setHighContrast] = useState(false);
  const [navigationMode, setNavigationMode] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastInstructionRef = useRef<string>('');
  const cachedAudioRef = useRef<Map<string, string>>(new Map());

  const currentStep = path[currentIndex];
  const nextStep = path[currentIndex + 1];

  // Shake to Repeat Logic
  useEffect(() => {
    let lastShake = 0;
    const handleMotion = (e: DeviceMotionEvent) => {
      const acc = e.accelerationIncludingGravity;
      if (!acc) return;
      
      const threshold = 15;
      if (Math.abs(acc.x!) > threshold || Math.abs(acc.y!) > threshold) {
        const now = Date.now();
        if (now - lastShake > 2000) {
          lastShake = now;
          speakCurrentInstruction();
        }
      }
    };

    window.addEventListener('devicemotion', handleMotion);
    return () => window.removeEventListener('devicemotion', handleMotion);
  }, [currentIndex, language]);

  const getInstruction = () => `Walk towards ${currentStep?.name || 'the next marker'}. ${nextStep ? `Next, head to ${nextStep.name}.` : 'You have arrived.'}`;

  const preloadUpcomingSegments = async () => {
    const upcoming = path.slice(currentIndex + 1, currentIndex + 4);
    await Promise.all(upcoming.map(async (step, idx) => {
      const text = `Upcoming step ${idx + 1}: proceed to ${step?.name || 'next point'}.`;
      if (cachedAudioRef.current.has(text)) return;
      try {
        const response = await fetch(`${API_BASE}/api/v1/voice/tts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text,
            language,
            gender: voiceSettings.gender,
            speaking_rate: voiceSettings.speed,
            pitch: voiceSettings.pitch,
          }),
        });
        if (response.ok) {
          const data = await response.json();
          cachedAudioRef.current.set(text, data.audio_base64);
        }
      } catch {
        // Silent preload failure
      }
    }));
  };

  const speakCurrentInstruction = async (overrideText?: string) => {
    if (!currentStep) return;
    setIsSpeaking(true);
    try {
      const text = overrideText || getInstruction();
      lastInstructionRef.current = text;
      const cached = cachedAudioRef.current.get(text);
      if (cached) {
        const audio = new Audio(`data:audio/mpeg;base64,${cached}`);
        audioRef.current = audio;
        await audio.play();
        audio.onended = () => setIsSpeaking(false);
        return;
      }
      const response = await fetch(`${API_BASE}/api/v1/voice/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          language,
          gender: voiceSettings.gender,
          speaking_rate: voiceSettings.speed,
          pitch: voiceSettings.pitch,
          ssml: true
        })
      });

      if (response.ok) {
        const data = await response.json();
        cachedAudioRef.current.set(text, data.audio_base64);
        const audio = new Audio(`data:audio/mpeg;base64,${data.audio_base64}`);
        audioRef.current = audio;
        await audio.play();
        audio.onended = () => setIsSpeaking(false);
      } else {
        setTextFallback(text);
        setIsSpeaking(false);
      }
    } catch (error) {
      console.error('TTS Error:', error);
      setTextFallback(getInstruction());
      setIsSpeaking(false);
    }
  };

  useEffect(() => {
    speakCurrentInstruction();
    preloadUpcomingSegments();
  }, [currentIndex, language, voiceSettings.speed, voiceSettings.gender, voiceSettings.pitch]);

  useEffect(() => {
    if (!('geolocation' in navigator)) return;
    const watcher = navigator.geolocation.watchPosition(
      (geo) => {
        setPosition((prev) => ({
          lat: geo.coords.latitude,
          lng: geo.coords.longitude,
          heading: geo.coords.heading ?? prev.heading,
        }));
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
    return () => navigator.geolocation.clearWatch(watcher);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdownSec((s) => Math.max(0, s - 1));
      setDistanceToTurn((d) => Math.max(0, d - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (distanceToTurn <= 7 && navigator.vibrate) {
      navigator.vibrate([100, 120, 100, 120, 200]);
    }
  }, [distanceToTurn]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = language === 'hi' ? 'hi-IN' : 'en-US';
    recognition.onresult = (event: any) => {
      const command = event.results[event.results.length - 1][0].transcript.toLowerCase();
      if (command.includes('repeat')) speakCurrentInstruction(lastInstructionRef.current);
      if (command.includes('next')) onNext();
      if (command.includes('previous')) onPrev();
      if (command.includes('pause')) audioRef.current?.pause();
    };
    recognition.start();
    return () => recognition.stop();
  }, [language, onNext, onPrev]);

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.setActionHandler('play', () => audioRef.current?.play());
    navigator.mediaSession.setActionHandler('pause', () => audioRef.current?.pause());
    navigator.mediaSession.setActionHandler('nexttrack', onNext);
    navigator.mediaSession.setActionHandler('previoustrack', onPrev);
  }, [onNext, onPrev]);

  const downloadOfflinePack = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/v1/voice/download/${language}`);
      if (!response.ok) return;
      const payload = await response.json();
      const dbRequest = indexedDB.open('stadiumflow-voice', 1);
      dbRequest.onupgradeneeded = () => {
        const db = dbRequest.result;
        if (!db.objectStoreNames.contains('packs')) db.createObjectStore('packs');
      };
      dbRequest.onsuccess = () => {
        const db = dbRequest.result;
        const tx = db.transaction('packs', 'readwrite');
        tx.objectStore('packs').put(payload, language);
        tx.oncomplete = () => setOfflineReady(true);
      };
    } catch (error) {
      console.error('Offline pack download failed', error);
    }
  };

  const formatCountdown = () => `${Math.floor(countdownSec / 60)}:${String(countdownSec % 60).padStart(2, '0')}`;

  return (
    <div className={cn("rounded-3xl border overflow-hidden shadow-2xl", highContrast ? "bg-black border-white/60 text-white" : "bg-[#112240] border-white/10")}>
      {/* Waveform Visualization */}
      <div className={cn("h-24 flex items-center justify-center gap-1 px-8 relative overflow-hidden", highContrast ? "bg-black" : "bg-[#0A1628]")}>
        {isSpeaking ? (
          [...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              animate={{ 
                height: [10, Math.random() * 40 + 10, 10],
                opacity: [0.3, 1, 0.3]
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 0.5 + Math.random() * 0.5,
                delay: i * 0.05
              }}
              className={cn("w-1 rounded-full", highContrast ? "bg-white" : "bg-[#00E676]")}
            />
          ))
        ) : (
          <div className="w-full h-0.5 bg-white/10 rounded-full" />
        )}
        
        {/* ETA & Battery Mini Info */}
        <div className="absolute top-3 left-6 flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-white/40 uppercase tracking-widest">
            <Clock className="w-3 h-3 text-[#29B6F6]" />
            ETA: {formatCountdown()}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-white/40 uppercase tracking-widest">
            <Battery className={cn("w-3 h-3", batterySaving ? "text-[#00E676]" : "text-white/40")} />
            {batterySaving ? 'Eco On' : 'Optimal'}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-white/40 uppercase tracking-widest">
            <Compass className="w-3 h-3 text-[#FFD600]" />
            {Math.round(position.heading)}°
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="flex items-start justify-between mb-8">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 bg-[#00E676]/10 text-[#00E676] text-[10px] font-bold rounded uppercase tracking-wider">
                Current Step
              </span>
              <Bluetooth className="w-3 h-3 text-white/20" />
            </div>
            <h2 className="text-2xl font-bold mb-1">{currentStep?.name || 'Locating...'}</h2>
            <p className="text-white/40 text-sm flex items-center gap-2">
              <Navigation className="w-4 h-4" />
              Next: {nextStep?.name || 'Arrived'}
            </p>
            <p className="text-xs text-white/40 mt-2">Audio descriptions: Passing concourse crowd lane, keep right for clearer path.</p>
          </div>
          
          <button 
            onClick={() => speakCurrentInstruction()}
            className="w-14 h-14 bg-[#00E676] rounded-2xl flex items-center justify-center shadow-lg shadow-[#00E676]/20 hover:scale-105 transition-all active:scale-95"
          >
            <RotateCcw className="w-6 h-6 text-[#0A1628]" />
          </button>
        </div>

        {/* Large Turn Indicator (Simulated) */}
        <div className="bg-[#0A1628] rounded-2xl p-6 flex items-center gap-6 mb-8 border border-white/5">
          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center">
            <motion.div
              animate={{ rotate: [0, -90, 0] }}
              transition={{ repeat: Infinity, duration: 4 }}
            >
              <Navigation className="w-8 h-8 text-[#00E676]" />
            </motion.div>
          </div>
          <div>
            <span className="text-3xl font-black text-white flex items-center gap-2">
              {distanceToTurn}<span className="text-lg text-white/40 font-bold uppercase">m</span>
            </span>
            <p className="text-sm font-bold text-white/60">Turn left at Stairs A</p>
          </div>
        </div>

        <div className="mb-6 bg-[#0A1628] border border-white/10 rounded-2xl p-3">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-white/50 mb-2">
            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> Live Position</span>
            <span>{position.lat.toFixed(4)}, {position.lng.toFixed(4)}</span>
          </div>
          <div className="h-16 rounded-xl bg-gradient-to-r from-[#1b2a4a] to-[#102138] relative overflow-hidden">
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, #fff 1px, transparent 1px)', backgroundSize: '14px 14px' }} />
            <motion.div animate={{ x: [10, 90, 170], y: [20, 30, 24] }} transition={{ duration: 6, repeat: Infinity }} className="absolute w-3 h-3 rounded-full bg-[#00E676]" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={onReroute}
            className="flex items-center justify-center gap-2 py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-sm font-bold transition-all"
          >
            <AlertTriangle className="w-4 h-4 text-[#FFD600]" />
            I'm Lost
          </button>
          <button 
            onClick={() => setBatterySaving(!batterySaving)}
            className={cn(
              "flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-bold transition-all border",
              batterySaving ? "bg-[#00E676]/10 border-[#00E676] text-[#00E676]" : "bg-white/5 border-transparent text-white"
            )}
          >
            <Battery className="w-4 h-4" />
            {batterySaving ? 'Eco Mode' : 'Power Mode'}
          </button>
          <button
            onClick={() => setNavigationMode(!navigationMode)}
            className="flex items-center justify-center gap-2 py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-sm font-bold transition-all"
          >
            <Navigation className="w-4 h-4 text-[#29B6F6]" />
            {navigationMode ? 'Exit Nav Mode' : 'Navigation Mode'}
          </button>
          <button
            onClick={() => setHighContrast(!highContrast)}
            className="flex items-center justify-center gap-2 py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-sm font-bold transition-all"
          >
            <Vibrate className="w-4 h-4 text-[#FFD600]" />
            {highContrast ? 'Normal Contrast' : 'High Contrast'}
          </button>
        </div>

        {/* Quick Voice Settings */}
        <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-between">
          <div className="flex gap-4">
            <button onClick={downloadOfflinePack} className="p-2 text-white/40 hover:text-white transition-colors">
              <Download className="w-5 h-5" />
            </button>
            <button className="p-2 text-white/40 hover:text-white transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={onPrev}
              disabled={currentIndex === 0}
              className="p-3 bg-white/5 rounded-xl disabled:opacity-20"
            >
              <ChevronRight className="w-5 h-5 rotate-180" />
            </button>
            <button 
              onClick={onNext}
              disabled={currentIndex === path.length - 1}
              className="p-3 bg-[#00E676] rounded-xl text-[#0A1628] font-bold"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="mt-4 text-[10px] text-white/40 uppercase tracking-wider flex items-center justify-between">
          <span>{offlineReady ? 'Offline pack ready' : 'Offline pack not downloaded'}</span>
          <span>Tip: Keep bluetooth and low-power mode on during long matches.</span>
        </div>
        {textFallback && (
          <div className="mt-3 text-xs rounded-xl border border-[#FFD600]/40 bg-[#FFD600]/10 p-2 text-[#FFD600]">
            Audio fallback active: {textFallback}
          </div>
        )}
      </div>
      {navigationMode && (
        <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center text-center p-6">
          <div>
            <div className="text-4xl font-black mb-2">{distanceToTurn}m</div>
            <div className="text-sm uppercase tracking-widest text-white/60">Distance to next turn</div>
            <div className="mt-3 text-xs text-white/40">Screen dimmed for battery. Voice guidance stays active in background.</div>
          </div>
        </div>
      )}
    </div>
  );
}
