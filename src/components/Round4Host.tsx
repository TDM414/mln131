'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { GameShowState, Round4Phase, TriviaQuestion, Player, SabotageCard } from '../lib/types';
import { MLN131_QUESTIONS } from '../data/questions';
import { getAvatarById } from '../data/memeAvatars';
import { sound } from '../lib/audioSynthesizer';
import { sync } from '../lib/syncEngine';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Flame,
  Zap,
  RotateCcw,
  Sparkles,
  AlertOctagon,
  ArrowRight,
  Shield,
  HelpCircle,
  Skull,
  Play,
  Users,
  CheckCircle2,
  XCircle,
  EyeOff,
  Coins
} from 'lucide-react';

interface Round4HostProps {
  state: GameShowState;
  onReturnToHub: () => void;
  onAdvanceToPodium?: () => void;
}

const R4_QUESTIONS: TriviaQuestion[] = MLN131_QUESTIONS.slice(0, 5).map((q) => ({
  id: q.id,
  topic: q.topic,
  scenario: q.scenario,
  options: q.options,
  correctAnswer: q.correctAnswer,
  explanation: q.explanation,
  points: 10000,
}));

export default function Round4Host({ state, onReturnToHub, onAdvanceToPodium }: Round4HostProps) {
  const players = Object.values(state.players || {});
  const [phase, setPhase] = useState<Round4Phase>('CARD_DRAFT');
  const [timer, setTimer] = useState<number>(15);
  const [currentQIndex, setCurrentQIndex] = useState<number>(0);
  const [sabotageFeed, setSabotageFeed] = useState<Array<{ from: string; to: string; cardName: string; icon: string }>>([]);

  const questionsList = useMemo(() => {
    return state.round4State?.questions?.length ? state.round4State.questions : R4_QUESTIONS;
  }, [state.round4State?.questions]);

  const totalQuestions = questionsList.length || 5;

  // Initialize Round 4 on Server
  useEffect(() => {
    sync.hostUpdateState({
      status: 'ROUND_4',
      round4State: {
        phase: 'CARD_DRAFT',
        currentQuestionIndex: 0,
        questions: R4_QUESTIONS,
        trivia: R4_QUESTIONS[0],
        activeSabotages: [],
        playerAnswers: {},
        queuedSkills: {},
      }
    });
    sync.setRoundPhase('CARD_DRAFT', { questionIndex: 0 });
  }, []);

  // Listen for sabotage attacks from server/events
  useEffect(() => {
    const unsubSabotage = sync.on('R4_SABOTAGE', (payload: any) => {
      const { fromName, targetName, cardName, icon } = payload;
      sound.playLaser(true);
      setSabotageFeed(prev => [
        { from: fromName, to: targetName, cardName, icon },
        ...prev.slice(0, 7)
      ]);
    });

    return () => unsubSabotage();
  }, []);

  // Handle phase advance
  const handleAdvancePhase = (forcedTarget?: 'NEXT_QUESTION' | 'SUMMARY') => {
    if (forcedTarget === 'NEXT_QUESTION' || (phase === 'ROUND_RESOLUTION' && currentQIndex < totalQuestions - 1)) {
      const nextIdx = currentQIndex + 1;
      setCurrentQIndex(nextIdx);
      setPhase('CARD_DRAFT');
      setTimer(15);
      sound.playLaser(true);
      sync.hostUpdateState({
        round4State: {
          ...state.round4State,
          phase: 'CARD_DRAFT',
          currentQuestionIndex: nextIdx,
          trivia: questionsList[nextIdx],
          questions: questionsList,
          playerAnswers: {},
          queuedSkills: {},
        }
      });
      sync.setRoundPhase('CARD_DRAFT', { questionIndex: nextIdx });
      return;
    }

    if (forcedTarget === 'SUMMARY' || (phase === 'ROUND_RESOLUTION' && currentQIndex >= totalQuestions - 1)) {
      setPhase('ROUND_SUMMARY');
      setTimer(0);
      confetti({ particleCount: 160, spread: 100, origin: { y: 0.6 } });
      sound.playVictoryFanfare();
      sync.hostUpdateState({
        round4State: {
          ...state.round4State,
          phase: 'ROUND_SUMMARY',
          questions: questionsList,
        }
      });
      sync.setRoundPhase('ROUND_SUMMARY');
      return;
    }

    if (phase === 'CARD_DRAFT' || phase === 'CARD_PICK' || phase === 'CARD_ATTACK') {
      // Enter Trivia Question Phase
      setPhase('TRIVIA_QUESTION');
      setTimer(25);
      sound.playWhistleAlarm();
      sync.hostUpdateState({
        round4State: {
          ...state.round4State,
          phase: 'TRIVIA_QUESTION',
          currentQuestionIndex: currentQIndex,
          trivia: questionsList[currentQIndex],
          questions: questionsList,
        }
      });
      sync.setRoundPhase('TRIVIA_QUESTION');
    } else if (phase === 'TRIVIA_QUESTION') {
      // Enter Resolution & Skill Evaluation Phase
      setPhase('ROUND_RESOLUTION');
      setTimer(12);
      sound.playVictoryFanfare();
      sync.hostUpdateState({
        round4State: {
          ...state.round4State,
          phase: 'ROUND_RESOLUTION',
          currentQuestionIndex: currentQIndex,
          trivia: questionsList[currentQIndex],
          questions: questionsList,
        }
      });
      sync.setRoundPhase('ROUND_RESOLUTION');
    }
  };

  // Timer loop
  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => {
      setTimer(t => {
        if (t <= 1) {
          clearInterval(interval);
          setTimeout(() => handleAdvancePhase(), 60);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timer, phase, currentQIndex]);

  const currentQ = questionsList[currentQIndex % questionsList.length] || R4_QUESTIONS[0];
  const sortedPlayers = [...players].sort((a, b) => (b.score || 0) - (a.score || 0));
  const queuedSkills = state.round4State?.queuedSkills || {};
  const playerAnswers = state.round4State?.playerAnswers || {};
  const answeredCount = Object.keys(playerAnswers).length;

  return (
    <div className="w-full min-h-full flex flex-col p-6 max-w-6xl mx-auto select-none overflow-y-auto pb-36">
      {/* 1. TOP HEADER */}
      <div className="flex items-center justify-between pb-4 border-b-4 border-black mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-500 border-3 border-black flex items-center justify-center text-2xl shadow-[3px_3px_0px_#000]">
            👑
          </div>
          <div>
            <div className="text-xs font-black text-rose-400 uppercase tracking-widest flex items-center gap-2">
              MODE 4: CHUNG KẾT LẬT KÈO • ĐẤU TRƯỜNG KỸ NĂNG & TRẮC NGHIỆM
            </div>
            <h1 className="text-2xl lg:text-3xl font-black text-white flex items-center gap-3">
              <span>ĐẠI CHIẾN PHÁ HOẠI & CHÂN LÝ MLN131</span>
              <span className="text-xs font-black bg-rose-500/20 text-rose-400 border border-rose-500 px-3 py-1 rounded-full uppercase">
                CÂU {currentQIndex + 1} / {totalQuestions}
              </span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Progress Step Pills */}
          <div className="hidden md:flex items-center gap-1.5 bg-slate-900 border-2 border-black px-3 py-1.5 rounded-xl">
            {Array.from({ length: totalQuestions }).map((_, idx) => (
              <div
                key={idx}
                className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black border transition ${
                  idx === currentQIndex
                    ? 'bg-cyber-yellow text-black border-black scale-110 shadow-[1px_1px_0px_#000]'
                    : idx < currentQIndex
                    ? 'bg-emerald-500 text-black border-black'
                    : 'bg-slate-800 text-slate-500 border-slate-700'
                }`}
              >
                {idx + 1}
              </div>
            ))}
          </div>

          {timer > 0 ? (
            <div className="flex items-center gap-2 bg-slate-900 border-3 border-black px-4 py-2 rounded-xl text-cyber-yellow font-mono font-black text-xl shadow-[3px_3px_0px_#000]">
              <span>⏱️</span>
              <span>{timer}s</span>
            </div>
          ) : (
            <div className="px-3 py-1 bg-slate-800 rounded-xl border border-slate-700 text-xs font-bold text-slate-400">
              Sẵn Sàng
            </div>
          )}

          {/* Manual Phase Skip Button so Host never gets stuck */}
          {phase !== 'ROUND_SUMMARY' && (
            <button
              onClick={() => handleAdvancePhase()}
              className="px-4 py-2.5 bg-cyber-yellow hover:bg-amber-300 text-black font-black text-xs uppercase rounded-xl border-2 border-black flex items-center gap-1 shadow-[2px_2px_0px_#000] active:scale-95 transition cursor-pointer"
            >
              <span>
                {phase === 'CARD_DRAFT' && 'Vào Làm Bài ➔'}
                {phase === 'TRIVIA_QUESTION' && 'Mở Đáp Án ➔'}
                {phase === 'ROUND_RESOLUTION' && (currentQIndex < totalQuestions - 1 ? `Sang Câu ${currentQIndex + 2}/5 ➔` : 'Xem Tổng Kết ➔')}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={onReturnToHub}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs uppercase rounded-xl border-2 border-black flex items-center gap-1 shadow-[2px_2px_0px_#000] cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Sảnh Hub</span>
          </button>
        </div>
      </div>

      {/* 2. MAIN STAGE */}
      <div className="flex-1 flex flex-col justify-center">
        {/* PHASE 1: CHỌN KỸ NĂNG & MỤC TIÊU */}
        {phase === 'CARD_DRAFT' && (
          <div className="max-w-4xl mx-auto w-full animate-in zoom-in-95">
            <div className="bg-slate-900/90 border-4 border-black rounded-3xl p-6 lg:p-8 text-center shadow-[8px_8px_0px_#000] mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-500/20 border border-rose-500 rounded-full text-xs font-black text-rose-400 uppercase mb-3">
                <span>CÂU HỎI {currentQIndex + 1}/{totalQuestions}</span>
                <span>•</span>
                <span>GIAI ĐOẠN 1: CHỌN KỸ NĂNG & MỤC TIÊU</span>
              </div>
              <h2 className="text-2xl lg:text-3xl font-black text-white mb-2 uppercase">
                CHỌN CHIÊU THỨC CHO CÂU {currentQIndex + 1}
              </h2>
              <p className="text-xs lg:text-sm text-amber-300 max-w-xl mx-auto mb-6 font-bold bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/30">
                ⚠️ QUY TẮC CỨNG: Bạn chỉ được kích hoạt kỹ năng NẾU TRẢ LỜI ĐÚNG câu hỏi này! Nếu trả lời SAI, kỹ năng sẽ BỊ HỦY!
              </p>

              {/* 4 Skills Display Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-left mb-6">
                <div className="p-3.5 bg-slate-800/90 rounded-2xl border-2 border-black shadow-[2px_2px_0px_#000]">
                  <div className="text-2xl mb-1">💎</div>
                  <div className="font-black text-xs text-white uppercase">Cược Niềm Tin x2</div>
                  <div className="text-[11px] text-emerald-400 font-bold mt-0.5">Áp dụng: Chính mình</div>
                  <div className="text-[11px] text-slate-300 mt-1">Đúng x2 (+20,000đ), sai phạt -5,000đ.</div>
                </div>

                <div className="p-3.5 bg-slate-800/90 rounded-2xl border-2 border-black shadow-[2px_2px_0px_#000]">
                  <div className="text-2xl mb-1">💰</div>
                  <div className="font-black text-xs text-white uppercase">Cướp 30% Điểm</div>
                  <div className="text-[11px] text-amber-400 font-bold mt-0.5">Áp dụng: 1 đối thủ</div>
                  <div className="text-[11px] text-slate-300 mt-1">Đúng hút 30% điểm đối thủ, sai hủy chiêu.</div>
                </div>

                <div className="p-3.5 bg-slate-800/90 rounded-2xl border-2 border-black shadow-[2px_2px_0px_#000]">
                  <div className="text-2xl mb-1">🦑</div>
                  <div className="font-black text-xs text-white uppercase">Mực Đen Che Mắt</div>
                  <div className="text-[11px] text-rose-400 font-bold mt-0.5">Áp dụng: 1 đối thủ</div>
                  <div className="text-[11px] text-slate-300 mt-1">Đúng xịt mực che mắt đối thủ câu sau.</div>
                </div>

                <div className="p-3.5 bg-slate-800/90 rounded-2xl border-2 border-black shadow-[2px_2px_0px_#000]">
                  <div className="text-2xl mb-1">🛡️</div>
                  <div className="font-black text-xs text-white uppercase">Khiên Bảo Vệ</div>
                  <div className="text-[11px] text-cyan-400 font-bold mt-0.5">Áp dụng: Chính mình</div>
                  <div className="text-[11px] text-slate-300 mt-1">Đúng miễn nhiễm mọi chiêu hại câu này.</div>
                </div>
              </div>

              {/* Roster of players who locked in skills */}
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800 text-left">
                <div className="flex items-center justify-between text-xs font-black uppercase text-slate-400 mb-2">
                  <span>CHIẾN SĨ ĐÃ KHÓA CHIÊU:</span>
                  <span className="text-cyber-yellow">{Object.keys(queuedSkills).length} / {players.length} người</span>
                </div>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {Object.values(queuedSkills).map((s, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 rounded-lg border border-slate-700 text-xs font-bold text-white shadow-sm">
                      <span>{s.cardType === 'DOUBLE_OR_NOTHING' ? '💎' : s.cardType === 'POINT_HEIST' ? '💰' : s.cardType === 'INK_SPLATTER' ? '🦑' : '🛡️'}</span>
                      <span className="text-cyber-yellow">{s.playerName}</span>
                      <span className="text-slate-400 text-[10px]">➔ {s.isSelfTarget ? 'Bản thân' : s.targetPlayerName}</span>
                    </div>
                  ))}
                  {Object.keys(queuedSkills).length === 0 && (
                    <div className="text-slate-500 text-xs italic py-2">
                      Đang chờ các chiến sĩ chọn thẻ bài trên điện thoại...
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PHASE 2: TRẢ LỜI TRẮC NGHIỆM */}
        {phase === 'TRIVIA_QUESTION' && (
          <div className="max-w-4xl mx-auto w-full bg-slate-900 border-4 border-black rounded-3xl p-6 lg:p-8 shadow-[8px_8px_0px_#000] animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-4">
              <span className="px-3 py-1 bg-rose-500/20 border border-rose-500 rounded-full text-xs font-black text-rose-400 uppercase">
                CÂU {currentQIndex + 1}/{totalQuestions} • {currentQ.topic}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30">
                  Đã nộp bài: {answeredCount} / {players.length}
                </span>
                <span className="text-xs font-black text-cyber-yellow font-mono">
                  +10,000 PTS
                </span>
              </div>
            </div>

            <h3 className="text-xl lg:text-2xl font-black text-white leading-relaxed mb-6">
              {currentQ.scenario}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
              {currentQ.options.map((opt, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-800 border-2 border-slate-700 flex items-start gap-3 shadow-[2px_2px_0px_#000]">
                  <span className="w-8 h-8 rounded-full bg-slate-900 border border-slate-600 flex items-center justify-center font-black text-sm text-cyber-yellow shrink-0">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="text-sm font-bold text-slate-200 leading-snug pt-1">{opt}</span>
                </div>
              ))}
            </div>

            <div className="text-center text-xs text-slate-400 font-bold bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              📱 Chọn đáp án A, B, C hoặc D trên điện thoại! Đúng để kích hoạt chiêu thức đã chọn!
            </div>
          </div>
        )}

        {/* PHASE 3: CÔNG BỐ ĐÁP ÁN & ĐÁNH GIÁ KỸ NĂNG */}
        {phase === 'ROUND_RESOLUTION' && (
          <div className="max-w-4xl mx-auto w-full space-y-4 animate-in zoom-in-95">
            {/* Correct Answer Card */}
            <div className="bg-slate-900 border-4 border-black rounded-3xl p-6 text-center shadow-[8px_8px_0px_#000]">
              <div className="text-xs font-black text-emerald-400 uppercase tracking-widest mb-1 flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> ĐÁP ÁN CHÍNH XÁC CÂU {currentQIndex + 1}/{totalQuestions}:
              </div>
              <h3 className="text-xl lg:text-2xl font-black text-white mb-2">
                {String.fromCharCode(65 + currentQ.correctAnswer)}. {currentQ.options[currentQ.correctAnswer]}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed bg-black/40 p-3 rounded-xl border border-slate-800 text-left">
                <span className="font-black text-cyber-yellow mr-1">Lý luận MLN131:</span>
                {currentQ.explanation}
              </p>
            </div>

            {/* Skill Activation Evaluation Board */}
            <div className="bg-slate-900 border-4 border-black rounded-3xl p-6 shadow-[8px_8px_0px_#000]">
              <div className="flex items-center justify-between pb-3 border-b-2 border-slate-800 mb-4">
                <div className="text-xs font-black text-rose-400 uppercase tracking-widest flex items-center gap-2">
                  <Flame className="w-4 h-4" /> KẾT QUẢ KÍCH HOẠT CHIÊU THỨC (ĐÚNG ÁP DỤNG • SAI HỦY)
                </div>
                <span className="text-xs font-bold text-slate-400">
                  {Object.keys(queuedSkills).length} chiêu đăng ký
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-1">
                {Object.values(queuedSkills).map((s, idx) => {
                  const pAns = playerAnswers[s.playerId];
                  const isCorrect = pAns?.isCorrect ?? false;
                  return (
                    <div
                      key={idx}
                      className={`p-3 rounded-xl border-2 flex items-center justify-between shadow-sm transition ${
                        isCorrect
                          ? 'bg-emerald-950/40 border-emerald-500/60'
                          : 'bg-rose-950/40 border-rose-500/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">
                          {s.cardType === 'DOUBLE_OR_NOTHING' ? '💎' : s.cardType === 'POINT_HEIST' ? '💰' : s.cardType === 'INK_SPLATTER' ? '🦑' : '🛡️'}
                        </span>
                        <div>
                          <div className="font-black text-sm text-white flex items-center gap-1.5">
                            <span>{s.playerName}</span>
                            {isCorrect ? (
                              <span className="text-[10px] font-black bg-emerald-500 text-black px-1.5 py-0.2 rounded uppercase">Đúng</span>
                            ) : (
                              <span className="text-[10px] font-black bg-rose-500 text-white px-1.5 py-0.2 rounded uppercase">Sai</span>
                            )}
                          </div>
                          <div className="text-xs text-slate-300">
                            {s.detail || (isCorrect ? 'Kích hoạt thành công!' : 'Trả lời sai: Kỹ năng bị hủy!')}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        {isCorrect ? (
                          <span className="text-xs font-black text-emerald-400">✅ THÀNH CÔNG</span>
                        ) : (
                          <span className="text-xs font-black text-rose-400">❌ BỊ HỦY</span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {Object.keys(queuedSkills).length === 0 && (
                  <div className="col-span-2 text-center py-6 text-slate-500 text-xs italic">
                    Không có người chơi nào đăng ký kỹ năng ở câu này.
                  </div>
                )}
              </div>
            </div>

            {/* Sticky Action Footer for Question Navigation */}
            <div className="flex justify-end pt-2">
              {currentQIndex < totalQuestions - 1 ? (
                <button
                  onClick={() => handleAdvancePhase('NEXT_QUESTION')}
                  className="px-6 py-3 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-black font-black text-sm uppercase rounded-xl border-2 border-black flex items-center gap-2 shadow-[3px_3px_0px_#000] cursor-pointer"
                >
                  <span>SANG CÂU HỎI {currentQIndex + 2} / {totalQuestions}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => handleAdvancePhase('SUMMARY')}
                  className="px-8 py-3.5 bg-gradient-to-r from-rose-500 to-amber-500 text-white font-black text-base uppercase rounded-xl border-3 border-black flex items-center gap-2 shadow-[4px_4px_0px_#000] cursor-pointer"
                >
                  <Trophy className="w-5 h-5 text-cyber-yellow" />
                  <span>HOÀN THÀNH VÒNG 4 • XEM TỔNG KẾT ➔</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* PHASE 4: GRAND SUMMARY */}
        {phase === 'ROUND_SUMMARY' && (
          <div className="max-w-xl mx-auto w-full bg-slate-900 border-4 border-black rounded-3xl p-8 text-center shadow-[8px_8px_0px_#000] animate-in zoom-in-95">
            <div className="text-6xl mb-2">👑</div>
            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyber-yellow via-amber-300 to-rose-400 uppercase mb-2">
              TỔNG KẾT VÒNG 4: CHUNG KẾT LẬT KÈO!
            </h2>
            <p className="text-xs text-slate-300 mb-6">
              Toàn bộ {totalQuestions} câu hỏi trắc nghiệm và đấu trí kỹ năng đã kết thúc!
            </p>

            {/* Top 3 Podium of Round 4 */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {sortedPlayers.slice(0, 3).map((p, idx) => (
                <div key={p.id} className="bg-slate-800 p-3 rounded-2xl border-2 border-slate-700">
                  <div className="text-2xl mb-1">{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</div>
                  <div className="font-bold text-white text-xs truncate">{p.name}</div>
                  <div className="text-xs font-black text-cyber-yellow mt-1">+{p.score?.toLocaleString()} PTS</div>
                </div>
              ))}
            </div>

            {/* Sticky Action Footer: Advance to Grand Tournament Podium */}
            <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0F1420]/95 backdrop-blur-lg border-t-4 border-black p-4 shadow-[0_-6px_25px_rgba(0,0,0,0.8)]">
              <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
                <div className="text-xs text-slate-300 font-bold flex items-center gap-2">
                  <span className="p-1.5 bg-purple-500 text-white font-black rounded-lg">🏆 TOURNAMENT 4 VÒNG</span>
                  <span>Đã hoàn thành toàn bộ 4 vòng đấu! Chuyển sang Đại Lễ Vinh Danh!</span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={onReturnToHub}
                    className="flex items-center gap-2 px-5 py-3 bg-slate-800 hover:bg-slate-700 text-white font-black text-sm rounded-xl border-2 border-black shadow-[3px_3px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Sảnh Hub</span>
                  </button>

                  <button
                    onClick={() => {
                      sound.playVictoryFanfare();
                      if (onAdvanceToPodium) {
                        onAdvanceToPodium();
                      } else {
                        sync.hostUpdateState({
                          status: 'PODIUM',
                        });
                        sync.setGameStatus('PODIUM');
                      }
                    }}
                    className="flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-black font-black text-base uppercase rounded-xl border-3 border-black shadow-[4px_4px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition cursor-pointer scale-105"
                  >
                    <Trophy className="w-5 h-5 text-black" />
                    <span>👑 XEM BẢNG TỔNG ĐIỂM TOURNAMENT 4 VÒNG 🏆</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
