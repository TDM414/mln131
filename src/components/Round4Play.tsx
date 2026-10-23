'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { GameShowState, Round4Phase, TriviaQuestion, SabotageCard, SabotageCardType } from '../lib/types';
import { sync } from '../lib/syncEngine';
import { sound } from '../lib/audioSynthesizer';
import { getAvatarById } from '../data/memeAvatars';
import {
  Flame,
  Zap,
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Sparkles,
  Target,
  Award,
  EyeOff,
  Snowflake,
  Eye
} from 'lucide-react';

interface Round4PlayProps {
  state: Partial<GameShowState>;
  playerId: string;
  playerName: string;
  avatarId: string;
}

const CARDS: SabotageCard[] = [
  {
    id: 'c1',
    type: 'DOUBLE_OR_NOTHING',
    name: 'Cược Liều x2',
    description: 'Bản thân • Đúng x2 (+20kđ), sai phạt -5kđ',
    icon: '💎',
    color: '#06d6a0'
  },
  {
    id: 'c2',
    type: 'POINT_HEIST',
    name: 'Cướp 30% Điểm',
    description: 'Đối thủ • Đúng hút 30% điểm đối thủ',
    icon: '💰',
    color: '#ffd166'
  },
  {
    id: 'c3',
    type: 'INK_SPLATTER',
    name: 'Mực Đen Che Mắt',
    description: 'Đối thủ • Đúng xịt mực làm đen màn hình câu sau',
    icon: '🦑',
    color: '#ef233c'
  },
  {
    id: 'c4',
    type: 'CYBER_SHIELD',
    name: 'Khiên Bảo Vệ',
    description: 'Bản thân • Miễn nhiễm mọi chiêu cướp/mực/đóng băng',
    icon: '🛡️',
    color: '#118ab2'
  },
  {
    id: 'c5',
    type: 'LAG_SPIKE',
    name: 'Đóng Băng Phím',
    description: 'Đối thủ • Khóa phím đối thủ 3s ở câu tiếp theo',
    icon: '🥶',
    color: '#38bdf8'
  },
  {
    id: 'c6',
    type: 'HACKER_EYE',
    name: 'Mắt Thần 50:50',
    description: 'Bản thân • Quét sạch 2 đáp án sai cho câu này',
    icon: '👁️',
    color: '#a855f7'
  }
];

function isCardSelfTarget(cardType: SabotageCardType): boolean {
  return cardType === 'DOUBLE_OR_NOTHING' || cardType === 'CYBER_SHIELD' || cardType === 'HACKER_EYE';
}

function getCardIcon(cardType?: string): string {
  switch (cardType) {
    case 'DOUBLE_OR_NOTHING': return '💎';
    case 'POINT_HEIST': return '💰';
    case 'INK_SPLATTER': return '🦑';
    case 'CYBER_SHIELD': return '🛡️';
    case 'LAG_SPIKE': return '🥶';
    case 'HACKER_EYE': return '👁️';
    default: return '⚡';
  }
}

