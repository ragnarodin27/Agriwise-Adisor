
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, LocationData } from '../types';
import { chatWithAdvisor, generateSpeech } from '../services/geminiService';
import { Send, User, Bot, Loader2, ExternalLink, Sparkles, MapPin, Leaf, CloudSun, AlertCircle, ChevronDown, Check, Volume2, StopCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useLanguage } from '../LanguageContext';

interface ChatAdvisorProps {
  location: LocationData | null;
}

const SUGGESTIONS = [
  { label: "Identify a pest", icon: <Bot size={14} />, prompt: "I have a pest problem. Can you help me identify it and suggest organic controls?" },
  { label: "Organic fertilizer", icon: <Leaf size={14} />, prompt: "What are the best organic fertilizers for vegetable crops in my region?" },
  { label: "Weather impact", icon: <CloudSun size={14} />, prompt: "How will the current weather affect my standing crops?" },
  { label: "Soil health", icon: <MapPin size={14} />, prompt: "How can I improve my soil organic matter without using synthetic inputs?" },
];

const ChatAdvisor: React.FC<ChatAdvisorProps> = ({ location }) => {
  const { language, t } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [sources, setSources] = useState<any[]>([]);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    // Initial greeting
    if (messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'model',
        text: language === 'en' ? "Hello! I am your professional AgriWise Consultant. I can help with crop diagnostics, organic inputs, and localized farming strategies. How can I assist you today?" 
              : "Hello! I am your AgriWise Consultant. How can I help?",
        timestamp: Date.now()
      }]);
    }
    return () => stopAudio();
  }, [language]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (textOverride?: string) => {
    stopAudio();
    const textToSend = textOverride || input;
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: textToSend,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    setSources([]);

    try {
      // Prepare history for API
      const history = messages
        .filter(m => m.id !== 'welcome') 
        .map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        }));

      const { text, sources: newSources } = await chatWithAdvisor(userMsg.text, history, location || undefined, language);

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: text,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, botMsg]);
      setSources(newSources);

    } catch (error) {
      console.error(error);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "I encountered a network issue while consulting the knowledge base. Please check your connection and try again.",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext) => {
    // 24000 sample rate for standard Gemini TTS models, 1 channel
    const sampleRate = 24000;
    const numChannels = 1;
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  };

  const stopAudio = () => {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop();
      sourceNodeRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setPlayingId(null);
  };

  const handleSpeak = async (msgId: string, text: string) => {
    if (playingId === msgId) {
      stopAudio();
      return;
    }
    stopAudio();
    setPlayingId(msgId);

    try {
      const base64Audio = await generateSpeech(text.replace(/[*#_]/g, ' '), language);
      if (!base64Audio) return;

      const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
      audioContextRef.current = outputAudioContext;
      
      const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext);
      
      const source = outputAudioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(outputAudioContext.destination);
      source.onended = () => setPlayingId(null);
      source.start();
      sourceNodeRef.current = source;
    } catch (e) {
      console.error("Audio playback error:", e);
      setPlayingId(null);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 relative">
      {/* Professional Header */}
      <div className="bg-white/90 backdrop-blur-xl border-b border-slate-200 p-4 sticky top-0 z-30 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
           <div className="bg-gradient-to-br from-green-500 to-emerald-700 p-2 rounded-xl text-white shadow-lg shadow-green-200">
              <Bot size={22} /> 
           </div>
           <div>
             <h2 className="text-lg font-black text-slate-800 leading-none">{t('nav.advisor')}</h2>
             <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest flex items-center gap-1 mt-1">
               <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> Online
             </span>
           </div>
        </div>
        <div className="bg-slate-100 text-slate-500 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
            <Sparkles size={10} className="text-amber-500" /> Pro v3.2
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-32 no-scrollbar">
        <div className="space-y-6 max-w-3xl mx-auto">
          {/* Welcome / Empty State Suggestions */}
          {messages.length === 1 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 animate-in slide-in-from-bottom-4 fade-in duration-500">
              {SUGGESTIONS.map((s, i) => (
                <button 
                  key={i} 
                  onClick={() => handleSend(s.prompt)}
                  className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-green-200 transition-all text-left group"
                >
                  <div className="flex items-center gap-2 mb-2 text-slate-400 group-hover:text-green-600 transition-colors">
                    <div className="p-1.5 bg-slate-50 group-hover:bg-green-50 rounded-lg">{s.icon}</div>
                    <span className="text-[10px] font-black uppercase tracking-widest">{s.label}</span>
                  </div>
                  <p className="text-xs font-medium text-slate-700 leading-relaxed group-hover:text-slate-900">"{s.prompt}"</p>
                </button>
              ))}
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
            >
              <div className="flex items-end gap-2 max-w-[90%] sm:max-w-[80%]">
                {msg.role === 'model' && (
                  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mb-1">
                    <Bot size={14} className="text-emerald-700" />
                  </div>
                )}
                
                <div
                  className={`rounded-2xl px-5 py-3.5 shadow-sm text-sm leading-relaxed relative group ${
                    msg.role === 'user'
                      ? 'bg-slate-900 text-white rounded-br-none'
                      : 'bg-white text-slate-700 border border-slate-100 rounded-bl-none'
                  }`}
                >
                  {msg.role === 'model' ? (
                     <div className="prose prose-sm prose-slate max-w-none prose-p:my-1 prose-headings:text-slate-900 prose-headings:font-black prose-strong:text-slate-900 prose-ul:my-1 prose-li:my-0.5">
                       <ReactMarkdown>{msg.text}</ReactMarkdown>
                     </div>
                  ) : (
                    <p>{msg.text}</p>
                  )}
                  
                  <div className={`absolute -bottom-5 ${msg.role === 'user' ? 'right-0' : 'left-0'} text-[9px] font-bold text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap`}>
                    {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>

                  {msg.role === 'model' && (
                    <button 
                      onClick={() => handleSpeak(msg.id, msg.text)}
                      className="absolute -right-10 top-2 p-2 bg-slate-100 rounded-full text-slate-500 hover:text-green-600 transition-colors opacity-0 group-hover:opacity-100 active:scale-95"
                    >
                      {playingId === msg.id ? <StopCircle size={16} className="text-red-500 animate-pulse" /> : <Volume2 size={16} />}
                    </button>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center shrink-0 mb-1">
                    <User size={14} className="text-slate-500" />
                  </div>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start animate-in fade-in pl-8">
              <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex items-center gap-3">
                <Loader2 className="animate-spin text-green-600" size={16} />
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Consulting Agronomist...</span>
              </div>
            </div>
          )}
          
          {!isTyping && sources.length > 0 && (
            <div className="flex justify-start animate-in fade-in pl-8 mt-2">
              <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 max-w-[85%] text-xs">
                <span className="font-black text-blue-700 block mb-3 flex items-center gap-1.5 uppercase tracking-widest text-[9px]">
                  <ExternalLink size={10} /> Verified References
                </span>
                <ul className="space-y-2">
                  {sources.map((chunk, idx) => (
                    chunk.web ? (
                    <li key={idx}>
                      <a 
                        href={chunk.web.uri} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="flex items-start gap-2 text-slate-600 hover:text-blue-600 transition-colors group bg-white p-2 rounded-lg border border-slate-100 hover:border-blue-200"
                      >
                         <div className="mt-0.5 bg-blue-100 text-blue-600 p-0.5 rounded text-[8px] font-bold shrink-0">{idx + 1}</div>
                         <span className="line-clamp-2 font-medium group-hover:underline">{chunk.web.title}</span>
                      </a>
                    </li>
                    ) : null
                  ))}
                </ul>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="absolute bottom-[68px] left-0 right-0 p-3 sm:p-4 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent z-20">
        <div className="max-w-3xl mx-auto bg-white border border-slate-200 shadow-[0_8px_30px_rgba(0,0,0,0.04)] rounded-[2rem] p-1.5 pl-5 flex items-center gap-3 transition-all focus-within:ring-4 focus-within:ring-green-500/10 focus-within:border-green-500/50">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask anything about your farm..."
            className="flex-1 bg-transparent outline-none text-slate-800 placeholder-slate-400 text-sm font-medium h-12"
            disabled={isTyping}
            autoComplete="off"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isTyping}
            className={`h-11 w-11 rounded-full flex items-center justify-center transition-all duration-300 transform ${
              input.trim() && !isTyping 
                ? 'bg-slate-900 text-white hover:bg-black hover:scale-105 shadow-md' 
                : 'bg-slate-100 text-slate-300'
            }`}
          >
            {isTyping ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className={input.trim() ? "translate-x-0.5 translate-y-0.5" : ""} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatAdvisor;
