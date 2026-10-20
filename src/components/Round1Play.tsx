'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { GameShowState, FeedComment } from '../lib/types';
import { ROAST_QUICK_CHIPS, sanitizeRoastText, MLN131_ROAST_PROMPTS } from '../data/questions';
import { getAvatarById } from '../data/memeAvatars';
import { sync } from '../lib/syncEngine';
import { sound } from '../lib/audioSynthesizer';
import {
  Send,
  Sparkles,
  CheckCircle2,
  Heart,
  Flame,
  Crown,
  Trophy,
  TrendingUp,
  Award,
  Zap,
} from 'lucide-react';

interface Round1PlayProps {
  state: Partial<GameShowState>;
  playerId: string;
  playerName: string;
  avatarId: string;
}

const DANMAKU_QUICK_EMOJIS = ['🔥', '🍅', '🧱', '❤️', '🤡', '🚀'];

export default function Round1Play({
  state,
  playerId,
  playerName,
  avatarId,
}: Round1PlayProps) {
  const round1State = state.round1State;
  const currentPromptIndex = round1State?.currentPromptIndex ?? 0;
  const prompts = round1State?.prompts?.length ? round1State.prompts : MLN131_ROAST_PROMPTS;
  const currentPrompt = prompts[currentPromptIndex] || MLN131_ROAST_PROMPTS[0];

  // Map phase
  const rawPhase = round1State?.phase || 'PROMPT';
  const phase: 'PROMPT' | 'FEED_REACTION' | 'TOP_TRENDING' = useMemo(() => {
    if (rawPhase === 'FEED_REACTION') {
      return 'FEED_REACTION';
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

  // Form State
  const [commentText, setCommentText] = useState<string>('');
  const [hasSubmitted, setHasSubmitted] = useState<boolean>(false);
  const [lastDanmakuTime, setLastDanmakuTime] = useState<number>(0);

  // Track player's reactions on posts { [postId]: 'heart' | 'tomato' | 'brick' }
  const [myReactions, setMyReactions] = useState<Record<string, 'heart' | 'tomato' | 'brick'>>({});
  const lastReactionTimeRef = useRef<number>(0);

  // Extract all comments from round1State
  const rawComments = round1State?.comments || {};
  const commentsList: FeedComment[] = useMemo(() => {
    const list = Object.values(rawComments);
    if (list.length > 0) return list;

    // Fallback to legacy submissions
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

  // Check if player has already submitted for THIS specific prompt
  const myExistingComment = useMemo(() => {
    return commentsList.find(
      (c) => c.authorId === playerId && (c.promptIndex ?? 0) === currentPromptIndex
    );
  }, [commentsList, playerId, currentPromptIndex]);

  // Strict local 30s countdown for current prompt
  const [promptTimeLeft, setPromptTimeLeft] = useState<number>(30);

  useEffect(() => {
    if (phase !== 'PROMPT') return;
    setPromptTimeLeft(30);
    const interval = setInterval(() => {
      setPromptTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [phase, currentPromptIndex]);

  useEffect(() => {
    if (myExistingComment) {
      setHasSubmitted(true);
      setCommentText(myExistingComment.text);
    } else {
      setHasSubmitted(false);
      setCommentText('');
    }
  }, [myExistingComment, currentPromptIndex]);

  // Quick Chip Insertion
  const handleChipClick = (chip: string) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(20);
    }
    setCommentText((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) return chip;
      if (trimmed.length + chip.length + 1 <= 100) {
        return `${trimmed} ${chip}`;
      }
      return prev;
    });
  };

  // 1-Tap Starter Template Insertion
  const handleStarterClick = (template: string) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(25);
    }
    setCommentText((prev) => {
      const trimmed = prev.trim();
      if (!trimmed) return `${template} `;
      if (trimmed.length + template.length + 1 <= 100) {
        return `${template} ${trimmed}`;
      }
      return template.slice(0, 100);
    });
  };

  // Submit Comment
  const handleSubmitComment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const sanitized = sanitizeRoastText(commentText);
    if (!sanitized) return;

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(45);
    }
    sound.playCorrectChime();

    await sync.submitFeedComment(sanitized, playerId, playerName, avatarId, currentPromptIndex);
    setHasSubmitted(true);
  };

  // React to a Feed Post
  const handleReactPost = async (
    postId: string,
    reactionType: 'heart' | 'tomato' | 'brick'
  ) => {
    const now = Date.now();
    // 100ms debounce
    if (now - lastReactionTimeRef.current < 100) return;
    lastReactionTimeRef.current = now;

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(25);
    }

    if (reactionType === 'tomato' || reactionType === 'brick') {
      sound.playSplat();
    } else {
      sound.playCountdownTick(false);
    }

    // Optimistic UI state
    setMyReactions((prev) => ({
      ...prev,
      [postId]: reactionType,
    }));

    await sync.reactFeedPost(postId, reactionType, playerId);
  };

  // Quick Danmaku Reaction
  const handleSendDanmaku = (emoji: string) => {
    const now = Date.now();
    if (now - lastDanmakuTime < 300) return;
    setLastDanmakuTime(now);

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(20);
    }
    sync.sendDanmaku(emoji, '', playerName, avatarId);
  };

  // Compute player's score and standing in Phase 3
  const sortedComments = useMemo(() => {
    return [...commentsList].sort((a, b) => {
      const sumA = (a.reactions?.heart || 0) + (a.reactions?.tomato || 0) + (a.reactions?.brick || 0);
      const sumB = (b.reactions?.heart || 0) + (b.reactions?.tomato || 0) + (b.reactions?.brick || 0);
      return sumB - sumA;
    });
  }, [commentsList]);

  const myRankIndex = sortedComments.findIndex((c) => c.authorId === playerId);
  const myTotalReactions = myExistingComment
    ? (myExistingComment.reactions?.heart || 0) +
      (myExistingComment.reactions?.tomato || 0) +
      (myExistingComment.reactions?.brick || 0)
    : 0;

  const myPlacementBonus =
    myRankIndex === 0 ? 3000 : myRankIndex === 1 ? 2000 : myRankIndex === 2 ? 1500 : 0;
  const myReactionBonus = myTotalReactions * 100;
  const myTotalRoundScore = myPlacementBonus + myReactionBonus;

  // ============================================================
  // PHASE 1: SUBMITTING / PROMPT VIEW
  // ============================================================
  if (phase === 'PROMPT') {
    return (
      <div className="w-full h-full flex flex-col justify-between p-3 select-none overflow-y-auto">
        {/* Authentic Mock Social Media Post Card */}
        <div className="bg-[#141A29] border-3 border-black rounded-2xl p-3.5 shadow-[4px_4px_0px_#000] shrink-0 mb-3">
          {/* Post Header: Platform, Author, Timestamp */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-700/60">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyber-yellow via-rose-500 to-indigo-500 p-0.5 border border-black shadow-[1px_1px_0px_#000]">
                <div className="w-full h-full bg-slate-900 rounded-[9px] flex items-center justify-center text-sm">
                  {currentPrompt.platform === 'confessions' ? '🎓' : currentPrompt.platform === 'threads' ? '🧵' : currentPrompt.platform === 'tiktok' ? '🎵' : '📱'}
                </div>
              </div>
              <div className="leading-tight">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-white">
                    {currentPrompt.authorName || 'Netizen'}
                  </span>
                  <span className="text-[9px] px-1.5 py-0.2 bg-blue-500/20 text-blue-400 font-bold border border-blue-400/30 rounded-full">
                    ✓ {currentPrompt.authorBadge || 'Hot'}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 flex items-center gap-1">
                  <span className="font-mono text-cyber-yellow">{currentPrompt.authorHandle || '@netizen'}</span>
                  <span>•</span>
                  <span>{currentPrompt.timeAgo || 'Vừa xong'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[10px] px-2 py-0.5 bg-cyber-yellow text-black font-black uppercase rounded-lg border border-black">
                BÀI #{currentPromptIndex + 1}/3
              </span>
              <span className={`text-[10px] px-2 py-0.5 font-mono font-black rounded-lg border border-black ${
                promptTimeLeft <= 8 ? 'bg-rose-500 text-white animate-pulse' : 'bg-slate-800 text-cyber-yellow'
              }`}>
                ⏱️ {promptTimeLeft}s
              </span>
            </div>
          </div>

          {/* Post Situation */}
          <h3 className="text-sm font-black text-white leading-snug mb-2.5">
            {currentPrompt.situation}
          </h3>

          {/* Spicy Pinned Bait Comment */}
          {currentPrompt.baitComment && (
            <div className="p-2.5 bg-amber-500/15 border-2 border-amber-500/50 rounded-xl mb-1.5">
              <div className="flex items-center justify-between text-[10px] text-amber-300 font-bold mb-1">
                <span className="flex items-center gap-1">
                  🔥 <span className="font-black">Bình luận mồi:</span> {currentPrompt.baitComment.author}
                </span>
                <span className="text-rose-400">❤️ {currentPrompt.baitComment.likes}</span>
              </div>
              <p className="text-xs font-bold text-amber-100 italic pl-1.5 border-l-2 border-amber-400">
                &ldquo;{currentPrompt.baitComment.text}&rdquo;
              </p>
            </div>
          )}

          <div className="text-[10px] text-slate-400 italic pt-1 flex items-center gap-1">
            <span>💡</span> <span>Góc nhìn MLN131: {currentPrompt.context}</span>
          </div>
        </div>

        {/* Input Form or Success State */}
        {!hasSubmitted ? (
          <div className="flex-1 flex flex-col justify-between">
            <form onSubmit={handleSubmitComment} className="flex-1 flex flex-col justify-between">
              <div>
                {/* 1-Tap Sentence Starters (Mở đầu câu tự nhiên) */}
                {currentPrompt.starterTemplates && currentPrompt.starterTemplates.length > 0 && (
                  <div className="mb-2">
                    <div className="text-[10px] text-cyber-yellow font-black uppercase mb-1 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Gợi ý mở đầu câu tự nhiên (Chạm 1-tap để gõ):
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {currentPrompt.starterTemplates.map((template, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleStarterClick(template)}
                          className="px-2.5 py-1 bg-amber-400/20 hover:bg-amber-400/30 active:scale-95 border-2 border-amber-400/60 rounded-xl text-xs font-black text-amber-200 transition shadow-[2px_2px_0px_#000]"
                        >
                          {template}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Character Counter & Text Area */}
                <div className="relative mb-2">
                  <textarea
                    rows={3}
                    maxLength={100}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Gõ bình luận phản pháo hoặc góc nhìn của bạn (tối đa 100 chữ)..."
                    className="w-full bg-slate-900 border-3 border-black rounded-2xl p-3 text-white font-black text-sm placeholder:text-slate-500 focus:outline-none focus:border-cyber-yellow shadow-[3px_3px_0px_#000] resize-none"
                  />
                  <div
                    className={`absolute bottom-2.5 right-3 text-[11px] font-mono font-black ${
                      commentText.length >= 90
                        ? 'text-rose-400'
                        : commentText.length >= 70
                        ? 'text-cyber-yellow'
                        : 'text-slate-400'
                    }`}
                  >
                    {commentText.length}/100
                  </div>
                </div>

                {/* Extra Quick Trend Chips */}
                <div className="mb-2.5">
                  <div className="flex flex-wrap gap-1">
                    {ROAST_QUICK_CHIPS.slice(0, 6).map((chip, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleChipClick(chip)}
                        className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 active:bg-cyber-yellow active:text-black border border-black rounded-lg text-[11px] font-bold text-slate-300 transition"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={!commentText.trim()}
                className={`w-full py-3.5 px-4 rounded-2xl border-3 border-black font-black text-base flex items-center justify-center gap-2 shadow-[4px_4px_0px_#000] transition active:translate-x-0.5 active:translate-y-0.5 ${
                  commentText.trim()
                    ? 'bg-cyber-yellow hover:bg-amber-300 text-black cursor-pointer'
                    : 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                }`}
              >
                <Send className="w-5 h-5" />
                <span>Bắn Bình Luận Lên Tường 🚀</span>
              </button>
            </form>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-between my-auto">
            {/* Success Card */}
            <div className="bg-[#141A29] border-3 border-emerald-500 rounded-2xl p-5 shadow-[4px_4px_0px_#000] text-center my-auto">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-emerald-500/20 rounded-full border-2 border-emerald-400 text-emerald-400 mb-2">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h4 className="text-lg font-black text-white mb-1">ĐÃ LÊN SÓNG THÀNH CÔNG! 🎉</h4>
              <p className="text-xs text-slate-300 mb-4">
                Bình luận của bạn đã xuất hiện trên máy chiếu phòng học.
              </p>

              <div className="p-3 bg-black/60 rounded-xl border border-slate-700 text-left mb-4">
                <div className="text-[10px] text-cyber-yellow font-bold uppercase mb-1">
                  Nội dung bạn vừa gửi:
                </div>
                <div className="text-sm font-black text-white italic">
                  &ldquo;{commentText}&rdquo;
                </div>
              </div>

              <div className="text-xs text-cyber-cyan font-bold animate-pulse">
                ⏳ Hãy chuẩn bị lướt newsfeed và thả reaction cho đồng đội...
              </div>
            </div>

            {/* Waiting Danmaku Bar */}
            <div className="mt-3 bg-black/40 border border-slate-800 rounded-xl p-2.5">
              <div className="text-[10px] text-slate-400 font-bold uppercase text-center mb-1.5">
                Bắn biểu cảm lên máy chiếu trong lúc chờ:
              </div>
              <div className="grid grid-cols-6 gap-1.5">
                {DANMAKU_QUICK_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleSendDanmaku(emoji)}
                    className="py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 border border-black rounded-lg text-lg flex items-center justify-center transition shadow-[2px_2px_0px_#000]"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ============================================================
  // PHASE 2: FEED_REACTION (30s)
  // ============================================================
  if (phase === 'FEED_REACTION') {
    return (
      <div className="w-full h-full flex flex-col justify-between p-3 select-none overflow-hidden">
        {/* Top Header */}
        <div className="bg-black/80 border-2 border-black rounded-xl px-3 py-2 shadow-[2px_2px_0px_#000] shrink-0 mb-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-base">🔥</span>
            <div>
              <div className="text-xs font-black text-white leading-tight">LƯỚT FEED & THẢ BÃO REACTION</div>
              <div className="text-[10px] text-cyber-yellow font-bold">Thả Tim (+1), Cà Chua (+1), Quăng Gạch (+1)</div>
            </div>
          </div>
          <span className="px-2 py-0.5 bg-rose-500 text-white font-mono font-black text-xs rounded-md border border-black">
            30s
          </span>
        </div>

        {/* Scrollable Newsfeed */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3 pb-2">
          {/* Highlight own comment first if submitted */}
          {myExistingComment && (
            <div className="bg-gradient-to-r from-cyan-950/70 to-slate-900 border-3 border-cyber-cyan rounded-2xl p-3.5 shadow-[4px_4px_0px_#06D6A0] relative">
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 bg-cyber-cyan text-black font-black text-[10px] uppercase rounded-md border border-black">
                  🌟 BÌNH LUẬN CỦA BẠN
                </span>
                <div className="text-[11px] font-black text-slate-300">
                  ❤️ {myExistingComment.reactions?.heart || 0}  🍅 {myExistingComment.reactions?.tomato || 0}  🧱 {myExistingComment.reactions?.brick || 0}
                </div>
              </div>
              <p className="text-sm font-black text-white mb-2 leading-snug">
                &ldquo;{myExistingComment.text}&rdquo;
              </p>
              <div className="text-[10px] text-cyber-cyan font-bold text-right">
                Đang nhận được {myTotalReactions} lượt tương tác từ cả lớp!
              </div>
            </div>
          )}

          {/* List of other student comments */}
          {commentsList.map((comment) => {
            const isMe = comment.authorId === playerId;
            if (isMe) return null; // already shown on top

            const avatar = getAvatarById(comment.avatarId || 'keyboard_warrior');
            const SvgComp = avatar.SvgComponent;
            const myPick = myReactions[comment.id];

            return (
              <div
                key={comment.id}
                className="bg-[#141A29] border-3 border-black rounded-2xl p-3 shadow-[3px_3px_0px_#000] flex flex-col justify-between"
              >
                {/* Author Info */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-black border border-black flex items-center justify-center shrink-0">
                    <SvgComp size={28} />
                  </div>
                  <div className="truncate">
                    <div className="font-black text-xs text-white truncate max-w-[170px]">
                      {comment.authorName}
                    </div>
                    <div className="text-[9px] text-cyber-yellow font-bold truncate">
                      {avatar.name}
                    </div>
                  </div>
                </div>

                {/* Comment Text */}
                <p className="text-sm font-black text-white leading-snug mb-3">
                  &ldquo;{comment.text}&rdquo;
                </p>

                {/* 3 GIANT TOUCH REACTION BUTTONS */}
                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-800">
                  {/* Heart */}
                  <button
                    onClick={() => handleReactPost(comment.id, 'heart')}
                    className={`py-2 rounded-xl border-2 border-black flex flex-col items-center justify-center gap-0.5 font-black transition active:scale-95 shadow-[2px_2px_0px_#000] cursor-pointer ${
                      myPick === 'heart'
                        ? 'bg-rose-500 text-white scale-102 ring-2 ring-white'
                        : 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/30'
                    }`}
                  >
                    <span className="text-lg">❤️</span>
                    <span className="text-[10px]">
                      Tim ({comment.reactions?.heart || 0})
                    </span>
                  </button>

                  {/* Tomato */}
                  <button
                    onClick={() => handleReactPost(comment.id, 'tomato')}
                    className={`py-2 rounded-xl border-2 border-black flex flex-col items-center justify-center gap-0.5 font-black transition active:scale-95 shadow-[2px_2px_0px_#000] cursor-pointer ${
                      myPick === 'tomato'
                        ? 'bg-amber-500 text-black scale-102 ring-2 ring-white'
                        : 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                    }`}
                  >
                    <span className="text-lg">🍅</span>
                    <span className="text-[10px]">
                      Cà Chua ({comment.reactions?.tomato || 0})
                    </span>
                  </button>

                  {/* Brick */}
                  <button
                    onClick={() => handleReactPost(comment.id, 'brick')}
                    className={`py-2 rounded-xl border-2 border-black flex flex-col items-center justify-center gap-0.5 font-black transition active:scale-95 shadow-[2px_2px_0px_#000] cursor-pointer ${
                      myPick === 'brick'
                        ? 'bg-cyan-500 text-black scale-102 ring-2 ring-white'
                        : 'bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30'
                    }`}
                  >
                    <span className="text-lg">🧱</span>
                    <span className="text-[10px]">
                      Gạch ({comment.reactions?.brick || 0})
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ============================================================
  // PHASE 3: TOP_TRENDING / SUMMARY
  // ============================================================
  const top1Comment = sortedComments[0];

  return (
    <div className="w-full h-full flex flex-col justify-between p-3.5 select-none overflow-y-auto">
      {/* Top Banner */}
      <div className="text-center pt-1 mb-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-cyber-yellow text-black font-black text-xs uppercase rounded-lg border-2 border-black shadow-[2px_2px_0px_#000] mb-1">
          <Trophy className="w-3.5 h-3.5" />
          <span>KẾT QUẢ TOP TRENDING</span>
        </div>
        <h3 className="text-xl font-black text-white">TỔNG KẾT VÒNG 1</h3>
      </div>

      {/* Personal Score Card */}
      <div className="bg-[#141A29] border-3 border-black rounded-2xl p-4 shadow-[4px_4px_0px_#000] mb-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-black text-cyber-yellow uppercase">THÀNH TÍCH CỦA BẠN</span>
          {myRankIndex >= 0 && (
            <span className="px-2 py-0.5 bg-black/60 rounded-md border border-slate-700 text-xs font-black text-cyber-cyan">
              Hạng #{myRankIndex + 1} / {sortedComments.length}
            </span>
          )}
        </div>

        {myExistingComment ? (
          <div>
            <div className="p-2.5 bg-black/60 rounded-xl border border-slate-800 text-xs font-black text-white italic mb-3">
              &ldquo;{myExistingComment.text}&rdquo;
            </div>

            {/* Reactions breakdown */}
            <div className="grid grid-cols-3 gap-2 text-center mb-3">
              <div className="p-1.5 bg-rose-500/20 border border-rose-500/40 rounded-lg">
                <div className="text-sm font-black text-rose-300">{myExistingComment.reactions?.heart || 0}</div>
                <div className="text-[10px] text-slate-400">❤️ Tim</div>
              </div>

              <div className="p-1.5 bg-amber-500/20 border border-amber-500/40 rounded-lg">
                <div className="text-sm font-black text-amber-300">{myExistingComment.reactions?.tomato || 0}</div>
                <div className="text-[10px] text-slate-400">🍅 Cà chua</div>
              </div>

              <div className="p-1.5 bg-cyan-500/20 border border-cyan-500/40 rounded-lg">
                <div className="text-sm font-black text-cyan-300">{myExistingComment.reactions?.brick || 0}</div>
                <div className="text-[10px] text-slate-400">🧱 Gạch</div>
              </div>
            </div>

            {/* Total Points calculation */}
            <div className="p-3 bg-gradient-to-r from-emerald-950/60 to-slate-900 border-2 border-emerald-500/60 rounded-xl flex items-center justify-between">
              <div>
                <div className="text-[10px] text-slate-300 font-bold uppercase">Điểm thưởng vòng này:</div>
                <div className="text-xs text-emerald-300">
                  {myPlacementBonus > 0 ? `+${myPlacementBonus} (Hạng ${myRankIndex + 1}) ` : ''}
                  +{myReactionBonus} (Tương tác)
                </div>
              </div>
              <div className="text-xl font-mono font-black text-emerald-400">
                +{myTotalRoundScore} PTS
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-3 text-xs text-slate-400 font-bold">
            Bạn chưa nộp bình luận trong vòng này!
          </div>
        )}
      </div>

      {/* Top 1 Crown Holder Preview */}
      {top1Comment && (
        <div className="bg-amber-950/40 border-2 border-amber-400/80 rounded-2xl p-3 shadow-[3px_3px_0px_#FFD166] mb-3">
          <div className="flex items-center gap-1.5 text-xs font-black text-cyber-yellow mb-1.5">
            <Crown className="w-4 h-4" />
            <span>QUÁN QUÂN TOP 1 TRENDING</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-black border border-amber-400 flex items-center justify-center shrink-0">
              {React.createElement(getAvatarById(top1Comment.avatarId || 'keyboard_warrior').SvgComponent, { size: 34 })}
            </div>
            <div className="truncate">
              <div className="font-black text-sm text-white truncate max-w-[200px]">
                {top1Comment.authorName}
              </div>
              <div className="text-xs text-amber-200/90 italic truncate max-w-[220px]">
                &ldquo;{top1Comment.text}&rdquo;
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Danmaku celebration bar */}
      <div className="bg-black/50 border border-slate-800 rounded-xl p-2.5">
        <div className="text-[10px] text-slate-400 font-bold uppercase text-center mb-1.5">
          Thả tim chúc mừng các chiến thần Trending:
        </div>
        <div className="grid grid-cols-6 gap-1.5">
          {DANMAKU_QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleSendDanmaku(emoji)}
              className="py-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 border border-black rounded-lg text-lg flex items-center justify-center transition shadow-[2px_2px_0px_#000]"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Waiting Host Indicator */}
      <div className="text-center text-xs text-slate-400 font-bold mt-2">
        ⏳ Đang chờ Host chuyển sang thử thách tiếp theo...
      </div>
    </div>
  );
}
