'use client';

import React, { useState, useEffect, useRef } from 'react';
import { GameShowState, MiniGameType, SabotageCardType } from '../lib/types';
import { NETIZEN_AVATARS } from '../data/memeAvatars';
import { sync } from '../lib/syncEngine';
import { sound } from '../lib/audioSynthesizer';
import { VIETNAMESE_ROAST_BANK } from '../data/questions';
import {
  FlaskConical,
  Bot,
  Users,
  Flame,
  Zap,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  X,
} from 'lucide-react';

interface DevBotSimulatorProps {
  state: GameShowState;
  isSimulating: boolean;
  onToggleSimulate: () => void;
  onClose?: () => void;
}

const VIETNAMESE_STUDENTS = [
  { name: 'Tuấn Anh', avatarId: 'keyboard_warrior' },
  { name: 'Khánh Linh', avatarId: 'genz_slang_queen' },
  { name: 'Minh Đức', avatarId: 'var_inspector' },
  { name: 'Hương Giang', avatarId: 'grammar_police' },
  { name: 'Văn Hoàng', avatarId: 'anti_scam_otter' },
  { name: 'Thị Thảo', avatarId: 'zen_monk' },
  { name: 'Gia Huy', avatarId: 'chicken_feeder' },
  { name: 'Bảo Châu', avatarId: 'phd_student' },
  { name: 'Thành Đạt', avatarId: 'conspiracy_theorist' },
  { name: 'Phương Anh', avatarId: 'righteous_netizen' },
  { name: 'Quốc Bảo', avatarId: 'keyboard_warrior' },
  { name: 'Diệu Linh', avatarId: 'genz_slang_queen' },
  { name: 'Hải Đăng', avatarId: 'var_inspector' },
  { name: 'Ngọc Ánh', avatarId: 'anti_scam_otter' },
  { name: 'Việt Dũng', avatarId: 'righteous_netizen' },
  { name: 'Thùy Trang', avatarId: 'grammar_police' },
  { name: 'Đức Thắng', avatarId: 'zen_monk' },
  { name: 'Mai Phương', avatarId: 'phd_student' },
];

const MEME_DANMAKU_COMMENTS = [
  { emoji: '🔥', text: 'Cà khịa đỉnh nóc kịch trần!' },
  { emoji: '🍅', text: 'Ném cà chua nè seeder ơi!' },
  { emoji: '🧱', text: 'Tặng 1 cục gạch chất lượng cao' },
  { emoji: '🎦', text: 'Check VAR góc quay chậm đê!' },
  { emoji: '🤡', text: 'Ai mượn giải cứu thế chú em?' },
  { emoji: '❤️', text: 'Dân chủ văn minh 10 điểm!' },
  { emoji: '👀', text: 'Hóng drama không chớp mắt' },
  { emoji: '👮', text: 'Cảnh sát chính tả gõ đầu nha' },
  { emoji: '🛸', text: 'Thuyết âm mưu này uy tín' },
  { emoji: '⚡', text: 'Lật kèo phút chót ae ơi!' },
];

const ROAST_TEMPLATES = [
  'Định hướng dư luận kiểu gì mà chính tả còn sai từa lưa vậy bạn ơi!',
  'Nhìn qua tưởng chuyên gia tài chính, soi kĩ hóa ra chuyên viên lùa gà!',
  'Bảo là thuốc tiên chữa bách bệnh nhưng thành phần chính là đường phèn!',
  'Group 200k mem mà admin tự biên tự diễn như diễn viên hài độc thoại.',
  'Dân biết dân bàn mà bạn cứ bấm nút xóa comment của người ta là sao?',
  'Ăn chanh luộc ngừa virus thì giáo trình MLN131 xin phép quỳ lạy.',
];

