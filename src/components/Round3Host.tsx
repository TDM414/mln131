'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  GameShowState,
  Round3Phase,
  DilemmaItem,
  DilemmaTally,
  Player,
  calculateSpeedDecayScore,
} from '../lib/types';
import { getAvatarById } from '../data/memeAvatars';
import { MLN131_CONSENSUS_DILEMMAS } from '../data/questions';
import { sound } from '../lib/audioSynthesizer';
import { sync } from '../lib/syncEngine';
import confetti from 'canvas-confetti';
import {
  Scale,
  Trophy,
  Sparkles,
  Timer,
  Users,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Play,
  Flame,
  ShieldCheck,
  Award,
  Crown,
  HelpCircle,
  Bot,
} from 'lucide-react';

interface Round3HostProps {
  state: GameShowState;
  onReturnToHub: () => void;
  onAdvanceToRound4?: () => void;
}

// Helper to extract text from string or object choice
function getChoiceText(choice: string | { text: string; label?: string } | undefined): string {
  if (!choice) return '';
  if (typeof choice === 'string') return choice;
  return choice.text || '';
}

export default function Round3Host({
  state,
  onReturnToHub,
  onAdvanceToRound4,
}: Round3HostProps) {
  const round3State = state.round3State;

  // Curated 3 dilemmas from MLN131_CONSENSUS_DILEMMAS
  const dilemmas: DilemmaItem[] = useMemo(() => {
    return MLN131_CONSENSUS_DILEMMAS.slice(0, 3);
  }, []);

  const currentDilemmaIndex = round3State?.currentDilemmaIndex ?? 0;
  const currentDilemma: DilemmaItem = dilemmas[currentDilemmaIndex] || dilemmas[0];

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

  // Master 20.0s Timer
  const [timeLeftMs, setTimeLeftMs] = useState<number>(20000);
  const timerStartRef = useRef<number>(0);
  const tickIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastTickTimeRef = useRef<number>(0);

  // Brick/tomato splatter effect for minority team during reveal
  const [showMinorityPenalty, setShowMinorityPenalty] = useState<boolean>(false);

  // Player roster
  const playersList: Player[] = useMemo(() => {
    return Object.values(state.players || {});
  }, [state.players]);

  // Stances and Bets from round3State
  const stances: Record<string, 'A' | 'B'> = useMemo(() => {
    return round3State?.stances || {};
  }, [round3State?.stances]);

  const consensusBets: Record<string, 'A' | 'B'> = useMemo(() => {
    return round3State?.consensusBets || {};
  }, [round3State?.consensusBets]);

  // Dynamic Tally calculation
  const tally: DilemmaTally = useMemo(() => {
    const allStances = Object.values(stances);
    const countA = allStances.filter((s) => s === 'A').length;
    const countB = allStances.filter((s) => s === 'B').length;
    const total = countA + countB;
    const percentA = total > 0 ? Math.round((countA / total) * 100) : 50;
    const percentB = total > 0 ? 100 - percentA : 50;
    const majority: 'A' | 'B' | 'DRAW' =
      countA > countB ? 'A' : countB > countA ? 'B' : 'DRAW';

    return { countA, countB, percentA, percentB, majority };
  }, [stances]);

  // Players categorized by stance
  const playersA = useMemo(() => {
    return playersList.filter((p) => stances[p.id] === 'A');
  }, [playersList, stances]);

  const playersB = useMemo(() => {
    return playersList.filter((p) => stances[p.id] === 'B');
  }, [playersList, stances]);

  const totalVotedCount = Object.keys(stances).length;
  const totalBetCount = Object.keys(consensusBets).length;

  // Initialize dilemma in sync if missing
  useEffect(() => {
    if (!round3State?.dilemma) {
      sync.hostUpdateState({
        round3State: {
          ...round3State,
          phase: 'DILEMMA_INTRO',
          currentDilemmaIndex,
          dilemma: currentDilemma,
          dilemmas,
          stances: {},
          consensusBets: {},
          tally: { countA: 0, countB: 0, percentA: 50, percentB: 50, majority: 'DRAW' },
        },
      });
      sync.setRoundPhase('DILEMMA_INTRO');
    }
  }, []);

  // Timer & ticking sound in VOTING phase
  useEffect(() => {
    if (phase !== 'VOTING') {
      if (tickIntervalRef.current) {
        clearInterval(tickIntervalRef.current);
        tickIntervalRef.current = null;
      }
      return;
    }

    timerStartRef.current = Date.now();
    setTimeLeftMs(20000);
    lastTickTimeRef.current = 0;

    const interval = setInterval(() => {
      const elapsed = Date.now() - timerStartRef.current;
      const remaining = Math.max(0, 20000 - elapsed);
      setTimeLeftMs(remaining);

      // Sound tick: woodblock every 1000ms, urgent every 500ms when < 5s
      const now = Date.now();
      const tickCadence = remaining <= 5000 ? 500 : 1000;
      if (now - lastTickTimeRef.current >= tickCadence) {
        lastTickTimeRef.current = now;
        sound.playCountdownTick(remaining <= 5000);
      }

      if (remaining <= 0) {
        clearInterval(interval);
        handleRevealResults();
      }
    }, 100);

    tickIntervalRef.current = interval;

    return () => {
      clearInterval(interval);
      tickIntervalRef.current = null;
    };
  }, [phase]);

  // Early completion check: if all active players have both voted stance AND placed bet
  useEffect(() => {
    if (phase === 'VOTING' && playersList.length > 0) {
      const allSubmitted =
        totalVotedCount >= playersList.length && totalBetCount >= playersList.length;
      if (allSubmitted && timeLeftMs > 2000) {
        const earlyTimeout = setTimeout(() => {
          handleRevealResults();
        }, 1200);
        return () => clearTimeout(earlyTimeout);
      }
    }
  }, [totalVotedCount, totalBetCount, playersList.length, phase, timeLeftMs]);

  // Reveal results: Whistle, Score Allocation, Penalty Barrage, Confetti
  const handleRevealResults = useCallback(() => {
    // 1. Play Whistle Alarm immediately
    sound.playWhistleAlarm();

    // 2. Compute final majority & score allocation
    const allStances = Object.values(round3State?.stances || stances);
    const countA = allStances.filter((s) => s === 'A').length;
    const countB = allStances.filter((s) => s === 'B').length;
    const total = countA + countB;
    const percentA = total > 0 ? Math.round((countA / total) * 100) : 50;
    const percentB = total > 0 ? 100 - percentA : 50;
    const majority: 'A' | 'B' | 'DRAW' =
      countA > countB ? 'A' : countB > countA ? 'B' : 'DRAW';

    const finalTally: DilemmaTally = { countA, countB, percentA, percentB, majority };

    // 3. Allocate scores to players
    const updatedPlayers = { ...state.players };
    const playerChoices = { ...(round3State?.playerChoices || {}) };
    const currentBets = round3State?.consensusBets || consensusBets;

    Object.values(updatedPlayers).forEach((p) => {
      const bet = currentBets[p.id];
      const pChoice = playerChoices[p.id];
      const remainingTime = 20000 - (pChoice?.timeMs || 10000);

      if (majority === 'DRAW') {
        // 50/50 Consensus Draw: +2,500 PTS for all participants
        const pts = 2500;
        p.score = (p.score || 0) + pts;
        p.roundScores.ROUND_3 = (p.roundScores.ROUND_3 || 0) + pts;
        if (!playerChoices[p.id]) {
          playerChoices[p.id] = {
            personalChoice: stances[p.id] || 'A',
            betConsensus: bet || 'A',
            timeMs: 10000,
            pointsEarned: pts,
          };
        } else {
          playerChoices[p.id].pointsEarned = pts;
        }
      } else if (majority === 'A' || majority === 'B') {
        // Correct bet on majority: Base +5000 PTS + Speed-Decay bonus
        const wonBet = bet === majority;
        if (wonBet) {
          const speedBonus = calculateSpeedDecayScore(1500, remainingTime, 20000, true);
          const pts = 5000 + speedBonus;
          p.score = (p.score || 0) + pts;
          p.roundScores.ROUND_3 = (p.roundScores.ROUND_3 || 0) + pts;
          if (!playerChoices[p.id]) {
            playerChoices[p.id] = {
              personalChoice: stances[p.id] || majority,
              betConsensus: bet || majority,
              timeMs: Math.max(0, 20000 - remainingTime),
              pointsEarned: pts,
            };
          } else {
            playerChoices[p.id].pointsEarned = pts;
          }
        }
      }
    });

    // 4. Trigger visual penalty & celebratory sound
    setTimeout(() => {
      if (majority === 'DRAW') {
        sound.playApplause();
      } else {
        sound.playVictoryFanfare();
        setShowMinorityPenalty(true);
        setTimeout(() => sound.playSplat(), 400);

        try {
          confetti({
            particleCount: 120,
            spread: 90,
            origin: { y: 0.6 },
          });
        } catch (e) {
          // ignore confetti in non-browser envs
        }
      }
    }, 500);

    // 5. Broadcast to room
    sync.hostUpdateState({
      players: updatedPlayers,
      round3State: {
        ...round3State,
        phase: 'TUG_REVEAL',
        tally: finalTally,
        majoritySide: majority,
        voteCountA: countA,
        voteCountB: countB,
        playerChoices,
      },
    });
    sync.setRoundPhase('TUG_REVEAL');
  }, [round3State, stances, consensusBets, state.players]);

  // Start Voting
  const handleStartVoting = () => {
    sound.playTrollHorn();
    setShowMinorityPenalty(false);

    sync.hostUpdateState({
      round3State: {
        ...round3State,
        phase: 'VOTING',
        currentDilemmaIndex,
        dilemma: currentDilemma,
        stances: {},
        consensusBets: {},
        tally: { countA: 0, countB: 0, percentA: 50, percentB: 50, majority: 'DRAW' },
      },
    });
    sync.setRoundPhase('VOTING');
  };

  // Change dilemma before voting
  const handleSelectDilemma = (idx: number) => {
    if (idx < 0 || idx >= dilemmas.length) return;
    const selected = dilemmas[idx];
    sound.playCorrectChime();

    sync.hostUpdateState({
      round3State: {
        ...round3State,
        phase: 'DILEMMA_INTRO',
        currentDilemmaIndex: idx,
        dilemma: selected,
        stances: {},
        consensusBets: {},
        tally: { countA: 0, countB: 0, percentA: 50, percentB: 50, majority: 'DRAW' },
      },
    });
  };

  // Advance to Next Dilemma
  const handleNextDilemma = () => {
    const nextIdx = (currentDilemmaIndex + 1) % dilemmas.length;
    sound.playCorrectChime();
    setShowMinorityPenalty(false);

    sync.hostUpdateState({
      round3State: {
        ...round3State,
        phase: 'DILEMMA_INTRO',
        currentDilemmaIndex: nextIdx,
        dilemma: dilemmas[nextIdx],
        stances: {},
        consensusBets: {},
        tally: { countA: 0, countB: 0, percentA: 50, percentB: 50, majority: 'DRAW' },
      },
    });
    sync.setRoundPhase('DILEMMA_INTRO');
  };

  // Dev Quick Simulation of Bot votes
  const handleSimulateBotVotes = () => {
    if (phase !== 'VOTING') return;
    sound.playTrollHorn();

    playersList.forEach((p, idx) => {
      // 60/40 distribution for realistic tug-of-war swing
      const stance: 'A' | 'B' = (idx % 5 < 3) ? 'A' : 'B';
      const bet: 'A' | 'B' = Math.random() < 0.65 ? 'A' : 'B';
      const delay = Math.random() * 2500 + 400;

      setTimeout(() => {
        sync.submitDilemmaStance(stance, p.id);
        setTimeout(() => {
          sync.submitDilemmaBet(bet, Math.max(1000, 20000 - delay), 20000, p.id);
        }, 300);
      }, delay);
    });
  };

  // Tug-of-war knot position:
  // percentA: 0% to 100%. Center is 50%.
  // If A dominates (e.g. 70%), knot shifts left towards A: knotLeftPercent = 50 - (percentA - 50) * 0.7 = 36%
  // Bounded between 15% and 85%
  const knotLeftPercent = useMemo(() => {
    const diff = tally.percentB - tally.percentA; // positive if B leads (shifts right), negative if A leads (shifts left)
    const offset = (diff / 100) * 40; // max shift +/- 40%
    return Math.max(15, Math.min(85, 50 + offset));
  }, [tally.percentA, tally.percentB]);

  const choiceAText = getChoiceText(currentDilemma.choiceA);
  const choiceBText = getChoiceText(currentDilemma.choiceB);

  return (
    <div className="w-full min-h-full flex flex-col justify-between p-6 max-w-7xl mx-auto select-none bg-[#0B0F19] text-white overflow-y-auto pb-32 relative font-sans">
      {/* 1. TOP HEADER & METRICS */}
      <div className="flex items-center justify-between bg-slate-900/90 border-3 border-black p-3.5 rounded-2xl shadow-[4px_4px_0px_#000] shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-cyber-yellow border-2 border-black rounded-xl text-black font-black text-xs uppercase shadow-[2px_2px_0px_#000] flex items-center gap-1.5">
            <Scale className="w-4 h-4 fill-black" />
            <span>MODE 3 • TRƯNG CẦU DÂN Ý</span>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <span className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded-lg text-xs font-bold border border-slate-700">
              Dilemma {currentDilemmaIndex + 1}/{dilemmas.length}
            </span>
            {currentDilemma.topic && (
              <span className="px-2.5 py-1 bg-purple-950/80 text-purple-300 rounded-lg text-xs font-bold border border-purple-800">
                {currentDilemma.topic}
              </span>
            )}
          </div>
        </div>

        {/* Phase Pill & Timer */}
        <div className="flex items-center gap-3">
          {phase === 'VOTING' ? (
            <div className="flex items-center gap-2 px-3.5 py-1.5 bg-rose-600 border-2 border-black rounded-xl text-white font-black text-sm shadow-[2px_2px_0px_#000] animate-pulse">
              <Timer className="w-4 h-4 animate-spin" />
              <span>⏱️ {(timeLeftMs / 1000).toFixed(1)}s</span>
            </div>
          ) : (
            <div className="px-3 py-1 bg-cyber-cyan/20 border-2 border-cyber-cyan rounded-xl text-cyber-cyan font-black text-xs uppercase tracking-wider">
              {phase === 'DILEMMA_INTRO'
                ? 'CHỜ KHAI MẠC'
                : phase === 'TUG_REVEAL'
                ? 'PHÁN QUYẾT KÉO CO'
                : 'TỔNG KẾT VÒNG'}
            </div>
          )}

          <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 rounded-xl border border-slate-700 text-xs font-bold text-slate-300">
            <Users className="w-3.5 h-3.5 text-cyber-yellow" />
            <span>{totalVotedCount}/{playersList.length} Đã chọn</span>
          </div>
        </div>
      </div>

      {/* Progress Bar (20s Countdown) */}
      {phase === 'VOTING' && (
        <div className="w-full bg-slate-800 h-2.5 border-2 border-black rounded-full overflow-hidden my-2 shadow-[2px_2px_0px_#000]">
          <div
            className="h-full bg-gradient-to-r from-cyber-yellow via-cyber-cyan to-cyber-crimson transition-all duration-100 ease-linear"
            style={{ width: `${(timeLeftMs / 20000) * 100}%` }}
          />
        </div>
      )}

      {/* 2. MAIN CENTER STAGE */}
      <div className="flex-1 flex flex-col justify-between my-2 overflow-hidden relative">
        {/* PHASE 1: DILEMMA INTRO & SITUATION DISPLAY */}
        {phase === 'DILEMMA_INTRO' && (
          <div className="flex-1 flex flex-col justify-between animate-in zoom-in-95 duration-200">
            {/* Dilemma Title & Scenario Card */}
            <div className="bg-slate-900 border-4 border-black rounded-3xl p-6 shadow-[8px_8px_0px_#000] relative">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-black uppercase text-cyber-yellow tracking-widest flex items-center gap-1">
                  <Flame className="w-4 h-4 fill-cyber-yellow text-cyber-yellow" />
                  TÌNH HUỐNG TIẾN THOÁI LƯỠNG NAN SỐ (MLN131)
                </span>

                {/* Dilemma Switchers for Host */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleSelectDilemma(currentDilemmaIndex - 1)}
                    disabled={currentDilemmaIndex === 0}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white disabled:opacity-30 cursor-pointer"
                    title="Tình huống trước"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleSelectDilemma(currentDilemmaIndex + 1)}
                    disabled={currentDilemmaIndex === dilemmas.length - 1}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white disabled:opacity-30 cursor-pointer"
                    title="Tình huống tiếp theo"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight mb-3">
                {currentDilemma.title}
              </h2>

              <p className="text-sm sm:text-base text-slate-200 leading-relaxed bg-black/40 border-2 border-slate-800 p-4 rounded-2xl mb-4">
                {currentDilemma.scenario}
              </p>

              {currentDilemma.contextMLN131 && (
                <div className="flex items-start gap-2 bg-purple-950/40 border border-purple-700/60 p-3 rounded-xl text-xs text-purple-200">
                  <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-purple-300">Ý nghĩa MLN131:</strong>{' '}
                    {currentDilemma.contextMLN131}
                  </span>
                </div>
              )}
            </div>

            {/* Two Opposing Stance Previews */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-3">
              {/* Stance A Preview */}
              <div className="bg-emerald-950/40 border-4 border-cyber-cyan rounded-2xl p-5 shadow-[4px_4px_0px_#000] flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="px-3 py-1 bg-cyber-cyan text-black font-black text-xs rounded-lg uppercase tracking-wider">
                    🛡️ PHE A
                  </span>
                  <span className="text-xs font-bold text-cyber-cyan">Phe Cánh Tả / An Ninh</span>
                </div>
                <p className="text-sm sm:text-base font-bold text-white mt-1 leading-snug">
                  {choiceAText}
                </p>
              </div>

              {/* Stance B Preview */}
              <div className="bg-rose-950/40 border-4 border-cyber-crimson rounded-2xl p-5 shadow-[4px_4px_0px_#000] flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="px-3 py-1 bg-cyber-crimson text-white font-black text-xs rounded-lg uppercase tracking-wider">
                    ⚖️ PHE B
                  </span>
                  <span className="text-xs font-bold text-rose-400">Phe Cánh Hữu / Riêng Tư</span>
                </div>
                <p className="text-sm sm:text-base font-bold text-white mt-1 leading-snug">
                  {choiceBText}
                </p>
              </div>
            </div>

            {/* Launch Action Bar */}
            <div className="flex items-center justify-center gap-4 pt-2">
              <button
                onClick={handleStartVoting}
                className="px-8 py-4 bg-cyber-yellow hover:bg-amber-300 text-black font-black text-lg sm:text-xl rounded-2xl border-4 border-black shadow-[6px_6px_0px_#000] flex items-center gap-3 transition active:scale-95 cursor-pointer"
              >
                <Play className="w-6 h-6 fill-black" />
                <span>BẮT ĐẦU TRƯNG CẦU DÂN Ý (20S)</span>
              </button>
            </div>
          </div>
        )}

        {/* PHASE 2: VOTING — REALTIME TUG-OF-WAR ENGINE */}
        {phase === 'VOTING' && (
          <div className="flex-1 flex flex-col justify-between">
            {/* Scenario brief header */}
            <div className="text-center mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                ĐANG LẤY Ý KIẾN CẢ LỚP & ĐẶT CƯỢC PHE ĐA SỐ (&gt;50%)
              </span>
              <h3 className="text-lg sm:text-xl font-black text-white truncate max-w-3xl mx-auto">
                {currentDilemma.title}
              </h3>
            </div>

            {/* THE TUG-OF-WAR ARENA */}
            <div className="bg-slate-900 border-4 border-black rounded-3xl p-5 shadow-[8px_8px_0px_#000] my-auto relative overflow-hidden">
              {/* Arena Background Grid */}
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

              {/* Top Bunkers: Scores & Percentages */}
              <div className="grid grid-cols-2 gap-4 items-center mb-6 relative z-10">
                {/* Left Bunker: Phe A */}
                <div
                  className={`p-4 rounded-2xl border-3 border-black transition-all ${
                    tally.percentA > tally.percentB
                      ? 'bg-cyber-cyan/25 border-cyber-cyan shadow-[0_0_20px_rgba(6,214,160,0.4)] scale-102'
                      : 'bg-slate-950/80 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 bg-cyber-cyan text-black font-black text-xs rounded-lg uppercase">
                      🛡️ PHE A
                    </span>
                    <span className="text-3xl font-black text-cyber-cyan font-mono">
                      {tally.percentA}%
                    </span>
                  </div>
                  <div className="text-lg font-black text-white mt-1">
                    {tally.countA} <span className="text-xs text-slate-400 font-normal">phiếu bầu</span>
                  </div>
                  <div className="text-xs text-slate-300 truncate mt-1">{choiceAText}</div>
                </div>

                {/* Right Bunker: Phe B */}
                <div
                  className={`p-4 rounded-2xl border-3 border-black transition-all text-right ${
                    tally.percentB > tally.percentA
                      ? 'bg-cyber-crimson/25 border-cyber-crimson shadow-[0_0_20px_rgba(239,35,60,0.4)] scale-102'
                      : 'bg-slate-950/80 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between flex-row-reverse">
                    <span className="px-2.5 py-1 bg-cyber-crimson text-white font-black text-xs rounded-lg uppercase">
                      ⚖️ PHE B
                    </span>
                    <span className="text-3xl font-black text-cyber-crimson font-mono">
                      {tally.percentB}%
                    </span>
                  </div>
                  <div className="text-lg font-black text-white mt-1">
                    {tally.countB} <span className="text-xs text-slate-400 font-normal">phiếu bầu</span>
                  </div>
                  <div className="text-xs text-slate-300 truncate mt-1">{choiceBText}</div>
                </div>
              </div>

              {/* THE ROPE AND THE CENTRAL TUG KNOT */}
              <div className="py-8 relative my-4">
                {/* Horizontal Cyber Rope */}
                <div className="w-full h-6 bg-gradient-to-r from-cyber-cyan via-amber-200 to-cyber-crimson rounded-full border-3 border-black shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)] relative flex items-center">
                  {/* Tension marks */}
                  <div className="absolute inset-0 flex justify-between px-6 pointer-events-none opacity-40">
                    <span className="text-[10px] font-black text-black">◀ PULL A</span>
                    <span className="text-[10px] font-black text-black">| 50% |</span>
                    <span className="text-[10px] font-black text-black">PULL B ▶</span>
                  </div>

                  {/* Midline Anchor Indicator */}
                  <div className="absolute left-1/2 -top-3 bottom-0 w-0.5 bg-white/40 -translate-x-1/2 pointer-events-none" />

                  {/* THE DYNAMIC KNOT / SCALE */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-300 ease-out z-20 flex flex-col items-center"
                    style={{ left: `${knotLeftPercent}%` }}
                  >
                    <div className="w-14 h-14 rounded-2xl bg-cyber-yellow border-3 border-black shadow-[0_0_15px_rgba(255,209,102,0.8)] flex items-center justify-center text-2xl animate-bounce">
                      {tally.majority === 'A' ? '🛡️' : tally.majority === 'B' ? '⚖️' : '✊'}
                    </div>
                    <span className="px-2 py-0.5 bg-black/90 border border-cyber-yellow rounded-md text-[10px] font-black text-cyber-yellow whitespace-nowrap mt-1">
                      {tally.majority === 'A'
                        ? 'Phe A Áp Đảo!'
                        : tally.majority === 'B'
                        ? 'Phe B Áp Đảo!'
                        : 'Giằng Co 50/50'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Voter Avatars Live Roster Grid */}
              <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-slate-800">
                {/* Team A Roster */}
                <div>
                  <div className="text-[11px] font-black uppercase text-cyber-cyan mb-2">
                    Chiến sĩ Phe A ({playersA.length}):
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto pr-1">
                    {playersA.length === 0 ? (
                      <span className="text-xs text-slate-500 italic">Đang chờ phiếu đầu tiên...</span>
                    ) : (
                      playersA.map((p) => {
                        const av = getAvatarById(p.avatarId || 'keyboard_warrior');
                        return (
                          <span
                            key={p.id}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-slate-800 border border-cyber-cyan/50 rounded-lg text-xs font-bold text-white shadow-sm"
                          >
                            <span>{av.emoji}</span>
                            <span className="truncate max-w-[80px]">{p.name}</span>
                          </span>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Team B Roster */}
                <div>
                  <div className="text-[11px] font-black uppercase text-cyber-crimson mb-2 text-right">
                    Chiến sĩ Phe B ({playersB.length}):
                  </div>
                  <div className="flex flex-wrap gap-1.5 justify-end max-h-20 overflow-y-auto pl-1">
                    {playersB.length === 0 ? (
                      <span className="text-xs text-slate-500 italic">Đang chờ phiếu đầu tiên...</span>
                    ) : (
                      playersB.map((p) => {
                        const av = getAvatarById(p.avatarId || 'keyboard_warrior');
                        return (
                          <span
                            key={p.id}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-slate-800 border border-cyber-crimson/50 rounded-lg text-xs font-bold text-white shadow-sm"
                          >
                            <span>{av.emoji}</span>
                            <span className="truncate max-w-[80px]">{p.name}</span>
                          </span>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions: Simulate bot votes & Early reveal */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={handleSimulateBotVotes}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border-2 border-black text-xs font-bold text-slate-300 flex items-center gap-2 cursor-pointer shadow-[2px_2px_0px_#000]"
                title="Mô phỏng phiếu của bot trong phòng"
              >
                <Bot className="w-4 h-4 text-cyber-yellow" />
                <span>Giả lập Bot Vote</span>
              </button>

              <button
                onClick={handleRevealResults}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl border-2 border-black shadow-[3px_3px_0px_#000] cursor-pointer"
              >
                Chốt Sớm Phán Quyết ⚡
              </button>
            </div>
          </div>
        )}

        {/* PHASE 3: TUG REVEAL & ROUND SUMMARY */}
        {(phase === 'TUG_REVEAL' || phase === 'SUMMARY') && (
          <div className="flex-1 flex flex-col justify-between animate-in zoom-in-95 duration-200">
            {/* Announcement Banner */}
            <div className="text-center mb-2">
              <div className="inline-block px-4 py-1.5 bg-cyber-yellow border-3 border-black rounded-full text-black font-black text-sm uppercase shadow-[3px_3px_0px_#000] mb-2">
                {tally.majority === 'DRAW'
                  ? '🤝 KẾT QUẢ ĐỒNG THUẬN HOÀN TOÀN 50 / 50'
                  : `🏆 PHE ĐA SỐ ${tally.majority} CHIẾN THẮNG ÁP ĐẢO!`}
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                {tally.majority === 'DRAW'
                  ? 'CẢ LỚP CÙNG NHẬN +2,500 ĐIỂM ĐỒNG THUẬN!'
                  : `+5,000 ĐIỂM CHO TẤT CẢ CHIẾN SĨ ĐOÁN ĐÚNG PHE ${tally.majority}!`}
              </h2>
            </div>

            {/* The Final Pull Verdict Stage */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-auto relative">
              {/* Left Side: Phe A Result Box */}
              <div
                className={`p-5 rounded-3xl border-4 border-black relative overflow-hidden transition-all shadow-[6px_6px_0px_#000] ${
                  tally.majority === 'A'
                    ? 'bg-cyber-cyan/30 border-cyber-cyan scale-102 ring-4 ring-cyber-cyan/50'
                    : 'bg-slate-900/90'
                }`}
              >
                {/* Minority Brick Barrage penalty overlay */}
                {showMinorityPenalty && tally.majority === 'B' && (
                  <div className="absolute inset-0 bg-red-950/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-4 border-4 border-cyber-crimson animate-in zoom-in-90">
                    <div className="text-5xl animate-bounce mb-2">🧱 💥 🍅</div>
                    <div className="text-xl font-black text-cyber-crimson uppercase text-center">
                      ĂN TRỌN BÃI GẠCH!
                    </div>
                    <p className="text-xs text-slate-300 text-center mt-1">
                      Phe thiểu số bị ném cà chua & gạch vỡ nát màn hình!
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between mb-2">
                  <span className="px-3 py-1 bg-cyber-cyan text-black font-black text-xs rounded-lg uppercase">
                    🛡️ PHE A
                  </span>
                  <span className="text-3xl font-black text-cyber-cyan font-mono">
                    {tally.percentA}% ({tally.countA} phiếu)
                  </span>
                </div>
                <p className="text-sm font-bold text-white mb-3">{choiceAText}</p>

                {tally.majority === 'A' && (
                  <div className="p-2.5 bg-black/60 rounded-xl border border-cyber-cyan text-xs font-black text-cyber-cyan flex items-center gap-2">
                    <Crown className="w-4 h-4 text-cyber-yellow" />
                    <span>PHE ĐA SỐ THẮNG LỚN!</span>
                  </div>
                )}
              </div>

              {/* Right Side: Phe B Result Box */}
              <div
                className={`p-5 rounded-3xl border-4 border-black relative overflow-hidden transition-all shadow-[6px_6px_0px_#000] ${
                  tally.majority === 'B'
                    ? 'bg-cyber-crimson/30 border-cyber-crimson scale-102 ring-4 ring-cyber-crimson/50'
                    : 'bg-slate-900/90'
                }`}
              >
                {/* Minority Brick Barrage penalty overlay */}
                {showMinorityPenalty && tally.majority === 'A' && (
                  <div className="absolute inset-0 bg-red-950/80 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-4 border-4 border-cyber-crimson animate-in zoom-in-90">
                    <div className="text-5xl animate-bounce mb-2">🧱 💥 🍅</div>
                    <div className="text-xl font-black text-cyber-crimson uppercase text-center">
                      ĂN TRỌN BÃI GẠCH!
                    </div>
                    <p className="text-xs text-slate-300 text-center mt-1">
                      Phe thiểu số bị ném cà chua & gạch vỡ nát màn hình!
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between mb-2">
                  <span className="px-3 py-1 bg-cyber-crimson text-white font-black text-xs rounded-lg uppercase">
                    ⚖️ PHE B
                  </span>
                  <span className="text-3xl font-black text-cyber-crimson font-mono">
                    {tally.percentB}% ({tally.countB} phiếu)
                  </span>
                </div>
                <p className="text-sm font-bold text-white mb-3">{choiceBText}</p>

                {tally.majority === 'B' && (
                  <div className="p-2.5 bg-black/60 rounded-xl border border-cyber-crimson text-xs font-black text-rose-400 flex items-center gap-2">
                    <Crown className="w-4 h-4 text-cyber-yellow" />
                    <span>PHE ĐA SỐ THẮNG LỚN!</span>
                  </div>
                )}
              </div>
            </div>

            {/* Roster of Winners who correctly bet on majority */}
            <div className="bg-slate-900 border-3 border-black rounded-2xl p-4 shadow-[4px_4px_0px_#000] my-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black uppercase text-cyber-yellow tracking-wider flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-cyber-yellow" />
                  BẢNG VINH DANH CHIẾN SĨ ĐOÁN TRÚNG ĐỒNG THUẬN:
                </span>
                <span className="text-xs text-slate-400">
                  {
                    playersList.filter((p) =>
                      tally.majority === 'DRAW'
                        ? true
                        : consensusBets[p.id] === tally.majority
                    ).length
                  }{' '}
                  người nhận thưởng
                </span>
              </div>

              <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
                {playersList
                  .filter((p) =>
                    tally.majority === 'DRAW'
                      ? true
                      : consensusBets[p.id] === tally.majority
                  )
                  .map((p) => {
                    const av = getAvatarById(p.avatarId || 'keyboard_warrior');
                    const pts =
                      round3State?.playerChoices?.[p.id]?.pointsEarned ||
                      (tally.majority === 'DRAW' ? 2500 : 5000);

                    return (
                      <div
                        key={p.id}
                        className="px-3 py-1.5 bg-slate-800 border-2 border-black rounded-xl text-xs font-black text-white flex items-center gap-2 shadow-[2px_2px_0px_#000]"
                      >
                        <span className="text-base">{av.emoji}</span>
                        <span>{p.name}</span>
                        <span className="text-cyber-yellow font-mono">+{pts.toLocaleString()}</span>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Sticky Final Action Bar - ALWAYS VISIBLE AT BOTTOM */}
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0F1420]/95 backdrop-blur-lg border-t-4 border-black p-4 shadow-[0_-6px_25px_rgba(0,0,0,0.8)]">
              <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1.5 bg-cyber-yellow text-black font-black text-xs uppercase rounded-xl border-2 border-black shadow-[2px_2px_0px_#000]">
                    ⚖️ TÌNH HUỐNG {currentDilemmaIndex + 1} / 3
                  </span>

                  <button
                    onClick={() => {
                      sound.playTrollHorn();
                      sync.returnToHub();
                      onReturnToHub();
                    }}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-black text-xs rounded-xl border-2 border-black shadow-[2px_2px_0px_#000] flex items-center gap-1.5 transition active:scale-95 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-cyber-yellow" />
                    <span>Sảnh Hub</span>
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  {currentDilemmaIndex < 2 ? (
                    <>
                      <button
                        onClick={handleNextDilemma}
                        className="px-6 py-3 bg-cyber-yellow hover:bg-amber-300 text-black font-black text-sm uppercase rounded-xl border-3 border-black shadow-[4px_4px_0px_#000] flex items-center gap-2 transition active:scale-95 cursor-pointer scale-105"
                      >
                        <span>SANG TÌNH HUỐNG {currentDilemmaIndex + 2}/3 ➔</span>
                      </button>

                      <button
                        onClick={() => {
                          sound.playVictoryFanfare();
                          if (onAdvanceToRound4) onAdvanceToRound4();
                          else {
                            sync.hostUpdateState({ status: 'ROUND_4', currentRoundPhase: 'CARD_DRAFT' });
                            sync.setGameStatus('ROUND_4');
                            sync.setRoundPhase('CARD_DRAFT');
                          }
                        }}
                        className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase rounded-xl border-2 border-slate-700 flex items-center gap-1 transition cursor-pointer"
                      >
                        <span>Bỏ qua sang V4 ➔</span>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        sound.playVictoryFanfare();
                        if (onAdvanceToRound4) {
                          onAdvanceToRound4();
                        } else {
                          sync.hostUpdateState({
                            status: 'ROUND_4',
                            currentRoundPhase: 'CARD_DRAFT',
                          });
                          sync.setGameStatus('ROUND_4');
                          sync.setRoundPhase('CARD_DRAFT');
                        }
                      }}
                      className="px-8 py-3.5 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white font-black text-base uppercase rounded-xl border-3 border-black shadow-[4px_4px_0px_#000] flex items-center gap-2 transition active:scale-95 cursor-pointer scale-105"
                    >
                      <Sparkles className="w-5 h-5 text-cyber-yellow" />
                      <span>HOÀN THÀNH VÒNG 3 • SANG VÒNG 4 (CHƠI XẤU) ➔</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
