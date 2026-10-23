'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  NETIZEN_AVATARS,
  getAvatarById,
  getRandomAvatar,
  NetizenAvatar,
} from '../../data/memeAvatars';
import { sync } from '../../lib/syncEngine';
import { sound } from '../../lib/audioSynthesizer';
import { mergeMonotonicState } from '../../lib/monotonicSync';
import { GameShowState, Player } from '../../lib/types';
import Round1Play from '../../components/Round1Play';
import Round2Play from '../../components/Round2Play';
import Round3Play from '../../components/Round3Play';
import Round4Play from '../../components/Round4Play';
import {
  Smartphone,
  Sparkles,
  Send,
  Flame,
  Shuffle,
  ShieldCheck,
  CheckCircle2,
  Trophy,
  AlertTriangle,
} from 'lucide-react';

const SUGGESTED_NAMES = [
  'Tuấn Anh',
  'Khánh Linh',
  'Minh Đức',
  'Hương Giang',
  'Văn Hoàng',
  'Bảo Châu',
  'Gia Huy',
  'Phương Anh',
  'Quốc Bảo',
  'Diệu Linh',
  'Hải Đăng',
  'Việt Dũng',
];

const QUICK_DANMAKU_EMOJIS = [
  { emoji: '🔥', label: 'Cháy' },
  { emoji: '🍅', label: 'Cà chua' },
  { emoji: '🧱', label: 'Gạch' },
  { emoji: '❤️', label: 'Thả tim' },
  { emoji: '🤡', label: 'Hài' },
  { emoji: '🎦', label: 'VAR' },
];

