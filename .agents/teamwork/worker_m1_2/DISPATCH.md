# Dispatch for Worker M1-2 (Remediation Execution)
Milestone: Milestone 1 Remediation (Execution of explorer_m1_2 blueprint)
Working Directory: C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131\.agents\teamwork\worker_m1_2
Project Root: C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131
Original Request: C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131\ORIGINAL_REQUEST.md
Master Project Index: C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131\PROJECT.md
Remediation Blueprint: C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131\.agents\teamwork\explorer_m1_2\handoff.md
Auditor Report: C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131\.agents\teamwork\auditor_m1_1\handoff.md
Challenger 2 Report: C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131\.agents\teamwork\challenger_m1_2\handoff.md
## 2026-10-19T12:22:54Z
Sender: 45f106cf-224a-4102-aeee-b56815847bc0
You are worker_m1_2.
Your working directory: C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131\.agents\teamwork\worker_m1_2
Project root: C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131
Original Request: C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131\ORIGINAL_REQUEST.md
Master Project Index: C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131\PROJECT.md
Remediation Blueprint: C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131\.agents\teamwork\explorer_m1_2\handoff.md
Auditor Report: C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131\.agents\teamwork\auditor_m1_1\handoff.md
Challenger 2 Report: C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131\.agents\teamwork\challenger_m1_2\handoff.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. An auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

MANDATORY: Read ORIGINAL_REQUEST.md, PROJECT.md, and the Remediation Blueprint in explorer_m1_2\handoff.md before implementing.

Execute the complete remediation for Milestone 1:
1. `tests/stress/m1_stress_harness.ts`: Fix line 28 typing `init: any` so `npx tsc --noEmit` and `npm run build` compile with 0 errors.
2. `src/app/api/game/route.ts`: Harden POST handler with `try/catch` around `req.json()` (returning HTTP 400 on malformed JSON), support `body.data` alias, default `payload = {}`, and apply defensive null-checks/string validations across all 14 action handlers (fixing all 13 uncaught exceptions). Update GET handler to filter `timestamp >= since`.
3. `src/lib/syncEngine.ts`: Add `seenEventIds: Set<string>` and deduplication logic so events arriving with the same millisecond timestamp are never dropped.
4. `src/components/DevBotSimulator.tsx`: Add `hasInitializedBots = useRef(false)`, isolate effect dependencies to `[isSimulating]`, and add timeout cleanup.
5. `tests/suites/tier4_real_world.mjs`: Completely remove the dummy inline `audioMethods` object in test T4.4. Import `sound` from `../../src/lib/audioSynthesizer.ts` directly, assert that all required SFX methods exist on `sound`, and assert that calling them does not throw in Node.js.
6. `tests/fixtures/mockData.mjs`, `tests/suites/tier1_features.mjs`, `tests/lib/gameShowEngine.mjs`: Align avatar IDs with the genuine 10 avatars in `src/data/memeAvatars.tsx` (`keyboard_warrior`, `grammar_police`, etc.).
7. `src/lib/audioSynthesizer.ts`: In all exponential ramp calls, clamp volume to `Math.max(0.0001, masterVolume)` to prevent W3C `RangeError` when volume is 0.
8. `src/app/play/page.tsx`: Add a 300ms cooldown to mobile Danmaku buttons and add `overflow-y-auto` to the mobile join form so the submit button remains visible when virtual keyboards pop up.
9. `src/data/memeAvatars.tsx`: Make `clipPath id` dynamic in `VarInspectorSvg` (`clipPath id={clipId}`) to prevent duplicate DOM IDs.
10. `src/app/host/page.tsx`: Fix `z-25` to `z-[25]` on line 365.
11. `package.json` & `scripts/run_e2e_tests.mjs`: Wire `tests/stress/m1_stress_harness.ts` into `scripts/run_e2e_tests.mjs` and update `"test": "npx tsx scripts/run_e2e_tests.mjs"` in `package.json`.
12. Run build verification (`npm run build`), static typecheck (`npx tsc --noEmit`), stress harness (`npx tsx tests/stress/m1_stress_harness.ts`), and master E2E test runner (`npm test`). Confirm ALL pass with exit code 0.
13. Document all completed changes and verification outputs in handoff.md in your working directory. Notify parent (45f106cf-224a-4102-aeee-b56815847bc0) when done.
