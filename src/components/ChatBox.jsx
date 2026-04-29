import React, { useState, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useChatHistory, useSendChat, useMySchool } from '../hooks/queries';

const nameColors = ['#60a5fa','#f472b6','#34d399','#fbbf24','#a78bfa','#fb923c','#2dd4bf','#f87171'];
const getColor = (name) => nameColors[(name||'').split('').reduce((a,c) => a+c.charCodeAt(0),0) % nameColors.length];

function ChatBox({ npsn, compact = false, currentUserId }) {
  const { data: messages, isLoading } = useChatHistory(npsn);
  const { mutate: sendChat, isPending } = useSendChat();
  const [text, setText] = useState('');
  const chatEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const queryClient = useQueryClient();
  const prevLenRef = useRef(0);

  // SSE: listen for new chat messages
  useEffect(() => {
    if (!npsn) return;
    const baseUrl = import.meta.env.VITE_API_URL || '';
    const es = new EventSource(`${baseUrl}/api/schools/${npsn}/stream`, { withCredentials: true });
    es.addEventListener('chat_message', () => {
      queryClient.invalidateQueries({ queryKey: ['chatHistory', npsn] });
    });
    es.addEventListener('chat_delete', () => {
      queryClient.invalidateQueries({ queryKey: ['chatHistory', npsn] });
    });
    return () => es.close();
  }, [npsn, queryClient]);

  // Auto-scroll on new messages
  useEffect(() => {
    const len = messages?.length || 0;
    if (len > prevLenRef.current) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevLenRef.current = len;
  }, [messages]);

  const handleSend = () => {
    const msg = text.trim();
    if (!msg || isPending) return;
    setText('');
    sendChat({ npsn, message: msg });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const displayMessages = compact ? (messages || []).slice(-5) : (messages || []);

  const formatTime = (d) => {
    const date = new Date(d);
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`flex flex-col ${compact ? 'h-[280px]' : 'h-[calc(100vh-200px)] max-h-[600px]'}`}>
      {/* Messages */}
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto space-y-1.5 px-1 py-2 scrollbar-hide">
        {isLoading && <p className="text-xs text-slate-500 text-center py-4">Memuat chat...</p>}
        {!isLoading && displayMessages.length === 0 && (
          <div className="text-center py-8">
            <span className="material-symbols-outlined text-3xl text-slate-600">chat_bubble</span>
            <p className="text-xs text-slate-500 mt-2">Belum ada pesan. Mulai percakapan!</p>
          </div>
        )}
        {displayMessages.map(m => {
          const isMe = m.senderId === currentUserId;
          return (
            <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] ${compact ? 'max-w-[85%]' : ''}`}>
                {!isMe && !compact && (
                  <p className="text-[10px] font-bold mb-0.5 ml-1" style={{ color: getColor(m.senderName) }}>
                    {m.senderName}
                  </p>
                )}
                <div className={`px-3 py-2 ${isMe
                  ? 'bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl rounded-tr-sm'
                  : 'bg-white/[0.06] border border-white/[0.08] rounded-2xl rounded-tl-sm'
                }`}>
                  {!isMe && compact && (
                    <span className="text-[10px] font-bold mr-1" style={{ color: getColor(m.senderName) }}>
                      {m.senderName}:
                    </span>
                  )}
                  <span className={`text-[12px] leading-relaxed ${isMe ? 'text-white' : 'text-slate-300'}`}>{m.message}</span>
                  <span className={`text-[9px] ml-2 ${isMe ? 'text-blue-200/60' : 'text-slate-500'}`}>{formatTime(m.createdAt)}</span>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 pt-2 border-t border-white/5">
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ketik pesan..."
          maxLength={1000}
          className={`flex-1 bg-black/30 border border-white/10 text-white text-xs focus:outline-none focus:ring-1 focus:ring-primary placeholder-slate-500 ${compact ? 'rounded-lg px-3 py-2' : 'rounded-xl px-4 py-3'}`}
        />
        <button
          onClick={handleSend}
          disabled={isPending || !text.trim()}
          className={`bg-gradient-to-r from-blue-600 to-blue-500 text-white flex items-center justify-center disabled:opacity-30 shrink-0 ${compact ? 'w-8 h-8 rounded-lg' : 'w-10 h-10 rounded-xl'}`}
        >
          <span className="material-symbols-outlined text-sm">send</span>
        </button>
      </div>
    </div>
  );
}

export default ChatBox;
