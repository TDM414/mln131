'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  GameShowState,
  DilemmaItem,
  DilemmaTally,
} from '../lib/types';
import { getAvatarById } from '../data/memeAvatars';
import { MLN131_CONSENSUS_DILEMMAS } from '../data/questions';
import { sound } from '../lib/audioSynthesizer';
import { sync } from '../lib/syncEngine';
import confetti from 'canvas-confetti';
import {
  Scale,
  Sparkles,
  Trophy,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Send,
  Timer,
  ShieldCheck,
  Flame,
  Award,
} from 'lucide-react';

interface Round3PlayProps {
  state: Partial<GameShowState>;
  playerId: string;
  playerName: string;
  avatarId: string;
}

const QUICK_EMOJIS = [
  { emoji: '🔥', label: 'Cháy' },
  { emoji: '🍅', label: 'Cà chua' },
  { emoji: '🧱', label: 'Gạch' },
  { emoji: '❤️', label: 'Tim' },
  { emoji: '👏', label: 'Vỗ tay' },
  { emoji: '🍿', label: 'Hóng' },
];

function getChoiceText(choice: string | { text: string; label?: string } | undefined): string {
  if (!choice) return '';
  if (typeof choice === 'string') return choice;
  return choice.text || '';
}

export default function Round3Play({
  state,
  playerId,
  playerName,
  avatarId,
}: Round3PlayProps) {
  const round3State = state.round3State;

  // Dilemma lookup
  const currentDilemma: DilemmaItem = useMemo(() => {
    if (round3State?.dilemma) return round3State.dilemma;
    const idx = round3State?.currentDilemmaIndex ?? 0;
    return MLN131_CONSENSUS_DILEMMAS[idx] || MLN131_CONSENSUS_DILEMMAS[0];
  }, [round3State?.dilemma, round3State?.currentDilemmaIndex]);

  // Normalized Phase
  const rawPhase = round3State?.phase || 'DILEMMA_INTRO';
  const phase: 'DILEMMA_INTRO' | 'VOTING' | 'TUG_REVEAL' | 'SUMMARY' = useMemo(() => {
    if (
      rawPhase === 'VOTING' ||
      rawPhase === 'VOTE_AND_BET' ||
      rawPhase === 'CLUE_DISCOVERY' ||
      rawPhase === 'EXPULSION_VOTE'
    ) {
      return 'VOTING';
    }
    if (
      rawPhase === 'TUG_REVEAL' ||
      rawPhase === 'TUG_OF_WAR_REVEAL' ||
      rawPhase === 'VAR_VERDICT'
    ) {
      return 'TUG_REVEAL';
    }
    if (rawPhase === 'SUMMARY' || rawPhase === 'ROUND_SUMMARY') {
      return 'SUMMARY';
    }
    return 'DILEMMA_INTRO';
  }, [rawPhase]);

  // 2-Stage Interaction Flow: Step 1 (STANCE) -> Step 2 (BET) -> LOCKED
  const [selectedStance, setSelectedStance] = useState<'A' | 'B' | null>(null);
  const [selectedBet, setSelectedBet] = useState<'A' | 'B' | null>(null);
  const [hasSubmittedStance, setHasSubmittedStance] = useState<boolean>(false);
  const [hasSubmittedBet, setHasSubmittedBet] = useState<boolean>(false);

  // Local voting timer (20s)
  const [timeLeftMs, setTimeLeftMs] = useState<number>(20000);
  const timerStartRef = useRef<number>(0);
  const soundPlayedRef = useRef<boolean>(false);

  // Reset when dilemma changes
  useEffect(() => {
    setSelectedStance(null);
    setSelectedBet(null);
    setHasSubmittedStance(false);
    setHasSubmittedBet(false);
    soundPlayedRef.current = false;
  }, [currentDilemma.id]);

  // Synchronize from server state if already recorded
  useEffect(() => {
    if (round3State?.stances?.[playerId]) {
      setSelectedStance(round3State.stances[playerId]);
      setHasSubmittedStance(true);
    }
    if (round3State?.consensusBets?.[playerId]) {
      setSelectedBet(round3State.consensusBets[playerId]);
      setHasSubmittedBet(true);
    }
  }, [round3State?.stances, round3State?.consensusBets, playerId]);

  // 20s local countdown timer during VOTING
  useEffect(() => {
    if (phase !== 'VOTING') return;

    timerStartRef.current = Date.now();
    setTimeLeftMs(20000);

    const interval = setInterval(() => {
      const elapsed = Date.now() - timerStartRef.current;
      const remaining = Math.max(0, 20000 - elapsed);
      setTimeLeftMs(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 150);

    return () => clearInterval(interval);
  }, [phase]);

  // Sound and confetti triggers on reveal
  useEffect(() => {
    if ((phase === 'TUG_REVEAL' || phase === 'SUMMARY') && !soundPlayedRef.current) {
      soundPlayedRef.current = true;
      const majority = round3State?.tally?.majority;
      const currentBet = selectedBet || round3State?.consensusBets?.[playerId];

      if (majority === 'DRAW') {
        sound.playApplause();
      } else if (majority && currentBet === majority) {
        sound.playVictoryFanfare();
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.7 },
          });
        } catch (e) {}
      } else {
        sound.playSplat();
      }
    }
  }, [phase, round3State?.tally?.majority, selectedBet, round3State?.consensusBets, playerId]);

  // STEP 1: Submit Stance
  const handleSelectStance = (stance: 'A' | 'B') => {
    if (hasSubmittedStance) return;
    setSelectedStance(stance);
    setHasSubmittedStance(true);

    if ('vibrate' in navigator) navigator.vibrate(30);
    sound.playCorrectChime();

    sync.submitDilemmaStance(stance, playerId);
  };

  // STEP 2: Submit Bet
  const handleSelectBet = (bet: 'A' | 'B') => {
    if (hasSubmittedBet) return;
    setSelectedBet(bet);
    setHasSubmittedBet(true);

    if ('vibrate' in navigator) navigator.vibrate(50);
    sound.playCorrectChime();

    const remainingTime = Math.max(1000, timeLeftMs);
    sync.submitDilemmaBet(bet, remainingTime, 20000, playerId);
  };

  // Send quick Danmaku reaction
  const handleSendEmoji = (emoji: string) => {
    if ('vibrate' in navigator) navigator.vibrate(20);
    sync.sendDanmaku(emoji, '', playerName, avatarId);
  };

  const choiceAText = getChoiceText(currentDilemma.choiceA);
  const choiceBText = getChoiceText(currentDilemma.choiceB);

  const playerAvatar = getAvatarById(avatarId || 'keyboard_warrior');
  const AvatarSvg = playerAvatar.SvgComponent;
  const currentPlayer = state.players?.[playerId];
  const totalScore = currentPlayer?.score ?? 0;

  const tally = round3State?.tally;
  const majority = tally?.majority;
  const isWinner = majority && majority !== 'DRAW' && selectedBet === majority;
  const isMinority = majority && majority !== 'DRAW' && selectedBet && selectedBet !== majority;
  const isDraw = majority === 'DRAW';

  return (
    <div className="h-[100dvh] w-full flex flex-col justify-between p-3.5 max-w-md mx-auto select-none bg-[#0B0F19] text-white overflow-hidden relative font-sans">
      {/* 1. TOP STATUS BAR */}
      <div className="flex items-center justify-between bg-slate-900 border-3 border-black p-2.5 rounded-2xl shadow-[3px_3px_0px_#000] shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg overflow-hidden bg-black flex items-center justify-center shrink-0 border border-slate-700">
            <AvatarSvg size={32} />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-black text-white truncate max-w-[110px]">{playerName}</div>
            <div className="text-[10px] text-cyber-yellow font-bold">
              {totalScore.toLocaleString()} pts
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {phase === 'VOTING' && (
            <div className="px-2.5 py-1 bg-rose-600 border border-black rounded-lg text-white font-black text-xs animate-pulse">
              ⏱️ {(timeLeftMs / 1000).toFixed(0)}s
            </div>
          )}

          <div className="px-2.5 py-1 bg-purple-500/20 border border-purple-500 rounded-lg text-[10px] font-black text-purple-300 uppercase">
            MODE 3: TRƯNG CẦU
          </div>
        </div>
      </div>

      {/* 2. MAIN INTERACTIVE CONTENT STAGE */}
      <div className="flex-1 flex flex-col justify-center my-2 overflow-y-auto">
        {/* PHASE 1: DILEMMA INTRO / WAITING */}
        {phase === 'DILEMMA_INTRO' && (
          <div className="bg-slate-900 border-4 border-black rounded-3xl p-5 shadow-[6px_6px_0px_#000] text-center animate-in zoom-in-95">
            <div className="inline-block px-3 py-1 bg-cyber-yellow text-black font-black text-[10px] rounded-full uppercase tracking-wider mb-2">
              CHUẨN BỊ BIỂU QUYẾT
            </div>

            <h3 className="text-base sm:text-lg font-black text-white mb-2 leading-snug">
              {currentDilemma.title}
            </h3>

            <p className="text-xs text-slate-300 leading-relaxed bg-black/40 border border-slate-800 p-3 rounded-xl mb-4 line-clamp-4">
              {currentDilemma.scenario}
            </p>

            <div className="grid grid-cols-2 gap-2 text-left mb-4">
              <div className="p-2.5 rounded-xl bg-emerald-950/40 border-2 border-cyber-cyan/50 text-[11px] font-bold text-cyber-cyan">
                🛡️ Phe A: {choiceAText}
              </div>
              <div className="p-2.5 rounded-xl bg-rose-950/40 border-2 border-cyber-crimson/50 text-[11px] font-bold text-rose-400">
                ⚖️ Phe B: {choiceBText}
              </div>
            </div>

            <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400 font-bold flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyber-yellow" />
              <span>Hãy nhìn máy chiếu. Chuẩn bị chọn phe & cược đa số!</span>
            </div>
          </div>
        )}

        {/* PHASE 2: VOTING — 2-STAGE INTERACTION */}
        {phase === 'VOTING' && (
          <div className="flex-1 flex flex-col justify-between py-1">
            {/* STEP 1: SELECT PERSONAL STANCE */}
            {!hasSubmittedStance ? (
              <div className="flex-1 flex flex-col justify-between animate-in slide-in-from-right duration-200">
                <div className="text-center mb-2">
                  <span className="px-3 py-1 bg-cyber-yellow text-black font-black text-[11px] rounded-full uppercase tracking-wider inline-block mb-1 shadow-[2px_2px_0px_#000]">
                    BƯỚC 1/2: LẬP TRƯỜNG CỦA BẠN
                  </span>
                  <h3 className="text-sm font-black text-white">Bạn nghiêng về phương án nào?</h3>
                </div>

                <div className="space-y-3 my-auto">
                  {/* Button Phe A */}
                  <button
                    onClick={() => handleSelectStance('A')}
                    disabled={hasSubmittedStance}
                    className="w-full p-4 rounded-2xl bg-cyber-cyan hover:bg-emerald-400 text-black font-black text-left border-4 border-black shadow-[5px_5px_0px_#000] transition active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs uppercase px-2 py-0.5 bg-black text-cyber-cyan rounded-md">
                        🛡️ PHE A
                      </span>
                      <span className="text-lg">👈</span>
                    </div>
                    <div className="text-sm sm:text-base leading-snug">{choiceAText}</div>
                  </button>

                  {/* Button Phe B */}
                  <button
                    onClick={() => handleSelectStance('B')}
                    disabled={hasSubmittedStance}
                    className="w-full p-4 rounded-2xl bg-cyber-crimson hover:bg-rose-500 text-white font-black text-left border-4 border-black shadow-[5px_5px_0px_#000] transition active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs uppercase px-2 py-0.5 bg-black text-cyber-crimson rounded-md">
                        ⚖️ PHE B
                      </span>
                      <span className="text-lg">👉</span>
                    </div>
                    <div className="text-sm sm:text-base leading-snug">{choiceBText}</div>
                  </button>
                </div>

                <div className="text-center text-[11px] text-slate-400">
                  Chọn lập trường cá nhân trước khi sang bước đặt cược!
                </div>
              </div>
            ) : !hasSubmittedBet ? (
              /* STEP 2: BET ON >50% CONSENSUS MAJORITY */
              <div className="flex-1 flex flex-col justify-between animate-in slide-in-from-right duration-200">
                <div className="text-center mb-2">
                  <span className="px-3 py-1 bg-cyber-crimson text-white font-black text-[11px] rounded-full uppercase tracking-wider inline-block mb-1 shadow-[2px_2px_0px_#000]">
                    BƯỚC 2/2: DỰ ĐOÁN ĐỒNG THUẬN
                  </span>
                  <h3 className="text-base sm:text-lg font-black text-cyber-yellow leading-tight">
                    THEO BẠN, TRÊN 50% CẢ LỚP SẼ CHỌN PHE NÀO?
                  </h3>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Đoán đúng nhận tới <strong className="text-cyber-yellow">+5,000 PTS</strong>!
                  </p>
                </div>

                {/* Stance reminder badge */}
                <div className="p-2 bg-slate-900 border border-slate-700 rounded-xl text-center text-xs text-slate-300">
                  Lập trường của bạn:{' '}
                  <strong className={selectedStance === 'A' ? 'text-cyber-cyan' : 'text-cyber-crimson'}>
                    Phe {selectedStance}
                  </strong>{' '}
                  (Bạn có thể cược phe khác nếu nghĩ lớp sẽ chọn khác!)
                </div>

                <div className="space-y-3 my-auto">
                  {/* Bet Phe A */}
                  <button
                    onClick={() => handleSelectBet('A')}
                    disabled={hasSubmittedBet}
                    className="w-full p-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-left border-4 border-cyber-cyan shadow-[5px_5px_0px_#000] transition active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs uppercase text-cyber-cyan font-black mb-1">
                        🎲 CƯỢC PHE A THẮNG (&gt;50%)
                      </div>
                      <div className="text-xs text-slate-300 truncate max-w-[220px]">
                        {choiceAText}
                      </div>
                    </div>
                    <span className="text-2xl">🛡️</span>
                  </button>

                  {/* Bet Phe B */}
                  <button
                    onClick={() => handleSelectBet('B')}
                    disabled={hasSubmittedBet}
                    className="w-full p-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-left border-4 border-cyber-crimson shadow-[5px_5px_0px_#000] transition active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs uppercase text-cyber-crimson font-black mb-1">
                        🎲 CƯỢC PHE B THẮNG (&gt;50%)
                      </div>
                      <div className="text-xs text-slate-300 truncate max-w-[220px]">
                        {choiceBText}
                      </div>
                    </div>
                    <span className="text-2xl">⚖️</span>
                  </button>
                </div>

                <div className="text-center text-[10px] text-slate-400">
                  Càng cược sớm điểm Speed-Decay càng cao!
                </div>
              </div>
            ) : (
              /* LOCKED IN / WAITING FOR TIMER EXPIRE */
              <div className="flex-1 flex flex-col justify-center items-center text-center p-4 bg-slate-900 border-4 border-black rounded-3xl shadow-[6px_6px_0px_#000] animate-in zoom-in-95">
                <div className="w-14 h-14 rounded-2xl bg-cyber-yellow border-3 border-black flex items-center justify-center text-3xl mb-3 shadow-[3px_3px_0px_#000]">
                  🔒
                </div>
                <h3 className="text-lg font-black text-white mb-1">ĐÃ CHỐT BIỂU QUYẾT & CƯỢC!</h3>

                <div className="w-full space-y-2 bg-black/50 border border-slate-800 rounded-2xl p-3 my-3 text-left text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Lập trường cá nhân:</span>
                    <span
                      className={`font-black ${
                        selectedStance === 'A' ? 'text-cyber-cyan' : 'text-cyber-crimson'
                      }`}
                    >
                      Phe {selectedStance}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Dự đoán đa số (&gt;50%):</span>
                    <span
                      className={`font-black ${
                        selectedBet === 'A' ? 'text-cyber-cyan' : 'text-cyber-crimson'
                      }`}
                    >
                      Cược Phe {selectedBet} Thắng
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed max-w-xs">
                  Hãy nhìn lên màn hình máy chiếu xem thanh kéo co giằng co realtime!
                </p>
              </div>
            )}
          </div>
        )}

        {/* PHASE 3: TUG REVEAL / VERDICT */}
        {(phase === 'TUG_REVEAL' || phase === 'SUMMARY') && (
          <div className="flex-1 flex flex-col justify-between py-1 relative">
            {/* Comic cracked screen overlay for minority betters */}
            {isMinority && (
              <div className="absolute inset-0 z-20 pointer-events-none flex flex-col items-center justify-center animate-in zoom-in-90">
                {/* SVG Cracked Glass Lines */}
                <svg
                  className="absolute inset-0 w-full h-full opacity-60 stroke-white"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >
                  <path d="M50 50 L10 10 M50 50 L90 15 M50 50 L80 90 M50 50 L15 85 M50 50 L30 3 M50 50 L70 98" strokeWidth="1" />
                  <circle cx="50" cy="50" r="12" fill="none" strokeWidth="1.5" />
                  <path d="M40 40 L35 15 M60 40 L85 30 M60 60 L75 80 M40 60 L25 75" strokeWidth="0.8" />
                </svg>
                {/* Giant Splattered Tomato & Brick */}
                <div className="text-6xl animate-bounce mb-2">🧱 💥 🍅</div>
              </div>
            )}

            {/* Result Verdict Card */}
            <div
              className={`p-5 rounded-3xl border-4 border-black text-center shadow-[6px_6px_0px_#000] my-auto relative z-10 ${
                isDraw
                  ? 'bg-purple-950/90 border-purple-500'
                  : isWinner
                  ? 'bg-emerald-950/90 border-cyber-cyan ring-4 ring-cyber-cyan/50'
                  : 'bg-red-950/90 border-cyber-crimson'
              }`}
            >
              {isDraw ? (
                <>
                  <div className="text-4xl mb-2">🤝</div>
                  <h3 className="text-xl font-black text-cyber-yellow uppercase">
                    HÒA ĐỒNG THUẬN 50 / 50!
                  </h3>
                  <div className="text-2xl font-black text-white font-mono my-2">+2,500 PTS</div>
                  <p className="text-xs text-slate-300">
                    Cả lớp cùng chia đều quan điểm! Mọi chiến sĩ đều nhận điểm thưởng đồng thuận.
                  </p>
                </>
              ) : isWinner ? (
                <>
                  <div className="text-4xl mb-2">🏆</div>
                  <h3 className="text-xl font-black text-cyber-cyan uppercase">
                    BẠN ĐOÁN TRÚNG PHE ĐA SỐ!
                  </h3>
                  <div className="text-3xl font-black text-cyber-yellow font-mono my-2">
                    +{((round3State?.playerChoices?.[playerId]?.pointsEarned) || 5000).toLocaleString()} PTS
                  </div>
                  <p className="text-xs text-slate-200">
                    Khả năng đọc vị đám đông đỉnh nóc kịch trần! Bạn đã chọn đúng phe đa số ({majority}).
                  </p>
                </>
              ) : (
                <>
                  <div className="text-4xl mb-2">🧱</div>
                  <h3 className="text-xl font-black text-cyber-crimson uppercase">
                    BẠN THUỘC PHE THIỂU SỐ!
                  </h3>
                  <div className="text-2xl font-black text-slate-400 font-mono my-2">+0 PTS</div>
                  <p className="text-xs text-slate-300">
                    Bạn cược Phe {selectedBet}, nhưng Phe {majority} mới là phe chiếm đa số (&gt;50%)!
                  </p>
                </>
              )}

              {/* Personal Choices Recap */}
              <div className="mt-4 pt-3 border-t border-white/20 text-left text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Lập trường cá nhân:</span>
                  <span className="font-bold text-white">Phe {selectedStance || 'A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Dự đoán đa số:</span>
                  <span className="font-bold text-white">Phe {selectedBet || 'A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Kết quả cả lớp:</span>
                  <span className="font-black text-cyber-yellow">
                    Phe {majority} ({tally?.percentA}% vs {tally?.percentB}%)
                  </span>
                </div>
              </div>
            </div>

            <div className="text-center text-[11px] text-slate-400 mt-1">
              Quan sát màn hình máy chiếu để xem vinh danh và chờ vòng tiếp theo!
            </div>
          </div>
        )}
      </div>

      {/* 3. BOTTOM THUMB-ZONE: DANMAKU REACTION BAR (Always Accessible) */}
      <div className="bg-slate-900 border-2 border-black rounded-2xl p-2 shadow-[3px_3px_0px_#000] shrink-0">
        <div className="flex items-center justify-between text-[9px] font-black uppercase text-cyber-yellow mb-1 px-1">
          <span>THẢ BIỂU CẢM LÊN MÁY CHIẾU:</span>
          <span className="text-slate-400">Chạm để bắn</span>
        </div>

        <div className="grid grid-cols-6 gap-1">
          {QUICK_EMOJIS.map((item) => (
            <button
              key={item.emoji}
              onClick={() => handleSendEmoji(item.emoji)}
              className="py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 flex flex-col items-center justify-center transition active:scale-90 cursor-pointer"
            >
              <span className="text-lg">{item.emoji}</span>
              <span className="text-[8px] font-bold text-slate-300">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