export default function DevBotSimulator({
  state,
  isSimulating,
  onToggleSimulate,
  onClose,
}: DevBotSimulatorProps) {
  const [speedProfile, setSpeedProfile] = useState<'FAST' | 'REALISTIC' | 'CHAOTIC'>('REALISTIC');
  const simulatedRoastTrack = useRef<Record<string, boolean>>({});
  const simulatedMiniGameTrack = useRef<Record<string, boolean>>({});
  const simulatedVoteTrack = useRef<Record<string, boolean>>({});
  const simulatedTriviaTrack = useRef<Record<string, boolean>>({});
  const hasInitializedBots = useRef(false);

  // Reset simulation tracks when game returns to Lobby or resets
  useEffect(() => {
    if (state.status === 'LOBBY') {
      simulatedRoastTrack.current = {};
      simulatedMiniGameTrack.current = {};
      simulatedVoteTrack.current = {};
      simulatedTriviaTrack.current = {};
    }
  }, [state.status]);

  // 1. AUTO-JOIN BOTS IN LOBBY WHEN SIMULATION IS ENABLED
  useEffect(() => {
    if (!isSimulating) {
      hasInitializedBots.current = false;
      return;
    }

    if (hasInitializedBots.current) return;
    hasInitializedBots.current = true;

    const currentPlayers = state.players || {};
    const remainingBots = VIETNAMESE_STUDENTS.slice(0, 15);
    const timeouts: NodeJS.Timeout[] = [];

    remainingBots.forEach((bot, index) => {
      const botId = `bot_${bot.name.replace(/\s+/g, '_').toLowerCase()}`;
      if (!currentPlayers[botId]) {
        const t = setTimeout(() => {
          sync.joinRoom(botId, bot.name, bot.avatarId, true);
        }, index * 120);
        timeouts.push(t);
      }
    });

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [isSimulating]);

  // 2. PERIODIC DANMAKU EMISSIONS IN LOBBY & DURING SHOW
  useEffect(() => {
    if (!isSimulating) return;

    const intervalMs = speedProfile === 'FAST' ? 1200 : speedProfile === 'CHAOTIC' ? 600 : 2400;
    const danmakuTimer = setInterval(() => {
      const bot = VIETNAMESE_STUDENTS[Math.floor(Math.random() * VIETNAMESE_STUDENTS.length)];
      const sample = MEME_DANMAKU_COMMENTS[Math.floor(Math.random() * MEME_DANMAKU_COMMENTS.length)];

      sync.sendDanmaku(sample.emoji, sample.text, bot.name, bot.avatarId);
    }, intervalMs);

    return () => clearInterval(danmakuTimer);
  }, [isSimulating, speedProfile]);

  // 3. ROUND 1: AUTO SUBMIT FEED COMMENTS & REACTIONS
  useEffect(() => {
    if (!isSimulating || state.status !== 'ROUND_1') return;

    const phase = state.round1State?.phase;

    // Comment Input Phase (45s): Bots submit comments with staggered delays
    if (phase === 'PROMPT' || phase === 'ROAST_INPUT' || phase === 'PROMPT_BROADCAST') {
      const promptIdx = state.round1State.currentPromptIndex;
      const key = `r1_feed_${promptIdx}`;
      if (!simulatedRoastTrack.current[key]) {
        simulatedRoastTrack.current[key] = true;

        const botParticipants = VIETNAMESE_STUDENTS.slice(0, 14);
        botParticipants.forEach((bot, idx) => {
          const botId = `bot_${bot.name.replace(/\s+/g, '_').toLowerCase()}`;
          const roastBank = VIETNAMESE_ROAST_BANK.length > 0 ? VIETNAMESE_ROAST_BANK : ROAST_TEMPLATES;
          const roastText = roastBank[idx % roastBank.length];

          const baseDelay =
            speedProfile === 'FAST'
              ? Math.random() * 4000 + 800
              : speedProfile === 'CHAOTIC'
              ? Math.random() * 2500 + 400
              : Math.random() * 12000 + 2000;

          setTimeout(() => {
            sync.submitFeedComment(roastText, botId, bot.name, bot.avatarId);
            sync.submitRoast(roastText, botId, bot.name, bot.avatarId);
          }, baseDelay);
        });
      }
    }

    // Reaction Phase (30s): Bots browse feed and spam reactions on comments
    if (phase === 'FEED_REACTION') {
      const key = `r1_react_${state.round1State.currentPromptIndex}`;
      if (!simulatedRoastTrack.current[key]) {
        simulatedRoastTrack.current[key] = true;

        VIETNAMESE_STUDENTS.forEach((bot, idx) => {
          const botId = `bot_${bot.name.replace(/\s+/g, '_').toLowerCase()}`;
          const reactionTimes = speedProfile === 'FAST' ? 4 : speedProfile === 'CHAOTIC' ? 5 : 3;

          for (let r = 0; r < reactionTimes; r++) {
            const delay = Math.random() * 18000 + 1000;
            setTimeout(() => {
              const currentComments = Object.values(state.round1State?.comments || {});
              if (currentComments.length > 0) {
                // Prioritize comments from human players so they get high visibility & trending score
                const humanComments = currentComments.filter(c => {
                  const p = state.players?.[c.authorId];
                  return p && !p.isBot;
                });
                const target = (humanComments.length > 0 && Math.random() < 0.92)
                  ? humanComments[Math.floor(Math.random() * humanComments.length)]
                  : currentComments[Math.floor(Math.random() * currentComments.length)];

                const reaction: 'heart' | 'tomato' | 'brick' =
                  (target && humanComments.some(h => h.id === target.id))
                    ? 'heart'
                    : (Math.random() < 0.7 ? 'heart' : Math.random() < 0.5 ? 'tomato' : 'brick');
                sync.reactFeedPost(target.id, reaction, botId);

                // Send Danmaku reaction
                if (Math.random() < 0.4) {
                  sync.sendDanmaku(reaction === 'heart' ? '❤️' : reaction === 'tomato' ? '🍅' : '🧱', '', bot.name, bot.avatarId);
                }
              }
            }, delay);
          }
        });
      }
    }

    // Top Trending celebration burst
    if (phase === 'TOP_TRENDING' || phase === 'TRENDING_REVEAL' || phase === 'VAR_REVEAL') {
      const topKey = `r1_top_burst_${state.round1State.currentPromptIndex}`;
      if (!simulatedRoastTrack.current[topKey]) {
        simulatedRoastTrack.current[topKey] = true;
        const emojis = ['👑', '🔥', '❤️', '👏', '🎉'];
        for (let v = 0; v < 6; v++) {
          const randomBot = VIETNAMESE_STUDENTS[Math.floor(Math.random() * VIETNAMESE_STUDENTS.length)];
          const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
          setTimeout(() => {
            sync.sendDanmaku(randomEmoji, 'Đỉnh nóc kịch trần!', randomBot.name, randomBot.avatarId);
          }, v * 300 + 400);
        }
      }
    }
  }, [isSimulating, state.status, state.round1State, speedProfile]);

  // 4. ROUND 2: FACT OR CAP 5S AUTOMATION WITH SPEED-DECAY SCORING
  useEffect(() => {
    if (!isSimulating || state.status !== 'ROUND_2') return;

    const phase = state.round2State?.phase;
    const gameIdx = state.round2State?.currentQuestionIndex ?? state.round2State?.currentGameIndex ?? 0;

    if (
      phase === 'QUESTION_ACTIVE' ||
      phase === 'QUESTION' ||
      phase === 'PLAYING' ||
      phase === 'MICRO_PLAYING'
    ) {
      const key = `r2_q_${gameIdx}`;
      if (!simulatedMiniGameTrack.current[key]) {
        simulatedMiniGameTrack.current[key] = true;

        VIETNAMESE_STUDENTS.forEach((bot) => {
          const botId = `bot_${bot.name.replace(/\s+/g, '_').toLowerCase()}`;

          // 85% accuracy for bots
          const questions = state.round2State?.questions || [];
          const curQ = questions[gameIdx];
          const isFact = curQ ? curQ.isFact : Math.random() < 0.5;
          const isCorrect = Math.random() < (speedProfile === 'FAST' ? 0.90 : 0.82);
          const choice: 'FACT' | 'CAP' = isCorrect ? (isFact ? 'FACT' : 'CAP') : (isFact ? 'CAP' : 'FACT');

          // Speed-decay reaction delay: 0.8s to 6.5s
          const reactionTime = Math.floor(Math.random() * 5500 + 800);
          const remainingTime = Math.max(500, 10000 - reactionTime);

          setTimeout(() => {
            sync.submitFactOrCap(choice, remainingTime, 10000, botId, gameIdx);
            sync.submitMinigameResult(isCorrect, reactionTime, botId);
          }, reactionTime);
        });
      }
    }
  }, [isSimulating, state.status, state.round2State, state.players, speedProfile]);

  // 4. ROUND 3: CONSENSUS DILEMMA TUG-OF-WAR AUTOMATION
  useEffect(() => {
    if (!isSimulating || state.status !== 'ROUND_3') return;

    const phase = state.round3State?.phase;
    const dilemmaIdx = state.round3State?.currentDilemmaIndex ?? 0;

    if (phase === 'VOTING' || phase === 'VOTE_AND_BET' || phase === 'EXPULSION_VOTE') {
      const key = `r3_dilemma_${dilemmaIdx}`;
      if (!simulatedVoteTrack.current[key]) {
        simulatedVoteTrack.current[key] = true;

        // Weight towards A or B (e.g. 60/40 or 70/30) to create exciting tug-of-war
        const weightA = Math.random() < 0.5 ? 0.65 : 0.35;

        VIETNAMESE_STUDENTS.forEach((bot) => {
          const botId = `bot_${bot.name.replace(/\s+/g, '_').toLowerCase()}`;
          const botStance: 'A' | 'B' = Math.random() < weightA ? 'A' : 'B';
          const botBet: 'A' | 'B' = Math.random() < (weightA > 0.5 ? 0.75 : 0.25) ? 'A' : 'B';

          // Step 1: Submit Stance (delay 1.0s to 6.0s)
          const stanceDelay = Math.floor(Math.random() * 5000 + 1000);
          setTimeout(() => {
            sync.submitDilemmaStance(botStance, botId);
          }, stanceDelay);

          // Step 2: Submit Predicted Majority Bet (delay 2.0s to 12.0s)
          const betDelay = Math.floor(Math.random() * 8000 + 2500);
          const remainingTime = Math.max(1000, 20000 - betDelay);
          setTimeout(() => {
            sync.submitDilemmaBet(botBet, remainingTime, 20000, botId);
          }, betDelay);
        });
      }
    }
  }, [isSimulating, state.status, state.round3State, speedProfile]);

  // 5. ROUND 4: TRIVIA & SABOTAGE CARDS AUTOMATION
  useEffect(() => {
    if (!isSimulating || state.status !== 'ROUND_4') return;

    const phase = state.round4State?.phase;
    const qIdx = state.round4State?.currentQuestionIndex ?? 0;

    // Phase 1: Bots queue sabotage skills for current question
    if (phase === 'CARD_DRAFT' || phase === 'CARD_PICK' || phase === 'CARD_ATTACK') {
      const key = `r4_sabotage_${qIdx}`;
      if (!simulatedTriviaTrack.current[key]) {
        simulatedTriviaTrack.current[key] = true;
        const cardTypes: Array<'INK_SPLATTER' | 'POINT_HEIST' | 'DOUBLE_OR_NOTHING' | 'CYBER_SHIELD'> = [
          'DOUBLE_OR_NOTHING',
          'POINT_HEIST',
          'INK_SPLATTER',
          'CYBER_SHIELD',
        ];
        const allPlayerIds = Object.keys(state.players || {});

        VIETNAMESE_STUDENTS.slice(0, 8).forEach((bot, idx) => {
          const botId = `bot_${bot.name.replace(/\s+/g, '_').toLowerCase()}`;
          const cardType = cardTypes[idx % cardTypes.length];
          const isSelf = cardType === 'DOUBLE_OR_NOTHING' || cardType === 'CYBER_SHIELD';
          const potentialTargets = allPlayerIds.filter((id) => id !== botId);
          const targetId = isSelf
            ? botId
            : (potentialTargets.length > 0
                ? potentialTargets[Math.floor(Math.random() * potentialTargets.length)]
                : botId);

          setTimeout(() => {
            sync.playCard(cardType, targetId, botId, bot.name, isSelf);
          }, Math.random() * 5000 + 400);
        });
      }
    }

    // Phase 3: Bots submit trivia answers
    if (phase === 'TRIVIA_QUESTION') {
      const key = `r4_q_${qIdx}`;
      if (!simulatedTriviaTrack.current[key]) {
        simulatedTriviaTrack.current[key] = true;
        const currentQ = state.round4State?.questions?.[qIdx];

        VIETNAMESE_STUDENTS.forEach((bot) => {
          const botId = `bot_${bot.name.replace(/\s+/g, '_').toLowerCase()}`;
          const isCorrect = Math.random() < 0.82;
          const selectedOption = isCorrect
            ? currentQ?.correctAnswer ?? 1
            : (currentQ?.correctAnswer === 0 ? 1 : 0);
          const answerTime = Math.floor(Math.random() * 4000 + 1500);

          setTimeout(() => {
            sync.submitTrivia(qIdx, selectedOption, answerTime, botId);
          }, answerTime);
        });
      }
    }
  }, [isSimulating, state.status, state.round4State, state.players]);

  // Manual Trigger: Blast Danmaku Storm
  const handleTriggerDanmakuStorm = () => {
    sound.playTrollHorn();
    MEME_DANMAKU_COMMENTS.forEach((m, idx) => {
      const bot = VIETNAMESE_STUDENTS[idx % VIETNAMESE_STUDENTS.length];
      setTimeout(() => {
        sync.sendDanmaku(m.emoji, m.text, bot.name, bot.avatarId);
      }, idx * 120);
    });
  };

  // Add 5 more bots
  const handleAddFiveBots = () => {
    const startIdx = Object.keys(state.players || {}).length;
    for (let i = 0; i < 5; i++) {
      const bot = VIETNAMESE_STUDENTS[(startIdx + i) % VIETNAMESE_STUDENTS.length];
      const botId = `bot_${bot.name.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}_${i}`;
      sync.joinRoom(botId, `${bot.name} #${i + 1}`, bot.avatarId, true);
    }
    sound.playCorrectChime();
  };

  return (
    <div className="bg-cyber-dark/95 border-4 border-black rounded-3xl p-5 shadow-[8px_8px_0px_#000] text-white">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b-2 border-slate-700">
        <div className="flex items-center gap-2">
          <span className="p-2 bg-cyber-yellow text-black rounded-xl border-2 border-black shadow-[2px_2px_0px_#000]">
            <FlaskConical className="w-5 h-5" />
          </span>
          <div>
            <h3 className="font-black text-sm uppercase tracking-wider text-white">
              DEV BOT SIMULATOR
            </h3>
            <p className="text-[11px] text-slate-400">
              Mô phỏng 15-20 sinh viên ảo & hành vi tương tác tự động
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Main Switcher */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between bg-slate-900 border-2 border-black rounded-2xl p-3">
          <div className="flex items-center gap-2">
            <Bot className={`w-5 h-5 ${isSimulating ? 'text-cyber-cyan animate-pulse' : 'text-slate-500'}`} />
            <div>
              <div className="text-xs font-black text-white">
                {isSimulating ? 'Đang chạy 15 Bot mô phỏng' : 'Chưa bật mô phỏng'}
              </div>
              <div className="text-[10px] text-slate-400">
                Tự động tham gia phòng, phản hồi vòng đấu & thả Danmaku
              </div>
            </div>
          </div>

          <button
            onClick={onToggleSimulate}
            className={`px-4 py-2 rounded-xl font-black text-xs uppercase border-2 border-black transition cursor-pointer ${
              isSimulating
                ? 'bg-emerald-500 text-black shadow-[3px_3px_0px_#000]'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {isSimulating ? 'TẮT BOT' : 'BẬT BOT NGAY'}
          </button>
        </div>

        {/* Speed Profile Toggle */}
        <div className="bg-slate-900 border-2 border-black rounded-2xl p-3">
          <div className="text-[11px] font-black uppercase text-cyber-yellow mb-2">
            TỐC ĐỘ PHẢN ỨNG CỦA BOT:
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(['FAST', 'REALISTIC', 'CHAOTIC'] as const).map((sp) => (
              <button
                key={sp}
                onClick={() => setSpeedProfile(sp)}
                className={`py-1.5 rounded-lg font-black text-[10px] uppercase border transition ${
                  speedProfile === sp
                    ? 'bg-cyber-yellow text-black border-black shadow-[2px_2px_0px_#000]'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                {sp === 'FAST' ? '⚡ Nhanh' : sp === 'REALISTIC' ? '🎯 Thực tế' : '💥 Hỗn loạn'}
              </button>
            ))}
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={handleTriggerDanmakuStorm}
            className="py-2.5 px-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-black text-xs uppercase border-2 border-black shadow-[3px_3px_0px_#000] flex items-center justify-center gap-1.5 cursor-pointer active:translate-x-0.5 active:translate-y-0.5"
          >
            <Flame className="w-4 h-4 fill-current" />
            <span>Bão Danmaku</span>
          </button>

          <button
            onClick={handleAddFiveBots}
            className="py-2.5 px-3 bg-cyber-cyan hover:bg-emerald-400 text-black rounded-xl font-black text-xs uppercase border-2 border-black shadow-[3px_3px_0px_#000] flex items-center justify-center gap-1.5 cursor-pointer active:translate-x-0.5 active:translate-y-0.5"
          >
            <Users className="w-4 h-4" />
            <span>Thêm +5 Bot</span>
          </button>
        </div>
      </div>
    </div>
  );
}
