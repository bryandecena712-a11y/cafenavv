'use client';

import { useState, useRef, useEffect } from 'react';
import { ChatTeardropText, X, PaperPlaneRight, Robot } from '@phosphor-icons/react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hi there! I am your AI Barista. Looking for a specific vibe or drink? Let me know!' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    const newMessages = [...messages, { role: 'user' as const, content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setMessages([...newMessages, { role: 'assistant', content: data.text }]);
      } else {
        setMessages([...newMessages, { role: 'assistant', content: "Oops, my espresso machine broke down! I couldn't brew a response right now." }]);
      }
    } catch (err) {
      setMessages([...newMessages, { role: 'assistant', content: 'Sorry, I am having trouble connecting right now.' }]);
    }
    
    setIsLoading(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat Window */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-80 sm:w-96 h-[500px] bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300">
          
          {/* Header */}
          <div className="bg-amber-500 p-4 flex justify-between items-center text-zinc-950">
            <div className="flex items-center gap-2 font-bold">
              <Robot size={24} weight="duotone" />
              <span>AI Barista</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-amber-600 p-1 rounded-lg transition-colors">
              <X size={20} weight="bold" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${msg.role === 'user' ? 'bg-amber-500 text-zinc-950 rounded-br-sm' : 'bg-zinc-800 text-white rounded-bl-sm'}`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-zinc-800 text-zinc-400 rounded-2xl rounded-bl-sm px-4 py-2 text-sm flex gap-1 items-center">
                  <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-white/10 bg-zinc-950 flex gap-2">
            <input 
              type="text" 
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask for a recommendation..."
              className="flex-1 bg-zinc-900 border border-white/10 rounded-full px-4 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
            />
            <button 
              type="submit" 
              disabled={isLoading || !input.trim()}
              className="w-10 h-10 bg-amber-500 text-zinc-950 rounded-full flex items-center justify-center disabled:opacity-50 hover:bg-amber-400 transition-colors"
            >
              <PaperPlaneRight size={20} weight="fill" />
            </button>
          </form>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-transform hover:scale-105 active:scale-95 ${isOpen ? 'bg-zinc-800 text-white border border-white/10' : 'bg-amber-500 text-zinc-950'}`}
      >
        {isOpen ? <X size={28} weight="bold" /> : <ChatTeardropText size={32} weight="duotone" />}
      </button>
    </div>
  );
}
