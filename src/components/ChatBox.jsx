import React, { useState, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useChatHistory, useSendChat, useConversations, useSchoolMembers } from '../hooks/queries';

const nameColors = ['#60a5fa','#f472b6','#34d399','#fbbf24','#a78bfa','#fb923c','#2dd4bf','#f87171'];
const getColor = (name) => nameColors[(name||'').split('').reduce((a,c) => a+c.charCodeAt(0),0) % nameColors.length];

function ChatBox({ npsn, compact = false, currentUserId }) {
  const [activeChat, setActiveChat] = useState(null); // null = list, 'group' = group, userId = DM
  const [text, setText] = useState('');
  const chatEndRef = useRef(null);
  const prevLenRef = useRef(0);
  const queryClient = useQueryClient();

  const toUserId = activeChat && activeChat !== 'group' ? activeChat : null;
  const { data: messages, isLoading } = useChatHistory(npsn, toUserId);
  const { data: conversations } = useConversations(npsn);
  const { data: members } = useSchoolMembers(npsn);
  const { mutate: sendChat, isPending } = useSendChat();

  // SSE for live updates
  useEffect(() => {
    if (!npsn) return;
    const baseUrl = import.meta.env.VITE_API_URL || '';
    const es = new EventSource(`${baseUrl}/api/schools/${npsn}/stream`, { withCredentials: true });
    const refresh = () => {
      queryClient.invalidateQueries({ queryKey: ['chatHistory'] });
      queryClient.invalidateQueries({ queryKey: ['conversations', npsn] });
    };
    es.addEventListener('chat_message', refresh);
    es.addEventListener('chat_delete', refresh);
    return () => es.close();
  }, [npsn, queryClient]);

  // Auto-scroll
  useEffect(() => {
    const len = messages?.length || 0;
    if (len > prevLenRef.current) chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    prevLenRef.current = len;
  }, [messages]);

  const handleSend = () => {
    const msg = text.trim();
    if (!msg || isPending) return;
    setText('');
    sendChat({ npsn, message: msg, recipientId: toUserId || undefined });
  };

  const formatTime = (d) => new Date(d).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  const formatAgo = (d) => {
    const ago = (Date.now() - new Date(d).getTime()) / 60000;
    if (ago < 1) return 'Baru';
    if (ago < 60) return `${Math.floor(ago)}m`;
    if (ago < 1440) return `${Math.floor(ago/60)}j`;
    return `${Math.floor(ago/1440)}h`;
  };

  // Active DM partner info
  const dmPartner = toUserId ? members?.find(m => m.userId === toUserId) : null;

  // Build conversation list from members + existing conversations
  const convoList = (members || []).filter(m => m.userId !== currentUserId).map(m => {
    const existing = (conversations || []).find(c => c.partnerId === m.userId);
    return {
      id: m.userId,
      name: m.userName,
      image: m.userImage,
      lastMessage: existing?.lastMessage || null,
      lastAt: existing?.lastAt || null,
    };
  }).sort((a, b) => {
    if (a.lastAt && b.lastAt) return new Date(b.lastAt) - new Date(a.lastAt);
    if (a.lastAt) return -1;
    if (b.lastAt) return 1;
    return 0;
  });

  // === COMPACT MODE (Dashboard) ===
  if (compact) {
    // If no active chat selected, show group chat
    if (!activeChat) {
      return (
        <div className="flex flex-col h-[280px]">
          {/* Tabs: Group + DM contacts */}
          <div className="flex gap-1.5 py-2 overflow-x-auto scrollbar-hide">
            <button onClick={() => setActiveChat('group')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-white/15 text-white border border-white/20 whitespace-nowrap shrink-0">
              <span className="material-symbols-outlined text-sm">groups</span>Grup
            </button>
            {convoList.slice(0, 5).map(c => (
              <button key={c.id} onClick={() => setActiveChat(c.id)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-white/10 text-white/80 hover:bg-white/15 whitespace-nowrap shrink-0">
                {c.name?.split(' ')[0]}
                {c.lastMessage && <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>}
              </button>
            ))}
          </div>
          <div className="flex-1 flex items-center justify-center">
            <p className="text-[11px] text-white/60 font-medium">Pilih Grup atau nama guru untuk chat</p>
          </div>
        </div>
      );
    }

    const displayMessages = (messages || []).slice(-5);
    return (
      <div className="flex flex-col h-[280px]">
        {/* Header with back */}
        <div className="flex items-center gap-2 py-1.5">
          <button onClick={() => setActiveChat(null)} className="text-slate-400 hover:text-white">
            <span className="material-symbols-outlined text-sm">arrow_back</span>
          </button>
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black text-white shrink-0 ${activeChat === 'group' ? 'bg-gradient-to-br from-violet-500 to-fuchsia-600' : ''}`} style={activeChat !== 'group' ? { background: getColor(dmPartner?.userName || '') } : {}}>
              {activeChat === 'group' ? <span className="material-symbols-outlined text-xs">groups</span> : (dmPartner?.userName?.charAt(0)?.toUpperCase() || '?')}
            </div>
            <span className="text-[10px] font-bold text-white truncate">{activeChat === 'group' ? 'Grup Sekolah' : dmPartner?.userName || 'Chat'}</span>
          </div>
        </div>
        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-1 scrollbar-hide">
          {displayMessages.length === 0 && <p className="text-[11px] text-white/50 text-center py-4">Belum ada pesan</p>}
          {displayMessages.map(m => {
            const isMe = m.senderId === currentUserId;
            return (
              <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-2.5 py-1.5 ${isMe ? 'bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl rounded-tr-sm' : 'bg-white/10 border border-white/15 rounded-xl rounded-tl-sm'}`}>
                  {!isMe && activeChat === 'group' && <span className="text-[9px] font-bold mr-1" style={{ color: getColor(m.senderName) }}>{m.senderName}:</span>}
                  <span className={`text-[11px] ${isMe ? 'text-white' : 'text-white/90'}`}>{m.message}</span>
                  <span className={`text-[8px] ml-1.5 ${isMe ? 'text-blue-200/70' : 'text-white/40'}`}>{formatTime(m.createdAt)}</span>
                </div>
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>
        {/* Input */}
        <div className="flex items-center gap-1.5 pt-1.5 border-t border-white/5">
          <input type="text" value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSend(); }}} placeholder="Ketik pesan..." maxLength={1000}
            className="flex-1 bg-black/30 border border-white/10 rounded-lg px-2.5 py-1.5 text-[11px] text-white focus:outline-none focus:ring-1 focus:ring-primary placeholder-slate-500" />
          <button onClick={handleSend} disabled={isPending || !text.trim()} className="w-7 h-7 bg-gradient-to-r from-blue-600 to-blue-500 text-white flex items-center justify-center rounded-lg disabled:opacity-30 shrink-0">
            <span className="material-symbols-outlined text-xs">send</span>
          </button>
        </div>
      </div>
    );
  }

  // === FULL MODE (SchoolHub page) ===
  if (!activeChat) {
    return (
      <div className="space-y-3">
        {/* Group chat entry */}
        <button onClick={() => setActiveChat('group')} className="w-full flex items-center gap-3 bg-black/20 rounded-xl p-3 hover:bg-black/30 transition-all text-left">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center text-white shrink-0">
            <span className="material-symbols-outlined text-lg">groups</span>
          </div>
          <div className="flex-1 min-w-0">
            <h5 className="text-xs font-bold text-white">Grup Sekolah</h5>
            <p className="text-[10px] text-slate-500 truncate">Pesan ke semua anggota</p>
          </div>
          <span className="material-symbols-outlined text-sm text-slate-500">chevron_right</span>
        </button>

        {/* DM list */}
        <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Pesan Langsung</h5>
        {convoList.length === 0 && <p className="text-xs text-slate-500 text-center py-4">Belum ada anggota lain.</p>}
        {convoList.map(c => (
          <button key={c.id} onClick={() => setActiveChat(c.id)} className="w-full flex items-center gap-3 bg-black/20 rounded-xl p-3 hover:bg-black/30 transition-all text-left">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-black shrink-0" style={{ background: getColor(c.name) }}>
              {c.name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h5 className="text-xs font-bold text-white">{c.name}</h5>
              {c.lastMessage ? (
                <p className="text-[10px] text-slate-500 truncate">{c.lastMessage}</p>
              ) : (
                <p className="text-[10px] text-slate-600 italic">Belum ada pesan</p>
              )}
            </div>
            {c.lastAt && <span className="text-[9px] text-slate-600 shrink-0">{formatAgo(c.lastAt)}</span>}
          </button>
        ))}
      </div>
    );
  }

  // Chat view (group or DM)
  const displayMessages = messages || [];
  return (
    <div className="flex flex-col h-[calc(100vh-240px)] max-h-[550px]">
      {/* Header */}
      <div className="flex items-center gap-3 pb-3 border-b border-white/5">
        <button onClick={() => setActiveChat(null)} className="text-slate-400 hover:text-white"><span className="material-symbols-outlined text-lg">arrow_back</span></button>
        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-black shrink-0 ${activeChat === 'group' ? 'bg-gradient-to-br from-violet-500 to-fuchsia-600' : ''}`} style={activeChat !== 'group' ? { background: getColor(dmPartner?.userName || '') } : {}}>
          {activeChat === 'group' ? <span className="material-symbols-outlined">groups</span> : (dmPartner?.userName?.charAt(0)?.toUpperCase() || '?')}
        </div>
        <div className="flex-1 min-w-0">
          <h5 className="text-sm font-bold text-white">{activeChat === 'group' ? 'Grup Sekolah' : dmPartner?.userName || 'Chat'}</h5>
          <p className="text-[10px] text-slate-500">{activeChat === 'group' ? `${members?.length || 0} anggota` : 'Pesan langsung'}</p>
        </div>
      </div>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-1.5 py-3 scrollbar-hide">
        {isLoading && <p className="text-xs text-slate-500 text-center py-4">Memuat...</p>}
        {!isLoading && displayMessages.length === 0 && (
          <div className="text-center py-8">
            <span className="material-symbols-outlined text-3xl text-slate-600">chat_bubble</span>
            <p className="text-xs text-slate-500 mt-2">Mulai percakapan!</p>
          </div>
        )}
        {displayMessages.map(m => {
          const isMe = m.senderId === currentUserId;
          return (
            <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-[80%]">
                {!isMe && activeChat === 'group' && <p className="text-[10px] font-bold mb-0.5 ml-1" style={{ color: getColor(m.senderName) }}>{m.senderName}</p>}
                <div className={`px-3 py-2 ${isMe ? 'bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl rounded-tr-sm' : 'bg-white/10 border border-white/15 rounded-2xl rounded-tl-sm'}`}>
                  <span className={`text-[12px] leading-relaxed ${isMe ? 'text-white' : 'text-white/90'}`}>{m.message}</span>
                  <span className={`text-[9px] ml-2 ${isMe ? 'text-blue-200/70' : 'text-white/40'}`}>{formatTime(m.createdAt)}</span>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>
      {/* Input */}
      <div className="flex items-center gap-2 pt-2 border-t border-white/5">
        <input type="text" value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }}} placeholder="Ketik pesan..." maxLength={1000}
          className="flex-1 bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary placeholder-slate-500" />
        <button onClick={handleSend} disabled={isPending || !text.trim()} className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-500 text-white flex items-center justify-center rounded-xl disabled:opacity-30 shrink-0">
          <span className="material-symbols-outlined text-sm">send</span>
        </button>
      </div>
    </div>
  );
}

export default ChatBox;
