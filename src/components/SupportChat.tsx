import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, MessageCircle, X } from 'lucide-react';
import { cn } from '@/src/utils/cn';

export default function SupportChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{ text: string; isUser: boolean }[]>([
    { text: 'Olá! Como podemos ajudar você hoje?', isUser: false }
  ]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setChatHistory([...chatHistory, { text: message, isUser: true }]);
    setMessage('');
    
    // Simulate admin response
    setTimeout(() => {
      setChatHistory(prev => [...prev, { text: 'Um de nossos especialistas entrará em contato em breve.', isUser: false }]);
    }, 1000);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="bg-emerald-600 text-white p-4 rounded-full shadow-lg hover:bg-emerald-700 transition-colors flex items-center justify-center"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </motion.button>

      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="absolute bottom-20 right-0 w-80 bg-white rounded-2xl shadow-2xl border border-zinc-200 overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="bg-emerald-600 p-4 text-white">
            <h3 className="font-semibold">Suporte Iris Agenda</h3>
            <p className="text-xs opacity-80">Online agora</p>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 h-80 overflow-y-auto space-y-4 bg-zinc-50">
            {chatHistory.map((msg, i) => (
              <div
                key={i}
                className={cn(
                  "max-w-[80%] p-3 rounded-2xl text-sm",
                  msg.isUser
                    ? "bg-emerald-600 text-white ml-auto rounded-tr-none"
                    : "bg-white text-zinc-800 mr-auto rounded-tl-none border border-zinc-200 shadow-sm"
                )}
              >
                {msg.text}
              </div>
            ))}
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-4 bg-white border-t border-zinc-100">
            <div className="flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Digite sua mensagem..."
                className="flex-1 bg-zinc-100 border-none rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
              <button
                type="submit"
                className="bg-emerald-600 text-white p-2 rounded-full hover:bg-emerald-700 transition-colors"
              >
                <Check size={18} />
              </button>
            </div>
          </form>
        </motion.div>
      )}
    </div>
  );
}
