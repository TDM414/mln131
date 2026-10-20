# Dispatch to explorer_rearchitect_code

## Task
Investigate the current codebase in `src/` (`src/lib/types.ts`, `src/app/api/game/route.ts`, `src/components/`, `src/app/host/page.tsx`, `src/app/play/page.tsx`) against the new user directive in `ORIGINAL_REQUEST.md` (2026-10-19T15:28:48Z).
Identify exactly what exists, what can be reused, what needs to be refactored, and what new components/endpoints are required for:
1. Mode 1: Trending Feed Wall (45s comment + 30s like/reaction feed + Top Trending projector)
2. Mode 2: 5s Fact or Cap Reflex (2 big mobile buttons, 5s countdown bomb on projector)
3. Mode 3: Consensus Dilemma Trưng Cầu Dân Ý (Mobile side choice + >50% bet; Projector realtime Tug-of-war bar + brick barrage)
4. Mode 4: Prominent Hub button [Thử Ngay Mode 4] + Sabotage Trivia with Speed-Decay
5. Speed-Decay scoring formula: BasePoints * (RemainingTime / TotalTime)
6. DevBotSimulator updates to simulate all these actions seamlessly.

Write your findings to `analysis.md` and `handoff.md` in your directory (`.agents/teamwork/explorer_rearchitect_code`).

## 2026-10-19T15:33:51Z
Read C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131\.agents\teamwork\ORIGINAL_REQUEST.md (specifically the latest update 2026-10-19T15:28:48Z) and C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131\.agents\teamwork\explorer_rearchitect_code\DISPATCH.md.
Investigate the current source code in C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131\src\ including types.ts, syncEngine.ts, audioSynthesizer.ts, questions.ts, route.ts, components (HostLobby, Round1Host/Play, Round2Host/Play, Round3Host/Play, Round4Host/Play, DevBotSimulator, etc.).
Determine exactly what code is in place, what needs to be refactored or rewritten for the new 4 modes (Trending Feed Wall, Fact or Cap 5s, Consensus Dilemma with Tug-of-war, and Sabotage Trivia with direct Hub launch, plus Speed-Decay scoring and DevBot updates).
Write your full analysis report to C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131\.agents\teamwork\explorer_rearchitect_code\analysis.md and a soft handoff to handoff.md. Then send a message back to the orchestrator.

