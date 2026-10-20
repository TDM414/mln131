'use client';

import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  GameShowState,
  GameMode,
  GameStatus,
  Player,
  DanmakuMessage,
} from '../../lib/types';
import { sync } from '../../lib/syncEngine';
import { sound } from '../../lib/audioSynthesizer';
import HostLobby from '../../components/HostLobby';
import DevBotSimulator from '../../components/DevBotSimulator';
import DanmakuCanvas from '../../components/DanmakuCanvas';
import Round1Host from '../../components/Round1Host';
import Round2Host from '../../components/Round2Host';
import Round3Host from '../../components/Round3Host';
import Round4Host from '../../components/Round4Host';
import { getAvatarById } from '../../data/memeAvatars';
import {
  Volume2,
  VolumeX,
  Music,
  Maximize2,
  FlaskConical,
  Trophy,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Flame,
  Award,
  Download,
  Crown,
  FileSpreadsheet,
  Home,
} from 'lucide-react';

export default function HostProjectorPage() {
  const roomCode = 'MLN131';

  // Master Game Show State
  const [gameState, setGameState] = useState<GameShowState>({
    roomCode: 'MLN131',
    mode: 'FREE_PLAY',
    status: 'LOBBY',
    currentRoundPhase: 'LOBBY_WAITING',
    timer: { total: 0, remaining: 0, active: false },
    players: {},
    roundScores: { ROUND_1: {}, ROUND_2: {}, ROUND_3: {}, ROUND_4: {} },
    round1State: {
      phase: 'PROMPT_BROADCAST',
      currentPromptIndex: 0,
      prompts: [],
      submissions: {},
      duels: [],
      currentDuelIndex: 0,
    },
    round2State: {
      phase: 'MICRO_INTRO',
      currentGameIndex: 0,
      activeGame: {
        type: 'CATCH_REPORT',
        title: 'Tóm Nút Báo Cáo',
        instruction: 'Nút Report đang trốn chạy! Bấm trúng trước khi hết 5 giây!',
        timeLimitSec: 5,
      },
      gamesList: [],
      survivorIds: [],
      playerResults: {},
    },
    round3State: {
      phase: 'ROLE_ASSIGNMENT',
      clues: [],
      nominatedSuspectIds: [],
      votes: {},
    },
    round4State: {
      phase: 'CARD_DRAFT',
      currentQuestionIndex: 0,
      questions: [],
      activeSabotages: [],
      playerAnswers: {},
    },
    recentEvents: [],
    devBotConfig: {
      enabled: false,
      botCount: 15,
      reactionSpeed: 'REALISTIC',
      simulatedDanmaku: true,
    },
  });

  // Host UI Controls
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(true);
  const [isBgmPlaying, setIsBgmPlaying] = useState<boolean>(false);
  const [showDevPanel, setShowDevPanel] = useState<boolean>(false);
  const [isSimulatingBots, setIsSimulatingBots] = useState<boolean>(false);
  const [floatingDanmaku, setFloatingDanmaku] = useState<Array<DanmakuMessage & { x: number; y: number }>>([]);

  // Audio Context Resume state
  const [hasInteracted, setHasInteracted] = useState<boolean>(false);

  // Sync Engine Setup
  useEffect(() => {
    sync.setRoom(roomCode);
    sync.startPolling(true); // Host mode (350ms delta poll)

    // Listen to Full State Updates
    const unsubState = sync.on('STATE_UPDATE', (data: any) => {
      if (data) {
        setGameState((prev) => ({
          ...prev,
          ...data,
          players: data.players || prev.players,
          mode: data.mode || prev.mode,
          status: data.status || prev.status,
          currentRoundPhase: data.currentRoundPhase || prev.currentRoundPhase,
        }));
      }
    });

    // Listen to Danmaku Reactions
    const unsubDanmaku = sync.on('danmaku', (msg: DanmakuMessage) => {
      const newDanmaku = {
        ...msg,
        x: typeof window !== 'undefined' ? window.innerWidth : 1200,
        y: Math.random() * 65 + 15, // 15% - 80% vertical height
      };
      setFloatingDanmaku((prev) => [...prev.slice(-25), newDanmaku]);

      // Subtle reaction pop sound
      if (msg.emoji === '🍅' || msg.emoji === '🧱') {
        sound.playSplat();
      }
    });

    return () => {
      unsubState();
      unsubDanmaku();
      sync.stopPolling();
    };
  }, [roomCode]);

  // Clean up floating Danmaku items after 6 seconds
  useEffect(() => {
    if (floatingDanmaku.length === 0) return;
    const cleanup = setTimeout(() => {
      setFloatingDanmaku((prev) => prev.slice(1));
    }, 5500);
    return () => clearTimeout(cleanup);
  }, [floatingDanmaku]);

  // Mode Selection Handler
  const handleSelectMode = (mode: GameMode) => {
    sound.playCorrectChime();
    setGameState((prev) => ({ ...prev, mode }));
    sync.setMode(mode);
  };

  // Launch Tournament Handler
  const handleStartTournament = () => {
    sound.playTrollHorn();
    setGameState((prev) => ({
      ...prev,
      status: 'ROUND_1',
      currentRoundPhase: 'PROMPT_BROADCAST',
    }));
    sync.setGameStatus('ROUND_1');
    sync.setRoundPhase('PROMPT_BROADCAST');
  };

  // Launch Individual Round Handler
  const handleStartRound = (status: GameStatus) => {
    sound.playTrollHorn();
    setGameState((prev) => ({
      ...prev,
      status,
      currentRoundPhase: 'ROUND_START',
    }));
    sync.setGameStatus(status);
    sync.setRoundPhase('ROUND_START');
  };

  // Reset Game back to Lobby
  const handleResetGame = () => {
    sound.playCorrectChime();
    setGameState((prev) => ({
      ...prev,
      status: 'LOBBY',
      currentRoundPhase: 'LOBBY_WAITING',
    }));
    sync.resetGame();
  };

  // Return to Hub preserving all player scores
  const handleReturnToHub = () => {
    sound.playCorrectChime();
    setGameState((prev) => ({
      ...prev,
      status: 'LOBBY',
      currentRoundPhase: 'LOBBY_WAITING',
    }));
    sync.setGameStatus('LOBBY');
    sync.setRoundPhase('LOBBY_WAITING');
  };

  // Sound Controls
  const toggleAudio = () => {
    setHasInteracted(true);
    const next = !isAudioEnabled;
    setIsAudioEnabled(next);
    sound.enabled = next;
    if (!next && isBgmPlaying) {
      sound.stopPartyBGM();
      setIsBgmPlaying(false);
    }
  };

  const toggleBgm = () => {
    setHasInteracted(true);
    if (!isAudioEnabled) {
      setIsAudioEnabled(true);
      sound.enabled = true;
    }
    if (isBgmPlaying) {
      sound.stopPartyBGM();
      setIsBgmPlaying(false);
    } else {
      sound.startPartyBGM();
      setIsBgmPlaying(true);
    }
  };

  // Fullscreen Toggle
  const toggleFullscreen = () => {
    if (typeof document !== 'undefined') {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  // Export Scoreboard to CSV
  const handleExportCSV = () => {
    sound.playCorrectChime();
    const headers = 'Hang,Ten_Nguoi_Choi,Avatar_ID,Vong_1_Trieu_Like,Vong_2_Boc_Phot_10s,Vong_3_Trung_Cau,Vong_4_Choi_Xau,Tong_Diem';
    const rows = sortedPlayers.map((p, idx) => {
      const v1 = p.roundScores?.ROUND_1 || 0;
      const v2 = p.roundScores?.ROUND_2 || 0;
      const v3 = p.roundScores?.ROUND_3 || 0;
      const v4 = p.roundScores?.ROUND_4 || 0;
      const total = p.score || 0;
      return `${idx + 1},"${p.name}","${p.avatarId}",${v1},${v2},${v3},${v4},${total}`;
    });
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `BangDiem_NetizenParty_MLN131_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Podium Confetti Blast
  useEffect(() => {
    if (gameState.status === 'PODIUM') {
      sound.playVictoryFanfare();
      confetti({ particleCount: 220, spread: 110, origin: { y: 0.5 } });
    }
  }, [gameState.status]);

  const playersList = Object.values(gameState.players || {});
  const sortedPlayers = [...playersList].sort((a, b) => (b.score || 0) - (a.score || 0));

  return (
    <div
      onClick={() => {
        if (!hasInteracted) setHasInteracted(true);
      }}
      className="relative w-screen h-screen bg-[#0B0F19] text-white flex flex-col overflow-hidden font-sans select-none"
    >
      {/* 1. TOP STATUS & SOUND BAR */}
      <header className="flex items-center justify-between px-6 py-3 border-b-4 border-black bg-cyber-card/90 backdrop-blur z-30">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-cyber-yellow border-2 border-black px-3 py-1 rounded-xl shadow-[3px_3px_0px_#000]">
            <span className="text-[10px] text-black font-black uppercase tracking-wider">PHÒNG:</span>
            <span className="text-xl font-black text-black font-mono tracking-widest">{roomCode}</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-900 border-2 border-black rounded-xl text-xs font-bold text-cyber-cyan shadow-[2px_2px_0px_#000]">
            <span className="w-2.5 h-2.5 rounded-full bg-cyber-cyan animate-pulse" />
            <span>{playersList.length} Dân mạng online</span>
          </div>

          <div className="hidden md:flex items-center gap-1 px-3 py-1 bg-slate-800 border-2 border-black rounded-xl text-xs font-black text-white">
            <Trophy className="w-3.5 h-3.5 text-cyber-yellow" />
            <span>{gameState.mode === 'TOURNAMENT' ? 'GIẢI ĐẤU (4 VÒNG)' : 'CHƠI TỰ DO'}</span>
          </div>
        </div>

        {/* Current Round Badge / Title */}
        <div className="text-center hidden lg:block">
          <div className="text-sm font-black uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyber-yellow via-rose-500 to-cyber-cyan">
            {gameState.status === 'LOBBY' && 'SẢNH CHỜ KHAI MẠC ĐẠI HỘI'}
            {gameState.status === 'ROUND_1' && 'VÒNG 1: CÀ KHỊA & CHECK VAR (QUIPLASH)'}
            {gameState.status === 'ROUND_2' && 'VÒNG 2: CHIẾN BINH 5 GIÂY (WARIOWARE)'}
            {gameState.status === 'ROUND_3' && 'VÒNG 3: VẠCH MẶT SEEDER (SOCIAL DEDUCTION)'}
            {gameState.status === 'ROUND_4' && 'VÒNG 4: ĐẠI CHIẾN LẬT KÈO (SABOTAGE TRIVIA)'}
            {gameState.status === 'PODIUM' && 'ĐẠI LỄ VINH DANH QUÁN QUÂN DÂN CHỦ'}
          </div>
        </div>

        {/* Audio & Control Buttons */}
        <div className="flex items-center gap-2">
          {/* Quick SFX Test (Airhorn) */}
          <button
            onClick={() => {
              setHasInteracted(true);
              sound.playTrollHorn();
            }}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black border-2 border-black shadow-[2px_2px_0px_#000] cursor-pointer"
            title="Bấm còi Troll Airhorn"
          >
            <span>📢 Còi</span>
          </button>

          {/* Quick SFX Test (Applause) */}
          <button
            onClick={() => {
              setHasInteracted(true);
              sound.playApplause();
            }}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 bg-cyber-cyan hover:bg-emerald-400 text-black rounded-xl text-xs font-black border-2 border-black shadow-[2px_2px_0px_#000] cursor-pointer"
            title="Tiếng vỗ tay"
          >
            <span>👏 Vỗ tay</span>
          </button>

          {/* 128 BPM Party BGM Toggle */}
          <button
            onClick={toggleBgm}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-black border-2 border-black transition cursor-pointer ${
              isBgmPlaying
                ? 'bg-cyber-yellow text-black shadow-[2px_2px_0px_#000] animate-pulse'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
            title="Bật/Tắt nhạc nền Party 128 BPM"
          >
            <Music className="w-3.5 h-3.5" />
            <span>BGM {isBgmPlaying ? 'ON' : 'OFF'}</span>
          </button>

          {/* Audio Mute/Unmute */}
          <button
            onClick={toggleAudio}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border-2 border-black text-slate-300 transition cursor-pointer"
            title="Bật/Tắt toàn bộ âm thanh"
          >
            {isAudioEnabled ? (
              <Volume2 className="w-4 h-4 text-cyber-cyan" />
            ) : (
              <VolumeX className="w-4 h-4 text-slate-500" />
            )}
          </button>

          {/* Dev Test Sandbox Toggle */}
          <button
            onClick={() => setShowDevPanel(!showDevPanel)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-black border-2 border-black transition cursor-pointer ${
              isSimulatingBots || showDevPanel
                ? 'bg-amber-400 text-black shadow-[3px_3px_0px_#000]'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <FlaskConical className="w-4 h-4" />
            <span>Test Dev</span>
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border-2 border-black text-cyber-yellow transition cursor-pointer"
            title="Toàn màn hình máy chiếu"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. DEV SANDBOX OVERLAY DRAWER */}
      {showDevPanel && (
        <div className="absolute top-16 right-6 z-40 w-96 animate-in slide-in-from-top duration-200">
          <DevBotSimulator
            state={gameState}
            isSimulating={isSimulatingBots}
            onToggleSimulate={() => setIsSimulatingBots(!isSimulatingBots)}
            onClose={() => setShowDevPanel(false)}
          />
        </div>
      )}

      {/* 3. FLOATING DANMAKU STREAM (CANVAS 2D OVERLAY ACROSS SCREEN) */}
      <DanmakuCanvas className="z-[25]" />

      {/* 4. DYNAMIC VIEW SWITCHER */}
      <main className="flex-1 overflow-hidden relative">
        {gameState.status === 'LOBBY' && (
          <HostLobby
            state={gameState}
            onStartTournament={handleStartTournament}
            onStartRound={handleStartRound}
            onSelectMode={handleSelectMode}
            onResetLobby={handleResetGame}
          />
        )}

        {/* ROUND 1: Cà Khịa & Check VAR (Quiplash-style) */}
        {gameState.status === 'ROUND_1' && (
          <Round1Host
            state={gameState}
            onAdvanceToRound2={() => handleStartRound('ROUND_2')}
            onResetGame={handleResetGame}
          />
        )}

        {/* ROUND 2: Chiến Binh 5 Giây Dị Hợm (WarioWare) */}
        {gameState.status === 'ROUND_2' && (
          <Round2Host
            state={gameState}
            onReturnToHub={handleReturnToHub}
            onAdvanceToRound3={() => handleStartRound('ROUND_3')}
          />
        )}

        {/* ROUND 3: Vạch Mặt Seeder (Social Deduction) */}
        {gameState.status === 'ROUND_3' && (
          <Round3Host
            state={gameState}
            onReturnToHub={handleReturnToHub}
            onAdvanceToRound4={() => handleStartRound('ROUND_4')}
          />
        )}

        {/* ROUND 4: Đại Chiến Lật Kèo (Sabotage Trivia Final) */}
        {gameState.status === 'ROUND_4' && (
          <Round4Host
            state={gameState}
            onReturnToHub={handleReturnToHub}
            onAdvanceToPodium={() => handleStartRound('PODIUM')}
          />
        )}

        {/* PODIUM / GRAND FINALE: TOURNAMENT 4-ROUND SCOREBOARD MATRIX */}
        {gameState.status === 'PODIUM' && (
          <div className="w-full min-h-full p-4 md:p-8 flex flex-col justify-between max-w-7xl mx-auto overflow-y-auto pb-36">
            {/* 1. Header */}
            <div className="text-center pt-2 mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-cyber-yellow text-black font-black text-xs md:text-sm uppercase rounded-xl border-3 border-black shadow-[3px_3px_0px_#000] mb-2">
                <Crown className="w-5 h-5 text-black" />
                <span>ĐẠI HỘI DÂN MẠNG (MLN131) • TỔNG KẾT TOURNAMENT</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyber-yellow via-amber-300 to-cyber-cyan tracking-wider drop-shadow-[2px_2px_0px_#000]">
                ĐẠI LỄ VINH DANH QUÁN QUÂN
              </h1>
              <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-2xl mx-auto">
                Chúc mừng tất cả chiến sĩ đã hoàn thành xuất sắc 4 vòng thi đấu kịch tính và thể hiện tinh thần dân chủ số mẫu mực!
              </p>
            </div>

            {/* 2. Top 3 Champions Podium */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 items-end max-w-4xl mx-auto w-full">
              {/* Rank 2 (Silver) */}
              <div className="order-2 md:order-1 bg-slate-900 border-4 border-slate-400 rounded-3xl p-5 flex flex-col items-center shadow-[6px_6px_0px_#000] min-h-[260px] justify-between text-center relative">
                <div className="absolute -top-3.5 px-3 py-1 bg-slate-300 text-black font-black text-xs uppercase rounded-lg border-2 border-black shadow-[2px_2px_0px_#000]">
                  🥈 Á QUÂN 1
                </div>
                <div className="text-5xl my-2">
                  {getAvatarById(sortedPlayers[1]?.avatarId || 'keyboard_warrior').emoji}
                </div>
                <div>
                  <div className="font-black text-lg text-white truncate max-w-[180px]">
                    {sortedPlayers[1]?.name || 'Chiến sĩ 2'}
                  </div>
                  <div className="text-xs text-slate-400">
                    {getAvatarById(sortedPlayers[1]?.avatarId || 'keyboard_warrior').name}
                  </div>
                  <div className="text-base font-black text-slate-200 mt-2 font-mono px-3 py-1 bg-black/60 rounded-xl border border-slate-700">
                    +{(sortedPlayers[1]?.score || 0).toLocaleString()} PTS
                  </div>
                </div>
              </div>

              {/* Rank 1 (Gold Champion) */}
              <div className="order-1 md:order-2 bg-gradient-to-b from-amber-500/20 to-slate-900 border-4 border-cyber-yellow rounded-3xl p-6 flex flex-col items-center shadow-[8px_8px_0px_#FFD166] min-h-[310px] justify-between text-center relative scale-105 z-10 animate-in zoom-in-95">
                <div className="absolute -top-4 px-4 py-1.5 bg-cyber-yellow text-black font-black text-xs md:text-sm uppercase rounded-xl border-3 border-black shadow-[3px_3px_0px_#000] flex items-center gap-1.5">
                  <Crown className="w-4 h-4 fill-black" />
                  <span>🥇 QUÁN QUÂN TOURNAMENT</span>
                </div>
                <div className="text-6xl my-2 animate-bounce">
                  {getAvatarById(sortedPlayers[0]?.avatarId || 'keyboard_warrior').emoji}
                </div>
                <div>
                  <div className="text-xs font-black text-cyber-yellow uppercase tracking-widest mb-1">
                    CHIẾN THẦN DÂN CHỦ SỐ
                  </div>
                  <div className="font-black text-2xl text-white truncate max-w-[200px]">
                    {sortedPlayers[0]?.name || 'Quán Quân'}
                  </div>
                  <div className="text-xs text-slate-400">
                    {getAvatarById(sortedPlayers[0]?.avatarId || 'keyboard_warrior').name}
                  </div>
                  <div className="text-xl font-black text-cyber-yellow mt-2 font-mono px-4 py-1 bg-black rounded-xl border-2 border-cyber-yellow shadow-[2px_2px_0px_#000]">
                    +{(sortedPlayers[0]?.score || 0).toLocaleString()} PTS
                  </div>
                </div>
              </div>

              {/* Rank 3 (Bronze) */}
              <div className="order-3 md:order-3 bg-slate-900 border-4 border-amber-700 rounded-3xl p-5 flex flex-col items-center shadow-[6px_6px_0px_#000] min-h-[240px] justify-between text-center relative">
                <div className="absolute -top-3.5 px-3 py-1 bg-amber-700 text-white font-black text-xs uppercase rounded-lg border-2 border-black shadow-[2px_2px_0px_#000]">
                  🥉 Á QUÂN 2
                </div>
                <div className="text-5xl my-2">
                  {getAvatarById(sortedPlayers[2]?.avatarId || 'keyboard_warrior').emoji}
                </div>
                <div>
                  <div className="font-black text-lg text-white truncate max-w-[180px]">
                    {sortedPlayers[2]?.name || 'Chiến sĩ 3'}
                  </div>
                  <div className="text-xs text-slate-400">
                    {getAvatarById(sortedPlayers[2]?.avatarId || 'keyboard_warrior').name}
                  </div>
                  <div className="text-base font-black text-amber-400 mt-2 font-mono px-3 py-1 bg-black/60 rounded-xl border border-slate-700">
                    +{(sortedPlayers[2]?.score || 0).toLocaleString()} PTS
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Grand Tournament Scoreboard Matrix (Unified 4 Rounds) */}
            <div className="bg-slate-900/90 border-4 border-black rounded-3xl p-4 md:p-6 shadow-[8px_8px_0px_#000] mb-6">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-4 border-b-2 border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-cyber-yellow text-black font-black rounded-xl text-sm">
                    📊
                  </span>
                  <div>
                    <h3 className="text-base md:text-lg font-black text-white uppercase tracking-wider">
                      BẢNG TỔNG SẮP ĐIỂM SỐ 4 VÒNG (TOURNAMENT MATRIX)
                    </h3>
                    <p className="text-xs text-slate-400">
                      Điểm tích lũy hợp nhất từ V1 (Triệu Like) ➔ V2 (Bóc Phốt 10s) ➔ V3 (Trưng Cầu) ➔ V4 (Chơi Xấu)
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleExportCSV}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase rounded-xl border-2 border-black shadow-[2px_2px_0px_#000] active:scale-95 transition cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Xuất CSV Báo Cáo</span>
                </button>
              </div>

              {/* Table Container */}
              <div className="overflow-x-auto rounded-2xl border-2 border-black">
                <table className="w-full text-left border-collapse text-xs md:text-sm">
                  <thead>
                    <tr className="bg-slate-950 text-slate-300 border-b-2 border-black font-black uppercase text-[11px] md:text-xs tracking-wider">
                      <th className="py-3 px-3 text-center w-14">HẠNG</th>
                      <th className="py-3 px-4">CHIẾN SĨ</th>
                      <th className="py-3 px-3 text-center text-cyber-yellow">V1: TRIỆU LIKE</th>
                      <th className="py-3 px-3 text-center text-rose-400">V2: BÓC PHỐT 10S</th>
                      <th className="py-3 px-3 text-center text-cyan-400">V3: TRƯNG CẦU</th>
                      <th className="py-3 px-3 text-center text-purple-400">V4: CHƠI XẤU</th>
                      <th className="py-3 px-4 text-right text-cyber-yellow">TỔNG ĐIỂM</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-bold">
                    {sortedPlayers.map((p, idx) => {
                      const avatar = getAvatarById(p.avatarId || 'keyboard_warrior');
                      const v1 = p.roundScores?.ROUND_1 || 0;
                      const v2 = p.roundScores?.ROUND_2 || 0;
                      const v3 = p.roundScores?.ROUND_3 || 0;
                      const v4 = p.roundScores?.ROUND_4 || 0;
                      const total = p.score || 0;

                      return (
                        <tr
                          key={p.id}
                          className={`hover:bg-slate-800/60 transition ${
                            idx === 0
                              ? 'bg-amber-500/10'
                              : idx === 1
                              ? 'bg-slate-300/10'
                              : idx === 2
                              ? 'bg-amber-700/10'
                              : ''
                          }`}
                        >
                          <td className="py-3 px-3 text-center font-mono font-black">
                            {idx === 0 ? '🥇 1' : idx === 1 ? '🥈 2' : idx === 2 ? '🥉 3' : `#${idx + 1}`}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <span className="text-xl shrink-0">{avatar.emoji}</span>
                              <div className="truncate max-w-[140px] md:max-w-[200px]">
                                <div className="font-black text-white truncate">{p.name}</div>
                                <div className="text-[10px] text-slate-400 truncate">{avatar.name}</div>
                              </div>
                              {p.isBot && (
                                <span className="px-1.5 py-0.5 bg-slate-800 text-[9px] text-slate-400 rounded border border-slate-700">
                                  BOT
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center font-mono text-slate-200">
                            +{v1.toLocaleString()}
                          </td>
                          <td className="py-3 px-3 text-center font-mono text-slate-200">
                            +{v2.toLocaleString()}
                          </td>
                          <td className="py-3 px-3 text-center font-mono text-slate-200">
                            +{v3.toLocaleString()}
                          </td>
                          <td className="py-3 px-3 text-center font-mono text-slate-200">
                            +{v4.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-black text-cyber-yellow text-sm md:text-base">
                            +{total.toLocaleString()} PTS
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 4. Sticky Bottom Action Bar - ALWAYS VISIBLE */}
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0F1420]/95 backdrop-blur-lg border-t-4 border-black p-4 shadow-[0_-6px_25px_rgba(0,0,0,0.8)]">
              <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
                <div className="text-xs text-slate-300 font-bold flex items-center gap-2">
                  <span className="p-1.5 bg-cyber-yellow text-black font-black rounded-lg">👑 TOURNAMENT GRAND FINALE</span>
                  <span>Đã tổng hợp toàn bộ 4 vòng thi đấu của môn học MLN131!</span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleExportCSV}
                    className="flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm uppercase rounded-xl border-2 border-black shadow-[3px_3px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Xuất Điểm CSV</span>
                  </button>

                  <button
                    onClick={handleResetGame}
                    className="flex items-center gap-2 px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-black text-sm uppercase rounded-xl border-2 border-black shadow-[3px_3px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4 text-cyber-yellow" />
                    <span>Khởi Tạo Tournament Mới</span>
                  </button>

                  <button
                    onClick={handleReturnToHub}
                    className="flex items-center gap-2 px-6 py-3 bg-cyber-yellow hover:bg-amber-300 text-black font-black text-sm uppercase rounded-xl border-3 border-black shadow-[4px_4px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition cursor-pointer scale-105"
                  >
                    <Home className="w-4 h-4" />
                    <span>Quay Về Sảnh Hub</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Global Danmaku CSS Animation */}
      <style jsx global>{`
        @keyframes danmakuFly {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-160vw);
          }
        }
      `}</style>
    </div>
  );
}
