import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, Send, Users, Info, Shield, Hash, Languages, Search, X, Smile, Paperclip } from 'lucide-react';
import { auth, db } from '../firebase';
import { collection, addDoc, onSnapshot, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { cn } from '../lib/utils';

const API_BASE = ((import.meta as any).env?.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:8000';

interface Message {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: any;
  channelId: string;
  userType: 'fan' | 'staff' | 'vip';
  stand?: string;
}

interface FanMessengerProps {
  currentStand?: string;
}

export function FanMessenger({ currentStand = 'Stand A' }: FanMessengerProps) {
  const [activeChannel, setActiveChannel] = useState<'stand' | 'match' | 'concierge'>('stand');
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [zonePhoneList, setZonePhoneList] = useState('');
  const [personalPhone, setPersonalPhone] = useState('');
  const [apiActionLoading, setApiActionLoading] = useState<'bulk' | 'personal' | null>(null);
  const [apiStatus, setApiStatus] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const channels = [
    { id: 'stand', name: `${currentStand} Chat`, icon: Users, color: '#00E676' },
    { id: 'match', name: 'Global Match Talk', icon: Hash, color: '#FFD600' },
    { id: 'concierge', name: 'Support / Concierge', icon: Shield, color: '#29B6F6' }
  ];

  useEffect(() => {
    const q = query(
      collection(db, 'fan_messages'),
      where('channelId', '==', activeChannel),
      orderBy('timestamp', 'asc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      
      // Add a mock staff message if it's the first time
      if (msgs.length === 0 && activeChannel === 'stand') {
        const mockStaffMsg: Message = {
          id: 'staff-1',
          userId: 'staff-system',
          userName: 'Stadium Safety',
          text: 'Welcome to the match! Please keep the aisles clear for safety. Enjoy the game!',
          timestamp: Timestamp.now(),
          channelId: 'stand',
          userType: 'staff'
        };
        setMessages([mockStaffMsg]);
      } else {
        setMessages(msgs);
      }
      setTimeout(scrollToBottom, 100);
    });

    return () => unsubscribe();
  }, [activeChannel]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || !auth.currentUser) return;

    const user = auth.currentUser;
    const newMessage = {
      userId: user.uid,
      userName: user.displayName || 'Anonymous Fan',
      text: inputText,
      timestamp: Timestamp.now(),
      channelId: activeChannel,
      userType: 'fan',
      stand: currentStand
    };

    try {
      await addDoc(collection(db, 'fan_messages'), newMessage);
      setInputText('');
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const parsePhones = (value: string) =>
    value
      .split(',')
      .map((phone) => phone.trim())
      .filter(Boolean);

  const handleBulkZoneAlert = async () => {
    const phoneNumbers = parsePhones(zonePhoneList);
    if (!inputText.trim() || phoneNumbers.length === 0) {
      setApiError('Enter a message and at least one phone number for bulk alert.');
      setApiStatus(null);
      return;
    }
    setApiActionLoading('bulk');
    setApiError(null);
    setApiStatus(null);
    try {
      const response = await fetch(`${API_BASE}/api/v1/notifications/bulk-zone-alert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zone: currentStand,
          message: inputText.trim(),
          phone_numbers: phoneNumbers,
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(result?.detail ?? 'Bulk zone alert failed.');
      }
      setApiStatus(result?.summary ?? `Bulk alert sent to ${phoneNumbers.length} recipients.`);
    } catch (error: any) {
      setApiError(error?.message ?? 'Failed to send bulk zone alert.');
    } finally {
      setApiActionLoading(null);
    }
  };

  const handlePersonalizedExit = async () => {
    if (!personalPhone.trim()) {
      setApiError('Enter a phone number for personalized exit alert.');
      setApiStatus(null);
      return;
    }
    setApiActionLoading('personal');
    setApiError(null);
    setApiStatus(null);
    try {
      const response = await fetch(`${API_BASE}/api/v1/notifications/personalized-exit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fan_name: auth.currentUser?.displayName || 'Guest User',
          phone_number: personalPhone.trim(),
          seat: 'N-Stand / Row G / 42',
          estimated_exit_time: '18 minutes',
          zone: currentStand,
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(result?.detail ?? 'Personalized exit alert failed.');
      }
      setApiStatus(result?.summary ?? 'Personalized exit message queued.');
    } catch (error: any) {
      setApiError(error?.message ?? 'Failed to send personalized exit alert.');
    } finally {
      setApiActionLoading(null);
    }
  };

  return (
    <div className="bg-[#112240] rounded-3xl border border-white/10 flex flex-col h-[600px] overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="p-4 bg-[#0A1628] border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#00E676]/10 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-[#00E676]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Fan Messenger</h3>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00E676] animate-pulse" />
              <span className="text-[10px] text-white/40 font-bold uppercase tracking-wider">
                {messages.length * 7 + 124} Fans Online
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsTranslating(!isTranslating)}
            className={cn(
              "p-2 rounded-lg transition-all",
              isTranslating ? "bg-[#29B6F6] text-[#0A1628]" : "bg-white/5 text-white/40"
            )}
          >
            <Languages className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Channel Tabs */}
      <div className="flex p-2 bg-[#0A1628]/50 gap-1 border-b border-white/5">
        {channels.map(channel => (
          <button
            key={channel.id}
            onClick={() => setActiveChannel(channel.id as any)}
            className={cn(
              "flex-1 py-2 px-3 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all",
              activeChannel === channel.id 
                ? "bg-white/10 text-white" 
                : "text-white/30 hover:text-white/50"
            )}
          >
            <channel.icon className="w-3.5 h-3.5" style={{ color: activeChannel === channel.id ? channel.color : 'currentColor' }} />
            <span className="hidden sm:inline">{channel.name}</span>
          </button>
        ))}
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide bg-gradient-to-b from-transparent to-[#0A1628]/30"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-20 px-8">
            <MessageSquare className="w-12 h-12 mb-4" />
            <p className="text-sm font-bold uppercase tracking-widest">Start the conversation</p>
            <p className="text-xs mt-2 italic">Be the first to cheer for your team in {currentStand}!</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.userId === auth.currentUser?.uid;
            return (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                key={msg.id}
                className={cn(
                  "flex flex-col max-w-[85%]",
                  isMe ? "ml-auto items-end" : "items-start"
                )}
              >
                {!isMe && (
                  <span className="text-[10px] font-bold text-white/30 mb-1 ml-2 flex items-center gap-2">
                    {msg.userName}
                    {msg.userType === 'staff' && (
                      <span className="px-1.5 py-0.5 bg-[#29B6F6]/10 text-[#29B6F6] rounded text-[8px] uppercase">Staff</span>
                    )}
                  </span>
                )}
                <div className={cn(
                  "px-4 py-3 rounded-2xl text-sm shadow-lg",
                  isMe 
                    ? "bg-[#00E676] text-[#0A1628] font-medium rounded-tr-none" 
                    : "bg-white/5 text-white/90 border border-white/5 rounded-tl-none"
                )}>
                  {msg.text}
                </div>
                <span className="text-[8px] text-white/20 mt-1 px-1">
                  {msg.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-[#0A1628] border-t border-white/5">
        <form onSubmit={handleSendMessage} className="flex gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Message ${activeChannel === 'stand' ? currentStand : 'Match Talk'}...`}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-4 pr-12 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-[#00E676]/50 transition-all"
            />
            <button 
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-white/20 hover:text-white/40 transition-colors"
            >
              <Smile className="w-5 h-5" />
            </button>
          </div>
          <button 
            type="submit"
            disabled={!inputText.trim()}
            className="w-12 h-12 bg-[#00E676] rounded-2xl flex items-center justify-center text-[#0A1628] disabled:opacity-20 hover:scale-105 transition-all active:scale-95 shadow-lg shadow-[#00E676]/20"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
          <input
            type="text"
            value={zonePhoneList}
            onChange={(e) => setZonePhoneList(e.target.value)}
            placeholder="Bulk phones (comma-separated)"
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs text-white placeholder:text-white/25 focus:outline-none focus:border-[#29B6F6]/50"
          />
          <input
            type="text"
            value={personalPhone}
            onChange={(e) => setPersonalPhone(e.target.value)}
            placeholder="Personal phone number"
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs text-white placeholder:text-white/25 focus:outline-none focus:border-[#29B6F6]/50"
          />
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleBulkZoneAlert}
            disabled={apiActionLoading !== null}
            className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg bg-[#29B6F6]/20 text-[#29B6F6] disabled:opacity-50"
          >
            {apiActionLoading === 'bulk' ? 'Sending Bulk…' : 'Send Bulk Zone Alert'}
          </button>
          <button
            type="button"
            onClick={handlePersonalizedExit}
            disabled={apiActionLoading !== null}
            className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg bg-[#FFD600]/20 text-[#FFD600] disabled:opacity-50"
          >
            {apiActionLoading === 'personal' ? 'Sending Exit…' : 'Send Personalized Exit'}
          </button>
        </div>
        {apiStatus && (
          <div className="mt-2 text-[10px] text-[#00E676] font-semibold">{apiStatus}</div>
        )}
        {apiError && (
          <div className="mt-2 text-[10px] text-[#FF1744] font-semibold">{apiError}</div>
        )}
        <div className="mt-3 flex items-center gap-4 opacity-30">
          <button className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest hover:opacity-100 transition-opacity">
            <Paperclip className="w-3 h-3" />
            Photo
          </button>
          <button className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest hover:opacity-100 transition-opacity">
            <Users className="w-3 h-3" />
            Invite
          </button>
        </div>
      </div>
    </div>
  );
}
