'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  GameShowState,
  Round2Phase,
  FactCapQuestion,
  FactCapAnswer,
  Player,
} from '../lib/types';
import { getAvatarById } from '../data/memeAvatars';
import { MLN131_FACT_OR_CAP_QUESTIONS } from '../data/questions';
import { sound } from '../lib/audioSynthesizer';
import { sync } from '../lib/syncEngine';
import confetti from 'canvas-confetti';
import {
  Bomb,
  Flame,
  Heart,
  Skull,
  Zap,
  Shield,
  Trophy,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  RotateCcw,
  Home,
  Crown,
  Sparkles,
  Volume2,
  Timer,
  Ghost,
  FastForward,
  Play,
  BookOpen,
  Users,
  Award,
} from 'lucide-react';

interface Round2HostProps {
  state: GameShowState;
  onReturnToHub: () => void;
  onAdvanceToRound3?: () => void;
}

export default function Round2Host({
  state,
  onReturnToHub,
  onAdvanceToRound3,
}: Round2HostProps) {
  const round2State = state.round2State;

  // Curated 5 questions from MLN131_FACT_OR_CAP_QUESTIONS
  const questions: FactCapQuestion[] = useMemo(() => {
    if (round2State?.questions && round2State.questions.length >= 5) {
      return round2State.questions.slice(0, 5);
    }
    return MLN131_FACT_OR_CAP_QUESTIONS.slice(0, 5);
  }, [round2State?.questions]);

  const currentQuestionIndex = round2State?.currentQuestionIndex ?? 0;
  const currentQuestion: FactCapQuestion = questions[currentQuestionIndex] || questions[0];

  // Normalized Phase
  const rawPhase = round2State?.phase || 'INTRO';
  const phase: 'INTRO' | 'QUESTION_ACTIVE' | 'REVEAL' | 'ROUND_SUMMARY' = useMemo(() => {
    if (
      rawPhase === 'QUESTION' ||
      rawPhase === 'QUESTION_ACTIVE' ||
      rawPhase === 'PLAYING' ||
      rawPhase === 'MICRO_PLAYING'
    ) {
      return 'QUESTION_ACTIVE';
    }
    if (
      rawPhase === 'REVEAL' ||
      rawPhase === 'QUESTION_RESULT' ||
      rawPhase === 'RESULT' ||
      rawPhase === 'MICRO_RESULT'
    ) {
      return 'REVEAL';
    }
    if (
      rawPhase === 'SUMMARY' ||
      rawPhase === 'ROUND_SUMMARY' ||
      rawPhase === 'ROUND_OVER'
    ) {
      return 'ROUND_SUMMARY';
    }
    return 'INTRO';
  }, [rawPhase]);

  // Timer State (10.0s ticking bomb)
  const [timeLeftMs, setTimeLeftMs] = useState<number>(10000);
  const [isExploding, setIsExploding] = useState<boolean>(false);
  const timerStartRef = useRef<number>(0);
  const tickIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastTickTimeRef = useRef<number>(0);

  // Player roster & answers for current question
  const answers: Record<string, FactCapAnswer> = useMemo(() => {
    return round2State?.answers || {};
  }, [round2State?.answers]);

  const playersList: Player[] = useMemo(() => {
    return Object.values(state.players || {});
  }, [state.players]);

  // In pure points mode: ALL players are active! No elimination.
  const activePlayers = useMemo(() => {
    return playersList;
  }, [playersList]);

  // Count players who answered this question
  const answeredCount = useMemo(() => {
    return Object.keys(answers).length;
  }, [answers]);

  // Ticking sound and countdown clock
  useEffect(() => {
    if (phase !== 'QUESTION_ACTIVE') {
      if (tickIntervalRef.current) {
        clearInterval(tickIntervalRef.current);
        tickIntervalRef.current = null;
      }
      return;
    }

    timerStartRef.current = Date.now();
    setTimeLeftMs(10000);
    setIsExploding(false);
    lastTickTimeRef.current = 0;

    const interval = setInterval(() => {
      const elapsed = Date.now() - timerStartRef.current;
      const remaining = Math.max(0, 10000 - elapsed);
      setTimeLeftMs(remaining);

      // Accelerating Web Audio Ticks
      const now = Date.now();
      const isUrgent = remaining <= 3000;
      const tickCadence = isUrgent ? 250 : 600;

      if (now - lastTickTimeRef.current >= tickCadence && remaining > 0) {
        sound.playCountdownTick(isUrgent);
        lastTickTimeRef.current = now;
      }

      // Check if time is up OR all active players answered
      if (remaining <= 0) {
        clearInterval(interval);
        handleTriggerExplosionAndReveal();
      }
    }, 40);

    tickIntervalRef.current = interval;

    return () => {
      clearInterval(interval);
    };
  }, [phase, currentQuestionIndex]);

  // Early explosion if all active players submitted (with 1.5s grace period so questions never auto-explode on transition)
  useEffect(() => {
    if (
      phase === 'QUESTION_ACTIVE' &&
      activePlayers.length > 0 &&
      answeredCount >= activePlayers.length &&
      timeLeftMs < 8500 // Must have run for at least 1.5s
    ) {
      const earlyTimeout = setTimeout(() => {
        handleTriggerExplosionAndReveal();
      }, 350);
      return () => clearTimeout(earlyTimeout);
    }
  }, [answeredCount, activePlayers.length, phase, timeLeftMs]);

  // Trigger bomb explosion and transition to REVEAL phase
  const handleTriggerExplosionAndReveal = useCallback(() => {
    if (phase !== 'QUESTION_ACTIVE') return;

    // Explode!
    setIsExploding(true);
    sound.playExplosion(true);

    // In pure points mode: no lives are lost on timeout, all players remain active

    // Sound chime based on question answer
    setTimeout(() => {
      if (currentQuestion.isFact) {
        sound.playCorrectChime();
      } else {
        sound.playWrongBuzz();
      }
    }, 400);

    setTimeout(() => {
      setIsExploding(false);
      sync.hostUpdateState({
        round2State: {
          ...state.round2State,
          phase: 'REVEAL',
          currentQuestionIndex,
          questions,
        },
      });
      sync.setRoundPhase('REVEAL');
    }, 600);
  }, [phase, state.players, state.round2State, currentQuestionIndex, currentQuestion.isFact, questions]);

  // Start question from INTRO
  const handleStartQuestion = (idx: number = 0) => {
    sound.playTrollHorn();
    sync.hostUpdateState({
      round2State: {
        ...state.round2State,
        phase: 'QUESTION_ACTIVE',
        currentQuestionIndex: idx,
        answers: {},
        questions,
      },
    });
    sync.setRoundPhase('QUESTION_ACTIVE');
  };

  // Advance to Next Question or Summary
  const handleNextStep = () => {
    const nextIdx = currentQuestionIndex + 1;
    if (nextIdx < questions.length) {
      sound.playCorrectChime();
      setTimeLeftMs(10000);
      setIsExploding(false);
      timerStartRef.current = Date.now();
      if (state.round2State) {
        state.round2State.answers = {};
      }
      sync.hostUpdateState({
        round2State: {
          ...state.round2State,
          phase: 'QUESTION_ACTIVE',
          currentQuestionIndex: nextIdx,
          answers: {},
          questions,
        },
      });
      sync.setRoundPhase('QUESTION_ACTIVE', { questionIndex: nextIdx });
    } else {
      // Final Round 2 Summary
      sound.playVictoryFanfare();
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.6 },
      });
      sync.hostUpdateState({
        round2State: {
          ...state.round2State,
          phase: 'ROUND_SUMMARY',
          questions,
        },
      });
      sync.setRoundPhase('ROUND_SUMMARY');
    }
  };

  // Return to Hub action
  const handleReturnToHubClick = () => {
    sound.playCorrectChime();
    sync.returnToHub();
    onReturnToHub();
  };

  // Advance directly to Round 3 (Trưng Cầu Dân Ý)
  const handleAdvanceToRound3Action = () => {
    sound.playVictoryFanfare();
    if (onAdvanceToRound3) {
      onAdvanceToRound3();
    } else {
      sync.hostUpdateState({
        status: 'ROUND_3',
        currentRoundPhase: 'DILEMMA_INTRO',
      });
      sync.setGameStatus('ROUND_3');
      sync.setRoundPhase('DILEMMA_INTRO');
    }
  };

  // Top speed responders on current question
  const topResponders = useMemo(() => {
    return Object.entries(answers)
      .map(([playerId, ans]) => ({
        player: state.players?.[playerId],
        ...ans,
      }))
      .filter((a) => a.isCorrect && a.player)
      .sort((a, b) => b.score - a.score);
  }, [answers, state.players]);

  // Overall Mode 2 ranking (sorted purely by Round 2 score)
  const mode2Leaderboard = useMemo(() => {
    return [...playersList].sort((a, b) => {
      const scoreA = a.roundScores?.ROUND_2 || 0;
      const scoreB = b.roundScores?.ROUND_2 || 0;
      return scoreB - scoreA;
    });
  }, [playersList]);

  // Bomb visual progress & glow styles (10.0s bomb)
  const progressRatio = Math.max(0, Math.min(1, timeLeftMs / 10000));
  const isUrgent = timeLeftMs <= 3500;
  const isCritical = timeLeftMs <= 1500;

  const bombGlowColor = isCritical
    ? 'text-rose-500 drop-shadow-[0_0_35px_rgba(239,35,60,0.9)] animate-pulse'
    : isUrgent
    ? 'text-amber-400 drop-shadow-[0_0_25px_rgba(251,191,36,0.8)]'
    : 'text-emerald-400 drop-shadow-[0_0_18px_rgba(16,185,129,0.7)]';

  const timerBarColor = isCritical
    ? 'bg-rose-500'
    : isUrgent
    ? 'bg-amber-400'
    : 'bg-emerald-400';

  return (
    <div
      className={`relative w-full min-h-full flex flex-col justify-between p-6 bg-slate-950 text-white overflow-y-auto pb-32 transition-all duration-300 ${
        isExploding ? 'animate-shake ring-8 ring-rose-600' : ''
      }`}
    >
      {/* Background Cyber Grid */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#06D6A0_1px,transparent_1px)] [background-size:24px_24px]" />

      {/* ------------------------------------------------------------- */}
      {/* TOP BAR: Header, Question Progress, Room Status */}
      {/* ------------------------------------------------------------- */}
      <header className="relative z-10 flex items-center justify-between pb-4 border-b-4 border-black bg-slate-900/90 rounded-2xl p-4 shadow-[4px_4px_0px_#000]">
        <div className="flex items-center gap-3">
          <span className="p-2.5 bg-rose-500 text-black font-black rounded-xl border-3 border-black shadow-[2px_2px_0px_#000] flex items-center gap-2">
            <Bomb className="w-6 h-6 animate-pulse" />
            <span className="text-sm uppercase tracking-wider font-extrabold text-white">
              MODE 2: BÓC PHỐT 10 GIÂY
            </span>
          </span>
          <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-slate-800 rounded-xl border-2 border-black text-xs font-bold text-slate-300">
            <Timer className="w-4 h-4 text-amber-400" />
            <span>10.0S TICKING REFLEX ENGINE</span>
          </div>
        </div>

        {/* Question Counter Pill */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-1.5 bg-cyber-yellow text-black font-black rounded-xl border-3 border-black shadow-[3px_3px_0px_#000]">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm">
              CÂU {currentQuestionIndex + 1} / {questions.length}
            </span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 border-2 border-black rounded-xl text-xs font-bold">
            <Users className="w-4 h-4 text-cyan-400" />
            <span>{playersList.length} Dân Mạng</span>
          </div>

          <button
            onClick={handleReturnToHubClick}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-black text-xs uppercase rounded-xl border-2 border-black shadow-[2px_2px_0px_#000] transition active:scale-95"
            title="Quay Về Sảnh Chính"
          >
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">Về Sảnh Hub</span>
          </button>
        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* PHASE 1: INTRO / RULE BRIEFING */}
      {/* ------------------------------------------------------------- */}
      {phase === 'INTRO' && (
        <main className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto my-auto text-center px-4 py-8">
          <div className="p-4 bg-rose-500/20 border-4 border-rose-500 rounded-3xl shadow-[8px_8px_0px_#000] mb-6 animate-pulse">
            <Bomb className="w-20 h-20 text-rose-500" />
          </div>

          <h1 className="text-4xl md:text-5xl font-black uppercase text-white tracking-tight drop-shadow-[3px_3px_0px_#000] mb-4">
            ĐẠI CHIẾN BÓC PHỐT 5 GIÂY
          </h1>
          <p className="text-lg md:text-xl font-bold text-amber-400 max-w-2xl mb-8">
            FACT OR CAP 5S REFLEX — 5 PHÁT NGÔN GIẬT GÂN VỀ DÂN CHỦ XHCN & KHÔNG GIAN SỐ!
          </p>

          {/* 3 Core Rules Neo-Brutalist Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mb-8 text-left">
            <div className="bg-slate-900 border-4 border-black rounded-2xl p-4 shadow-[4px_4px_0px_#000]">
              <div className="flex items-center gap-2 mb-2">
                <span className="p-2 bg-emerald-500 text-black font-black rounded-lg text-xs">01</span>
                <span className="font-black text-emerald-400 text-sm">2 NÚT BẤM DUY NHẤT</span>
              </div>
              <p className="text-xs text-slate-300">
                [🟢 FACT / CHUẨN] nếu phát ngôn đúng đắn. [🔴 CAP / BỐC PHÉT] nếu là tin fake hoặc xuyên tạc.
              </p>
            </div>

            <div className="bg-slate-900 border-4 border-black rounded-2xl p-4 shadow-[4px_4px_0px_#000]">
              <div className="flex items-center gap-2 mb-2">
                <span className="p-2 bg-amber-400 text-black font-black rounded-lg text-xs">02</span>
                <span className="font-black text-amber-400 text-sm">SPEED-DECAY SCORING</span>
              </div>
              <p className="text-xs text-slate-300">
                Càng bấm nhanh điểm càng cao (tối đa 1000 điểm). Điểm giảm dần từng tích tắc theo thời gian!
              </p>
            </div>

            <div className="bg-slate-900 border-4 border-black rounded-2xl p-4 shadow-[4px_4px_0px_#000]">
              <div className="flex items-center gap-2 mb-2">
                <span className="p-2 bg-rose-500 text-black font-black rounded-lg text-xs">03</span>
                <span className="font-black text-rose-400 text-sm">3 MẠNG ❤️❤️❤️</span>
              </div>
              <p className="text-xs text-slate-300">
                Bấm sai hoặc hết 5 giây = BỊ NỔ BOM MẤT 1 MẠNG! Hết 3 mạng hóa thành Ma Mạng 👻.
              </p>
            </div>
          </div>

          <button
            onClick={() => handleStartQuestion(0)}
            className="flex items-center gap-3 px-10 py-5 bg-emerald-400 hover:bg-emerald-300 text-black font-black text-xl uppercase tracking-wider rounded-3xl border-4 border-black shadow-[8px_8px_0px_#000] active:translate-x-1 active:translate-y-1 transition"
          >
            <Play className="w-7 h-7 fill-black" />
            <span>KÍCH HOẠT QUẢ BOM 5 GIÂY!</span>
          </button>
        </main>
      )}

      {/* ------------------------------------------------------------- */}
      {/* PHASE 2: QUESTION_ACTIVE (5.0s TICKING BOMB) */}
      {/* ------------------------------------------------------------- */}
      {phase === 'QUESTION_ACTIVE' && (
        <main className="relative z-10 flex-1 flex flex-col justify-between max-w-5xl mx-auto w-full my-auto py-4">
          {/* Statement Neo-Brutalist Card */}
          <div className="relative bg-white text-black border-4 border-black rounded-3xl p-6 md:p-8 shadow-[8px_8px_0px_#000] mb-6">
            <div className="flex items-center justify-between mb-4">
              <span className="px-3.5 py-1.5 bg-rose-100 text-rose-800 border-2 border-black rounded-xl text-xs font-extrabold uppercase">
                {currentQuestion.category || 'Dân chủ & Truyền thông số'}
              </span>
              <span className="text-xs font-bold text-slate-600">
                Tối đa: +{currentQuestion.basePoints || 1000} PTS (Speed-Decay)
              </span>
            </div>

            <p className="text-2xl md:text-3xl lg:text-4xl font-black leading-snug tracking-tight text-slate-900">
              &ldquo;{currentQuestion.statement}&rdquo;
            </p>
          </div>

          {/* Central Bomb Meter & Timer */}
          <div className="flex flex-col items-center justify-center my-auto py-2">
            <div className="relative flex items-center justify-center">
              {/* Pulsing Fuse Smoke / Shockwave */}
              <div
                className={`absolute w-36 h-36 rounded-full transition-all duration-200 pointer-events-none ${
                  isCritical
                    ? 'bg-rose-500/30 scale-125 animate-ping'
                    : isUrgent
                    ? 'bg-amber-400/20 scale-110 animate-pulse'
                    : 'bg-emerald-400/10 scale-100'
                }`}
              />

              <Bomb
                className={`w-28 h-28 md:w-32 md:h-32 transition-transform duration-100 ${bombGlowColor} ${
                  isUrgent ? 'animate-bounce' : ''
                }`}
              />
            </div>

            {/* Countdown Digits */}
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-5xl md:text-6xl font-black font-mono tracking-tighter text-white drop-shadow-[3px_3px_0px_#000]">
                {(timeLeftMs / 1000).toFixed(1)}
              </span>
              <span className="text-2xl font-black text-slate-400 font-mono">S</span>
            </div>

            {/* Visual 5.0s Countdown Bar */}
            <div className="w-full max-w-xl h-6 bg-slate-900 border-3 border-black rounded-full overflow-hidden mt-3 shadow-[3px_3px_0px_#000]">
              <div
                className={`h-full ${timerBarColor} transition-all duration-75`}
                style={{ width: `${progressRatio * 100}%` }}
              />
            </div>
          </div>

          {/* Bottom Live Submissions Tracker */}
          <div className="flex items-center justify-between bg-slate-900/90 border-3 border-black rounded-2xl p-4 shadow-[4px_4px_0px_#000]">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-400 text-black rounded-xl border-2 border-black font-black text-xs">
                ⚡
              </div>
              <div>
                <div className="text-sm font-black text-white">
                  ĐÃ CHỐT ĐÁP ÁN: {answeredCount} / {activePlayers.length || playersList.length} DÂN MẠNG
                </div>
                <div className="text-xs text-slate-400">
                  {activePlayers.length - answeredCount > 0
                    ? `Còn ${activePlayers.length - answeredCount} bạn đang căng não chọn...`
                    : 'Tất cả đã chốt đáp án! Chuẩn bị nổ bom!'}
                </div>
              </div>
            </div>

            <button
              onClick={handleTriggerExplosionAndReveal}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs uppercase rounded-xl border-2 border-black transition"
            >
              Nổ Bom Ngay ➔
            </button>
          </div>
        </main>
      )}

      {/* ------------------------------------------------------------- */}
      {/* PHASE 3: REVEAL (ANSWER, MLN131 EXPLANATION, LIVES IMPACT) */}
      {/* ------------------------------------------------------------- */}
      {phase === 'REVEAL' && (
        <main className="relative z-10 flex-1 flex flex-col justify-between max-w-5xl mx-auto w-full my-auto py-2">
          {/* Answer Reveal Banner */}
          <div className="flex flex-col items-center text-center mb-4">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">
              ĐÁP ÁN CHÍNH XÁC LÀ
            </span>

            {currentQuestion.isFact ? (
              <div className="flex items-center gap-3 px-8 py-3 bg-emerald-400 text-black border-4 border-black rounded-3xl shadow-[6px_6px_0px_#000] animate-bounce">
                <CheckCircle2 className="w-10 h-10 fill-black text-emerald-400" />
                <span className="text-3xl md:text-4xl font-black uppercase tracking-wider">
                  🟢 FACT / CHUẨN MEN!
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-3 px-8 py-3 bg-rose-500 text-white border-4 border-black rounded-3xl shadow-[6px_6px_0px_#000] animate-bounce">
                <XCircle className="w-10 h-10 fill-white text-rose-500" />
                <span className="text-3xl md:text-4xl font-black uppercase tracking-wider">
                  🔴 CAP / BỐC PHÉT!
                </span>
              </div>
            )}
          </div>

          {/* MLN131 Curriculum Theoretical Explanation Box */}
          <div className="bg-slate-900 border-4 border-amber-400/80 rounded-2xl p-5 shadow-[6px_6px_0px_#000] mb-4">
            <div className="flex items-center gap-2 mb-2 text-amber-400 font-black text-sm uppercase">
              <BookOpen className="w-5 h-5" />
              <span>CƠ SỞ LÝ LUẬN MLN131 (DÂN CHỦ XÃ HỘI CHỦ NGHĨA):</span>
            </div>
            <p className="text-sm md:text-base font-bold text-slate-200 leading-relaxed">
              {currentQuestion.explanation}
            </p>
          </div>

          {/* Question Outcomes: Survivors vs Lost Lives Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Top Speed Survivors */}
            <div className="bg-slate-900/90 border-3 border-black rounded-2xl p-4 shadow-[4px_4px_0px_#000]">
              <div className="flex items-center justify-between pb-2 mb-3 border-b-2 border-slate-700">
                <div className="flex items-center gap-2 text-emerald-400 font-black text-xs uppercase">
                  <Zap className="w-4 h-4" />
                  <span>TOP PHẢN XẠ NHANH NHẤT (+ĐIỂM CAO)</span>
                </div>
                <span className="text-xs font-bold text-slate-400">
                  {topResponders.length} Người Trả Lời Đúng
                </span>
              </div>

              {topResponders.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-2">
                  Cả lớp đều bị nổ bom ở câu này! 💥
                </p>
              ) : (
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {topResponders.slice(0, 4).map((item, idx) => {
                    const avatar = getAvatarById(item.player?.avatarId);
                    return (
                      <div
                        key={item.player?.id || idx}
                        className="flex items-center justify-between bg-slate-800/80 rounded-xl px-3 py-1.5 border border-slate-700 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-amber-400">#{idx + 1}</span>
                          <span className="text-base">{avatar.emoji}</span>
                          <span className="font-bold text-white truncate max-w-[120px]">
                            {item.player?.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-400 font-mono">
                            {((5000 - item.remainingTime) / 1000).toFixed(2)}s
                          </span>
                          <span className="font-black text-emerald-400">
                            +{item.score} PTS
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Answer Results Overview */}
            <div className="bg-slate-900/90 border-3 border-black rounded-2xl p-4 shadow-[4px_4px_0px_#000]">
              <div className="flex items-center justify-between pb-2 mb-3 border-b-2 border-slate-700">
                <div className="flex items-center gap-2 text-cyber-yellow font-black text-xs uppercase">
                  <CheckCircle2 className="w-4 h-4 text-cyber-yellow" />
                  <span>KẾT QUẢ TRẢ LỜI CẢ LỚP</span>
                </div>
                <span className="text-xs font-bold text-slate-400">
                  {Object.values(answers).filter((a) => a.isCorrect).length} Đúng / {playersList.length} Bạn
                </span>
              </div>

              <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto pr-1">
                {playersList.map((p) => {
                  const avatar = getAvatarById(p.avatarId);
                  const answered = answers[p.id];
                  const wasCorrect = answered?.isCorrect;
                  const didAnswer = Boolean(answered);

                  return (
                    <div
                      key={p.id}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-bold ${
                        !didAnswer
                          ? 'bg-slate-800 border-slate-700 text-slate-400'
                          : wasCorrect
                          ? 'bg-emerald-950/60 border-emerald-700 text-emerald-200'
                          : 'bg-rose-950/60 border-rose-700 text-rose-200'
                      }`}
                    >
                      <span>{avatar.emoji}</span>
                      <span className="truncate max-w-[90px]">{p.name}</span>
                      <span className="text-[11px] font-black">
                        {!didAnswer ? '⏳ Quá giờ' : wasCorrect ? '✅ +' + (answered.score || 0) : '❌ 0đ'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sticky Action Buttons: Next Question OR Jump to Round 3 */}
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0F1420]/95 backdrop-blur-lg border-t-4 border-black p-4 shadow-[0_-6px_25px_rgba(0,0,0,0.8)]">
            <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={handleAdvanceToRound3Action}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-black font-black text-sm uppercase rounded-xl border-3 border-black shadow-[3px_3px_0px_#000] active:scale-95 transition cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-black" />
                <span>CHUYỂN SANG VÒNG 3 (TRƯNG CẦU DÂN Ý) ➔</span>
              </button>

              <button
                onClick={handleNextStep}
                className="flex items-center gap-3 px-8 py-3 bg-cyber-yellow hover:bg-yellow-300 text-black font-black text-base uppercase rounded-xl border-3 border-black shadow-[3px_3px_0px_#000] active:scale-95 transition cursor-pointer scale-105"
              >
                <span>
                  {currentQuestionIndex + 1 < questions.length
                    ? `SANG CÂU ${currentQuestionIndex + 2} ➔`
                    : 'XEM TỔNG KẾT VÒNG 2 🏆'}
                </span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </main>
      )}

      {/* ------------------------------------------------------------- */}
      {/* PHASE 4: FINAL ROUND SUMMARY & PODIUM */}
      {/* ------------------------------------------------------------- */}
      {phase === 'ROUND_SUMMARY' && (
        <main className="relative z-10 flex-1 flex flex-col justify-between max-w-5xl mx-auto w-full my-auto py-4">
          <div className="text-center mb-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-rose-500/20 text-rose-400 border-2 border-rose-500 rounded-full text-xs font-black uppercase mb-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>KẾT QUẢ ĐẠI CHIẾN BÓC PHỐT 10 GIÂY</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white uppercase drop-shadow-[2px_2px_0px_#000]">
              VINH DANH NHỮNG CHIẾN THẦN BẢO TOÀN TÍNH MẠNG!
            </h2>
          </div>

          {/* Top 3 Survivors Podium */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {mode2Leaderboard.slice(0, 3).map((player, idx) => {
              const avatar = getAvatarById(player.avatarId);
              const lives = player.r2Lives ?? 3;
              const r2Score = player.roundScores?.ROUND_2 || 0;
              const medals = ['🥇 QUÁN QUÂN', '🥈 Á QUÂN', '🥉 QUÝ QUÂN'];
              const bgColors = [
                'bg-cyber-yellow text-black border-black',
                'bg-slate-200 text-black border-black',
                'bg-amber-600 text-white border-black',
              ];

              return (
                <div
                  key={player.id}
                  className={`border-4 rounded-3xl p-5 shadow-[6px_6px_0px_#000] flex flex-col items-center text-center ${
                    bgColors[idx]
                  } ${idx === 0 ? 'scale-105 z-10' : ''}`}
                >
                  <span className="text-xs font-black uppercase tracking-wider mb-2">
                    {medals[idx]}
                  </span>
                  <span className="text-5xl mb-2">{avatar.emoji}</span>
                  <h3 className="font-black text-lg truncate max-w-[200px] mb-1">
                    {player.name}
                  </h3>
                  <div className="text-xs font-bold mb-3 opacity-80">
                    Chiến thần Bóc phốt
                  </div>
                  <div className="px-4 py-1.5 bg-black text-white font-mono font-black text-base rounded-xl border border-black">
                    +{r2Score.toLocaleString()} PTS
                  </div>
                </div>
              );
            })}
          </div>

          {/* Remaining Roster List */}
          <div className="bg-slate-900 border-3 border-black rounded-2xl p-4 shadow-[4px_4px_0px_#000] max-h-48 overflow-y-auto mb-4">
            <h4 className="text-xs font-black uppercase text-slate-400 mb-2">
              BẢNG TỔNG SẮP MODE 2 TOÀN BỘ PHÒNG
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {mode2Leaderboard.slice(3).map((p, i) => {
                const avatar = getAvatarById(p.avatarId);
                const r2Score = p.roundScores?.ROUND_2 || 0;
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between bg-slate-800 px-3 py-2 rounded-xl border border-slate-700 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-500">#{i + 4}</span>
                      <span>{avatar.emoji}</span>
                      <span className="font-bold text-white truncate max-w-[100px]">{p.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-emerald-400">+{r2Score.toLocaleString()} PTS</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sticky Bottom Host Action Bar - ALWAYS VISIBLE AT BOTTOM */}
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0F1420]/95 backdrop-blur-lg border-t-4 border-black p-4 shadow-[0_-6px_25px_rgba(0,0,0,0.8)]">
            <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
              <div className="text-xs text-slate-300 font-bold flex items-center gap-2">
                <span className="p-1.5 bg-rose-500 text-white font-black rounded-lg">⚡ VÒNG 2 HOÀN TẤT</span>
                <span>Đã ghi nhận điểm Bóc Phốt 10s vào Bảng Tổng Sắp!</span>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleReturnToHubClick}
                  className="flex items-center gap-2 px-5 py-3 bg-slate-800 hover:bg-slate-700 text-white font-black text-sm rounded-xl border-2 border-black shadow-[3px_3px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition cursor-pointer"
                >
                  <Home className="w-4 h-4" />
                  <span>Sảnh Hub</span>
                </button>

                <button
                  onClick={handleAdvanceToRound3Action}
                  className="flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-cyan-400 to-emerald-400 hover:from-cyan-300 hover:to-emerald-300 text-black font-black text-base uppercase rounded-xl border-3 border-black shadow-[4px_4px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition cursor-pointer scale-105"
                >
                  <Sparkles className="w-5 h-5 text-black" />
                  <span>TIẾP TỤC SANG VÒNG 3: TRƯNG CẦU DÂN Ý ➔</span>
                </button>
              </div>
            </div>
          </div>
        </main>
      )}
    </div>
  );
}
