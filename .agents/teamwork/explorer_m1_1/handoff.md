# Milestone 1: Foundation, Hub & Audio Engine — Architectural Blueprint & Handoff Report

## 1. Observation

### Existing Codebase Analysis
- **`ORIGINAL_REQUEST.md` (lines 5-63)**: Mandates the transformation of the project into *"NETIZEN PARTY: ĐẠI HỘI DÂN MẠNG (MLN131 Edition)"* — a real-time classroom party game show (Host projector + 40-50 mobile clients) featuring a 4-round tournament structure, neo-brutalist cartoon meme aesthetic, troll audio SFX, Gen Z satire, and seamless LAN/Vercel support.
- **`PROJECT.md` (lines 70-79)**: Defines Milestone 1 ("Foundation, Hub & Audio Engine") as the prerequisite foundation for all subsequent round implementations (Round 1: Cà Khịa, Round 2: 5s WarioWare, Round 3: Seeder vs Netizen, Round 4: Sabotage Trivia & Grand Podium).
- **Current `src/lib/types.ts` (lines 1-119)**: Contains legacy single-boss raid data structures (`BossState`, `MinionUnit`, `MinionRarity`, `DamagePopup`, `Projectile`). It lacks `GameShowState`, 4-round states, player tournament models, sabotage card definitions, and `DevBotConfig`.
- **Current `src/lib/audioSynthesizer.ts` (lines 1-216)**: Implements procedural Web Audio synthesis for basic SFX (`playLaser`, `playExplosion`, `playGachaReveal`, `playWhistleAlarm`, `playBossStun`, `playTapPunch`, `playVictoryFanfare`). It lacks party game show audio signatures required by R3: `playTrollHorn` (air horn), `playApplause` (crowd cheering), `playCountdownTick` (urgency clock), `playSplat` (tomato/ink squelch), `playCorrectChime`, `playWrongBuzz`, `playSabotageStab`, and `startPartyBGM` / `stopPartyBGM` (procedural 128 BPM funky chiptune loop).
- **Current `src/lib/syncEngine.ts` (lines 1-182)** & **`src/app/api/game/route.ts` (lines 1-165)**: Currently bound to boss-raid actions (`SUMMON`, `WHISTLE`, `TAP`). Missing game show action dispatchers (`JOIN`, `SET_MODE`, `START_ROUND`, `SET_PHASE`, `SUBMIT_ROAST`, `VOTE_ROAST`, `DANMAKU`, `MINIGAME_RESULT`, `DEDUCTION_VOTE`, `PLAY_CARD`, `WIPE_INK`, `SUBMIT_TRIVIA`, `TOGGLE_BOTS`, `RESET_GAME`).
- **Current `src/data/memeAvatars.ts`**: Currently does not exist.
- **Current `src/components/HostLobby.tsx`** & **`src/components/DevBotSimulator.tsx`**: Currently do not exist.
- **Current `src/app/host/page.tsx`** & **`src/app/play/page.tsx`**: Tightly coupled to the legacy boss battle and minion gacha rather than the multi-round tournament hub.
- **Build Status**: Verified via `npx tsc --noEmit` and `npm run build` — currently exits with code 0.

---

## 2. Logic Chain

1. **Interface Contract Precedence**:
   Subsequent Milestones (M2 through M5) rely directly on shared type contracts. If `src/lib/types.ts` does not define complete, strongly-typed structures for all 4 rounds now, future milestone workers would be forced to mutate global types, causing breaking schema drift. Retaining `QuizQuestion` and `UnitTypeDefinition` ensures backwards compatibility during incremental migration.
2. **Procedural Web Audio Guarantee**:
   Web Audio API procedural synthesis provides 100% offline availability without relying on external CDN MP3 assets that may fail in disconnected classroom environments or trigger cross-origin audio blocks. By implementing mathematically-tuned oscillators, noise buffers, and filter envelopes for troll air horns, crowd applause, splats, buzzers, and background music, sound is instantaneous and zero-latency.
3. **Dual-Channel Synchronization Strategy**:
   Classrooms with 40-50 mobile devices on high-latency Wi-Fi or cellular connections cannot rely solely on WebSockets (due to NAT traversal or Vercel serverless connection limits). The hybrid architecture combining `BroadcastChannel` (0ms instantaneous multi-tab communication on host laptop) with timestamped HTTP delta polling (`/api/game?room=...&since=...` at 350ms for host and 700ms for clients) delivers maximum resilience and real-time responsiveness.
