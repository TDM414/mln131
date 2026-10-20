'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { GameShowState, GameMode, GameStatus } from '../lib/types';
import { getAvatarById } from '../data/memeAvatars';
import {
  Trophy,
  Play,
  RotateCcw,
  Users,
  Smartphone,
  Sparkles,
  Flame,
  ShieldCheck,
  Zap,
  Copy,
  Check,
  Wifi,
  Globe,
} from 'lucide-react';

interface HostLobbyProps {
  state: GameShowState;
  onStartTournament: () => void;
  onStartRound: (roundStatus: GameStatus) => void;
  onSelectMode: (mode: GameMode) => void;
  onResetLobby: () => void;
}

export default function HostLobby({
  state,
  onStartTournament,
  onStartRound,
  onSelectMode,
  onResetLobby,
}: HostLobbyProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const players = Object.values(state.players || {});
  const roomCode = state.roomCode || 'MLN131';

  // Network & IP resolution
  const detectedLanIp = state.hostLanIp || '10.33.79.195';
  const availableIps =
    state.availableIps && state.availableIps.length > 0
      ? state.availableIps
      : [
          { name: 'Wi-Fi', ip: '10.33.79.195' },
          { name: 'Hotspot', ip: '192.168.137.1' },
        ];

  const [selectedBaseUrl, setSelectedBaseUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [showCustomInput, setShowCustomInput] = useState<boolean>(false);
  const [customUrlInput, setCustomUrlInput] = useState<string>('');

  // Auto-detect base host: if on localhost/127.0.0.1, auto-use detected LAN IP
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isLocal =
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1';
      if (isLocal) {
        setSelectedBaseUrl(`http://${detectedLanIp}:3000`);
      } else {
        setSelectedBaseUrl(window.location.origin);
      }
    }
  }, [detectedLanIp]);

  const activePlayUrl = selectedBaseUrl
    ? `${selectedBaseUrl.replace(/\/$/, '')}/play?room=${roomCode}`
    : `http://${detectedLanIp}:3000/play?room=${roomCode}`;

  // Generate QR Code dynamically
  useEffect(() => {
    if (activePlayUrl) {
      QRCode.toDataURL(activePlayUrl, {
        width: 250,
        margin: 1,
        color: { dark: '#000000', light: '#FFFFFF' },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error('QR Gen error:', err));
    }
  }, [activePlayUrl]);

  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(activePlayUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const roundsInfo = [
    {
      status: 'ROUND_1' as GameStatus,
      title: 'VÒNG 1: TƯỜNG BÌNH LUẬN TRIỆU LIKE',
      genre: 'Trending Feed Wall',
      icon: '🔥',
      color: 'bg-amber-400',
      desc: '45s toàn lớp gõ cà khịa • 30s lướt feed thả ❤️/🍅/🧱 • Vinh danh Top Trending máy chiếu',
    },
    {
      status: 'ROUND_2' as GameStatus,
      title: 'VÒNG 2: ĐẠI CHIẾN BÓC PHỐT 5 GIÂY',
      genre: 'Fact or Cap 5s Reflex',
      icon: '⚡',
      color: 'bg-emerald-400',
      desc: 'Quả bom 5s đếm ngược • 2 nút khổng lồ [🟢 FACT] vs [🔴 CAP] • Điểm phản xạ Speed-Decay • 3 mạng sinh tử',
    },
    {
      status: 'ROUND_3' as GameStatus,
      title: 'VÒNG 3: TRƯNG CẦU DÂN Ý: ĐOÁN PHE ĐA SỐ',
      genre: 'The Consensus Dilemma',
      icon: '⚖️',
      color: 'bg-purple-400',
      desc: 'Dilemma MLN131 • Chọn lập trường [A] vs [B] • Đặt cược phe đa số >50% • Kéo co Tug-of-war Realtime',
    },
    {
      status: 'ROUND_4' as GameStatus,
      title: 'VÒNG 4: ĐẤU TRƯỜNG CHƠI XẤU CƯỚP ĐIỂM',
      genre: 'Sabotage Trivia Final',
      icon: '👑',
      color: 'bg-rose-500',
      desc: 'Thẻ bài chơi xấu: Đổ mực đen, Cướp 50% điểm, Cược x2 • Trắc nghiệm MLN131 tính điểm Speed-Decay',
    },
  ];

  return (
    <div className="w-full h-full flex flex-col p-6 max-w-[1600px] mx-auto select-none">
      {/* 1. TOP HEADER & MODE SELECTOR */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4 pb-4 border-b-4 border-black">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-cyber-yellow border-2 border-black font-black text-xs uppercase tracking-widest shadow-[3px_3px_0px_#000]">
              MLN131 • DÂN CHỦ XHCN & TRUYỀN THÔNG SỐ
            </span>
            <span className="px-3 py-1 bg-cyber-cyan border-2 border-black font-black text-xs uppercase tracking-widest shadow-[3px_3px_0px_#000]">
              GAME SHOW EDITION
            </span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-white mt-2">
            NETIZEN PARTY: <span className="text-cyber-yellow underline decoration-black">ĐẠI HỘI DÂN MẠNG</span>
          </h1>
        </div>

        {/* Mode Switcher Buttons */}
        <div className="flex items-center gap-3 bg-cyber-card p-2 rounded-2xl border-4 border-black shadow-[5px_5px_0px_#000]">
          <button
            onClick={() => onSelectMode('TOURNAMENT')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm uppercase transition cursor-pointer border-2 border-black ${
              state.mode === 'TOURNAMENT'
                ? 'bg-cyber-yellow text-black shadow-[3px_3px_0px_#000] scale-105'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Giải Đấu (4 Vòng)</span>
          </button>

          <button
            onClick={() => onSelectMode('FREE_PLAY')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm uppercase transition cursor-pointer border-2 border-black ${
              state.mode === 'FREE_PLAY'
                ? 'bg-cyber-cyan text-black shadow-[3px_3px_0px_#000] scale-105'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Chơi Tự Do (Từng Vòng)</span>
          </button>
        </div>
      </div>

      {/* 2. MAIN 3-COLUMN PROJECTOR DASHBOARD */}
      <div className="grid grid-cols-12 gap-6 flex-1 min-h-0">
        {/* LEFT COLUMN: ROOM PIN & QR CODE (4 COLS) */}
        <div className="col-span-12 lg:col-span-4 flex flex-col justify-between bg-cyber-card border-4 border-black rounded-3xl p-5 shadow-[6px_6px_0px_#000] overflow-y-auto max-h-[85vh]">
          <div>
            <div className="text-xs font-black text-cyber-yellow uppercase tracking-widest flex items-center gap-2 mb-2">
              <Smartphone className="w-4 h-4" /> QUÉT MÃ HOẶC TRUY CẬP ĐIỆN THOẠI
            </div>

            {/* Room PIN Neo-Brutalist Box */}
            <div className="bg-cyber-yellow border-4 border-black rounded-2xl p-3 text-center shadow-[4px_4px_0px_#000] mb-3">
              <div className="text-[10px] font-black uppercase tracking-wider text-black">MÃ PHÒNG (ROOM PIN)</div>
              <div className="text-4xl font-black text-black tracking-widest mt-0.5 font-mono">{roomCode}</div>
            </div>

            {/* Crisp QR Code */}
            <div className="flex flex-col items-center justify-center p-3 bg-white border-4 border-black rounded-2xl shadow-[4px_4px_0px_#000] mb-3">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`QR for Room ${roomCode}`}
                  className="w-44 h-44 rounded-lg object-contain"
                />
              ) : (
                <div className="w-44 h-44 flex items-center justify-center text-slate-500 font-bold text-xs">
                  Đang tạo mã QR...
                </div>
              )}
              <div className="text-black font-black text-[11px] mt-1.5 uppercase tracking-wide">
                Camera / Zalo / Trình duyệt quét mã
              </div>
            </div>

            {/* Direct URL Display & Copy */}
            <div className="bg-slate-900 border-2 border-black rounded-xl p-2.5 mb-3">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
                <span>Link truy cập trực tiếp:</span>
                <span className="text-cyber-yellow font-bold text-[9px]">LAN IP / Online</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="flex-1 min-w-0 bg-black text-cyber-yellow font-mono text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 truncate select-all">
                  {activePlayUrl}
                </div>
                <button
                  onClick={handleCopy}
                  className="px-2.5 py-1.5 bg-cyber-yellow hover:bg-amber-300 text-black font-black text-xs rounded-lg border-2 border-black flex items-center gap-1 transition shadow-[2px_2px_0px_#000] cursor-pointer shrink-0"
                  title="Sao chép link vào bộ nhớ tạm"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Đã chép!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Chép link</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Multi-Network Switcher Badges */}
            <div className="bg-slate-900 border-2 border-black rounded-xl p-2.5 mb-3">
              <div className="text-[10px] font-black text-cyber-cyan uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Wifi className="w-3 h-3" /> Chọn Mạng / IP Máy Tính:
              </div>
              <div className="flex flex-wrap gap-1.5">
                {availableIps.map((net) => {
                  const netUrl = `http://${net.ip}:3000`;
                  const isSelected = selectedBaseUrl.includes(net.ip);
                  return (
                    <button
                      key={net.ip}
                      onClick={() => setSelectedBaseUrl(netUrl)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase transition border border-black cursor-pointer flex items-center gap-1 ${
                        isSelected
                          ? 'bg-cyber-yellow text-black shadow-[2px_2px_0px_#000]'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      <span>{net.name}:</span>
                      <span className="font-mono">{net.ip}</span>
                    </button>
                  );
                })}

                <button
                  onClick={() => setShowCustomInput(!showCustomInput)}
                  className="px-2 py-1 rounded-lg text-[10px] font-bold text-slate-400 bg-slate-800 hover:text-white border border-slate-700 transition cursor-pointer flex items-center gap-1"
                >
                  <Globe className="w-3 h-3" />
                  <span>Domain tùy chỉnh</span>
                </button>
              </div>

              {showCustomInput && (
                <div className="mt-2 pt-2 border-t border-slate-800 flex gap-1.5">
                  <input
                    type="text"
                    placeholder="https://abc.ngrok.app hoặc domain"
                    value={customUrlInput}
                    onChange={(e) => setCustomUrlInput(e.target.value)}
                    className="flex-1 bg-black text-white text-xs px-2 py-1 rounded border border-slate-700 font-mono"
                  />
                  <button
                    onClick={() => {
                      if (customUrlInput.trim()) {
                        setSelectedBaseUrl(customUrlInput.trim());
                      }
                    }}
                    className="px-2 py-1 bg-cyber-cyan text-black font-black text-[10px] rounded border border-black cursor-pointer"
                  >
                    Áp dụng
                  </button>
                </div>
              )}

              <div className="text-[9px] text-slate-400 leading-tight mt-1.5">
                💡 <span className="text-slate-300">Gợi ý:</span> Nếu Wi-Fi trường bật chặn kết nối nội bộ, hãy bấm chọn <strong className="text-cyber-yellow">Hotspot (192.168.137.1)</strong> hoặc phát Wi-Fi từ máy tính!
              </div>
            </div>
          </div>

          {/* Connection Stats Bar */}
          <div className="bg-slate-900 border-2 border-black rounded-xl p-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-cyber-cyan font-black text-xs">
              <Users className="w-4 h-4" />
              <span>{players.length} Chiến Sĩ Đã Vào</span>
            </div>
            <button
              onClick={onResetLobby}
              className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition"
              title="Khởi tạo lại phòng"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* CENTER / RIGHT SECTION (8 COLS): LAUNCH CONTROLS & LIVE ROSTER */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
          {/* Top of Right: Start Game / Mode Launcher */}
          {state.mode === 'TOURNAMENT' ? (
            <div className="bg-gradient-to-r from-cyber-card via-slate-900 to-cyber-card border-4 border-black rounded-3xl p-6 shadow-[6px_6px_0px_#000] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-black text-xs text-cyber-yellow uppercase tracking-widest flex items-center gap-1.5">
                    <Trophy className="w-4 h-4" /> LỘ TRÌNH GIẢI ĐẤU TOURNAMENT (4 VÒNG LIÊN TIẾP)
                  </span>
                  <span className="text-xs text-slate-400 font-bold">Tích lũy điểm số qua từng vòng</span>
                </div>

                {/* 4 Rounds Progression Bar */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
                  {roundsInfo.map((r, i) => (
                    <div
                      key={r.status}
                      className="bg-slate-900 border-2 border-black rounded-2xl p-3 flex flex-col justify-between shadow-[3px_3px_0px_#000]"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xl">{r.icon}</span>
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-black text-white">
                          VÒNG {i + 1}
                        </span>
                      </div>
                      <div className="text-xs font-black text-white leading-tight mb-1">{r.genre}</div>
                      <div className="text-[10px] text-slate-400 leading-snug line-clamp-2">{r.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Big Launch Tournament Button */}
              <button
                onClick={onStartTournament}
                disabled={players.length === 0}
                className={`w-full py-5 rounded-2xl font-black text-xl uppercase tracking-wider flex items-center justify-center gap-3 border-4 border-black transition cursor-pointer ${
                  players.length > 0
                    ? 'bg-cyber-yellow text-black hover:bg-amber-300 active:translate-x-1 active:translate-y-1 shadow-[6px_6px_0px_#000]'
                    : 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed opacity-60'
                }`}
              >
                <Play className="w-6 h-6 fill-current" />
                <span>
                  {players.length > 0
                    ? `KHAI MẠC ĐẠI HỘI NGAY (${players.length} CHIẾN SĨ)`
                    : 'ĐANG CHỜ NGƯỜI CHƠI HOẶC BẬT TEST DEV...'}
                </span>
              </button>
            </div>
          ) : (
            /* Free-Play Mode Cards */
            <div className="bg-cyber-card border-4 border-black rounded-3xl p-6 shadow-[6px_6px_0px_#000]">
              <div className="text-xs font-black text-cyber-cyan uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <Zap className="w-4 h-4" /> CHỌN CHƠI LẺ RIÊNG TỪNG VÒNG (FREE-PLAY)
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {roundsInfo.map((r) => (
                  <button
                    key={r.status}
                    onClick={() => onStartRound(r.status)}
                    className="p-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border-3 border-black text-left flex items-start justify-between group transition active:translate-x-1 active:translate-y-1 shadow-[4px_4px_0px_#000] cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl">{r.icon}</span>
                        <span className="font-black text-sm text-white group-hover:text-cyber-yellow transition">
                          {r.title}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">{r.desc}</p>
                    </div>
                    <span className="shrink-0 p-2 rounded-xl bg-black text-cyber-yellow group-hover:scale-110 transition ml-2">
                      <Play className="w-4 h-4 fill-current" />
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bottom of Right: Live Student Roster Grid */}
          <div className="flex-1 bg-cyber-card border-4 border-black rounded-3xl p-6 shadow-[6px_6px_0px_#000] flex flex-col min-h-[280px]">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-white uppercase tracking-wider">
                  DANH SÁCH CHIẾN SĨ DÂN MẠNG ({players.length})
                </span>
                {players.length > 0 && (
                  <span className="w-2.5 h-2.5 rounded-full bg-cyber-cyan animate-ping" />
                )}
              </div>
              <span className="text-xs text-slate-400 font-bold">10 Persona Meme độc quyền</span>
            </div>

            {/* Roster Cards Grid */}
            {players.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-700 rounded-2xl p-8 text-center text-slate-400">
                <div className="text-4xl mb-2 animate-bounce">📱</div>
                <div className="font-black text-base text-white">Chưa có ai vào phòng!</div>
                <p className="text-xs text-slate-400 max-w-md mt-1">
                  Hãy quét mã QR trên màn hình hoặc dùng thanh công cụ <span className="text-cyber-yellow font-bold">Test Dev</span> ở góc trên để bật 15 sinh viên ảo thử nghiệm ngay lập tức.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 overflow-y-auto max-h-[340px] pr-1">
                {players.map((p) => {
                  const avatar = getAvatarById(p.avatarId);
                  const AvatarSvg = avatar.SvgComponent;
                  return (
                    <div
                      key={p.id}
                      className="bg-slate-900 border-2 border-black rounded-2xl p-2.5 flex items-center gap-2.5 shadow-[3px_3px_0px_#000] hover:scale-102 transition"
                    >
                      <div className="w-10 h-10 shrink-0 rounded-xl overflow-hidden bg-black flex items-center justify-center">
                        <AvatarSvg size={40} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-black text-white truncate leading-tight flex items-center gap-1">
                          <span>{p.name}</span>
                          {p.isBot && (
                            <span className="text-[9px] font-bold px-1 py-0.2 bg-slate-800 text-cyber-cyan rounded">
                              BOT
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-cyber-yellow truncate font-semibold mt-0.5">
                          {avatar.name}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
