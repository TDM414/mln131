## 2026-10-19T12:49:56Z
You are explorer_m2_1.
Your working directory: C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131\.agents\teamwork\explorer_m2_1
Project root: C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131
Original Request: C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131\ORIGINAL_REQUEST.md
Master Project Index: C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131\PROJECT.md

MANDATORY: Read ORIGINAL_REQUEST.md and PROJECT.md first.
Your scope is Milestone 2: "Round 1: Cà Khịa & Check VAR" (Jackbox / Quiplash style).
Investigate existing code and create a detailed, file-by-file implementation blueprint for:
1. `src/components/DanmakuCanvas.tsx`: HTML5 Canvas 2D reaction engine supporting 60+ simultaneous flying emojis (🍅 tomato, 🧱 brick, ❤️ heart, 🤡 clown, custom text), particle physics, pooling (max 80 active particles), and smooth requestAnimationFrame loop.
2. `src/components/Round1Host.tsx`: 16:9 classroom projector view with:
   - Phase 1 (Prompt Broadcast & Roast Input): Display MLN131 satirical drama prompt, countdown timer, submission progress tracker (`X / Y Đã Nộp`).
   - Phase 2 (Duel Showdown & Voting): Side-by-side 1v1 comic duel cards (Card A vs Card B), voting timer, live Danmaku layer.
   - Phase 3 (VAR Reveal): Referee whistle alarm, dramatic VAR card popup, vote split bar (e.g., 65% vs 35%), winner highlight, points distribution (+1000 winner, +250 sympathy, +150 voters).
3. `src/components/Round1Play.tsx`: 1-finger touch mobile controller with:
   - Roast input view: 120-character counter, quick phrase chips, profanity filter, submit button.
   - 1v1 vote view: Large thumb-friendly Vote A / Vote B cards.
   - Persistent Danmaku reaction dock (🍅, 🧱, ❤️, 🤡) with 300ms cooldown.
4. Dev Bot Simulator integration in `src/components/DevBotSimulator.tsx`:
   - Curate a bank of witty Vietnamese student roasts for MLN131 prompts.
   - Bots automatically submit roasts with realistic staggered delays (4s–20s).
   - Bots vote on duels with realistic 55/45 or 70/30 distribution.
   - Bots generate Danmaku reaction bursts.
5. Integration into `src/app/host/page.tsx` and `src/app/play/page.tsx` when status is `ROUND_1`.

Write your comprehensive implementation plan to handoff.md in your working directory and notify parent (45f106cf-224a-4102-aeee-b56815847bc0).
