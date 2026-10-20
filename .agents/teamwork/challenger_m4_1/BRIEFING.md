# BRIEFING — 2026-10-20T00:13:40Z

## Mission
Empirical stress-testing and verification for Milestone 4 (Mode 3: Trưng Cầu Dân Ý: Đoán Phe Đa Số).

## 🔒 My Identity
- Archetype: empirical_challenger
- Roles: critic, specialist
- Working directory: C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131\.agents\teamwork\challenger_m4_1
- Original parent: dcd6312c-918d-4ca5-957d-512b431b5686
- Milestone: Milestone 4 - Mode 3 Trưng Cầu Dân Ý
- Instance: 1 of 1

## 🔒 Key Constraints
- Review-only — do NOT modify implementation code
- Run verification code empirically; do not trust worker's claims or logs
- Test 50 concurrent students submitting stances and consensus bets simultaneously
- Verify dynamic rope percentage calculation across skewed distributions (90/10, 50/50, 0/100, 1/49)
- Verify point distribution (+5000 points strictly to correct betters)
- .agents/teamwork/ must contain only metadata — no tests or source code in .agents/teamwork/

## Current Parent
- Conversation ID: dcd6312c-918d-4ca5-957d-512b431b5686
- Updated: not yet

## Review Scope
- **Files to review**: `src/components/Round3Host.tsx`, `src/components/Round3Play.tsx`, `src/app/api/game/route.ts`, `src/types/game.ts`
- **Interface contracts**: `PROJECT.md`, `ORIGINAL_REQUEST.md`
- **Review criteria**: Correctness of Mode 3 mechanics, concurrency safety (50 students), skewed rope calculation edge cases, scoring logic (+5000 points strictly to correct betters)

## Attack Surface
- **Hypotheses tested**: TBD
- **Vulnerabilities found**: TBD
- **Untested angles**: TBD

## Loaded Skills
- None requested

## Key Decisions Made
- Established testing boundaries: review implementation code, write dedicated test script under `tests/` or run via Node.js/Vitest, evaluate all edge distributions.

## Artifact Index
- `DISPATCH.md` — Task assignment and instructions
- `BRIEFING.md` — Persistent working memory
- `progress.md` — Liveness heartbeat and status tracking
- `handoff.md` — Verification report and APPROVE/REJECT verdict
