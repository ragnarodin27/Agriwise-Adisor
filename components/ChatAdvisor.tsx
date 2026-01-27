
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, LocationData, UserProfile } from '../types';
import { chatWithAdvisor, generateSpeech, summarizeConversation } from '../services/geminiService';
import { Send, User, Sparkles, Loader2, Volume2, Mic, Bot, ShieldCheck, Globe, X, FileText, CheckCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useLanguage } from '../LanguageContext';

interface ChatAdvisorProps {
  location: LocationData | null;
}

const BugIcon = ({size}: {size: number}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m8 2 1.88 1.88"/><path d="M14.12 3.88 16 2"/><path d="M9 7.13v-1a3.003 3.003 0 1 1 6 0v1"/><path d="M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6"/><path d="M12 20v-9"/><path d="M6.53 9C4.6 8.8 3 7.1 3 5"/><path d="M6 13H2"/><path d="M3 21c0-2.1 1.7-3.9 3.8-4"/><path d="M20.97 5c0 2.1-1.6 3.8-3.5 4"/><path d="M22 13h-4"/><path d="M17.2 17c2.1.1 3.8 1.9 3.8 4"/></svg>
);

const LeafIcon = ({size}: {size: number}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 4 13H2a10 10 0 0 0 10 10z"/><path d="M2 13h2a7 7 0 0 1 7-7V4a10 10 0 0 0-10 9z"/></svg>
);

const CloudSunIcon = ({size}: {size: number}) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 16.5V22"/><path d="M12 2v2.5"/><path d="m4.22 4.22 1.72 1.72"/><path d="m18.06 18.06 1.72 1.72"/><path d="M2 12h2.5"/><path d="M19.5 12H22"/><path d="m4.22 19.78 1.72-1.72"/><path d="m18.06 5.94 1.72-1.72"/><path d="M16 12a4 4 0 0 0-8 0"/><path d="M12 12h.01"/></svg>
);

