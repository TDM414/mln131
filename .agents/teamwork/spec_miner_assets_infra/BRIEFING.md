# BRIEFING — 2026-10-19T11:47:30Z

## Mission
Mine and catalog authoritative requirements for Assets & Visual Pipeline, Visual Identity & Tone, Audio & SFX, and Deployment & Networking for Democracy Raid.

## 🔒 My Identity
- Archetype: specification_miner
- Roles: spec_miner_assets_infra
- Working directory: C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131\.agents\teamwork\spec_miner_assets_infra
- Original parent: 45f106cf-224a-4102-aeee-b56815847bc0
- Milestone: specification_mining

## 🔒 Key Constraints
- Read ORIGINAL_REQUEST.md first as authoritative source.
- Asset & Visual Pipeline Priority:
  - Priority 1: Download from web (Lucide/OpenGameArt/Freesound/Flaticon/Google Fonts)
  - Priority 2: Gen AI if no matching context memes
  - Priority 3: Canvas 2D/SVG/CSS keyframe animation
  - Priority 4: Report
- Visual Identity & Tone: Gen Z party game, bright cartoon meme style, 16:9 classroom projector layout, 1-finger touch mobile layout.
- Audio & SFX: Arcade sound effects, applause, troll horn, explosion, background music via Web Audio API or audio assets.
- Deployment & Networking: Local LAN (classroom offline) and 1-click Vercel deployment; 40-50 simultaneous mobile connections; real-time synchronization strategy (SSE / WebSockets / polling / state engine).
- Do NOT implement anything — read-only specification miner.
- Write detailed specs and pipeline plan to handoff.md in working directory.
- Send message to parent (45f106cf-224a-4102-aeee-b56815847bc0) when complete.

## Current Parent
- Conversation ID: 45f106cf-224a-4102-aeee-b56815847bc0
- Updated: 2026-10-19T11:43:00Z

## Task Summary
- **What to build**: Specification discovery & catalog for Assets, Audio, Visual Identity, and Infrastructure.
- **Success criteria**: Comprehensive feature table, edge cases, asset acquisition pipeline, audio implementation strategy, networking & deployment architecture specs in handoff.md.
- **Interface contracts**: C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131\ORIGINAL_REQUEST.md
- **Code layout**: Next.js app in src/

## Key Decisions Made
- Prioritize zero-cost/offline web audio and CSS/SVG solutions alongside external open assets to support offline LAN gameplay without internet dependency.
- Established 10 Netizen Avatar archetypes and detailed visual tokens for neo-brutalist party game aesthetic.
- Designed 16:9 projector layout with 10m legibility standards and 1-finger touch mobile layout (100dvh, thumb zone, haptic vibration).
- Specified procedural Web Audio API synthesis for Troll Horn, Applause, Explosion, 5s Countdown Ticks, Splat, and Party BGM.
- Defined Dual-Mode Networking: Local Classroom LAN (<15ms) and 1-Click Vercel Serverless Delta Polling (700ms client / 350ms host) handling 40-50 simultaneous connections with ~21 KB/s aggregate bandwidth.
- Designed Dev Bot Simulator harness (15-20 bots) for single-developer end-to-end verification.

## Artifact Index
- DISPATCH.md — Task assignment and instructions
- BRIEFING.md — Identity and situational awareness
- progress.md — Liveness heartbeat and progress tracking
- handoff.md — 5-component handoff report with mined specifications