4. **Zero-Asset Meme Avatars**:
   Rendering the 10 Netizen Personas as pure vector SVG components guarantees crisp rendering on both 4K classroom projectors and mobile screens, eliminates network image download latency, and allows dynamic CSS styling (accents, glowing borders, active states).
5. **Dev Sandbox Testing Feasibility**:
   Developing and testing a 40-50 student party game show without physical access to 40 phones requires an automated in-engine simulation. `DevBotSimulator` injects 15-20 virtual Vietnamese students with authentic personas, automated state-driven responses (roasts, votes, 5s reactions, card plays, Danmaku barrage) to enable complete E2E testing from a single browser tab.

---

## 3. Concrete Implementation Blueprint

### File 1: `src/lib/types.ts`
Replace the legacy contents with comprehensive game show data models while retaining compatibility interfaces:

```typescript
// Core Enums
export type GameMode = 'TOURNAMENT' | 'FREE_PLAY';
export type GameStatus = 'LOBBY' | 'ROUND_1' | 'ROUND_2' | 'ROUND_3' | 'ROUND_4' | 'PODIUM';

// Player Interface
export interface Player {
  id: string;
  name: string;
  avatarId: string; // key from NETIZEN_AVATARS (e.g., 'keyboard_warrior')
  score: number;
  roundScores: {
    ROUND_1?: number;
    ROUND_2?: number;
    ROUND_3?: number;
    ROUND_4?: number;
  };
  connected: boolean;
  isBot?: boolean;
  lastActive: number;
  streak: number;
  // Round-specific transient fields
  r2Lives?: number;
  r3Role?: 'NETIZEN' | 'SEEDER';
  r4Cards?: SabotageCardType[];
  r4Debuffs?: {
    isBlindedByInk?: boolean;
    inkWipesLeft?: number;
    multiplier?: number;
    hasShield?: boolean;
  };
}

// Round 1: Cà Khịa & Check VAR
export type Round1Phase = 'PROMPT_BROADCAST' | 'ROAST_INPUT' | 'DUEL_SHOWDOWN' | 'VOTE_ACTIVE' | 'VAR_REVEAL' | 'ROUND_SUMMARY';

export interface RoastPrompt {
  id: string;
  situation: string;
  category: string;
  context: string;
}

export interface RoastSubmission {
  id: string;
  playerId: string;
  playerName: string;
  avatarId: string;
  text: string;
  timestamp: number;
}

export interface DuelPair {
  id: string;
  prompt: RoastPrompt;
  submissionA: RoastSubmission;
  submissionB: RoastSubmission;
  votesA: string[];
  votesB: string[];
  winnerId?: string;
  revealed?: boolean;
}

export interface Round1State {
  phase: Round1Phase;
  currentPromptIndex: number;
  prompts: RoastPrompt[];
  submissions: Record<string, RoastSubmission>;
  duels: DuelPair[];
  currentDuelIndex: number;
}

// Round 2: Chiến Binh 5 Giây Dị Hợm
export type Round2Phase = 'MICRO_INTRO' | 'MICRO_PLAYING' | 'MICRO_RESULT' | 'ROUND_SUMMARY';
export type MiniGameType = 'CATCH_REPORT' | 'SHAKE_OTP' | 'DODGE_BRICKS' | 'SPOT_DEEPFAKE';

export interface MiniGameConfig {
  type: MiniGameType;
  title: string;
  instruction: string;
  timeLimitSec: number;
  data?: any;
}

export interface Round2State {
  phase: Round2Phase;
  currentGameIndex: number;
  activeGame: MiniGameConfig;
  gamesList: MiniGameConfig[];
  survivorIds: string[];
  playerResults: Record<string, {
    success: boolean;
    reactionTimeMs: number;
    livesRemaining: number;
  }>;
}

// Round 3: Vạch Mặt Seeder & Check VAR
export type Round3Phase = 'ROLE_ASSIGNMENT' | 'CLUE_DISCOVERY' | 'HOT_SEAT_DEBATE' | 'EXPULSION_VOTE' | 'VAR_VERDICT' | 'ROUND_SUMMARY';

export interface SocialClue {
  id: string;
  author: string;
  content: string;
  engagement: string;
  isBotnetSeeder: boolean;
  anomalyHint: string;
}

export interface Round3State {
  phase: Round3Phase;
  clues: SocialClue[];
  nominatedSuspectIds: string[];
  votes: Record<string, string>; // voterId -> suspectId
  exiledPlayerId?: string;
  exileVerdict?: {
    playerName: string;
    wasSeeder: boolean;
    voteCount: number;
  };
  netizenVictory?: boolean;
}

// Round 4: Đại Chiến Lật Kèo & Cướp Điểm
export type SabotageCardType = 'INK_SPLATTER' | 'POINT_HEIST' | 'TROLL_QUESTION' | 'DOUBLE_OR_NOTHING' | 'CYBER_SHIELD';

export interface SabotageCard {
  id: string;
  type: SabotageCardType;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export type Round4Phase = 'CARD_DRAFT' | 'CARD_ATTACK' | 'TRIVIA_QUESTION' | 'ROUND_RESOLUTION' | 'ROUND_SUMMARY';

export interface TriviaQuestion {
  id: number;
  topic: string;
  scenario: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  points: number;
}

export interface Round4State {
  phase: Round4Phase;
  currentQuestionIndex: number;
  questions: TriviaQuestion[];
  activeSabotages: Array<{
    id: string;
    fromPlayerId: string;
    fromPlayerName: string;
    targetPlayerId: string;
    cardType: SabotageCardType;
    blocked?: boolean;
  }>;
  playerAnswers: Record<string, {
    optionIndex: number;
    timeMs: number;
    isCorrect: boolean;
    pointsEarned: number;
  }>;
}

// Danmaku Message
export interface DanmakuMessage {
  id: string;
  text?: string;
  emoji: string;
  senderName: string;
  senderAvatar: string;
  color?: string;
  yPosition?: number;
  speed?: number;
  timestamp: number;
}

// Dev Bot Simulator Config
export interface DevBotConfig {
  enabled: boolean;
  botCount: number;
  reactionSpeed: 'FAST' | 'REALISTIC' | 'CHAOTIC';
  simulatedDanmaku: boolean;
}

// Master GameShowState
export interface GameShowState {
  roomCode: string;
  mode: GameMode;
  status: GameStatus;
  currentRoundPhase: string;
  timer: {
    total: number;
    remaining: number;
    active: boolean;
    startedAt?: number;
  };
  players: Record<string, Player>;
  roundScores: Record<string, Record<string, number>>;
  round1State: Round1State;
  round2State: Round2State;
  round3State: Round3State;
  round4State: Round4State;
  recentEvents: GameEvent[];
  devBotConfig: DevBotConfig;
}

export interface GameEvent {
  id: string;
  type: string;
  payload: any;
  timestamp: number;
}

// Backwards compatibility aliases
export interface QuizQuestion {
  id: number;
  topic: string;
  scenario: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export type MinionRarity = 'common' | 'rare' | 'epic' | 'legendary';
export interface UnitTypeDefinition {
  typeId: string;
  name: string;
  rarity: MinionRarity;
  description: string;
  icon: string;
  color: string;
  glowColor: string;
  baseHp: number;
  baseDamage: number;
  speed: number;
  attackSpeed: number;
  ability: string;
}
```

