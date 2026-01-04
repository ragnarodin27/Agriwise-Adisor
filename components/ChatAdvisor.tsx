import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, LocationData } from '../types';
import { chatWithAdvisor } from '../services/geminiService';
import { Send, User, Bot, Loader2, ExternalLink, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useLanguage } from '../LanguageContext';

interface ChatAdvisorProps {
  location: LocationData | null;
}

const ChatAdvisor: React.FC<ChatAdvisorProps> = ({ location }) => {
  const { language, t } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: "Hello! I'm your AgriWise advisor. Ask me anything about crop planning, pest control, or soil health.",
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [sources, setSources] = useState<any[]>([]);

  // Update welcome message when language changes (simple reset)
  useEffect(() => {
    setMessages([{
      id: 'welcome',
      role: 'model',
      text: language === 'en' ? "Hello! I'm your AgriWise advisor. Ask me anything." 
            : language === 'hi' ? "नमस्ते! मैं आपका एग्रीवाइज सलाहकार हूं। मुझसे कुछ भी पूछें।"
            : language === 'es' ? "¡Hola! Soy tu asesor AgriWise. Pregúntame lo que quieras."
            : "Hello! Ask me anything.",
      timestamp: Date.now()
    }]);
  }, [language]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    setSources([]);

    try {
      const history = messages
        .filter(m => m.id !== 'welcome') 
        .map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        }));

      // Pass language to service
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
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "Sorry, I'm having trouble connecting to the network. Please try again.",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 relative">
      <div className="bg-white/80 backdrop-blur-md shadow-sm p-4 sticky top-0 z-20 flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
           <div className="bg-green-100 p-1.5 rounded-lg text-green-600">
              <Bot size={20} /> 
           </div>
           {t('nav.advisor')}
        </h2>
        <div className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full flex items-center gap-1">
            <Sparkles size={10} /> AI Powered
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-32 no-scrollbar">
        {messages.map((msg, idx) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-5 py-3.5 shadow-sm text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-green-600 text-white rounded-br-none'
                  : 'bg-white text-slate-700 border border-slate-100 rounded-bl-none'
              }`}
            >
              {msg.role === 'model' ? (
                 <div className="prose prose-sm prose-green max-w-none prose-p:my-1 prose-headings:text-green-800 prose-headings:font-bold prose-strong:text-slate-900">
                   <ReactMarkdown>{msg.text}</ReactMarkdown>
                 </div>
              ) : (
                <p>{msg.text}</p>
              )}
            </div>
            <span className="text-[10px] text-slate-400 mt-1 px-1">
                {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </span>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start animate-in fade-in">
            <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex items-center gap-2">
              <Loader2 className="animate-spin text-green-600" size={16} />
              <span className="text-sm text-slate-400 font-medium">Analyzing...</span>
            </div>
          </div>
        )}
        
        {!isTyping && sources.length > 0 && (
          <div className="flex justify-start animate-in fade-in">
            <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3 max-w-[85%] text-xs">
              <span className="font-bold text-blue-700 block mb-2 flex items-center gap-1"><ExternalLink size={10} /> Referenced Sources</span>
              <ul className="space-y-1.5">
                {sources.map((chunk, idx) => (
                  chunk.web ? (
                  <li key={idx} className="bg-white rounded-md p-1.5 border border-blue-100 shadow-sm">
                    <a href={chunk.web.uri} target="_blank" rel="noopener noreferrer" className="flex items-start gap-1.5 text-slate-600 hover:text-blue-600 transition-colors">
                       <span className="line-clamp-1">{chunk.web.title}</span>
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

      <div className="absolute bottom-[68px] left-0 right-0 p-4 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent">
        <div className="bg-white border border-slate-200 shadow-lg rounded-[2rem] p-1.5 pl-4 flex items-center gap-2 focus-within:ring-2 focus-within:ring-green-500/20 focus-within:border-green-500 transition-all">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about crops, pests, or weather..."
            className="flex-1 bg-transparent outline-none text-slate-700 placeholder-slate-400 text-sm h-10"
            disabled={isTyping}
            autoComplete="off"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className={`h-10 w-10 rounded-full flex items-center justify-center transition-all duration-300 transform ${
              input.trim() && !isTyping 
                ? 'bg-green-600 text-white hover:bg-green-700 hover:scale-105 shadow-md shadow-green-200' 
                : 'bg-slate-100 text-slate-300'
            }`}
          >
            <Send size={18} className={input.trim() ? "translate-x-0.5 translate-y-0.5" : ""} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatAdvisor;