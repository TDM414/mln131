'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  GameShowState,
  Round1Phase,
  RoastPrompt,
  FeedComment,
  Player,
} from '../lib/types';
import { getAvatarById } from '../data/memeAvatars';
import { MLN131_ROAST_PROMPTS, VIETNAMESE_ROAST_BANK } from '../data/questions';
import { sound } from '../lib/audioSynthesizer';
import { sync } from '../lib/syncEngine';
import confetti from 'canvas-confetti';
import {
  Flame,
  Trophy,
  Timer,
  ArrowRight,
  RotateCcw,
  Crown,
  Heart,
  MessageSquare,
  Sparkles,
  Home,
  CheckCircle2,
  Users,
  Award,
  FastForward,
  TrendingUp,
  Volume2,
} from 'lucide-react';

interface Round1HostProps {
  state: GameShowState;
  onAdvanceToRound2?: () => void;
  onResetGame?: () => void;
  onReturnToHub?: () => void;
}

export default function Round1Host({
  state,
  onAdvanceToRound2,
  onResetGame,
  onReturnToHub,
}: Round1HostProps) {
  const round1State = state.round1State;
  const currentPromptIndex = round1State?.currentPromptIndex ?? 0;
  const prompts = round1State?.prompts?.length ? round1State.prompts : MLN131_ROAST_PROMPTS;
  const currentPrompt: RoastPrompt = prompts[currentPromptIndex] || MLN131_ROAST_PROMPTS[0];

  // Map legacy phases to Mode 1 standard phases
  const rawPhase = round1State?.phase || 'PROMPT';
  const phase: 'PROMPT' | 'FEED_REACTION' | 'POST_REVEAL' | 'TOP_TRENDING' = useMemo(() => {
    if (rawPhase === 'FEED_REACTION') {
      return 'FEED_REACTION';
    }
    if (rawPhase === 'POST_REVEAL') {
      return 'POST_REVEAL';
    }
    if (
      rawPhase === 'TOP_TRENDING' ||
      rawPhase === 'TRENDING_REVEAL' ||
      rawPhase === 'ROUND_SUMMARY'
    ) {
      return 'TOP_TRENDING';
    }
    return 'PROMPT';
  }, [rawPhase]);

  // Phase Timers
  const [promptTimer, setPromptTimer] = useState<number>(25);
  const [reactionTimer, setReactionTimer] = useState<number>(15);
  const [revealTimer, setRevealTimer] = useState<number>(8);
  const hasAwardedBonusRef = useRef<boolean>(false);
  const awardedPromptsRef = useRef<Set<number>>(new Set());
  const previousReactionsTotalRef = useRef<number>(0);

  // Live submission notice toast
  const [latestPostNotice, setLatestPostNotice] = useState<{
    name: string;
    avatarId: string;
    text: string;
  } | null>(null);
  const prevCommentsCountRef = useRef<number>(0);

  // Extract comments
  const rawComments = round1State?.comments || {};
  const commentsList: FeedComment[] = useMemo(() => {
    const list = Object.values(rawComments);
    if (list.length > 0) return list;

    // Fallback to submissions if comments empty
    const subs = Object.values(round1State?.submissions || {});
    return subs.map((s) => ({
      id: s.id || s.playerId,
      authorId: s.playerId,
      authorName: s.playerName,
      avatarId: s.avatarId,
      text: s.text,
      timestamp: s.timestamp,
      reactions: { heart: 0, tomato: 0, brick: 0 },
      score: 0,
    }));
  }, [rawComments, round1State?.submissions]);

  // Audio & Toast effect on each new comment posted
  useEffect(() => {
    if (commentsList.length > prevCommentsCountRef.current && prevCommentsCountRef.current > 0) {
      sound.playCorrectChime();
      const newest = commentsList[commentsList.length - 1];
      if (newest) {
        setLatestPostNotice({
          name: newest.authorName,
          avatarId: newest.avatarId || 'keyboard_warrior',
          text: newest.text,
        });
        const timer = setTimeout(() => {
          setLatestPostNotice(null);
        }, 4000);
        return () => clearTimeout(timer);
      }
    }
    prevCommentsCountRef.current = commentsList.length;
  }, [commentsList]);

  const playersList = useMemo(() => Object.values(state.players || {}), [state.players]);
  const submittedPlayerIds = useMemo(() => {
    const set = new Set<string>();
    commentsList.forEach((c) => {
      if (c.authorId && (c.promptIndex ?? 0) === currentPromptIndex) {
        set.add(c.authorId);
      }
    });
    return set;
  }, [commentsList, currentPromptIndex]);

  // Current Prompt Comments
  const currentPromptComments = useMemo(() => {
    return commentsList.filter((c) => (c.promptIndex ?? 0) === currentPromptIndex);
  }, [commentsList, currentPromptIndex]);

  // Sorted Comments of THIS prompt by Total Reactions (heart + tomato + brick)
  const sortedCurrentPromptComments = useMemo(() => {
    return [...currentPromptComments].sort((a, b) => {
      const sumA = (a.reactions?.heart || 0) + (a.reactions?.tomato || 0) + (a.reactions?.brick || 0);
      const sumB = (b.reactions?.heart || 0) + (b.reactions?.tomato || 0) + (b.reactions?.brick || 0);
      return sumB - sumA;
    });
  }, [currentPromptComments]);

  // Sorted Comments by Total Reactions (heart + tomato + brick)
  const sortedComments = useMemo(() => {
    return [...commentsList].sort((a, b) => {
      const sumA = (a.reactions?.heart || 0) + (a.reactions?.tomato || 0) + (a.reactions?.brick || 0);
      const sumB = (b.reactions?.heart || 0) + (b.reactions?.tomato || 0) + (b.reactions?.brick || 0);
      return sumB - sumA;
    });
  }, [commentsList]);

  // Audio Pop on New Reactions during FEED_REACTION
  useEffect(() => {
    if (phase !== 'FEED_REACTION') return;

    const currentTotalReactions = commentsList.reduce((acc, c) => {
      return acc + (c.reactions?.heart || 0) + (c.reactions?.tomato || 0) + (c.reactions?.brick || 0);
    }, 0);

    if (currentTotalReactions > previousReactionsTotalRef.current) {
      sound.playSplat();
    }
    previousReactionsTotalRef.current = currentTotalReactions;
  }, [phase, commentsList]);

  // ============================================================
  // PHASE 1: PROMPT COUNTDOWN (30s)
  // ============================================================
  useEffect(() => {
    if (phase !== 'PROMPT') return;

    if (promptTimer <= 0) {
      handleTransitionFromPrompt();
      return;
    }

    const interval = setInterval(() => {
      setPromptTimer((prev) => {
        if (prev <= 10 && prev > 1) {
          sound.playCountdownTick(true);
        } else if (prev > 10 && prev % 5 === 0) {
          sound.playCountdownTick(false);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [phase, promptTimer]);

  // ============================================================
  // PHASE 2: FEED_REACTION COUNTDOWN (15s)
  // ============================================================
  useEffect(() => {
    if (phase !== 'FEED_REACTION') return;

    if (reactionTimer <= 0) {
      handleTransitionToPostReveal();
      return;
    }

    const interval = setInterval(() => {
      setReactionTimer((prev) => {
        if (prev <= 6 && prev > 1) {
          sound.playCountdownTick(true);
        } else if (prev > 6 && prev % 3 === 0) {
          sound.playCountdownTick(false);
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [phase, reactionTimer]);

  // ============================================================
  // PHASE 3: POST_REVEAL SPOTLIGHT & PROMPT BONUS (8s)
  // ============================================================
  useEffect(() => {
    if (phase !== 'POST_REVEAL') return;

    // Play fanfare and confetti
    sound.playTrollHorn();
    setTimeout(() => {
      sound.playVictoryFanfare();
    }, 500);

    confetti({
      particleCount: 120,
      spread: 90,
      origin: { y: 0.55 },
      colors: ['#FFD166', '#06D6A0', '#EF233C', '#7209B7', '#4CC9F0'],
    });

    // Award Prompt Top 3 bonus (+500, +300, +150) and active voters (+50 PTS)
    if (!awardedPromptsRef.current.has(currentPromptIndex) && sortedCurrentPromptComments.length > 0) {
      awardedPromptsRef.current.add(currentPromptIndex);
      const updatedPlayers = { ...state.players };
      let hasChanges = false;

      // 1. Award Top 3 Comments of THIS Prompt
      sortedCurrentPromptComments.slice(0, 3).forEach((comment, idx) => {
        const bonus = idx === 0 ? 500 : idx === 1 ? 300 : 150;
        const authorId = comment.authorId;
        if (bonus > 0 && authorId && updatedPlayers[authorId]) {
          const currentP = { ...updatedPlayers[authorId] };
          currentP.score = (currentP.score || 0) + bonus;
          currentP.roundScores = {
            ...currentP.roundScores,
            ROUND_1: (currentP.roundScores?.ROUND_1 || 0) + bonus,
          };
          updatedPlayers[authorId] = currentP;
          hasChanges = true;
        }
      });

      // 2. Award +50 PTS to players who participated in voting for this prompt
      const promptVotersMap = state.round1State?.promptVoters?.[currentPromptIndex] || {};
      Object.keys(promptVotersMap).forEach((vId) => {
        if (updatedPlayers[vId]) {
          const currentP = { ...updatedPlayers[vId] };
          currentP.score = (currentP.score || 0) + 50;
          currentP.roundScores = {
            ...currentP.roundScores,
            ROUND_1: (currentP.roundScores?.ROUND_1 || 0) + 50,
          };
          updatedPlayers[vId] = currentP;
          hasChanges = true;
        }
      });

      if (hasChanges) {
        sync.hostUpdateState({ players: updatedPlayers });
      }
    }

    // Auto-advance after 8 seconds
    setRevealTimer(8);
    const interval = setInterval(() => {
      setRevealTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleAdvanceFromPostReveal();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [phase, currentPromptIndex, sortedCurrentPromptComments]);

  // ============================================================
  // PHASE 4: TOP_TRENDING CELEBRATION (No duplicate bonus)
  // ============================================================
  useEffect(() => {
    if (phase !== 'TOP_TRENDING') {
      hasAwardedBonusRef.current = false;
      return;
    }

    // Play Victory Fanfare & Troll Airhorn
    sound.playTrollHorn();
    setTimeout(() => {
      sound.playVictoryFanfare();
    }, 600);

    // Confetti celebration
    confetti({
      particleCount: 160,
      spread: 100,
      origin: { y: 0.55 },
      colors: ['#FFD166', '#06D6A0', '#EF233C', '#7209B7', '#4CC9F0'],
    });
  }, [phase]);

  // Transition Helpers
  const handleTransitionFromPrompt = async () => {
    let currentComments = { ...rawComments };
    const thisPromptComments = Object.values(currentComments).filter(
      (c) => (c.promptIndex ?? 0) === currentPromptIndex
    );

    // If fewer than 2 comments submitted for this prompt, seed with realistic mock comments
    if (thisPromptComments.length < 2) {
      const mockAvatars = ['keyboard_warrior', 'genz_slang_queen', 'fact_checker', 'righteous_netizen'];
      const mockNames = ['Tuấn Anh', 'Khánh Linh', 'Minh Quân', 'Hải Yến'];
      const mockRoasts = VIETNAMESE_ROAST_BANK;

      for (let i = 0; i < 4; i++) {
        const mockId = `mock_p${currentPromptIndex}_c${i + 1}`;
        if (!currentComments[mockId]) {
          currentComments[mockId] = {
            id: mockId,
            authorId: `bot_${i + 1}`,
            authorName: mockNames[(i + currentPromptIndex) % mockNames.length],
            avatarId: mockAvatars[(i + currentPromptIndex) % mockAvatars.length],
            text: mockRoasts[(i + currentPromptIndex * 3) % mockRoasts.length],
            timestamp: Date.now(),
            promptIndex: currentPromptIndex,
            reactions: {
              heart: Math.floor(Math.random() * 4) + 1,
              tomato: Math.floor(Math.random() * 2),
              brick: Math.floor(Math.random() * 2),
            },
            score: 200,
          };
        }
      }
    }

    setReactionTimer(15);
    sound.playTrollHorn();
    await sync.hostUpdateState({
      round1State: {
        ...round1State,
        phase: 'FEED_REACTION',
        currentPromptIndex,
        comments: currentComments,
      },
    });
    await sync.setRoundPhase('FEED_REACTION', { currentPromptIndex });
  };

  const handleTransitionToPostReveal = async () => {
    setRevealTimer(8);
    sound.playVictoryFanfare();
    await sync.hostUpdateState({
      round1State: {
        ...round1State,
        phase: 'POST_REVEAL',
        currentPromptIndex,
      },
    });
    await sync.setRoundPhase('POST_REVEAL', { currentPromptIndex });
  };

  const handleAdvanceFromPostReveal = async () => {
    // 3 drama posts: index 0, 1, 2
    if (currentPromptIndex < 2 && currentPromptIndex + 1 < prompts.length) {
      const nextPromptIndex = currentPromptIndex + 1;
      const nextPrompt = prompts[nextPromptIndex];
      sound.playTrollHorn();
      setPromptTimer(25);

      await sync.hostUpdateState({
        round1State: {
          ...round1State,
          phase: 'PROMPT',
          currentPromptIndex: nextPromptIndex,
          prompt: nextPrompt,
        },
      });
      await sync.setRoundPhase('PROMPT', { currentPromptIndex: nextPromptIndex });
    } else {
      await handleTransitionToTrending();
    }
  };

  const handleTransitionToTrending = async () => {
    // Compute final top IDs
    const topIds = sortedComments.slice(0, 5).map((c) => c.id);
    await sync.hostUpdateState({
      round1State: {
        ...round1State,
        phase: 'TOP_TRENDING',
        trendingTopIds: topIds,
      },
    });
    await sync.setRoundPhase('TOP_TRENDING');
  };

  const handleReplayMode1 = async () => {
    sound.playCorrectChime();
    const nextPromptIndex = 0;
    const nextPrompt = prompts[nextPromptIndex];
    setPromptTimer(25);
    setReactionTimer(15);
    setRevealTimer(8);
    hasAwardedBonusRef.current = false;
    awardedPromptsRef.current.clear();

    await sync.hostUpdateState({
      round1State: {
        phase: 'PROMPT',
        currentPromptIndex: nextPromptIndex,
        prompt: nextPrompt,
        comments: {},
        posts: {},
        trendingTopIds: [],
        submissions: {},
        duels: [],
        currentDuelIndex: 0,
      },
    });
    await sync.setRoundPhase('PROMPT');
  };

  const handleAdvanceToRound2Action = () => {
    sound.playVictoryFanfare();
    if (onAdvanceToRound2) {
      onAdvanceToRound2();
    } else {
      sync.hostUpdateState({ status: 'ROUND_2', currentRoundPhase: 'INTRO' });
      sync.setGameStatus('ROUND_2');
      sync.setRoundPhase('INTRO');
    }
  };

  const handleReturnToHubAction = async () => {
    sound.playCorrectChime();
    if (onReturnToHub) {
      onReturnToHub();
    } else {
      await sync.returnToHub();
    }
  };

  // ============================================================
  // RENDER PHASE 1: PROMPT / SUBMITTING (30s per post, 3 posts)
  // ============================================================
  if (phase === 'PROMPT') {
    const totalPlayers = Math.max(1, playersList.length);
    const submittedCount = submittedPlayerIds.size;
    const percentSubmitted = Math.min(100, Math.round((submittedCount / totalPlayers) * 100));

    return (
      <div className="w-full h-full flex flex-col justify-between p-6 md:p-8 max-w-7xl mx-auto select-none relative">
        {/* Floating Live Submission Notice Toast */}
        {latestPostNotice && (
          <div className="fixed top-20 right-8 z-50 animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-none">
            <div className="bg-gradient-to-r from-amber-400 via-rose-500 to-cyber-cyan p-1 rounded-2xl shadow-[6px_6px_0px_#000]">
              <div className="bg-slate-950 px-4 py-2.5 rounded-[12px] flex items-center gap-3 border border-black">
                <div className="w-10 h-10 rounded-xl bg-black border border-white flex items-center justify-center shrink-0">
                  {React.createElement(getAvatarById(latestPostNotice.avatarId).SvgComponent, { size: 32 })}
                </div>
                <div>
                  <div className="text-xs font-black text-cyber-yellow flex items-center gap-1.5">
                    <span>🚀 BÌNH LUẬN MỚI TỪ:</span>
                    <span className="text-white underline">{latestPostNotice.name}</span>
                  </div>
                  <div className="text-xs text-slate-200 font-bold italic line-clamp-1 max-w-xs">
                    &ldquo;{latestPostNotice.text}&rdquo;
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Top Control Bar */}
        <div className="flex items-center justify-between bg-black/60 backdrop-blur border-3 border-black rounded-2xl px-5 py-3 shadow-[4px_4px_0px_#000]">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-cyber-yellow text-black font-black text-xs md:text-sm uppercase tracking-wider rounded-lg border-2 border-black shadow-[2px_2px_0px_#000]">
              MODE 1: TƯỜNG BÌNH LUẬN TRIỆU LIKE
            </span>
            <span className="text-xs md:text-sm font-black text-cyber-cyan bg-slate-900 px-3 py-1 rounded-lg border border-slate-700">
              BÀI PHỐT #{currentPromptIndex + 1} / 3
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Advance to next post or feed */}
            <button
              onClick={handleTransitionFromPrompt}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-400 hover:bg-emerald-300 text-black font-black text-xs md:text-sm rounded-xl border-2 border-black shadow-[3px_3px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition cursor-pointer"
            >
              <FastForward className="w-4 h-4" />
              <span>Chốt & Thả Bão Reaction Bài #{currentPromptIndex + 1} ➔</span>
            </button>

            {/* Extend Time Button */}
            <button
              onClick={() => setPromptTimer((prev) => prev + 15)}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition cursor-pointer"
            >
              +15s
            </button>
          </div>
        </div>

        {/* Center: Authentic Mock Social Media Post (Threads / Confessions / Facebook) */}
        <div className="my-auto max-w-4xl mx-auto w-full">
          <div className="bg-[#141A29] border-4 border-black rounded-3xl p-6 md:p-8 shadow-[8px_8px_0px_#FFD166] relative overflow-hidden">
            {/* Social Post Top Bar: Platform + Author Meta + Actions */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-700/80">
              <div className="flex items-center gap-3">
                {/* Simulated Social Avatar */}
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyber-yellow via-rose-500 to-indigo-500 p-0.5 border-2 border-black shadow-[2px_2px_0px_#000]">
                  <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center text-xl">
                    {currentPrompt.platform === 'confessions' ? '🎓' : currentPrompt.platform === 'threads' ? '🧵' : currentPrompt.platform === 'tiktok' ? '🎵' : '📱'}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base md:text-lg font-black text-white">
                      {currentPrompt.authorName || 'Netizen Ẩn Danh'}
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 font-bold border border-blue-400/30 rounded-full">
                      ✓ {currentPrompt.authorBadge || 'Bài Viết Hot'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 font-medium flex items-center gap-2">
                    <span className="font-mono text-cyber-yellow">{currentPrompt.authorHandle || '@netizen_viet'}</span>
                    <span>•</span>
                    <span>{currentPrompt.timeAgo || '15 phút trước'}</span>
                    <span>•</span>
                    <span>🌐 Công khai</span>
                  </div>
                </div>
              </div>

              {/* Category Pill */}
              <div className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1.5 bg-rose-500 text-white font-black text-xs uppercase tracking-wider rounded-xl border-2 border-black shadow-[2px_2px_0px_#000]">
                <Flame className="w-4 h-4" />
                <span>{currentPrompt.category}</span>
              </div>
            </div>

            {/* Post Hashtags if any */}
            {currentPrompt.postTag && (
              <div className="mb-2 text-xs md:text-sm font-black text-cyber-cyan tracking-wide font-mono">
                {currentPrompt.postTag}
              </div>
            )}

            {/* Prompt Situation / Main Post Body */}
            <h2 className="text-xl md:text-2xl lg:text-3xl font-black text-white leading-relaxed mb-5 tracking-wide">
              {currentPrompt.situation}
            </h2>

            {/* Mock Interaction Bar (Like, Comment, Share) */}
            <div className="flex items-center justify-between py-2.5 px-4 bg-slate-900/80 rounded-2xl border border-slate-800 text-xs md:text-sm text-slate-300 font-bold mb-4">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-rose-400">
                  <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                  {currentPrompt.mockStats?.likes || '2.4K'}
                </span>
                <span className="flex items-center gap-1.5 text-cyber-cyan">
                  <MessageSquare className="w-4 h-4" />
                  {currentPrompt.mockStats?.comments || '480'} bình luận
                </span>
              </div>
              <div className="text-slate-400 text-xs">
                🔄 {currentPrompt.mockStats?.shares || '120'} chia sẻ
              </div>
            </div>

            {/* Pinned Spicy Bait Comment (Bình luận mồi kích nổ tranh luận) */}
            {currentPrompt.baitComment && (
              <div className="p-4 bg-amber-500/10 border-2 border-amber-500/50 rounded-2xl mb-4">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2 py-0.5 bg-amber-400 text-black font-black uppercase rounded-md border border-black text-[10px]">
                      🔥 BÌNH LUẬN NỔI BẬT GÂY BÃO
                    </span>
                    <span className="text-xs font-bold text-slate-200">
                      {currentPrompt.baitComment.author}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {currentPrompt.baitComment.handle}
                    </span>
                  </div>
                  <span className="text-xs text-rose-400 font-bold">
                    ❤️ {currentPrompt.baitComment.likes}
                  </span>
                </div>
                <p className="text-sm md:text-base font-bold text-amber-100 italic pl-2 border-l-3 border-amber-400">
                  &ldquo;{currentPrompt.baitComment.text}&rdquo;
                </p>
                <div className="mt-2 text-[11px] text-amber-300/80 font-bold uppercase tracking-wider">
                  👉 Nhiệm vụ của cả lớp: Bắn bình luận phản pháo lại ý kiến trên hoặc đưa ra góc nhìn sắc bén nhất!
                </div>
              </div>
            )}

            {/* Curriculum connection / MLN131 Context */}
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl flex items-start gap-2.5">
              <span className="text-lg">💡</span>
              <p className="text-xs md:text-sm text-slate-300 font-medium leading-relaxed">
                <span className="text-cyber-yellow font-black">Góc nhìn MLN131:</span> {currentPrompt.context}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Master Timer & Live Submission Tally */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center bg-[#0F1420] border-3 border-black rounded-3xl p-4 md:p-5 shadow-[6px_6px_0px_#000]">
          {/* Master Countdown Clock */}
          <div className="flex items-center gap-4 justify-center md:justify-start">
            <div
              className={`w-16 h-16 rounded-2xl border-3 border-black flex items-center justify-center font-mono font-black text-3xl shadow-[3px_3px_0px_#000] ${
                promptTimer <= 10
                  ? 'bg-rose-500 text-white animate-pulse'
                  : 'bg-cyber-yellow text-black'
              }`}
            >
              {promptTimer}s
            </div>
            <div>
              <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Thời Gian Soạn Bình Luận</div>
              <div className="text-sm font-black text-white">30 Giây Mỗi Bài Phốt 🚀</div>
            </div>
          </div>

          {/* Live Submission Counter */}
          <div className="flex flex-col items-center justify-center">
            <div className="flex items-center gap-2 mb-1.5">
              <Users className="w-5 h-5 text-cyber-cyan" />
              <span className="text-sm md:text-base font-black text-white">
                ĐÃ CÓ <span className="text-cyber-cyan text-xl">{submittedCount}</span> / {totalPlayers} BẠN NỘP BÀI NÀY
              </span>
            </div>
            {/* Progress bar */}
            <div className="w-full max-w-md h-3.5 bg-slate-800 rounded-full border-2 border-black overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyber-yellow to-cyber-cyan transition-all duration-300"
                style={{ width: `${percentSubmitted}%` }}
              />
            </div>
          </div>

          {/* Active Player Avatars preview */}
          <div className="flex items-center justify-center md:justify-end gap-1.5 overflow-x-auto py-1">
            {playersList.slice(0, 8).map((p) => {
              const isSubmitted = submittedPlayerIds.has(p.id);
              const avatar = getAvatarById(p.avatarId);
              const SvgComp = avatar.SvgComponent;
              return (
                <div
                  key={p.id}
                  className={`relative w-10 h-10 rounded-xl border-2 border-black flex items-center justify-center transition-all ${
                    isSubmitted
                      ? 'bg-emerald-500 shadow-[2px_2px_0px_#000]'
                      : 'bg-slate-800 opacity-60'
                  }`}
                  title={`${p.name}: ${isSubmitted ? 'Đã gửi' : 'Đang gõ...'}`}
                >
                  <SvgComp size={30} />
                  {isSubmitted && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 border border-black rounded-full flex items-center justify-center text-[10px]">
                      ✓
                    </div>
                  )}
                </div>
              );
            })}
            {playersList.length > 8 && (
              <span className="text-xs font-bold text-slate-400">+{playersList.length - 8}</span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER PHASE 2: FEED_REACTION WALL (30s)
  // ============================================================
  if (phase === 'FEED_REACTION') {
    return (
      <div className="w-full h-full flex flex-col justify-between p-4 md:p-6 max-w-7xl mx-auto select-none overflow-hidden">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between bg-black/70 backdrop-blur border-3 border-black rounded-2xl px-5 py-3 shadow-[4px_4px_0px_#000] shrink-0">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-rose-500 text-white font-black text-xs md:text-sm uppercase tracking-wider rounded-lg border-2 border-black shadow-[2px_2px_0px_#000] flex items-center gap-1.5">
              <Flame className="w-4 h-4" />
              <span>BÃO TƯƠNG TÁC: LƯỚT FEED VÀ THẢ REACTION</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Reaction Timer */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-bold uppercase hidden md:inline">Thời gian còn lại:</span>
              <div
                className={`px-3 py-1.5 rounded-xl border-2 border-black font-mono font-black text-lg shadow-[2px_2px_0px_#000] ${
                  reactionTimer <= 8
                    ? 'bg-rose-500 text-white animate-pulse'
                    : 'bg-cyber-yellow text-black'
                }`}
              >
                {reactionTimer}s
              </div>
            </div>

            {/* Advance to Post Reveal */}
            <button
              onClick={handleTransitionToPostReveal}
              className="flex items-center gap-1.5 px-4 py-2 bg-cyber-yellow hover:bg-amber-300 text-black font-black text-xs md:text-sm rounded-xl border-2 border-black shadow-[3px_3px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition cursor-pointer"
            >
              <Trophy className="w-4 h-4" />
              <span>Chốt Vote & Xem Top Bài #{currentPromptIndex + 1} ➔</span>
            </button>
          </div>
        </div>

        {/* Middle: Live Newsfeed Wall (Grid / Masonry of student comments for THIS prompt) */}
        <div className="flex-1 overflow-y-auto my-3 pr-2 scrollbar-thin scrollbar-thumb-slate-700">
          {currentPromptComments.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <span className="text-6xl mb-3 animate-bounce">📱</span>
              <h3 className="text-2xl font-black text-white mb-2">Đang tải Tường Bình Luận Bài #{currentPromptIndex + 1}...</h3>
              <p className="text-slate-400 text-sm">Hãy dùng điện thoại để bắn bình luận đầu tiên lên màn hình!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentPromptComments.map((comment, index) => {
                const avatar = getAvatarById(comment.avatarId || 'keyboard_warrior');
                const SvgComp = avatar.SvgComponent;
                const totalReactions =
                  (comment.reactions?.heart || 0) +
                  (comment.reactions?.tomato || 0) +
                  (comment.reactions?.brick || 0);

                return (
                  <div
                    key={comment.id || index}
                    className="bg-[#141A29] border-3 border-black rounded-2xl p-4 shadow-[4px_4px_0px_#000] hover:border-cyber-yellow transition flex flex-col justify-between relative group"
                  >
                    {/* Post Author Info */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-black border-2 border-black flex items-center justify-center shrink-0">
                          <SvgComp size={36} />
                        </div>
                        <div>
                          <div className="font-black text-sm text-white truncate max-w-[140px]">
                            {comment.authorName}
                          </div>
                          <div className="text-[10px] text-cyber-yellow font-bold truncate">
                            {avatar.name}
                          </div>
                        </div>
                      </div>

                      {/* Total reaction badge */}
                      <div className="flex items-center gap-1 px-2.5 py-1 bg-black/60 rounded-lg border border-slate-700 text-xs font-black text-cyber-cyan">
                        <TrendingUp className="w-3.5 h-3.5" />
                        <span>{totalReactions}</span>
                      </div>
                    </div>

                    {/* Comment text */}
                    <p className="text-base md:text-lg font-black text-white leading-snug mb-4 flex-1">
                      &ldquo;{comment.text}&rdquo;
                    </p>

                    {/* Realtime Reactions Tally Bar */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t-2 border-slate-800 text-center">
                      <div className="flex items-center justify-center gap-1.5 py-1.5 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300 font-black text-xs">
                        <span>❤️</span>
                        <span>{comment.reactions?.heart || 0}</span>
                      </div>

                      <div className="flex items-center justify-center gap-1.5 py-1.5 bg-amber-500/20 border border-amber-500/40 rounded-xl text-amber-300 font-black text-xs">
                        <span>🍅</span>
                        <span>{comment.reactions?.tomato || 0}</span>
                      </div>

                      <div className="flex items-center justify-center gap-1.5 py-1.5 bg-cyan-500/20 border border-cyan-500/40 rounded-xl text-cyan-300 font-black text-xs">
                        <span>🧱</span>
                        <span>{comment.reactions?.brick || 0}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom prompt reminder banner */}
        <div className="bg-black/60 border-2 border-slate-800 rounded-xl px-4 py-2 flex items-center justify-between text-xs text-slate-300 shrink-0">
          <div className="truncate max-w-xl">
            <span className="text-cyber-yellow font-bold mr-1">Chủ đề:</span>
            {currentPrompt.situation}
          </div>
          <div className="font-bold text-cyber-cyan">
            📱 Mở điện thoại, lướt và thả ❤️/🍅/🧱 cho bài viết tâm đắc!
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER PHASE 3: POST_REVEAL SPOTLIGHT (Top 3 Comments of Current Post)
  // ============================================================
  if (phase === 'POST_REVEAL') {
    const top3 = sortedCurrentPromptComments.slice(0, 3);
    const isLastPost = currentPromptIndex >= 2;

    return (
      <div className="w-full h-full flex flex-col justify-between p-4 md:p-6 max-w-7xl mx-auto select-none overflow-hidden">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between bg-black/70 backdrop-blur border-3 border-black rounded-2xl px-5 py-3 shadow-[4px_4px_0px_#000] shrink-0">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-amber-400 text-black font-black text-xs md:text-sm uppercase tracking-wider rounded-lg border-2 border-black shadow-[2px_2px_0px_#000] flex items-center gap-1.5">
              <Crown className="w-4 h-4" />
              <span>VINH DANH TOP BÌNH LUẬN: BÀI #{currentPromptIndex + 1}/3</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Auto countdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-bold uppercase hidden md:inline">Tự chuyển sau:</span>
              <div className="px-3 py-1.5 rounded-xl border-2 border-black font-mono font-black text-lg bg-cyber-yellow text-black shadow-[2px_2px_0px_#000]">
                {revealTimer}s
              </div>
            </div>

            {/* Manual Advance Button */}
            <button
              onClick={handleAdvanceFromPostReveal}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-black font-black text-sm rounded-xl border-2 border-black shadow-[3px_3px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition cursor-pointer"
            >
              <span>{isLastPost ? '🏆 Xem Tổng Kết Vòng 1 ➔' : `Sang Bài Phốt #${currentPromptIndex + 2} ➔`}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Situation reminder */}
        <div className="bg-slate-900/90 border-2 border-slate-700 rounded-xl px-4 py-2 text-center text-xs md:text-sm text-slate-300 font-bold my-2 shrink-0">
          <span className="text-cyber-yellow font-black">Chủ đề: </span>
          &ldquo;{currentPrompt.situation}&rdquo;
        </div>

        {/* Top 3 Spotlight Cards */}
        <div className="flex-1 my-auto flex items-center justify-center">
          {top3.length === 0 ? (
            <div className="text-center p-8 bg-slate-900/60 rounded-2xl border-2 border-slate-700">
              <span className="text-5xl mb-2 block">🤷</span>
              <h3 className="text-xl font-black text-white">Chưa có bình luận nào cho bài này!</h3>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full max-w-5xl">
              {top3.map((comment, idx) => {
                const avatar = getAvatarById(comment.avatarId || 'keyboard_warrior');
                const SvgComp = avatar.SvgComponent;
                const isTop1 = idx === 0;
                const isTop2 = idx === 1;
                const isTop3 = idx === 2;

                const borderCol = isTop1
                  ? 'border-amber-400 shadow-[6px_6px_0px_#FFD166]'
                  : isTop2
                  ? 'border-slate-300 shadow-[4px_4px_0px_#94A3B8]'
                  : 'border-amber-700 shadow-[4px_4px_0px_#C2410C]';
                const medalBg = isTop1 ? 'bg-amber-400 text-black' : isTop2 ? 'bg-slate-300 text-black' : 'bg-amber-700 text-white';
                const bonusPts = isTop1 ? '+500' : isTop2 ? '+300' : '+150';

                return (
                  <div
                    key={comment.id || idx}
                    className={`bg-[#141A29] border-3 rounded-3xl p-5 flex flex-col justify-between transition-all transform ${borderCol} ${
                      isTop1 ? 'md:-translate-y-3 scale-103' : ''
                    }`}
                  >
                    <div>
                      {/* Rank Medal */}
                      <div className="flex items-center justify-between mb-3">
                        <span className={`px-3 py-1 font-black text-xs uppercase rounded-xl border-2 border-black flex items-center gap-1.5 ${medalBg}`}>
                          {isTop1 ? <Crown className="w-4 h-4" /> : <Award className="w-4 h-4" />}
                          <span>HẠNG #{idx + 1}</span>
                        </span>
                        <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-mono font-black text-xs rounded-lg">
                          {bonusPts} PTS
                        </span>
                      </div>

                      {/* Author */}
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-2xl bg-black border-2 border-black flex items-center justify-center shrink-0">
                          <SvgComp size={40} />
                        </div>
                        <div className="truncate">
                          <div className="font-black text-base text-white truncate">
                            {comment.authorName}
                          </div>
                          <div className="text-xs text-cyber-yellow font-bold truncate">
                            {avatar.name}
                          </div>
                        </div>
                      </div>

                      {/* Comment quote */}
                      <p className="text-base md:text-lg font-black text-white italic leading-snug mb-4">
                        &ldquo;{comment.text}&rdquo;
                      </p>
                    </div>

                    {/* Reactions received */}
                    <div className="grid grid-cols-3 gap-2 pt-3 border-t-2 border-slate-800 text-center">
                      <div className="py-1 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300 font-black text-xs">
                        ❤️ {comment.reactions?.heart || 0}
                      </div>
                      <div className="py-1 bg-amber-500/20 border border-amber-500/40 rounded-xl text-amber-300 font-black text-xs">
                        🍅 {comment.reactions?.tomato || 0}
                      </div>
                      <div className="py-1 bg-cyan-500/20 border border-cyan-500/40 rounded-xl text-cyan-300 font-black text-xs">
                        🧱 {comment.reactions?.brick || 0}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom footer */}
        <div className="text-center text-xs text-slate-400 font-bold shrink-0">
          💡 Điểm thưởng Top cmt và tương tác đã được cộng trực tiếp vào tổng điểm của người chơi
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER PHASE 4: TOP TRENDING REVEAL & PODIUM
  // ============================================================
  const top1 = sortedComments[0];
  const top2 = sortedComments[1];
  const top3 = sortedComments[2];
  const runnerUps = sortedComments.slice(3, 5);

  return (
    <div className="w-full min-h-full flex flex-col justify-between p-6 md:p-8 max-w-7xl mx-auto select-none overflow-y-auto pb-32">
      {/* Top Header */}
      <div className="text-center pt-2">
        <div className="inline-flex items-center gap-2 px-4 py-1 bg-cyber-yellow text-black font-black text-xs md:text-sm uppercase rounded-xl border-2 border-black shadow-[3px_3px_0px_#000] mb-2">
          <Crown className="w-4 h-4 text-black" />
          <span>BẢNG XẾP HẠNG TOP TRENDING MẠNG XÃ HỘI</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyber-yellow via-amber-300 to-cyber-cyan tracking-wide">
          BÌNH LUẬN TRIỆU LIKE XUẤT SẮC NHẤT
        </h1>
      </div>

      {/* Podium Grid (Top 1 in Center, Top 2 Left, Top 3 Right) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-auto items-end max-w-5xl mx-auto w-full">
        {/* TOP 2 (SILVER) */}
        {top2 && (
          <div className="order-2 md:order-1 bg-slate-900 border-4 border-black rounded-3xl p-5 shadow-[6px_6px_0px_#000] flex flex-col justify-between h-[340px] relative">
            <div className="absolute -top-4 left-6 px-3 py-1 bg-slate-200 text-black font-black text-xs uppercase rounded-lg border-2 border-black shadow-[2px_2px_0px_#000]">
              🥈 Á QUÂN TOP 2 TRENDING
            </div>

            <div className="flex items-center gap-3 mt-3">
              <div className="w-12 h-12 rounded-xl bg-black border-2 border-black flex items-center justify-center shrink-0">
                {React.createElement(getAvatarById(top2.avatarId || 'keyboard_warrior').SvgComponent, { size: 44 })}
              </div>
              <div>
                <div className="font-black text-base text-white truncate max-w-[170px]">{top2.authorName}</div>
                <div className="text-xs text-slate-400">{getAvatarById(top2.avatarId || 'keyboard_warrior').name}</div>
              </div>
            </div>

            <p className="text-base font-black text-slate-100 my-auto leading-snug line-clamp-4">
              &ldquo;{top2.text}&rdquo;
            </p>

            <div className="flex items-center justify-between pt-3 border-t-2 border-slate-800 text-xs font-bold text-slate-300">
              <span>❤️ {top2.reactions?.heart || 0}  🍅 {top2.reactions?.tomato || 0}  🧱 {top2.reactions?.brick || 0}</span>
              <span className="text-cyber-cyan font-black text-sm">
                {(top2.reactions?.heart || 0) + (top2.reactions?.tomato || 0) + (top2.reactions?.brick || 0)} Likes
              </span>
            </div>
          </div>
        )}

        {/* TOP 1 (GOLD SPOTLIGHT) */}
        {top1 ? (
          <div className="order-1 md:order-2 bg-gradient-to-b from-amber-950/80 to-[#141A29] border-4 border-amber-400 rounded-3xl p-6 shadow-[8px_8px_0px_#FFD166] flex flex-col justify-between h-[410px] relative scale-105 z-10 animate-in zoom-in-95 duration-300">
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-cyber-yellow text-black font-black text-sm uppercase rounded-xl border-3 border-black shadow-[3px_3px_0px_#000] flex items-center gap-1.5 whitespace-nowrap">
              <Crown className="w-5 h-5" />
              <span>🥇 QUÁN QUÂN TOP 1 TRENDING</span>
            </div>

            <div className="flex items-center gap-3 mt-4">
              <div className="w-16 h-16 rounded-2xl bg-black border-3 border-amber-400 flex items-center justify-center shrink-0 shadow-[2px_2px_0px_#FFD166]">
                {React.createElement(getAvatarById(top1.avatarId || 'keyboard_warrior').SvgComponent, { size: 58 })}
              </div>
              <div>
                <div className="font-black text-xl text-white truncate max-w-[200px]">{top1.authorName}</div>
                <div className="text-xs text-cyber-yellow font-black">{getAvatarById(top1.avatarId || 'keyboard_warrior').name}</div>
              </div>
            </div>

            <p className="text-lg md:text-xl font-black text-amber-100 my-auto leading-relaxed">
              &ldquo;{top1.text}&rdquo;
            </p>

            <div className="flex items-center justify-between pt-3 border-t-2 border-amber-500/40 text-sm font-bold text-amber-200">
              <div className="flex items-center gap-2">
                <span>❤️ {top1.reactions?.heart || 0}</span>
                <span>🍅 {top1.reactions?.tomato || 0}</span>
                <span>🧱 {top1.reactions?.brick || 0}</span>
              </div>
              <span className="text-cyber-yellow font-black text-lg">
                {(top1.reactions?.heart || 0) + (top1.reactions?.tomato || 0) + (top1.reactions?.brick || 0)} Reactions
              </span>
            </div>
          </div>
        ) : (
          <div className="order-1 md:order-2 text-center text-slate-400 font-bold p-8">
            Chưa có bình luận nào để trao giải!
          </div>
        )}

        {/* TOP 3 (BRONZE) */}
        {top3 && (
          <div className="order-3 md:order-3 bg-slate-900 border-4 border-black rounded-3xl p-5 shadow-[6px_6px_0px_#000] flex flex-col justify-between h-[310px] relative">
            <div className="absolute -top-4 left-6 px-3 py-1 bg-amber-700 text-white font-black text-xs uppercase rounded-lg border-2 border-black shadow-[2px_2px_0px_#000]">
              🥉 QUÝ QUÂN TOP 3 TRENDING
            </div>

            <div className="flex items-center gap-3 mt-3">
              <div className="w-12 h-12 rounded-xl bg-black border-2 border-black flex items-center justify-center shrink-0">
                {React.createElement(getAvatarById(top3.avatarId || 'keyboard_warrior').SvgComponent, { size: 44 })}
              </div>
              <div>
                <div className="font-black text-base text-white truncate max-w-[170px]">{top3.authorName}</div>
                <div className="text-xs text-slate-400">{getAvatarById(top3.avatarId || 'keyboard_warrior').name}</div>
              </div>
            </div>

            <p className="text-base font-black text-slate-100 my-auto leading-snug line-clamp-3">
              &ldquo;{top3.text}&rdquo;
            </p>

            <div className="flex items-center justify-between pt-3 border-t-2 border-slate-800 text-xs font-bold text-slate-300">
              <span>❤️ {top3.reactions?.heart || 0}  🍅 {top3.reactions?.tomato || 0}  🧱 {top3.reactions?.brick || 0}</span>
              <span className="text-cyber-cyan font-black text-sm">
                {(top3.reactions?.heart || 0) + (top3.reactions?.tomato || 0) + (top3.reactions?.brick || 0)} Likes
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Honorable Mentions (#4 and #5) if available */}
      {runnerUps.length > 0 && (
        <div className="flex items-center justify-center gap-4 my-2">
          {runnerUps.map((r, i) => (
            <div
              key={r.id}
              className="bg-black/60 border border-slate-700 rounded-xl px-4 py-1.5 flex items-center gap-2 text-xs text-slate-300 max-w-sm"
            >
              <span className="font-black text-cyber-yellow">#{i + 4}</span>
              <span className="font-bold text-white truncate max-w-[100px]">{r.authorName}:</span>
              <span className="truncate max-w-[180px] italic">&ldquo;{r.text}&rdquo;</span>
            </div>
          ))}
        </div>
      )}

      {/* 4. CLASSROOM ALL PLAYERS LEADERBOARD BAR */}
      <div className="bg-slate-900 border-3 border-black rounded-2xl p-4 shadow-[4px_4px_0px_#000] my-4 max-w-5xl mx-auto w-full">
        <div className="flex items-center justify-between pb-2 mb-3 border-b-2 border-slate-800">
          <div className="flex items-center gap-2 text-xs font-black uppercase text-cyber-yellow tracking-wider">
            <Users className="w-4 h-4" />
            <span>BẢNG XẾP HẠNG TẤT CẢ CHIẾN SĨ TRONG PHÒNG ({Object.keys(state.players || {}).length} người)</span>
          </div>
          <span className="text-[11px] font-bold text-slate-400">
            Điểm tương tác & điểm xếp hạng Vòng 1
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2.5 max-h-48 overflow-y-auto pr-1">
          {Object.values(state.players || {})
            .sort((a, b) => (b.score || 0) - (a.score || 0))
            .map((p, idx) => {
              const isHuman = !p.isBot;
              return (
                <div
                  key={p.id}
                  className={`p-2.5 rounded-xl border-2 flex items-center justify-between text-xs transition ${
                    isHuman
                      ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border-cyber-yellow text-white shadow-[2px_2px_0px_#FFD166]'
                      : 'bg-slate-800 border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className={`w-5 h-5 rounded-md flex items-center justify-center font-black text-[10px] shrink-0 ${
                        idx === 0
                          ? 'bg-cyber-yellow text-black'
                          : idx === 1
                          ? 'bg-slate-200 text-black'
                          : idx === 2
                          ? 'bg-amber-600 text-white'
                          : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <div className="truncate">
                      <div className="font-black text-xs text-white truncate flex items-center gap-1">
                        <span>{p.name}</span>
                        {isHuman && <span className="text-[10px] text-cyber-yellow font-black">⭐</span>}
                      </div>
                    </div>
                  </div>
                  <span className="font-mono font-black text-cyber-yellow text-xs shrink-0">
                    +{(p.score || 0).toLocaleString()}đ
                  </span>
                </div>
              );
            })}
        </div>
      </div>

      {/* Sticky Bottom Host Action Bar - ALWAYS VISIBLE AT BOTTOM */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#0F1420]/95 backdrop-blur-lg border-t-4 border-black p-4 shadow-[0_-6px_20px_rgba(0,0,0,0.7)]">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="text-xs text-slate-300 font-bold flex items-center gap-2">
            <span className="p-1.5 bg-cyber-yellow text-black font-black rounded-lg">⭐ VÒNG 1</span>
            <span>⭐ Đã cộng điểm thưởng Top ở từng bài! (Màn hình tổng kết chỉ vinh danh cmt viral nhất, không cộng đúp điểm)</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Replay Mode 1 */}
            <button
              onClick={handleReplayMode1}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-black text-sm rounded-xl border-2 border-black shadow-[3px_3px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-cyber-yellow" />
              <span>Chơi Lại Mode 1</span>
            </button>

            {/* Advance to Round 2 */}
            <button
              onClick={handleAdvanceToRound2Action}
              className="flex items-center gap-2 px-6 py-3 bg-cyber-yellow hover:bg-amber-300 text-black font-black text-base uppercase rounded-xl border-3 border-black shadow-[4px_4px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition cursor-pointer scale-105"
            >
              <span>TIẾP TỤC SANG MODE 2: BÓC PHỐT 10S</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            {/* Return to Hub */}
            <button
              onClick={handleReturnToHubAction}
              className="flex items-center gap-2 px-4 py-2.5 bg-rose-500 hover:bg-rose-400 text-white font-black text-sm rounded-xl border-2 border-black shadow-[3px_3px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>Sảnh Hub</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