---

### File 2: `src/lib/audioSynthesizer.ts`
Implement pure Web Audio procedural synthesis with no external MP3 dependencies:
- **`playTrollHorn()`**: 3-burst detuned sawtooth brass blast (Bb4: 466.16Hz and F4: 349.23Hz) with resonant bandpass filter at 1.1kHz.
- **`playApplause()`**: Synthesizes a 1.8s pink/white noise buffer shaped by a custom gain curve and 12 randomized micro-impulses simulating crowd claps.
- **`playCountdownTick(isUrgent = false)`**: Sharp 35ms woodblock/clock impulse with pitch sweep (1200Hz if urgent, 800Hz if normal).
- **`playSplat()`**: Liquid wet comic squelch using frequency slide (450Hz down to 50Hz) combined with rapid lowpass filter sweep.
- **`playCorrectChime()`**: Harmonic 4-bell arpeggio (C5, E5, G5, C6) with sine/triangle blend and shimmering decay.
- **`playWrongBuzz()`**: Dissonant double-sawtooth buzzer (130.8Hz + 138.6Hz minor 2nd beat frequency).
- **`playSabotageStab()`**: Cinematic diminished suspense hit with sub-bass punch (65Hz) and dramatic resonance.
- **`playVictoryFanfare()`**: Triumphant brass melody for champion announcements.
- **`startPartyBGM()` / `stopPartyBGM()`**: Procedural 128 BPM chiptune party loop playing a funky D-minor bassline, kick, hi-hat, and snare noise bursts on a timer.