function MobileControllerContent() {
  const searchParams = useSearchParams();
  const roomFromUrl = (searchParams.get('room') || 'MLN131').toUpperCase();

  // Player Profile State
  const [roomCode, setRoomCode] = useState<string>(roomFromUrl);
  const [playerId, setPlayerId] = useState<string>('');
  const [playerName, setPlayerName] = useState<string>('');
  const [selectedAvatarId, setSelectedAvatarId] = useState<string>('keyboard_warrior');
  const [isJoined, setIsJoined] = useState<boolean>(false);

  // Sync Game State
  const [gameState, setGameState] = useState<Partial<GameShowState>>({
    status: 'LOBBY',
    currentRoundPhase: 'LOBBY_WAITING',
  });

  // Danmaku Input State
  const [customComment, setCustomComment] = useState<string>('');
  const [recentReaction, setRecentReaction] = useState<string | null>(null);
  const lastDanmakuTime = useRef<number>(0);

  // Local ink debuff state
  const [inkWipesLeft, setInkWipesLeft] = useState<number>(0);

  // Restore saved session from localStorage on mount (always show name setup screen first)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedId = localStorage.getItem('np_player_id');
      const savedName = localStorage.getItem('np_player_name');
      const savedAvatar = localStorage.getItem('np_player_avatar');

      if (savedId && savedName) {
        setPlayerId(savedId);
        setPlayerName(savedName);
        if (savedAvatar) setSelectedAvatarId(savedAvatar);
      } else {
        const newId = 'p_' + Math.random().toString(36).substring(2, 9);
        setPlayerId(newId);
        const randomName = SUGGESTED_NAMES[Math.floor(Math.random() * SUGGESTED_NAMES.length)];
        setPlayerName(randomName);
        setSelectedAvatarId(getRandomAvatar().id);
      }
      // Always show Name & Avatar setup screen first!
      setIsJoined(false);
    }
  }, [roomCode]);

  // Sync polling when joined
  useEffect(() => {
    if (!isJoined) return;
    sync.setRoom(roomCode);
    sync.startPolling(false); // Mobile client polling (700ms)

    // Listen to Full State Updates with Monotonic Guard (prevents rollback to LOBBY or previous rounds)
    const unsubState = sync.on('STATE_UPDATE', (data: any) => {
      if (data) {
        setGameState((prev) => mergeMonotonicState(prev, data, false));
        // Check debuff for this player
        if (playerId && data.players && data.players[playerId]) {
          const debuffs = data.players[playerId].r4Debuffs;
          if (debuffs?.isBlindedByInk) {
            setInkWipesLeft(debuffs.inkWipesLeft ?? 6);
          } else {
            setInkWipesLeft(0);
          }
        }
      }
    });

    return () => {
      unsubState();
      sync.stopPolling();
    };
  }, [isJoined, roomCode, playerId]);

  // Handle Join Submit
  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) return;

    if (typeof window !== 'undefined') {
      localStorage.setItem('np_player_id', playerId);
      localStorage.setItem('np_player_name', playerName.trim());
      localStorage.setItem('np_player_avatar', selectedAvatarId);
    }

    if ('vibrate' in navigator) navigator.vibrate(50);
    sound.playCorrectChime();

    setIsJoined(true);
    sync.setRoom(roomCode);
    sync.joinRoom(playerId, playerName.trim(), selectedAvatarId);
  };

  // Randomize Name
  const handleRandomizeName = () => {
    const nextName = SUGGESTED_NAMES[Math.floor(Math.random() * SUGGESTED_NAMES.length)];
    setPlayerName(nextName);
    setSelectedAvatarId(getRandomAvatar().id);
    if ('vibrate' in navigator) navigator.vibrate(25);
  };

  // Send Danmaku Reaction (with 300ms cooldown)
  const handleSendDanmaku = (emoji: string, text: string = '') => {
    const now = Date.now();
    if (now - lastDanmakuTime.current < 300) return;
    lastDanmakuTime.current = now;

    if ('vibrate' in navigator) navigator.vibrate(35);
    setRecentReaction(emoji);
    sync.sendDanmaku(emoji, text, playerName, selectedAvatarId);

    setTimeout(() => {
      setRecentReaction(null);
    }, 1200);
  };

  // Submit Custom Comment
  const handleSendCustomComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customComment.trim()) return;

    handleSendDanmaku('💬', customComment.trim());
    setCustomComment('');
  };

  // Wipe Ink Debuff on touch
  const handleWipeInk = () => {
    if (inkWipesLeft <= 0) return;
    if ('vibrate' in navigator) navigator.vibrate(40);
    sound.playSplat();
    const next = inkWipesLeft - 1;
    setInkWipesLeft(next);
    sync.wipeInk(playerId);
  };

  const selectedAvatar = getAvatarById(selectedAvatarId);
  const AvatarSvg = selectedAvatar.SvgComponent;

  // ==========================================
  // VIEW 1: JOIN ROOM SCREEN (Mobile First)
  // ==========================================
  if (!isJoined) {
    return (
      <div className="h-[100dvh] w-screen bg-[#0B0F19] text-white flex flex-col justify-between p-4 select-none overflow-hidden relative">
        {/* Header */}
        <div className="text-center pt-2">
          <div className="inline-block px-3 py-1 bg-cyber-yellow border-2 border-black rounded-full text-black font-black text-[11px] uppercase tracking-wider mb-2 shadow-[2px_2px_0px_#000]">
            MLN131 • ĐẠI HỘI DÂN MẠNG
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">
            NETIZEN <span className="text-cyber-yellow">PARTY</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Chọn nhân vật đại diện & vào phòng chiến đấu</p>
        </div>

        {/* Form Container */}
        <form onSubmit={handleJoin} className="my-auto py-2 space-y-4 max-w-sm mx-auto w-full overflow-y-auto">
          {/* Avatar Selector Carousel / Grid */}
          <div>
            <label className="block text-xs font-black uppercase text-cyber-yellow tracking-wider mb-2">
              CHỌN PERSONA DÂN MẠNG CỦA BẠN:
            </label>
            <div className="grid grid-cols-5 gap-2 bg-slate-900 border-2 border-black rounded-2xl p-2.5 shadow-[3px_3px_0px_#000]">
              {NETIZEN_AVATARS.map((av) => {
                const SvgComp = av.SvgComponent;
                const isSelected = av.id === selectedAvatarId;
                return (
                  <button
                    key={av.id}
                    type="button"
                    onClick={() => {
                      setSelectedAvatarId(av.id);
                      if ('vibrate' in navigator) navigator.vibrate(20);
                    }}
                    className={`relative p-1 rounded-xl transition cursor-pointer flex flex-col items-center ${
                      isSelected
                        ? 'bg-cyber-yellow border-2 border-black scale-105 shadow-[2px_2px_0px_#000]'
                        : 'bg-black/50 border border-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <SvgComp size={42} />
                  </button>
                );
              })}
            </div>

            {/* Selected Avatar Info Card */}
            <div className="mt-2 bg-cyber-card border-2 border-black rounded-xl p-2.5 flex items-center gap-2.5 shadow-[2px_2px_0px_#000]">
              <div className="w-10 h-10 shrink-0 rounded-lg overflow-hidden bg-black flex items-center justify-center">
                <AvatarSvg size={40} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-black text-white truncate">{selectedAvatar.name}</div>
                <div className="text-[10px] text-cyber-yellow truncate">{selectedAvatar.title}</div>
              </div>
            </div>
          </div>

          {/* Name Input with Randomizer */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-black uppercase text-slate-300">TÊN HOẶC BIỆT DANH</label>
              <button
                type="button"
                onClick={handleRandomizeName}
                className="text-[11px] font-bold text-cyber-cyan hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Shuffle className="w-3 h-3" /> Đổi tên ngẫu nhiên
              </button>
            </div>
            <input
              type="text"
              required
              maxLength={18}
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Nhập tên của bạn..."
              className="w-full bg-slate-900 border-2 border-black rounded-2xl px-4 py-3 text-white font-black text-sm focus:outline-none focus:border-cyber-yellow shadow-[3px_3px_0px_#000]"
            />
          </div>

          {/* Room PIN Input */}
          <div>
            <label className="block text-xs font-black uppercase text-slate-300 mb-1">
              MÃ PHÒNG (ROOM PIN)
            </label>
            <input
              type="text"
              required
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              className="w-full bg-slate-900 border-2 border-black rounded-2xl px-4 py-3 text-cyber-yellow font-black text-center text-lg tracking-widest font-mono uppercase focus:outline-none focus:border-cyber-cyan shadow-[3px_3px_0px_#000]"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-4 bg-cyber-yellow text-black font-black text-base uppercase rounded-2xl border-4 border-black shadow-[4px_4px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition cursor-pointer"
          >
            🚀 VÀO ĐẠI HỘI NGAY!
          </button>
        </form>

        {/* Footer */}
        <div className="text-center text-[10px] text-slate-500 pb-2">
          Môn học MLN131 • Dân chủ XHCN & Truyền thông số
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: ACTIVE CONTROLLER (Joined)
  // ==========================================
  return (
    <div className="h-[100dvh] w-screen bg-[#0B0F19] text-white flex flex-col justify-between p-3 select-none overflow-hidden relative">
      {/* INK SPLATTER DEBUFF OVERLAY */}
      {inkWipesLeft > 0 && (
        <div
          onClick={handleWipeInk}
          className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-6 text-center cursor-pointer animate-in zoom-in duration-150"
        >
          <div className="text-7xl mb-3 animate-bounce">🦑</div>
          <div className="text-2xl font-black text-rose-500 uppercase tracking-wider mb-2">
            MÀN HÌNH BỊ DÍNH MỰC!
          </div>
          <p className="text-sm text-slate-200 mb-6 max-w-xs">
            Bạn vừa bị dính thẻ bài chơi xấu! Chạm liên tục vào màn hình để lau sạch mực!
          </p>
          <div className="px-6 py-3 bg-cyber-yellow text-black font-black text-lg rounded-2xl border-4 border-black shadow-[4px_4px_0px_#000] animate-pulse">
            👆 CHẠM ĐỂ LAU (CÒN {inkWipesLeft} LẦN)
          </div>
        </div>
      )}

      {/* TOP HEADER: Player Profile & Room Status & Persistent Score */}
      <div className="flex items-center justify-between bg-cyber-card border-3 border-black rounded-2xl px-3 py-2 shadow-[3px_3px_0px_#000] shrink-0 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-10 h-10 shrink-0 rounded-xl overflow-hidden bg-black flex items-center justify-center border border-black">
            <AvatarSvg size={38} />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-black text-white truncate max-w-[95px] leading-tight">
              {playerName}
            </div>
            <div className="text-[10px] text-slate-400 font-bold truncate">
              {selectedAvatar.name}
            </div>
          </div>
        </div>

        {/* PERSISTENT LIVE TOTAL SCORE BADGE */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-cyber-yellow/15 border-2 border-cyber-yellow rounded-xl shadow-[2px_2px_0px_#000] shrink-0">
          <span className="text-base">🪙</span>
          <div className="text-right">
            <div className="text-[8px] text-amber-300 font-black uppercase leading-none">ĐIỂM CỦA BẠN</div>
            <div className="text-xs font-black font-mono text-cyber-yellow leading-tight">
              {(gameState.players?.[playerId]?.score || 0).toLocaleString()} <span className="text-[8px]">PTS</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <div className="text-right">
            <div className="text-[8px] text-slate-400 font-bold uppercase leading-none">PHÒNG</div>
            <div className="text-[11px] font-mono font-black text-cyber-cyan">{roomCode}</div>
          </div>

          <button
            onClick={() => {
              setIsJoined(false);
            }}
            className="text-[9px] text-slate-400 hover:text-white px-1.5 py-1 bg-slate-800 rounded-lg border border-slate-700 cursor-pointer"
          >
            Đổi tên
          </button>
        </div>
      </div>

      {/* DYNAMIC VIEW FOR ROUND 1, ROUND 2, ROUND 3, ROUND 4 OR GENERIC LOBBY */}
      {gameState.status === 'ROUND_1' ? (
        <div className="flex-1 overflow-hidden">
          <Round1Play
            state={gameState}
            playerId={playerId}
            playerName={playerName}
            avatarId={selectedAvatarId}
          />
        </div>
      ) : gameState.status === 'ROUND_2' ? (
        <div className="flex-1 overflow-hidden">
          <Round2Play
            state={gameState}
            playerId={playerId}
            playerName={playerName}
            avatarId={selectedAvatarId}
          />
        </div>
      ) : gameState.status === 'ROUND_3' ? (
        <div className="flex-1 overflow-hidden">
          <Round3Play
            state={gameState}
            playerId={playerId}
            playerName={playerName}
            avatarId={selectedAvatarId}
          />
        </div>
      ) : gameState.status === 'ROUND_4' ? (
        <div className="flex-1 overflow-hidden">
          <Round4Play
            state={gameState}
            playerId={playerId}
            playerName={playerName}
            avatarId={selectedAvatarId}
          />
        </div>
      ) : (
        <>
          {/* CENTER STAGE: Game Status Notification & Dynamic Content */}
          <div className="flex-1 flex flex-col items-center justify-center text-center p-4 my-auto">
            {recentReaction && (
              <div className="text-6xl animate-bounce-short mb-2">{recentReaction}</div>
            )}

            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-cyber-yellow border-2 border-black rounded-full text-black font-black text-xs uppercase mb-3 shadow-[2px_2px_0px_#000]">
              <Sparkles className="w-3.5 h-3.5 fill-black" />
              <span>
                {gameState.status === 'PODIUM' ? 'TỔNG KẾT PODIUM' : 'SẢNH CHỜ KHAI MẠC'}
              </span>
            </div>

            {gameState.status === 'PODIUM' && (
              <div className="bg-slate-900 border-3 border-black rounded-2xl p-4 shadow-[4px_4px_0px_#000] w-full max-w-xs mb-3 text-center animate-in zoom-in-95">
                {(() => {
                  const myP = gameState.players?.[playerId];
                  const allSorted = Object.values(gameState.players || {}).sort((a, b) => (b.score || 0) - (a.score || 0));
                  const myRank = allSorted.findIndex((p) => p.id === playerId) + 1;
                  return (
                    <>
                      <div className="text-3xl mb-1">{myRank === 1 ? '🥇' : myRank === 2 ? '🥈' : myRank === 3 ? '🥉' : '🎖️'}</div>
                      <div className="text-xs uppercase font-black text-cyber-yellow">
                        HẠNG TOÀN KHÓA: #{myRank > 0 ? myRank : '-'} / {allSorted.length}
                      </div>
                      <div className="text-2xl font-mono font-black text-white mt-1">
                        +{((myP?.score) || 0).toLocaleString()} PTS
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-slate-800 text-[10px] font-bold">
                        <div className="bg-slate-800/80 p-1.5 rounded-lg">
                          <span className="text-slate-400">V1 Like:</span> <span className="text-cyber-yellow">+{((myP?.roundScores?.ROUND_1) || 0).toLocaleString()}</span>
                        </div>
                        <div className="bg-slate-800/80 p-1.5 rounded-lg">
                          <span className="text-slate-400">V2 10s:</span> <span className="text-rose-400">+{((myP?.roundScores?.ROUND_2) || 0).toLocaleString()}</span>
                        </div>
                        <div className="bg-slate-800/80 p-1.5 rounded-lg">
                          <span className="text-slate-400">V3 Ý Dân:</span> <span className="text-cyan-400">+{((myP?.roundScores?.ROUND_3) || 0).toLocaleString()}</span>
                        </div>
                        <div className="bg-slate-800/80 p-1.5 rounded-lg">
                          <span className="text-slate-400">V4 Chơi Xấu:</span> <span className="text-purple-400">+{((myP?.roundScores?.ROUND_4) || 0).toLocaleString()}</span>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            <h2 className="text-xl font-black text-white max-w-xs leading-snug">
              {gameState.status === 'PODIUM'
                ? 'ĐẠI LỄ VINH DANH QUÁN QUÂN!'
                : 'ĐÃ VÀO PHÒNG CHIẾN ĐẤU!'}
            </h2>
            <p className="text-xs text-slate-400 mt-2 max-w-xs">
              {gameState.status === 'PODIUM'
                ? 'Quan sát màn hình máy chiếu để vinh danh các chiến sĩ đứng đầu bảng xếp hạng! Thả danmaku chúc mừng bên dưới!'
                : 'Màn hình máy chiếu đang hiển thị danh sách người chơi. Hãy dùng bảng biểu cảm bên dưới để thả cà chua, gạch đá tương tác!'}
            </p>
          </div>

          {/* BOTTOM THUMB-ZONE: INTERACTIVE DANMAKU REACTION PAD (Always Accessible) */}
          <div className="bg-cyber-card border-3 border-black rounded-2xl p-3 shadow-[4px_4px_0px_#000] shrink-0 space-y-2">
            <div className="flex items-center justify-between text-[10px] font-black uppercase text-cyber-yellow">
              <span>THẢ BIỂU CẢM DANMAKU LÊN MÁY CHIẾU:</span>
              <span className="text-slate-400">Chạm để bắn</span>
            </div>

            {/* 6 Quick Emoji Tap Chips */}
            <div className="grid grid-cols-6 gap-1.5">
              {QUICK_DANMAKU_EMOJIS.map((item) => (
                <button
                  key={item.emoji}
                  onClick={() => handleSendDanmaku(item.emoji)}
                  className="py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border-2 border-black flex flex-col items-center justify-center transition active:scale-90 cursor-pointer shadow-[2px_2px_0px_#000]"
                >
                  <span className="text-xl">{item.emoji}</span>
                  <span className="text-[9px] font-bold text-slate-300 mt-0.5">{item.label}</span>
                </button>
              ))}
            </div>

            {/* Custom Text Danmaku Input */}
            <form onSubmit={handleSendCustomComment} className="flex gap-1.5 pt-1">
              <input
                type="text"
                maxLength={60}
                value={customComment}
                onChange={(e) => setCustomComment(e.target.value)}
                placeholder="Bắn bình luận lên máy chiếu..."
                className="flex-1 bg-slate-900 border-2 border-black rounded-xl px-3 py-2 text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-cyber-yellow"
              />
              <button
                type="submit"
                className="px-3 py-2 bg-cyber-yellow text-black font-black text-xs uppercase rounded-xl border-2 border-black shadow-[2px_2px_0px_#000] active:scale-95 transition cursor-pointer flex items-center gap-1"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}

export default function MobilePlayPage() {
  return (
    <Suspense
      fallback={
        <div className="h-[100dvh] w-screen bg-[#0B0F19] text-white flex items-center justify-center font-black text-sm">
          Đang kết nối phòng chiến đấu...
        </div>
      }
    >
      <MobileControllerContent />
    </Suspense>
  );
}