export default function Round4Play({ state, playerId, playerName, avatarId }: Round4PlayProps) {
  const r4State = state.round4State;
  const rawPhase = r4State?.phase || 'CARD_DRAFT';

  // Normalize phase across all naming variations
  const phase: 'CARD_DRAFT' | 'TRIVIA_QUESTION' | 'ROUND_RESOLUTION' | 'ROUND_SUMMARY' = useMemo(() => {
    if (rawPhase === 'CARD_PICK' || rawPhase === 'CARD_DRAFT' || rawPhase === 'CARD_ATTACK') return 'CARD_DRAFT';
    if (rawPhase === 'TRIVIA_QUESTION' || rawPhase === 'QUESTION') return 'TRIVIA_QUESTION';
    if (rawPhase === 'ROUND_RESOLUTION' || rawPhase === 'REVEAL') return 'ROUND_RESOLUTION';
    if (rawPhase === 'ROUND_SUMMARY' || rawPhase === 'SUMMARY') return 'ROUND_SUMMARY';
    return 'CARD_DRAFT';
  }, [rawPhase]);

  const currentQIndex = r4State?.currentQuestionIndex ?? 0;
  const totalQuestions = r4State?.questions?.length || 10;

  const currentQ: TriviaQuestion = r4State?.questions?.[currentQIndex] || {
    id: 1,
    topic: 'DÂN BIẾT SỐ',
    scenario: 'Một tài khoản mạng xã hội đăng tin giả kích động. Là công dân số, bạn nên làm gì?',
    options: [
      'Chia sẻ ngay vào nhóm lớp',
      'Tra cứu Cổng Thông Tin Điện Tử Chính Phủ để kiểm chứng',
      'Kêu gọi vào chửi bới',
      'Tin ngay vì nhiều like'
    ],
    correctAnswer: 1,
    explanation: 'Dân biết trên không gian số đòi hỏi tiếp cận và kiểm chứng thông tin từ các kênh chính thống của Nhà nước.',
    points: 10000
  };

  const opponentsList = useMemo(() => {
    return Object.values(state.players || {}).filter(p => p.id !== playerId);
  }, [state.players, playerId]);

  // Skill picking state
  const [selectedCard, setSelectedCard] = useState<SabotageCard>(CARDS[0]);
  const [selectedTargetId, setSelectedTargetId] = useState<string>('');
  const [hasLockedSkill, setHasLockedSkill] = useState<boolean>(false);

  // Debuff states
  const myPlayer = state.players?.[playerId];
  const isBlinded = myPlayer?.r4Debuffs?.isBlindedByInk ?? false;
  const inkWipesLeft = myPlayer?.r4Debuffs?.inkWipesLeft ?? (isBlinded ? 5 : 0);

  // Freeze debuff state (Lag Spike)
  const isFrozen = myPlayer?.r4Debuffs?.isFrozen ?? false;
  const [freezeSecondsLeft, setFreezeSecondsLeft] = useState<number>(0);

  useEffect(() => {
    if (phase === 'TRIVIA_QUESTION' && isFrozen) {
      setFreezeSecondsLeft(3);
      const timer = setInterval(() => {
        setFreezeSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    } else {
      setFreezeSecondsLeft(0);
    }
  }, [phase, isFrozen]);

  // Trivia Answer state
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hasAnswered, setHasAnswered] = useState<boolean>(false);
  const questionStartTimeRef = useRef<number>(Date.now());

  // Auto reset states when question index changes
  useEffect(() => {
    setHasLockedSkill(false);
    setSelectedTargetId('');
    setSelectedOption(null);
    setHasAnswered(false);
    questionStartTimeRef.current = Date.now();
  }, [currentQIndex]);

  // Hacker Eye 50:50 Calculation
  const eliminatedOptionIndices = useMemo(() => {
    const hasHackerEye =
      r4State?.queuedSkills?.[playerId]?.cardType === 'HACKER_EYE' ||
      (hasLockedSkill && selectedCard.type === 'HACKER_EYE');
    if (!hasHackerEye) return [];
    const correct = currentQ.correctAnswer;
    const wrong = [0, 1, 2, 3].filter(i => i !== correct);
    return wrong.slice(0, 2);
  }, [r4State?.queuedSkills, playerId, hasLockedSkill, selectedCard.type, currentQ.correctAnswer]);

  // Handle locking skill
  const handleLockSkill = async () => {
    if (hasLockedSkill) return;
    const isSelf = isCardSelfTarget(selectedCard.type);
    const targetId = isSelf ? playerId : (selectedTargetId || (opponentsList[0]?.id || playerId));

    setHasLockedSkill(true);
    sound.playCorrectChime();
    if ('vibrate' in navigator) navigator.vibrate([80, 40, 80]);

    await sync.playCard(
      selectedCard.type,
      targetId,
      playerId,
      playerName,
      isSelf
    );
  };

  // Handle Wiping Ink off Screen
  const handleWipeInk = async () => {
    sound.playTapPunch();
    if ('vibrate' in navigator) navigator.vibrate(30);
    await sync.wipeInk(playerId);
  };

  // Handle Trivia Answer Submission
  const handleSelectOption = async (optionIndex: number) => {
    if (hasAnswered || freezeSecondsLeft > 0) return;
    const timeMs = Math.max(500, Date.now() - questionStartTimeRef.current);
    setSelectedOption(optionIndex);
    setHasAnswered(true);
    sound.playTapPunch();
    if ('vibrate' in navigator) navigator.vibrate(50);

    await sync.submitTrivia(currentQIndex, optionIndex, timeMs, playerId);
  };

  // My answer and queued skill results
  const myQueuedSkill = r4State?.queuedSkills?.[playerId];
  const myAnswer = r4State?.playerAnswers?.[playerId];
  const isAnswerCorrect = myAnswer?.isCorrect ?? (selectedOption === currentQ.correctAnswer);

  return (
    <div className="w-full h-full flex flex-col justify-between p-3.5 max-w-md mx-auto select-none bg-[#0a0e17] text-white">
      {/* 1. TOP STATUS HEADER */}
      <div className="bg-slate-900 border-3 border-black rounded-2xl p-2.5 flex items-center justify-between shadow-[3px_3px_0px_#000]">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-rose-500 border-2 border-black flex items-center justify-center text-lg shrink-0">
            👑
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-black text-rose-400 uppercase tracking-wider">
              VÒNG 4: CHUNG KẾT LẬT KÈO
            </div>
            <div className="text-xs font-black text-white flex items-center gap-1.5">
              <span>CÂU {currentQIndex + 1}/{totalQuestions}</span>
              <span className="text-[10px] text-cyber-yellow bg-black/50 px-1.5 py-0.5 rounded font-mono font-black border border-slate-800">
                {(myPlayer?.score || 0).toLocaleString()} PTS
              </span>
            </div>
          </div>
        </div>

        <div className="text-right">
          <span className="px-2 py-1 bg-slate-800 text-cyber-yellow rounded-lg border border-slate-700 text-[10px] font-black uppercase">
            {phase === 'CARD_DRAFT' && '1. CHỌN CHIÊU'}
            {phase === 'TRIVIA_QUESTION' && '2. TRẢ LỜI'}
            {phase === 'ROUND_RESOLUTION' && '3. KẾT QUẢ'}
            {phase === 'ROUND_SUMMARY' && 'TỔNG KẾT'}
          </span>
        </div>
      </div>

      {/* 2. DYNAMIC MAIN STAGE */}
      <div className="flex-1 flex flex-col justify-center my-2 overflow-y-auto">
        {/* PHASE 1: CHỌN KỸ NĂNG & MỤC TIÊU */}
        {phase === 'CARD_DRAFT' && (
          <div className="space-y-2.5">
            <div className="text-center mb-0.5">
              <span className="px-3 py-0.5 bg-rose-500/20 text-rose-400 border border-rose-500/40 rounded-full text-[10px] font-black uppercase">
                🃏 CÂU {currentQIndex + 1}/{totalQuestions}: ĐẤU TRƯỜNG KỸ NĂNG
              </span>
              <h3 className="text-xs font-black text-white uppercase mt-1">
                CHỌN 1 CHIÊU THỨC DƯỚI ĐÂY (LƯỚI 6 Ô)
              </h3>
              <p className="text-[9px] text-amber-300 font-bold bg-amber-500/10 p-1 rounded-lg border border-amber-500/20 mt-0.5">
                ⚠️ Chỉ kích hoạt NẾU TRẢ LỜI ĐÚNG! Trả lời sai sẽ bị hủy chiêu!
              </p>
            </div>

            {/* 6 Skill Cards in a clean 2-Column Grid */}
            <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-0.5">
              {CARDS.map((card) => {
                const isSelected = selectedCard?.id === card.id;
                const isSelf = isCardSelfTarget(card.type);
                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => {
                      if (hasLockedSkill) return;
                      setSelectedCard(card);
                      sound.playTapPunch();
                    }}
                    className={`p-2 rounded-xl border-2 text-left transition active:scale-95 cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-rose-950/90 border-cyber-yellow ring-2 ring-cyber-yellow shadow-[3px_3px_0px_#000]'
                        : 'bg-slate-900 hover:bg-slate-800 border-black shadow-[2px_2px_0px_#000]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 w-full mb-1">
                      <span className="text-xl">{card.icon}</span>
                      <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
                        isSelf
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}>
                        {isSelf ? 'Bản thân' : 'Đối thủ'}
                      </span>
                    </div>
                    <div className="font-black text-[11px] text-white leading-tight mb-0.5 truncate w-full">
                      {card.name}
                    </div>
                    <div className="text-[9px] text-slate-300 leading-tight line-clamp-2">
                      {card.description}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Target Selection: 2-Column Avatar Cards Grid */}
            {!isCardSelfTarget(selectedCard.type) && (
              <div className="bg-slate-900/90 p-2.5 rounded-2xl border-2 border-black shadow-[2px_2px_0px_#000]">
                <div className="flex items-center justify-between text-[10px] font-black text-slate-300 uppercase mb-1.5">
                  <span>🎯 CHỌN ĐỐI THỦ [{selectedCard.name}]:</span>
                  <span className="text-cyber-yellow font-mono">{opponentsList.length} người</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto pr-0.5">
                  {opponentsList.map((opp) => {
                    const isSelected = selectedTargetId === opp.id || (!selectedTargetId && opponentsList[0]?.id === opp.id);
                    const oppAvatar = getAvatarById(opp.avatarId || 'keyboard_warrior');
                    const OppAvatarSvg = oppAvatar.SvgComponent;
                    return (
                      <button
                        key={opp.id}
                        type="button"
                        onClick={() => {
                          if (hasLockedSkill) return;
                          setSelectedTargetId(opp.id);
                          sound.playTapPunch();
                        }}
                        className={`p-1.5 rounded-xl border-2 flex items-center gap-1.5 text-left transition cursor-pointer active:scale-95 ${
                          isSelected
                            ? 'bg-rose-950/90 border-cyber-yellow ring-2 ring-cyber-yellow text-white shadow-[2px_2px_0px_#000]'
                            : 'bg-slate-800 hover:bg-slate-700/80 border-slate-700 text-slate-300'
                        }`}
                      >
                        <div className="w-7 h-7 rounded-lg overflow-hidden bg-black shrink-0 border border-slate-700 flex items-center justify-center">
                          <OppAvatarSvg size={24} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[11px] font-black truncate leading-tight">{opp.name}</div>
                          <div className="text-[9px] font-mono text-cyber-yellow font-bold leading-tight">
                            {(opp.score || 0).toLocaleString()} <span className="text-[7px]">PTS</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                  {opponentsList.length === 0 && (
                    <div className="col-span-2 text-center text-slate-400 text-xs py-2 italic">
                      Chưa có đối thủ nào khác trong phòng.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Lock Skill Button */}
            <div className="pt-0.5">
              <button
                onClick={handleLockSkill}
                disabled={hasLockedSkill}
                className={`w-full py-3 text-black font-black text-xs uppercase rounded-xl border-3 border-black shadow-[3px_3px_0px_#000] active:scale-95 transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  hasLockedSkill ? 'bg-emerald-500 text-white' : 'bg-cyber-yellow hover:bg-amber-300'
                }`}
              >
                {hasLockedSkill ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>✓ ĐÃ KHÓA CHIÊU THỨC • CHUẨN BỊ LÀM BÀI!</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-black" />
                    <span>KHÓA KỸ NĂNG [{selectedCard.name}] ➔</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* PHASE 2: TRẢ LỜI CÂU HỎI TRẮC NGHIỆM */}
        {phase === 'TRIVIA_QUESTION' && (
          <div className="relative space-y-3">
            {/* INK DEBUFF OVERLAY (IF BLINDED) */}
            {isBlinded && (
              <div
                onClick={handleWipeInk}
                className="absolute inset-0 z-30 bg-black/95 rounded-2xl flex flex-col items-center justify-center p-4 text-center cursor-pointer border-4 border-rose-500 animate-pulse"
              >
                <EyeOff className="w-12 h-12 text-rose-500 mb-2 animate-bounce" />
                <h4 className="text-lg font-black text-white uppercase mb-1">
                  BỊ MỰC ĐEN CHE MÀN HÌNH!
                </h4>
                <p className="text-xs text-rose-300 mb-3">
                  Bạn bị đối thủ chơi xấu xịt mực! Hãy chạm nhanh vào màn hình để lau sạch!
                </p>
                <div className="px-5 py-2.5 bg-rose-600 text-white font-black text-sm rounded-xl border-2 border-black shadow-[3px_3px_0px_#000]">
                  CHẠM ĐỂ LAU MỰC ({inkWipesLeft} lần nữa) 🖐️
                </div>
              </div>
            )}

            {/* FROZEN DEBUFF OVERLAY (LAG SPIKE 3s COUNTDOWN) */}
            {freezeSecondsLeft > 0 && (
              <div className="absolute inset-0 z-30 bg-cyan-950/90 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center p-4 text-center border-4 border-cyan-400 animate-pulse">
                <Snowflake className="w-12 h-12 text-cyan-300 mb-2 animate-spin duration-1000" />
                <h4 className="text-lg font-black text-cyan-300 uppercase mb-1">
                  BỊ ĐÓNG BĂNG PHÍM (LAG SPIKE)!
                </h4>
                <p className="text-xs text-cyan-100 mb-3">
                  Bạn bị đối thủ làm tê liệt phím! Đang rã đông trong:
                </p>
                <div className="px-6 py-2.5 bg-cyan-400 text-black font-black text-2xl rounded-2xl border-3 border-black shadow-[3px_3px_0px_#000] font-mono">
                  ❄️ {freezeSecondsLeft}S
                </div>
              </div>
            )}

            <div className="bg-slate-900 border-2 border-slate-800 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 bg-rose-500/20 text-rose-400 border border-rose-500/40 rounded-full text-[9px] font-black uppercase">
                  {currentQ.topic}
                </span>
                <span className="text-[10px] font-black text-cyber-yellow font-mono">+10,000 PTS</span>
              </div>

              {/* 50:50 Lifeline Notification */}
              {eliminatedOptionIndices.length > 0 && (
                <div className="mb-2 px-2.5 py-1 bg-purple-950/70 border border-purple-500 rounded-lg flex items-center gap-1.5 text-[10px] font-black text-purple-300 animate-pulse">
                  <Eye className="w-3.5 h-3.5" />
                  <span>👁️ MẮT THẦN HACKER: ĐÃ QUÉT SẠCH 2 ĐÁP ÁN SAI (50:50)!</span>
                </div>
              )}

              <h3 className="text-xs font-bold text-white leading-relaxed mb-3">
                {currentQ.scenario}
              </h3>

              <div className="space-y-2">
                {currentQ.options.map((opt, idx) => {
                  const isSelected = selectedOption === idx;
                  const isEliminated = eliminatedOptionIndices.includes(idx);

                  if (isEliminated) {
                    return (
                      <div
                        key={idx}
                        className="w-full p-2.5 rounded-xl border-2 border-slate-800 bg-slate-950/60 text-slate-600 line-through text-left flex items-start gap-2.5 cursor-not-allowed opacity-40"
                      >
                        <span className="w-5 h-5 rounded-full bg-black border border-slate-800 flex items-center justify-center font-black text-[10px] text-slate-600 shrink-0">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="text-[11px] font-medium leading-snug">
                          {opt} <span className="text-[9px] text-rose-500 ml-1 no-underline">[ĐÃ LOẠI 50:50]</span>
                        </span>
                      </div>
                    );
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectOption(idx)}
                      disabled={hasAnswered || freezeSecondsLeft > 0}
                      className={`w-full p-2.5 rounded-xl border-2 text-left flex items-start gap-2.5 transition active:scale-98 cursor-pointer ${
                        isSelected
                          ? 'bg-rose-950 border-cyber-yellow text-white shadow-[2px_2px_0px_#000]'
                          : 'bg-slate-800 hover:bg-slate-700/80 border-slate-700 text-slate-200'
                      }`}
                    >
                      <span className="w-5 h-5 rounded-full bg-slate-900 border border-slate-600 flex items-center justify-center font-black text-[10px] text-cyber-yellow shrink-0">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="text-[11px] font-bold leading-snug">{opt}</span>
                    </button>
                  );
                })}
              </div>

              {hasAnswered && (
                <div className="mt-3 text-center text-xs font-bold text-cyber-yellow animate-pulse bg-slate-950 p-2 rounded-xl border border-slate-800">
                  ✓ Đã nộp bài! Đang chờ máy chiếu công bố đáp án...
                </div>
              )}
            </div>
          </div>
        )}

        {/* PHASE 3: CÔNG BỐ KẾT QUẢ & ĐÁNH GIÁ KỸ NĂNG */}
        {phase === 'ROUND_RESOLUTION' && (
          <div className="space-y-3 animate-in zoom-in-95">
            {/* Trivia Answer Result */}
            <div className={`p-4 rounded-2xl border-3 border-black text-center shadow-[4px_4px_0px_#000] ${
              isAnswerCorrect ? 'bg-emerald-950/80 border-emerald-500' : 'bg-rose-950/80 border-rose-500'
            }`}>
              <div className="text-3xl mb-1">{isAnswerCorrect ? '🎉' : '❌'}</div>
              <h3 className="text-base font-black text-white uppercase">
                {isAnswerCorrect ? 'BẠN ĐÃ TRẢ LỜI ĐÚNG!' : 'BẠN ĐÃ TRẢ LỜI SAI!'}
              </h3>
              <p className="text-xs text-slate-200 mt-1">
                Đáp án chuẩn: <span className="font-black text-cyber-yellow">{String.fromCharCode(65 + currentQ.correctAnswer)}. {currentQ.options[currentQ.correctAnswer]}</span>
              </p>
            </div>

            {/* Skill Outcome Card */}
            <div className="bg-slate-900 border-2 border-slate-800 rounded-2xl p-4 shadow-sm text-center">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">
                KẾT QUẢ KÍCH HOẠT KỸ NĂNG
              </div>
              <div className="text-2xl mb-1">
                {getCardIcon(myQueuedSkill?.cardType || selectedCard.type)}
              </div>
              <h4 className="font-black text-sm text-white uppercase">
                {myQueuedSkill?.cardType ? (CARDS.find(c => c.type === myQueuedSkill.cardType)?.name || myQueuedSkill.cardType) : selectedCard.name}
              </h4>
              <p className={`text-xs font-black mt-1 ${isAnswerCorrect ? 'text-emerald-400' : 'text-rose-400'}`}>
                {isAnswerCorrect ? '✅ KÍCH HOẠT THÀNH CÔNG!' : '❌ BỊ HỦY DO TRẢ LỜI SAI!'}
              </p>
              <p className="text-[11px] text-slate-300 mt-1">
                {myQueuedSkill?.detail || (isAnswerCorrect ? 'Chiêu thức của bạn đã có hiệu lực!' : 'Bạn không trả lời đúng nên kỹ năng không được áp dụng.')}
              </p>
            </div>

            <div className="text-center text-xs text-slate-400 font-bold">
              Đang chuẩn bị sang câu tiếp theo...
            </div>
          </div>
        )}

        {/* PHASE 4: GRAND SUMMARY */}
        {phase === 'ROUND_SUMMARY' && (
          <div className="bg-slate-900 border-3 border-black rounded-2xl p-6 text-center shadow-[4px_4px_0px_#000] space-y-3 animate-in zoom-in-95">
            <div className="text-5xl">👑</div>
            <h3 className="text-xl font-black text-cyber-yellow uppercase">
              HOÀN THÀNH VÒNG 4!
            </h3>
            <p className="text-xs text-slate-300">
              Trận chung kết lật kèo đã kết thúc! Điểm tổng kết của bạn:
            </p>
            <div className="text-2xl font-black text-white font-mono bg-black/50 py-3 rounded-xl border border-slate-800">
              {(myPlayer?.score || 0).toLocaleString()} PTS
            </div>
            <p className="text-xs text-rose-400 font-bold animate-pulse">
              🏆 Hãy ngước nhìn lên máy chiếu để tham gia Đại Lễ Trao Giải Grand Podium!
            </p>
          </div>
        )}
      </div>

      {/* 3. BOTTOM FOOTER */}
      <div className="text-center text-[10px] text-slate-500 font-bold pt-2 border-t border-slate-900">
        NETIZEN PARTY • VÒNG 4 CHUNG KẾT LẬT KÈO • MLN131
      </div>
    </div>
  );
}