---

### File 3: `src/lib/syncEngine.ts` & `src/app/api/game/route.ts`
- **`RealtimeSyncEngine`**:
  - Unifies local `BroadcastChannel('netizen_party_game')` with HTTP polling `/api/game?room=${roomCode}&since=${timestamp}`.
  - Exposes strongly typed methods:
    - `joinRoom(playerId, name, avatarId)`
    - `setMode(mode: GameMode)`
    - `setGameStatus(status: GameStatus)`
    - `setRoundPhase(phase: string)`
    - `sendDanmaku(emoji: string, text?: string, senderName?: string, senderAvatar?: string)`
    - `submitRoast(text: string)`
    - `voteRoast(duelId: string, choice: 'A' | 'B')`
    - `submitMinigameResult(success: boolean, reactionTimeMs: number)`
    - `voteExile(suspectPlayerId: string)`
    - `playCard(cardType: SabotageCardType, targetPlayerId: string)`
    - `wipeInk()`
    - `submitTrivia(questionIndex: number, optionIndex: number, timeMs: number)`
    - `hostUpdateState(patch: Partial<GameShowState>)`
    - `resetGame()`
- **`src/app/api/game/route.ts`**:
  - Maintains in-memory `GameShowState` keyed by room PIN (`MLN131`).
  - Supports `GET` (returns full state snapshot + incremental events since client timestamp).
  - Supports `POST` (processes all action types, appends to `recentEvents` buffer capped at 120 items, updates player records and scores).

---

### File 4: `src/data/memeAvatars.ts`
Create high-resolution, vector-crisp SVG components for the 10 Netizen Personas:
1. `keyboard_warrior` ("Anh Hùng Bàn Phím"): Helmet made of mechanical keyboard keys, red fiery eyes.
2. `grammar_police` ("Cảnh Sát Chính Tả"): Blue police cap, stern monocle, holding a giant red pen.
3. `var_inspector` ("Trọng Tài Check VAR"): Referee jersey, whistle, glowing yellow VAR card.
4. `anti_scam_otter` ("Hải Cẩu Bóc Phốt"): Sleek detective trench coat, sunglasses, rubber stamp.
5. `zen_monk` ("Bồ Tát Hóng Drama"): Golden halo, eating popcorn, watching drama on smartphone.
6. `chicken_feeder` ("Seeder Lùa Gà"): Sneaky grin, sunglasses, megaphone, yellow chick feathers.
7. `phd_student` ("Học Giả Bách Khoa"): Thick spiral glasses, coffee mug, academic book.
8. `genz_slang_queen` ("Chiến Thần Tóp Tóp"): Cat-ear headphones, boba cup, heart stickers.
9. `conspiracy_theorist` ("Thánh Thuyết Âm Mưu"): Tin foil origami hat, alien badge, antenna.
10. `righteous_netizen` ("Dân Mạng Lương Thiện"): Golden smiling avatar with laurel wreath and voting ballot.

Include helper exports:
- `NETIZEN_AVATARS: NetizenAvatar[]`
- `getAvatarById(id: string): NetizenAvatar`
- `getRandomAvatar(): NetizenAvatar`

---

### File 5: `src/components/HostLobby.tsx` & `src/components/DevBotSimulator.tsx`
- **`HostLobby.tsx`**:
  - Neo-brutalist 16:9 layout for classroom projection (readable 5-15m away).
  - Left: Massive Room PIN `MLN131`, high-res QR code generated via `qrcode`, connection instructions.
  - Center: Mode Picker toggle (**Tournament Mode** vs **Free-Play Mode**), single-round direct launch cards, and animated "BẮT ĐẦU ĐẠI HỘI" launch button.
  - Right: Live student roster grid showing real-time joins with animated avatar cards and ready badges.
  - Floating Danmaku reaction display directly on the lobby screen.
- **`DevBotSimulator.tsx`**:
  - Built-in simulation harness that spawns 15-20 virtual students with authentic Vietnamese names (`Tuấn Anh`, `Khánh Linh`, `Minh Đức`, `Hương Giang`, etc.).
  - Runs state-driven simulation loops:
    - Lobby: joins bots in staggered batches, periodically fires Danmaku reactions.
    - Round 1: submits humorous roasts, votes in duels.
    - Round 2: responds to 5s micro-games with 75% success and realistic delays.
    - Round 3: casts suspect votes.
    - Round 4: answers trivia and casts sabotage cards.
  - Host toggle controls (Enable/Disable, Add 5 Bots, Clear Bots, Speed Profile).

---

### File 6: `src/app/host/page.tsx` & `src/app/play/page.tsx`
- **`src/app/host/page.tsx`**:
  - Host orchestrator component managing `GameShowState`.
  - Header with room PIN, audio mute/volume toggle, BGM toggle, fullscreen button, and Dev Sandbox drawer trigger.
  - Dynamic body switcher: renders `HostLobby` when status is `LOBBY`, placeholder/round components for `ROUND_1` to `ROUND_4`, and `GrandPodium` for `PODIUM`.
  - Background procedural BGM and audio trigger handlers.
- **`src/app/play/page.tsx`**:
  - 100dvh mobile-first controller optimized for 1-finger touch.
  - Join view: Name input, random name generator button, visual avatar selector carousel/grid, PIN input, and join CTA with haptic feedback.
  - Lobby waiting view: Player profile card, room status, interactive Danmaku reaction pad (5 instant emojis + custom comment input).
  - Dynamic round view: Renders active round controller view or waiting view with persistent Danmaku thumb-zone.

---

## 4. Caveats

- **Autoplay Audio Policy**: Modern web browsers block Web Audio from producing sound until the user interacts with the page (click/touch). The host UI must include an explicit "Bật Âm Thanh" / "Khởi Động Âm Thanh" banner or button if AudioContext is suspended.
- **Network Resilience**: In local classroom environments, intermittent Wi-Fi drops may occur. The sync engine handles this by maintaining local state and catching fetch errors silently during polling loops.
- **Danmaku Throttling**: To prevent Danmaku flooding from 50 devices degrading canvas rendering performance, the client limits reactions to 1 send every 400ms.

---

## 5. Conclusion

Milestone 1 establishes the complete foundation, data contracts, audio engine, avatar identities, lobby hub, and simulation tools required for all subsequent gameplay rounds. Implementing this blueprint allows Milestones 2, 3, 4, and 5 to proceed with zero schema modifications, guaranteed 100% offline audio, and full testability via the Dev Bot Simulator.

---

## 6. Verification Method

To independently verify the implementation:

1. **Static Analysis & Typecheck**:
   ```bash
   npx tsc --noEmit
   ```
   Must complete with zero TypeScript errors.
2. **Next.js Production Build**:
   ```bash
   npm run build
   ```
   Must compile all routes (`/`, `/host`, `/play`, `/api/game`) successfully with 0 SSR or hydration errors.
3. **End-to-End Functional Verification**:
   - Start dev server: `npm run dev`
   - Open Host screen: `http://localhost:3000/host`
   - Verify Room PIN `MLN131` and QR code render crisply.
   - Click "Test Dev" ➔ Enable 15 Dev Bots. Confirm 15 virtual student cards appear in the roster with diverse Netizen Avatars.
   - Test Procedural Audio: Click Audio SFX buttons (Troll horn, Applause, Splat, Fanfare) and BGM loop to verify crystal-clear Web Audio output.
   - Open Mobile Controller: `http://localhost:3000/play?room=MLN131` in another tab.
   - Choose an avatar, enter a name, click Join. Confirm the new player card immediately pops up on the Host screen.
   - Tap Danmaku reaction emojis on Mobile; verify they fly across the Host screen in real time.
