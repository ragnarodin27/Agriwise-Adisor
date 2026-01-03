import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, LocationData } from '../types';
import { chatWithAdvisor } from '../services/geminiService';
import { Send, User, Bot, Loader2, ExternalLink } from 'lucide-react';
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
    <div className="flex flex-col h-screen pb-16 bg-gray-50">
      <div className="bg-white shadow-sm p-4 sticky top-0 z-10">
        <h2 className="text-xl font-bold text-green-900 flex items-center gap-2">
           <Bot className="text-green-600" /> {t('nav.advisor')}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl p-4 shadow-sm ${
                msg.role === 'user'
                  ? 'bg-green-600 text-white rounded-tr-none'
                  : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none'
              }`}
            >
              {msg.role === 'model' ? (
                 <div className="prose prose-sm prose-green max-w-none">
                   <ReactMarkdown>{msg.text}</ReactMarkdown>
                 </div>
              ) : (
                <p>{msg.text}</p>
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-none p-4 shadow-sm flex items-center gap-2">
              <Loader2 className="animate-spin text-green-600" size={16} />
              <span className="text-sm text-gray-500">Thinking...</span>
            </div>
          </div>
        )}
        
        {!isTyping && sources.length > 0 && (
          <div className="flex justify-start">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 max-w-[85%] text-xs">
              <span className="font-semibold text-blue-800 block mb-1">Sources & References:</span>
              <ul className="space-y-1">
                {sources.map((chunk, idx) => (
                  chunk.web ? (
                  <li key={idx}>
                    <a href={chunk.web.uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline">
                      <ExternalLink size={10} /> {chunk.web.title}
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

      <div className="p-4 bg-white border-t border-gray-100">
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-300 rounded-full px-4 py-2 focus-within:ring-2 focus-within:ring-green-500 focus-within:border-transparent transition-all">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about crops, pests, or weather..."
            className="flex-1 bg-transparent outline-none text-gray-700 placeholder-gray-400"
            disabled={isTyping}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className={`p-2 rounded-full transition-colors ${
              input.trim() && !isTyping ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-200 text-gray-400'
            }`}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatAdvisor;