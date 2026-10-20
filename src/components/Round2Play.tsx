'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  GameShowState,
  FactCapQuestion,
  FactCapAnswer,
  calculateSpeedDecayScore,
} from '../lib/types';
import { getAvatarById } from '../data/memeAvatars';
import { MLN131_FACT_OR_CAP_QUESTIONS } from '../data/questions';
import { sound } from '../lib/audioSynthesizer';
import { sync } from '../lib/syncEngine';
import {
  Heart,
  Skull,
  Zap,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Bomb,
  Ghost,
  Sparkles,
  Timer,
  Send,
  Flame,
  Volume2,
} from 'lucide-react';

interface Round2PlayProps {
  state: Partial<GameShowState>;
  playerId: string;
  playerName: string;
  avatarId: string;
}

// Danmaku emojis for Ghost Mode & audience cheer
const GHOST_REACTIONS = [
  { emoji: '👻', label: 'Hù ma' },
  { emoji: '💀', label: 'Bay màu' },
  { emoji: '🔥', label: 'Cháy quá' },
  { emoji: '🍿', label: 'Hóng drama' },
  { emoji: '🍅', label: 'Cà chua' },
  { emoji: '🧱', label: 'Ném gạch' },
];

export default function Round2Play({
  state,
  playerId,
  playerName,
  avatarId,
}: Round2PlayProps) {
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

  // Player state
  const currentPlayer = state.players?.[playerId];
  const lives = currentPlayer?.r2Lives ?? 3;
  const isGhost = lives <= 0;
  const playerAvatar = getAvatarById(avatarId);

  // Local submission tracking
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);
  const [lockedChoice, setLockedChoice] = useState<{
    choice: 'FACT' | 'CAP';
    reactionTimeMs: number;
    isCorrect: boolean;
    score: number;
    remainingTime: number;
  } | null>(null);

  // 10.0-second countdown for local feedback
  const [timeLeftMs, setTimeLeftMs] = useState<number>(10000);
  const questionStartTimeRef = useRef<number>(0);
  const submittedRef = useRef<boolean>(false);

  // Reset state when question advances
  useEffect(() => {
    setHasSubmitted(false);
    setLockedChoice(null);
    submittedRef.current = false;
    setTimeLeftMs(10000);
    questionStartTimeRef.current = Date.now();

    // Check if player has already submitted according to state
    if (round2State?.answers?.[playerId]) {
      const existing = round2State.answers[playerId];
      setHasSubmitted(true);
      submittedRef.current = true;
      setLockedChoice({
        choice: existing.choice,
        reactionTimeMs: 10000 - existing.remainingTime,
        isCorrect: existing.isCorrect,
        score: existing.score,
        remainingTime: existing.remainingTime,
      });
    }
  }, [currentQuestionIndex]);

  // Local 10s countdown clock
  useEffect(() => {
    if (phase !== 'QUESTION_ACTIVE') return;

    questionStartTimeRef.current = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - questionStartTimeRef.current;
      const remaining = Math.max(0, 10000 - elapsed);
      setTimeLeftMs(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 40);

    return () => clearInterval(interval);
  }, [phase, currentQuestionIndex]);

  // Handle FACT or CAP Touch
  const handleSelectChoice = async (choice: 'FACT' | 'CAP') => {
    if (hasSubmitted || submittedRef.current || phase !== 'QUESTION_ACTIVE') return;

    submittedRef.current = true;
    setHasSubmitted(true);

    const now = Date.now();
    const elapsed = Math.min(10000, now - questionStartTimeRef.current);
    const remainingTime = Math.max(0, 10000 - elapsed);

    const isCorrect =
      (currentQuestion.isFact && choice === 'FACT') ||
      (!currentQuestion.isFact && choice === 'CAP');

    const score = calculateSpeedDecayScore(
      currentQuestion.basePoints || 1000,
      remainingTime,
      10000,
      isCorrect
    );

    setLockedChoice({
      choice,
      reactionTimeMs: elapsed,
      isCorrect,
      score,
      remainingTime,
    });

    // Mobile haptic feedback & tap sound
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(50);
      } catch (e) {
        // Ignore vibration errors
      }
    }
    sound.playTapPunch();

    // Dispatch to serverless backend
    await sync.submitFactOrCap(
      choice,
      remainingTime,
      10000,
      playerId,
      currentQuestionIndex
    );
  };

  // Ghost Mode Danmaku send
  const handleSendGhostDanmaku = (emoji: string, label: string) => {
    sync.sendDanmaku(emoji, label, playerName, avatarId);
    if (emoji === '🍅' || emoji === '🧱') {
      sound.playSplat();
    } else {
      sound.playTapPunch();
    }
  };

  // Timer visual progress
  const timerRatio = Math.max(0, Math.min(1, timeLeftMs / 10000));
  const isUrgent = timeLeftMs <= 3500;
  const isCritical = timeLeftMs <= 1500;

  // Reveal outcome determination
  const serverAnswer = round2State?.answers?.[playerId];
  const finalAnswer = lockedChoice || serverAnswer;
  const wasCorrect = finalAnswer ? finalAnswer.isCorrect : false;
  const didTimeout = !finalAnswer;
  const reactionTimeSec = finalAnswer
    ? ('reactionTimeMs' in finalAnswer
        ? finalAnswer.reactionTimeMs / 1000
        : Math.max(0, 10000 - finalAnswer.remainingTime) / 1000)
    : 0;

  return (
    <div
      className={`relative h-[100dvh] w-full flex flex-col justify-between overflow-hidden bg-slate-950 text-white select-none transition-all duration-300 ${
        isGhost ? 'bg-gradient-to-b from-purple-950/40 to-slate-950' : ''
      }`}
    >
      {/* Background Cyber Grid */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#EF233C_1px,transparent_1px)] [background-size:20px_20px]" />

      {/* ------------------------------------------------------------- */}
      {/* TOP HEADER: Player Profile, 3 Lives, Question Indicator */}
      {/* ------------------------------------------------------------- */}
      <header className="relative z-10 px-4 py-3 bg-slate-900/95 border-b-4 border-black shadow-[0_4px_0_#000]">
        <div className="flex items-center justify-between">
          {/* Avatar & Name */}
          <div className="flex items-center gap-2.5">
            <span className="text-2xl p-1 bg-slate-800 rounded-xl border-2 border-black">
              {playerAvatar.emoji}
            </span>
            <div>
              <div className="text-xs font-black text-white truncate max-w-[130px]">
                {playerName}
              </div>
              <div className="text-[10px] font-bold text-cyber-yellow">
                {(currentPlayer?.score || 0).toLocaleString()} PTS
              </div>
            </div>
          </div>

          {/* 3 Lives Health Meter / Ghost Indicator */}
          <div className="flex items-center gap-2">
            {isGhost ? (
              <div className="flex items-center gap-1 px-3 py-1 bg-purple-900/80 border-2 border-purple-500 rounded-xl text-purple-200 text-xs font-black animate-pulse">
                <Ghost className="w-4 h-4 text-purple-400" />
                <span>MA MẠNG</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 px-3 py-1 bg-slate-800 border-2 border-black rounded-xl shadow-[2px_2px_0px_#000]">
                <span className="text-sm tracking-widest">
                  {lives === 3
                    ? '❤️❤️❤️'
                    : lives === 2
                    ? '❤️❤️🖤'
                    : '❤️🖤🖤'}
                </span>
                <span className="text-[10px] font-black text-rose-400 ml-1">
                  x{lives}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Question & Category Sub-Bar */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800 text-[11px] font-bold text-slate-400">
          <span className="flex items-center gap-1 text-cyber-yellow">
            <Sparkles className="w-3.5 h-3.5" />
            <span>CÂU {currentQuestionIndex + 1}/5</span>
          </span>
          <span className="truncate max-w-[180px] text-slate-300">
            {currentQuestion.category || 'Dân chủ & Không gian số'}
          </span>
        </div>
      </header>

      {/* ------------------------------------------------------------- */}
      {/* PHASE 1: INTRO / WAITING FOR PROJECTOR START */}
      {/* ------------------------------------------------------------- */}
      {phase === 'INTRO' && (
        <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="p-5 bg-rose-500/20 border-4 border-rose-500 rounded-3xl shadow-[6px_6px_0px_#000] mb-5 animate-pulse">
            <Bomb className="w-16 h-16 text-rose-500" />
          </div>

          <h2 className="text-2xl font-black uppercase text-white mb-2 drop-shadow-[2px_2px_0px_#000]">
            BÓC PHỐT 5 GIÂY SẮP BẮT ĐẦU!
          </h2>
          <p className="text-xs font-bold text-amber-400 max-w-xs mb-6">
            Mỗi câu chỉ có đúng 5 giây. Chuẩn bị 2 ngón tay cái để bấm thật nhanh!
          </p>

          <div className="w-full max-w-xs bg-slate-900 border-3 border-black rounded-2xl p-4 shadow-[4px_4px_0px_#000] text-left space-y-2 text-xs">
            <div className="flex items-center gap-2 text-emerald-400 font-black">
              <span>🟢 FACT:</span>
              <span className="text-slate-300 font-normal">Chạm khi phát ngôn đúng</span>
            </div>
            <div className="flex items-center gap-2 text-rose-400 font-black">
              <span>🔴 CAP:</span>
              <span className="text-slate-300 font-normal">Chạm khi là tin fake/bịa đặt</span>
            </div>
            <div className="flex items-center gap-2 text-amber-400 font-black">
              <span>⚡ SPEED:</span>
              <span className="text-slate-300 font-normal">Càng nhanh điểm càng cao!</span>
            </div>
          </div>
        </main>
      )}

      {/* ------------------------------------------------------------- */}
      {/* PHASE 2: QUESTION_ACTIVE (5.0s COUNTDOWN & 2 GIANT BUTTONS) */}
      {/* ------------------------------------------------------------- */}
      {phase === 'QUESTION_ACTIVE' && (
        <main className="relative z-10 flex-1 flex flex-col justify-between p-4 gap-3">
          {/* Visual 5.0s Countdown Bar */}
          <div className="w-full bg-slate-900 border-3 border-black rounded-2xl p-3 shadow-[4px_4px_0px_#000]">
            <div className="flex items-center justify-between mb-1.5 text-xs font-black">
              <span className="flex items-center gap-1.5 text-slate-300">
                <Bomb
                  className={`w-4 h-4 ${
                    isCritical
                      ? 'text-rose-500 animate-bounce'
                      : isUrgent
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                />
                <span>THỜI GIAN CÒN LẠI</span>
              </span>
              <span className="font-mono text-base text-white">
                {(timeLeftMs / 1000).toFixed(1)}s
              </span>
            </div>

            <div className="w-full h-3.5 bg-slate-950 border-2 border-black rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-75 ${
                  isCritical
                    ? 'bg-rose-500'
                    : isUrgent
                    ? 'bg-amber-400'
                    : 'bg-emerald-400'
                }`}
                style={{ width: `${timerRatio * 100}%` }}
              />
            </div>
          </div>

          {/* Statement Snippet Card */}
          <div className="bg-white text-black border-3 border-black rounded-2xl p-4 shadow-[4px_4px_0px_#000] text-center">
            <p className="text-sm sm:text-base font-black leading-snug line-clamp-3">
              &ldquo;{currentQuestion.statement}&rdquo;
            </p>
          </div>

          {/* Main Action Area */}
          {!hasSubmitted ? (
            <div className="flex-1 flex flex-col gap-3 justify-center">
              {/* Giant Button 1: FACT / CHUẨN MEN */}
              <button
                onClick={() => handleSelectChoice('FACT')}
                className="flex-1 flex flex-col items-center justify-center p-5 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-black border-4 border-black rounded-3xl shadow-[6px_6px_0px_#000] transition active:shadow-none"
              >
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck className="w-8 h-8 fill-black text-emerald-500" />
                  <span className="text-3xl font-black tracking-wider uppercase">
                    FACT
                  </span>
                </div>
                <span className="text-xs font-extrabold uppercase tracking-wide bg-black text-emerald-400 px-3 py-1 rounded-full border border-black">
                  CHUẨN MEN / ĐÚNG
                </span>
              </button>

              {/* Giant Button 2: CAP / BỐC PHÉT */}
              <button
                onClick={() => handleSelectChoice('CAP')}
                className="flex-1 flex flex-col items-center justify-center p-5 bg-rose-500 hover:bg-rose-400 active:scale-95 text-white border-4 border-black rounded-3xl shadow-[6px_6px_0px_#000] transition active:shadow-none"
              >
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-8 h-8 fill-white text-rose-500" />
                  <span className="text-3xl font-black tracking-wider uppercase">
                    CAP
                  </span>
                </div>
                <span className="text-xs font-extrabold uppercase tracking-wide bg-black text-rose-400 px-3 py-1 rounded-full border border-black">
                  BỐC PHÉT / XẠO KE
                </span>
              </button>
            </div>
          ) : (
            /* Locked In Confirmation View */
            <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-900 border-4 border-black rounded-3xl shadow-[6px_6px_0px_#000] text-center">
              <div className="p-3 bg-cyber-yellow/20 rounded-full border-2 border-cyber-yellow mb-3 animate-spin">
                <Timer className="w-8 h-8 text-cyber-yellow" />
              </div>

              <div className="text-xs font-black uppercase tracking-wider text-slate-400 mb-1">
                BẠN ĐÃ CHỐT ĐÁP ÁN:
              </div>

              <div
                className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl border-3 border-black text-xl font-black uppercase shadow-[4px_4px_0px_#000] mb-3 ${
                  lockedChoice?.choice === 'FACT'
                    ? 'bg-emerald-400 text-black'
                    : 'bg-rose-500 text-white'
                }`}
              >
                {lockedChoice?.choice === 'FACT' ? '🟢 FACT (CHUẨN)' : '🔴 CAP (BỐC PHÉT)'}
              </div>

              <div className="text-xs font-bold text-slate-300 mb-1">
                ⚡ Tốc độ phản xạ:{' '}
                <span className="font-mono text-cyber-yellow">
                  {((lockedChoice?.reactionTimeMs || 0) / 1000).toFixed(2)}s
                </span>
              </div>

              <div className="text-[11px] text-slate-400 italic">
                Chờ máy chiếu nổ bom & vạch mặt đáp án...
              </div>
            </div>
          )}

          {/* Ghost Mode Auxiliary Toolbar */}
          {isGhost && (
            <div className="bg-purple-950/80 border-2 border-purple-600 rounded-2xl p-2.5 shadow-[3px_3px_0px_#000]">
              <div className="text-[11px] font-black text-purple-300 text-center mb-1.5 flex items-center justify-center gap-1">
                <Ghost className="w-3.5 h-3.5" />
                <span>MA MẠNG TROLL MÁY CHIẾU:</span>
              </div>
              <div className="grid grid-cols-6 gap-1">
                {GHOST_REACTIONS.map((g) => (
                  <button
                    key={g.emoji}
                    onClick={() => handleSendGhostDanmaku(g.emoji, g.label)}
                    className="p-1.5 bg-purple-900/60 hover:bg-purple-800 border border-purple-500 rounded-xl text-center active:scale-95 transition"
                    title={g.label}
                  >
                    <span className="text-lg">{g.emoji}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </main>
      )}

      {/* ------------------------------------------------------------- */}
      {/* PHASE 3: REVEAL (GREEN FLASH vs CRACKED SCREEN ON WRONG) */}
      {/* ------------------------------------------------------------- */}
      {phase === 'REVEAL' && (
        <main
          className={`relative z-10 flex-1 flex flex-col justify-between p-4 ${
            !wasCorrect ? 'animate-shake' : ''
          }`}
        >
          {/* Cracked Screen Overlay on Wrong Answer */}
          {!wasCorrect && (
            <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center">
              {/* Red blood/danger vignette */}
              <div className="absolute inset-0 bg-rose-950/30 ring-inset ring-8 ring-rose-600" />
              {/* SVG Comic Glass Cracks */}
              <svg className="w-full h-full opacity-60" viewBox="0 0 100 100">
                <line x1="50" y1="50" x2="10" y2="10" stroke="#fff" strokeWidth="1" />
                <line x1="50" y1="50" x2="90" y2="20" stroke="#fff" strokeWidth="0.8" />
                <line x1="50" y1="50" x2="80" y2="85" stroke="#fff" strokeWidth="1" />
                <line x1="50" y1="50" x2="15" y2="75" stroke="#fff" strokeWidth="0.8" />
                <line x1="50" y1="50" x2="45" y2="95" stroke="#fff" strokeWidth="1.2" />
                <line x1="50" y1="50" x2="5" y2="45" stroke="#fff" strokeWidth="0.8" />
                <circle cx="50" cy="50" r="4" fill="#EF233C" />
              </svg>
            </div>
          )}

          {/* Outcome Result Card */}
          <div
            className={`border-4 border-black rounded-3xl p-5 shadow-[6px_6px_0px_#000] text-center my-auto ${
              wasCorrect
                ? 'bg-emerald-500 text-black'
                : 'bg-rose-600 text-white'
            }`}
          >
            {wasCorrect ? (
              <>
                <CheckCircle2 className="w-16 h-16 mx-auto mb-2 fill-black text-emerald-500" />
                <h3 className="text-2xl font-black uppercase tracking-tight mb-1">
                  CHÍNH XÁC! 🎉
                </h3>
                <p className="text-xs font-black uppercase bg-black text-emerald-400 px-3 py-1 rounded-full inline-block mb-3">
                  BẢO TOÀN TÍNH MẠNG!
                </p>

                <div className="text-3xl font-black font-mono mb-1">
                  +{finalAnswer?.score || 0} PTS
                </div>
                <div className="text-xs font-bold opacity-90">
                  Phản xạ: {reactionTimeSec.toFixed(2)}s
                </div>
              </>
            ) : (
              <>
                <Bomb className="w-16 h-16 mx-auto mb-2 text-white animate-bounce" />
                <h3 className="text-2xl font-black uppercase tracking-tight mb-1">
                  {didTimeout ? 'HẾT GIỜ! 💥' : 'NỔ BOM RỒI! 💥'}
                </h3>
                <p className="text-xs font-black uppercase bg-black text-rose-400 px-3 py-1 rounded-full inline-block mb-3">
                  BẠN BỊ MẤT 1 MẠNG! (-1 ❤️)
                </p>

                <div className="text-lg font-black mb-1">
                  {lives <= 0 ? '👻 BẠN ĐÃ BIẾN THÀNH MA MẠNG' : `CÒN LẠI: ${lives} MẠNG`}
                </div>
                <div className="text-xs opacity-90">
                  {didTimeout ? 'Do không kịp bấm trước 5 giây' : 'Do phán đoán sai thực tế'}
                </div>
              </>
            )}
          </div>

          {/* 1-Line MLN131 Explanation for Mobile */}
          <div className="bg-slate-900 border-3 border-black rounded-2xl p-4 shadow-[4px_4px_0px_#000] text-xs">
            <div className="flex items-center gap-1.5 text-amber-400 font-black mb-1">
              <span>ĐÁP ÁN:</span>
              <span className="uppercase">
                {currentQuestion.isFact ? '🟢 FACT (CHUẨN MEN)' : '🔴 CAP (BỐC PHÉT)'}
              </span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              {currentQuestion.explanation}
            </p>
          </div>
        </main>
      )}

      {/* ------------------------------------------------------------- */}
      {/* PHASE 4: FINAL ROUND SUMMARY */}
      {/* ------------------------------------------------------------- */}
      {phase === 'ROUND_SUMMARY' && (
        <main className="relative z-10 flex-1 flex flex-col justify-center items-center p-6 text-center">
          <div className="p-4 bg-cyber-yellow/20 border-4 border-cyber-yellow rounded-3xl shadow-[6px_6px_0px_#000] mb-4">
            <Sparkles className="w-14 h-14 text-cyber-yellow animate-spin" />
          </div>

          <h3 className="text-2xl font-black uppercase text-white mb-2">
            HOÀN THÀNH VÒNG 2!
          </h3>
          <p className="text-xs font-bold text-slate-300 max-w-xs mb-5">
            Bạn đã chiến đấu dũng cảm trong 5 câu bóc phốt 5 giây.
          </p>

          <div className="w-full max-w-xs bg-slate-900 border-3 border-black rounded-2xl p-4 shadow-[4px_4px_0px_#000] mb-4 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-bold">Điểm Vòng 2:</span>
              <span className="font-mono font-black text-emerald-400 text-base">
                +{(currentPlayer?.roundScores?.ROUND_2 || 0).toLocaleString()} PTS
              </span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-bold">Số mạng còn lại:</span>
              <span className="font-black">
                {lives > 0 ? `❤️ x${lives}` : '👻 Ma Mạng'}
              </span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 italic">
            Theo dõi màn hình máy chiếu để xem vinh danh và chuyển vòng tiếp theo!
          </div>
        </main>
      )}
    </div>
  );
}