const SUGGESTIONS = [
  { label: "ORGANIC PEST ID", icon: <BugIcon size={20} />, prompt: "How do I identify and treat pests on my crops using only natural methods?", color: "text-rose-600", bg: "bg-rose-50 dark:bg-rose-900/20" },
  { label: "FERTILIZER CYCLE", icon: <LeafIcon size={20} />, prompt: "What is the best organic fertilizer schedule for my current crops?", color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
  { label: "WEATHER SAFETY", icon: <CloudSunIcon size={20} />, prompt: "Is it safe to plant seeds given the next 7 days of weather?", color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" }
];

const AIOrb = ({ size = 'md', state = 'idle' }: { size?: 'sm' | 'md' | 'lg' | 'xl', state?: 'idle' | 'thinking' | 'speaking' | 'listening' }) => {
  const sizeClasses = { sm: "w-8 h-8", md: "w-12 h-12", lg: "w-32 h-32", xl: "w-48 h-48" };
  const isThinking = state === 'thinking';
  const isListening = state === 'listening';
  
  return (
    <div className={`relative flex items-center justify-center ${sizeClasses[size]} transition-all duration-700`}>
      <div className={`absolute inset-0 rounded-full bg-gradient-to-tr from-emerald-400 to-cyan-400 blur-xl opacity-40 
        ${isThinking ? 'animate-pulse-fast' : isListening ? 'scale-125 opacity-60 animate-pulse' : 'animate-pulse-slow'}`}>
      </div>
      <div className={`absolute inset-0 rounded-full bg-white dark:bg-[#1C2B22] shadow-inner border border-white/20 overflow-hidden ${isThinking ? 'animate-spin-slow' : 'animate-float'}`}>
         <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-t from-emerald-400/20 to-transparent"></div>
         <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-gradient-to-br from-transparent via-white/40 to-transparent rotate-45 transform translate-y-full animate-shimmer"></div>
      </div>
      <div className={`relative z-10 transition-colors duration-300 ${isListening ? 'text-red-500' : 'text-emerald-600'}`}>
        {isListening ? <Mic size={size === 'md' ? 20 : 48} className="animate-pulse" /> : <Sparkles size={size === 'md' ? 20 : 48} className={isThinking ? 'animate-bounce' : ''} />}
      </div>
    </div>
  );
};

const ChatAdvisor: React.FC<ChatAdvisorProps> = ({ location }) => {
  const { language, t } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeakingId, setIsSpeakingId] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [profile, setProfile] = useState<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('agri_user_profile');
    if (saved) setProfile(JSON.parse(saved));
    
    if (messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'model',
        text: "Namaste! I am your AgriChatbot, your 24/7 global agronomy partner. I am ready to provide localized advice compliant with international farming standards. How can I help you improve your yields today?",
        timestamp: Date.now()
      }]);
    }
  }, []);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isTyping, summary]);

  const handleSpeech = async (text: string, msgId: string) => {
    if (isSpeakingId === msgId) {
      audioRef.current?.pause();
      setIsSpeakingId(null);
      return;
    }
    
    setIsSpeakingId(msgId);
    try {
      const base64Audio = await generateSpeech(text, language);
      if (base64Audio) {
        const audioBlob = await (await fetch(`data:audio/pcm;base64,${base64Audio}`)).blob();
        const url = URL.createObjectURL(audioBlob);
        if (audioRef.current) audioRef.current.src = url;
        else {
           audioRef.current = new Audio(url);
           audioRef.current.onended = () => setIsSpeakingId(null);
        }
        audioRef.current.play();
      }
    } catch (e) {
      console.error("Speech error", e);
      setIsSpeakingId(null);
    }
  };

  const handleSummarize = async () => {
    if (messages.length <= 1 || isSummarizing) return;
    setIsSummarizing(true);
    try {
      const history = messages.filter(m => m.id !== 'welcome').map(m => ({ role: m.role, parts: [{ text: m.text }] }));
      const summaryText = await summarizeConversation(history, language);
      setSummary(summaryText);
    } catch (error) {
      console.error("Summary error", error);
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: textToSend, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setSummary(null); // Clear summary when new messages are sent
    setInput('');
    setIsTyping(true);

    try {
      const history = messages.filter(m => m.id !== 'welcome').map(m => ({ role: m.role, parts: [{ text: m.text }] }));
      const { text } = await chatWithAdvisor(textToSend, history, location || undefined, language, profile);
      const botMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'model', text: text, timestamp: Date.now() };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      setMessages(prev => [...prev, { id: 'err', role: 'model', text: "Forgive me, my connection is weak. Please ask again.", timestamp: Date.now() }]);
    } finally { setIsTyping(false); }
  };

  const toggleListening = () => {
    if (isListening) {
      setIsListening(false);
      handleSend();
    } else {
      setIsListening(true);
      // Mock listening for demo if browser speech recognition is not implemented
      setTimeout(() => {
        setIsListening(false);
        setInput("Analyze my crop rotation for nitrogen fixation.");
      }, 2500);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-[#0E1F17] relative transition-colors duration-500">
      
      <div className="relative z-30 pt-safe-top px-6 py-4 backdrop-blur-md bg-white/70 dark:bg-[#0E1F17]/70 border-b border-slate-200 dark:border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg">
             <Bot size={22} />
           </div>
           <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-emerald-50">AgriChatbot</h2>
              <div className="flex items-center gap-1.5">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                 <span className="text-[9px] font-black uppercase text-slate-400 dark:text-emerald-400/50 tracking-widest">Global Node Active</span>
              </div>
           </div>
        </div>
        <button 
          onClick={handleSummarize} 
          disabled={messages.length <= 1 || isSummarizing}
          className="p-3 bg-white dark:bg-[#1C2B22] rounded-xl shadow-soft text-slate-500 dark:text-emerald-400 border border-slate-100 dark:border-white/5 disabled:opacity-30 active:scale-95 transition-all flex items-center gap-2"
        >
          {isSummarizing ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
          <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Summary</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-40 no-scrollbar relative z-10">
        <div className="max-w-2xl mx-auto space-y-8">
          
          {messages.length <= 1 && (
            <div className="flex flex-col items-center py-8 text-center animate-in fade-in duration-1000">
               <AIOrb size="lg" state={isListening ? 'listening' : isTyping ? 'thinking' : 'idle'} />
               <div className="bg-white dark:bg-[#1C2B22] p-8 rounded-[3rem] shadow-soft border border-slate-100 dark:border-white/5 -mt-16 w-full">
                 <h1 className="text-2xl font-black text-slate-900 dark:text-emerald-50 mt-16 mb-2 tracking-tight">AgriChatbot AI</h1>
                 <p className="text-slate-500 dark:text-emerald-400/60 text-xs font-medium max-w-xs mx-auto leading-relaxed mb-8">
                   World-class AI logic for identifying pests, optimizing soil, and managing your farm.
                 </p>
                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                   {SUGGESTIONS.map((s, i) => (
                     <button 
                       key={i} 
                       onClick={() => handleSend(s.prompt)} 
                       className={`flex flex-col items-center justify-center gap-3 p-4 rounded-3xl border border-slate-100 dark:border-white/5 transition-all active:scale-[0.98] group hover:bg-slate-50 dark:hover:bg-white/5 ${s.bg}`}
                     >
                        <div className={`p-3 rounded-2xl shadow-sm ${s.color}`}>
                          {s.icon}
                        </div>
                        <span className={`text-[9px] font-black uppercase tracking-widest text-slate-600 dark:text-emerald-400/80`}>{s.label}</span>
                     </button>
                   ))}
                 </div>
               </div>
            </div>
          )}

          {summary && (
            <div className="animate-in slide-in-from-top-4 duration-500">
               <div className="bg-indigo-50 dark:bg-indigo-950/20 p-6 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/30">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle size={16} className="text-indigo-600" />
                    <span className="text-[10px] font-black uppercase text-indigo-600 tracking-widest">Actionable Conversation Summary</span>
                  </div>
                  <div className="prose prose-sm dark:prose-invert max-w-none text-xs text-indigo-900 dark:text-indigo-200">
                    <ReactMarkdown>{summary}</ReactMarkdown>
                  </div>
               </div>
            </div>
          )}

          {messages.length > 1 && messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-4`}>
              <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                 <div className="mt-auto shrink-0">
                    {msg.role === 'user' ? (
                      <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-[#1C2B22] flex items-center justify-center text-slate-500"><User size={14} /></div>
                    ) : (
                      <AIOrb size="sm" state={isTyping && msg.id === messages[messages.length-1].id ? 'thinking' : 'idle'} />
                    )}
                 </div>
                 <div className={`p-5 rounded-[2rem] shadow-sm text-sm leading-relaxed relative ${msg.role === 'user' ? 'bg-slate-900 dark:bg-emerald-600 text-white rounded-br-none' : 'bg-white dark:bg-[#1C2B22] text-slate-700 dark:text-emerald-50/90 rounded-bl-none border border-slate-100 dark:border-white/5'}`}>
                   {msg.role === 'model' && (
                     <button onClick={() => handleSpeech(msg.text, msg.id)} className={`absolute top-2 right-2 p-1.5 rounded-lg transition-colors ${isSpeakingId === msg.id ? 'bg-emerald-500 text-white' : 'text-slate-300 hover:text-emerald-500'}`}>
                       {isSpeakingId === msg.id ? <X size={14} /> : <Volume2 size={14} />}
                     </button>
                   )}
                   <div className="prose prose-sm prose-slate dark:prose-invert max-w-none pr-6">
                     <ReactMarkdown>{msg.text}</ReactMarkdown>
                   </div>
                 </div>
              </div>
            </div>
          ))}

          {isTyping && ( <div ref={messagesEndRef} /> )}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4 pt-2 safe-pb z-20 bg-gradient-to-t from-slate-50 dark:from-[#0E1F17] to-transparent">
        <div className="w-full max-w-2xl mx-auto flex items-end gap-3">
          <div className="flex-1 bg-white/90 dark:bg-[#1C2B22]/90 backdrop-blur-xl border border-slate-200 dark:border-white/10 shadow-2xl rounded-[2.5rem] p-1.5 pl-6 flex items-center transition-all focus-within:ring-4 focus-within:ring-emerald-500/10">
             <input
               type="text"
               value={input}
               onChange={(e) => setInput(e.target.value)}
               onKeyDown={(e) => e.key === 'Enter' && handleSend()}
               placeholder={isListening ? "Listening..." : "Message AgriChatbot..."}
               className="flex-1 bg-transparent outline-none text-slate-800 dark:text-emerald-50 placeholder-slate-400 text-sm font-bold h-12"
             />
             <button onClick={() => handleSend()} className={`h-11 w-11 rounded-full flex items-center justify-center transition-all ${input.trim() ? 'bg-emerald-600 text-white scale-100 shadow-lg' : 'bg-slate-100 dark:bg-[#0E1F17] text-slate-300 scale-90'}`}>
                <Send size={18} />
             </button>
          </div>
          <button onClick={toggleListening} className={`h-16 w-16 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-90 border-4 border-white dark:border-[#0E1F17] ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-emerald-600 text-white'}`}>
             {isListening ? <Loader2 size={24} className="animate-spin" /> : <Mic size={24} />}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes pulse-fast { 0%, 100% { opacity: 0.5; transform: scale(1); } 50% { opacity: 0.8; transform: scale(1.1); } }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes shimmer { 0% { transform: translateX(-150%) rotate(45deg); } 100% { transform: translateX(150%) rotate(45deg); } }
        .animate-pulse-fast { animation: pulse-fast 1.5s infinite ease-in-out; }
        .animate-float { animation: float 6s infinite ease-in-out; }
        .animate-shimmer { animation: shimmer 2s infinite linear; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default ChatAdvisor;
