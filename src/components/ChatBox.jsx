import React, { useState, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useChatHistory, useSendChat, useDeleteChat, useEditChat, useConversations, useSchoolMembers } from '../hooks/queries';

const nameColors = ['#60a5fa','#f472b6','#34d399','#fbbf24','#a78bfa','#fb923c','#2dd4bf','#f87171'];
const getColor = (name) => nameColors[(name||'').split('').reduce((a,c) => a+c.charCodeAt(0),0) % nameColors.length];

function ChatBox({ npsn, compact = false, currentUserId }) {
  const [activeChat, setActiveChat] = useState(null);
  const [text, setText] = useState('');
  const [actionMsg, setActionMsg] = useState(null); // { id, message } — message being acted on
  const [editMode, setEditMode] = useState(null); // { id, text } — message being edited
  const chatEndRef = useRef(null);
  const prevLenRef = useRef(0);
  const queryClient = useQueryClient();

  const toUserId = activeChat && activeChat !== 'group' ? activeChat : null;
  const { data: messages, isLoading } = useChatHistory(npsn, toUserId);
  const { data: conversations } = useConversations(npsn);
  const { data: members } = useSchoolMembers(npsn);
  const { mutate: sendChat, isPending } = useSendChat();
  const { mutate: deleteChat } = useDeleteChat();
  const { mutate: editChat } = useEditChat();

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
    es.addEventListener('chat_edit', refresh);
    return () => es.close();
  }, [npsn, queryClient]);

  useEffect(() => {
    const len = messages?.length || 0;
    if (len > prevLenRef.current) chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    prevLenRef.current = len;
  }, [messages]);

  const handleSend = () => {
    if (editMode) {
      const msg = editMode.text.trim();
      if (!msg) return;
      editChat({ npsn, messageId: editMode.id, message: msg });
      setEditMode(null);
      setText('');
      return;
    }
    const msg = text.trim();
    if (!msg || isPending) return;
    setText('');
    sendChat({ npsn, message: msg, recipientId: toUserId || undefined });
  };

  const handleDelete = (messageId) => {
    if (window.confirm('Hapus pesan ini?')) {
      deleteChat({ npsn, messageId });
      setActionMsg(null);
    }
  };

  const handleEdit = (m) => {
    setEditMode({ id: m.id, text: m.message });
    setText(m.message);
    setActionMsg(null);
  };

  const cancelEdit = () => {
    setEditMode(null);
    setText('');
  };

  const formatTime = (d) => new Date(d).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  const formatAgo = (d) => {
    const ago = (Date.now() - new Date(d).getTime()) / 60000;
    if (ago < 1) return 'Baru';
    if (ago < 60) return `${Math.floor(ago)}m`;
    if (ago < 1440) return `${Math.floor(ago/60)}j`;
    return `${Math.floor(ago/1440)}h`;
  };

  const dmPartner = toUserId ? members?.find(m => m.userId === toUserId) : null;
  const convoList = (members || []).filter(m => m.userId !== currentUserId).map(m => {
    const existing = (conversations || []).find(c => c.partnerId === m.userId);
    return { id: m.userId, name: m.userName, image: m.userImage, lastMessage: existing?.lastMessage || null, lastAt: existing?.lastAt || null };
  }).sort((a, b) => {
    if (a.lastAt && b.lastAt) return new Date(b.lastAt) - new Date(a.lastAt);
    if (a.lastAt) return -1;
    if (b.lastAt) return 1;
    return 0;
  });

  // --- Action popup (shared) ---
  const ActionPopup = ({ msg, onClose }) => (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative bg-slate-900 border border-white/10 rounded-t-2xl w-full max-w-sm p-4 pb-6 space-y-1 animate-slide-up" onClick={e => e.stopPropagation()}>
        {/* Preview */}
        <div className="bg-white/5 rounded-xl px-3 py-2 mb-3">
          <p className="text-xs text-white/70 line-clamp-2">{msg.message}</p>
        </div>
        <button onClick={() => handleEdit(msg)} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-all text-left">
          <span className="material-symbols-outlined text-blue-400 text-lg">edit</span>
          <span className="text-sm text-white font-medium">Edit Pesan</span>
        </button>
        <button onClick={() => handleDelete(msg.id)} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-all text-left">
          <span className="material-symbols-outlined text-red-400 text-lg">delete</span>
          <span className="text-sm text-red-400 font-medium">Hapus Pesan</span>
        </button>
        <button onClick={onClose} className="w-full text-center py-2 text-xs text-white/40 font-medium mt-2">Batal</button>
      </div>
    </div>
  );

  // --- Message bubble (shared) ---
  const Bubble = ({ m, isCompact }) => {
    const isMe = m.senderId === currentUserId;
    return (
      <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
        <div className={isCompact ? 'max-w-[85%]' : 'max-w-[80%]'}>
          {!isMe && !isCompact && activeChat === 'group' && <p className="text-[10px] font-bold mb-0.5 ml-1" style={{ color: getColor(m.senderName) }}>{m.senderName}</p>}
          <div
            className={`${isCompact ? 'px-2.5 py-1.5' : 'px-3 py-2'} ${isMe
              ? 'bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl rounded-tr-sm'
              : 'bg-white/10 border border-white/15 rounded-2xl rounded-tl-sm'
            } ${isMe ? 'active:scale-[0.97] transition-transform cursor-pointer' : ''}`}
            onClick={() => isMe && setActionMsg(m)}
          >
            {!isMe && isCompact && activeChat === 'group' && <span className="text-[9px] font-bold mr-1" style={{ color: getColor(m.senderName) }}>{m.senderName}:</span>}
            <span className={`${isCompact ? 'text-[11px]' : 'text-[12px] leading-relaxed'} ${isMe ? 'text-white' : 'text-white/90'}`}>{m.message}</span>
            <span className={`${isCompact ? 'text-[8px] ml-1.5' : 'text-[9px] ml-2'} ${isMe ? 'text-blue-200/70' : 'text-white/40'}`}>{formatTime(m.createdAt)}</span>
          </div>
        </div>
      </div>
    );
  };

  // --- Input bar (shared) ---
  const InputBar = ({ isCompact }) => (
    <div className={`flex items-center gap-${isCompact ? '1.5' : '2'} pt-${isCompact ? '1.5' : '2'} border-t border-white/5`}>
      {editMode && (
        <button onClick={cancelEdit} className="text-yellow-400 shrink-0"><span className="material-symbols-outlined text-sm">close</span></button>
      )}
      <input type="text" value={editMode ? editMode.text : text}
        onChange={e => editMode ? setEditMode({...editMode, text: e.target.value}) : setText(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }}}
        placeholder={editMode ? 'Edit pesan...' : 'Ketik pesan...'}
        maxLength={1000}
        className={`flex-1 ${editMode ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-black/30 border-white/10'} border ${isCompact ? 'rounded-lg px-2.5 py-1.5 text-[11px]' : 'rounded-xl px-4 py-3 text-xs'} text-white focus:outline-none focus:ring-1 focus:ring-primary placeholder-slate-500`}
      />
      <button onClick={handleSend} disabled={isPending || !(editMode ? editMode.text.trim() : text.trim())}
        className={`${isCompact ? 'w-7 h-7 rounded-lg' : 'w-10 h-10 rounded-xl'} ${editMode ? 'bg-gradient-to-r from-yellow-500 to-amber-500' : 'bg-gradient-to-r from-blue-600 to-blue-500'} text-white flex items-center justify-center disabled:opacity-30 shrink-0`}>
        <span className="material-symbols-outlined text-xs">{editMode ? 'check' : 'send'}</span>
      </button>
    </div>
  );

  // === COMPACT MODE ===
  if (compact) {
    if (!activeChat) {
      return (
        <div className="flex flex-col h-[280px]">
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
        <div className="flex items-center gap-2 py-1.5">
          <button onClick={() => { setActiveChat(null); cancelEdit(); }} className="text-slate-400 hover:text-white">
            <span className="material-symbols-outlined text-sm">arrow_back</span>
          </button>
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black text-white shrink-0 ${activeChat === 'group' ? 'bg-gradient-to-br from-violet-500 to-fuchsia-600' : ''}`} style={activeChat !== 'group' ? { background: getColor(dmPartner?.userName || '') } : {}}>
              {activeChat === 'group' ? <span className="material-symbols-outlined text-xs">groups</span> : (dmPartner?.userName?.charAt(0)?.toUpperCase() || '?')}
            </div>
            <span className="text-[10px] font-bold text-white truncate">{activeChat === 'group' ? 'Grup Sekolah' : dmPartner?.userName || 'Chat'}</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto space-y-1 scrollbar-hide">
          {displayMessages.length === 0 && <p className="text-[11px] text-white/50 text-center py-4">Belum ada pesan</p>}
          {displayMessages.map(m => <Bubble key={m.id} m={m} isCompact />)}
          <div ref={chatEndRef} />
        </div>
        <InputBar isCompact />
        {actionMsg && <ActionPopup msg={actionMsg} onClose={() => setActionMsg(null)} />}
      </div>
    );
  }

  // === FULL MODE ===
  if (!activeChat) {
    return (
      <div className="space-y-3">
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
        <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Pesan Langsung</h5>
        {convoList.length === 0 && <p className="text-xs text-slate-500 text-center py-4">Belum ada anggota lain.</p>}
        {convoList.map(c => (
          <button key={c.id} onClick={() => setActiveChat(c.id)} className="w-full flex items-center gap-3 bg-black/20 rounded-xl p-3 hover:bg-black/30 transition-all text-left">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-black shrink-0" style={{ background: getColor(c.name) }}>
              {c.name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h5 className="text-xs font-bold text-white">{c.name}</h5>
              {c.lastMessage ? <p className="text-[10px] text-slate-500 truncate">{c.lastMessage}</p> : <p className="text-[10px] text-slate-600 italic">Belum ada pesan</p>}
            </div>
            {c.lastAt && <span className="text-[9px] text-slate-600 shrink-0">{formatAgo(c.lastAt)}</span>}
          </button>
        ))}
      </div>
    );
  }

  const displayMessages = messages || [];
  return (
    <div className="flex flex-col h-[calc(100vh-240px)] max-h-[550px]">
      <div className="flex items-center gap-3 pb-3 border-b border-white/5">
        <button onClick={() => { setActiveChat(null); cancelEdit(); }} className="text-slate-400 hover:text-white"><span className="material-symbols-outlined text-lg">arrow_back</span></button>
        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-black shrink-0 ${activeChat === 'group' ? 'bg-gradient-to-br from-violet-500 to-fuchsia-600' : ''}`} style={activeChat !== 'group' ? { background: getColor(dmPartner?.userName || '') } : {}}>
          {activeChat === 'group' ? <span className="material-symbols-outlined">groups</span> : (dmPartner?.userName?.charAt(0)?.toUpperCase() || '?')}
        </div>
        <div className="flex-1 min-w-0">
          <h5 className="text-sm font-bold text-white">{activeChat === 'group' ? 'Grup Sekolah' : dmPartner?.userName || 'Chat'}</h5>
          <p className="text-[10px] text-slate-500">{activeChat === 'group' ? `${members?.length || 0} anggota` : 'Pesan langsung'}</p>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto space-y-1.5 py-3 scrollbar-hide">
        {isLoading && <p className="text-xs text-slate-500 text-center py-4">Memuat...</p>}
        {!isLoading && displayMessages.length === 0 && (
          <div className="text-center py-8">
            <span className="material-symbols-outlined text-3xl text-slate-600">chat_bubble</span>
            <p className="text-xs text-slate-500 mt-2">Mulai percakapan!</p>
          </div>
        )}
        {displayMessages.map(m => <Bubble key={m.id} m={m} isCompact={false} />)}
        <div ref={chatEndRef} />
      </div>
      {editMode && (
        <div className="flex items-center gap-2 px-1 py-1.5 bg-yellow-500/10 border-l-2 border-yellow-500 rounded-r-lg">
          <span className="material-symbols-outlined text-yellow-400 text-sm">edit</span>
          <p className="text-[11px] text-yellow-300 flex-1 truncate">Mengedit pesan</p>
          <button onClick={cancelEdit}><span className="material-symbols-outlined text-white/40 text-sm">close</span></button>
        </div>
      )}
      <InputBar isCompact={false} />
      {actionMsg && <ActionPopup msg={actionMsg} onClose={() => setActionMsg(null)} />}
    </div>
  );
}

export default ChatBox;
