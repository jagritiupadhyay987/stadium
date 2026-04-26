import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, X, Search, Navigation, Utensils, Info, AlertOctagon, Users, PlayCircle, Hash, Languages } from 'lucide-react';
import { cn } from '../lib/utils';

interface VoiceCommandModalProps {
  onCommand: (action: string, data?: any) => void;
}

const API_BASE = ((import.meta as any).env?.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:8000';

export function VoiceCommandModal({ onCommand }: VoiceCommandModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [recognition, setRecognition] = useState<any>(null);
  const [suggestions] = useState([
    { icon: Navigation, text: "Where is my seat?", color: "#00E676" },
    { icon: Utensils, text: "Nearest food", color: "#FFD600" },
    { icon: Search, text: "Nearest restroom", color: "#9C6BFF" },
    { icon: AlertOctagon, text: "Emergency exit", color: "#FF5252" },
    { icon: Users, text: "Find my friend", color: "#29B6F6" },
    { icon: PlayCircle, text: "Replay last wicket", color: "#E040FB" },
    { icon: Hash, text: "What is the score?", color: "#FF6D00" },
    { icon: Languages, text: "Switch to Hindi", color: "#FFFFFF" }
  ]);

  const processCommand = useCallback(async (text: string) => {
    if (!text.trim()) return;
    try {
      const response = await fetch(`${API_BASE}/api/v1/voice/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: text })
      });
      const result = await response.json();
      onCommand(result.action, result.target);
      setTranscript(text);
      setTimeout(() => setIsOpen(false), 1200);
    } catch (error) {
      console.error("Command processing failed", error);
    }
  }, [onCommand]);

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setTranscript("Speech recognition not supported in this browser.");
      return;
    }

    const recognitionInstance = new SpeechRecognition();
    recognitionInstance.continuous = false;
    recognitionInstance.interimResults = true;
    recognitionInstance.lang = 'en-US';

    recognitionInstance.onstart = () => {
      setIsListening(true);
      setTranscript('Listening...');
    };

    recognitionInstance.onresult = (event: any) => {
      const current = event.results[event.results.length - 1][0].transcript;
      setTranscript(current);
    };

    recognitionInstance.onend = async () => {
      setIsListening(false);
      if (transcript && transcript !== 'Listening...') {
        await processCommand(transcript);
      }
    };

    recognitionInstance.start();
    setRecognition(recognitionInstance);
  }, [transcript, processCommand]);

  useEffect(() => {
    if (isOpen) {
      startListening();
      return;
    }
    recognition?.stop?.();
  }, [isOpen, startListening, recognition]);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-[90] w-14 h-14 rounded-full bg-[#00E676] text-[#0A1628] flex items-center justify-center shadow-xl hover:scale-105 transition-transform"
        aria-label="Open voice assistant"
      >
        <Mic className="w-6 h-6" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-[#0A1628]/95 backdrop-blur-xl"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg bg-[#112240] rounded-[40px] border border-white/10 shadow-2xl overflow-hidden"
          >
            <div className="p-8 text-center">
              <div className="flex justify-end mb-4">
                <button onClick={() => setIsOpen(false)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="relative inline-block mb-8">
                <motion.div
                  animate={isListening ? {
                    scale: [1, 1.5, 1],
                    opacity: [0.3, 0.1, 0.3]
                  } : {}}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute inset-0 bg-[#00E676] rounded-full blur-2xl"
                />
                <button 
                  onClick={startListening}
                  className={cn(
                    "relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-500",
                    isListening ? "bg-[#00E676] scale-110" : "bg-white/5 hover:bg-white/10"
                  )}
                >
                  <Mic className={cn("w-10 h-10 transition-colors", isListening ? "text-[#0A1628]" : "text-[#00E676]")} />
                </button>
              </div>

              <h2 className="text-3xl font-black mb-2 italic">
                {isListening ? "I'm Listening..." : "Voice Assistant"}
              </h2>
              <p className="text-white/40 font-medium mb-12 min-h-[1.5em]">
                {transcript || "Try saying 'Where is my seat?'"}
              </p>

              <div className="space-y-3">
                <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] mb-4">Suggestions</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {suggestions.map((item, i) => (
                    <button
                      key={i}
                      onClick={() => processCommand(item.text)}
                      className="flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all group text-left"
                    >
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/5 group-hover:scale-110 transition-transform">
                        <item.icon className="w-5 h-5" style={{ color: item.color }} />
                      </div>
                      <span className="text-sm font-bold text-white/80">{item.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
