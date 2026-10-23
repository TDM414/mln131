// Master Type Definitions for NETIZEN PARTY: ĐẠI HỘI DÂN MẠNG (MLN131 Edition)

// ==========================================
// 1. Core Game Show & Room Enums
// ==========================================
export type GameMode = 'TOURNAMENT' | 'FREE_PLAY';

export type GameStatus =
  | 'LOBBY'
  | 'ROUND_1'
  | 'ROUND_2'
  | 'ROUND_3'
  | 'ROUND_4'
  | 'PODIUM';

// ==========================================
// 2. Player Data Model
// ==========================================
export interface Player {
  id: string;
  name: string;
  avatarId: string; // key from NETIZEN_AVATARS (e.g., 'keyboard_warrior')
  score: number;
  totalScore?: number;
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
  // Transient round-specific state
  r2Lives?: number; // 3 lives in Round 2
  r3Role?: 'NETIZEN' | 'SEEDER'; // Secret role in Round 3
  r4Cards?: SabotageCardType[]; // Hand in Round 4
  r4Debuffs?: {
    isBlindedByInk?: boolean;
    inkWipesLeft?: number;
    multiplier?: number; // 2 for double or nothing
    hasShield?: boolean;
    isFrozen?: boolean;
    frozenUntil?: number;
    eliminatedOptions?: number[];
  };
}

// ==========================================
// Master Speed-Decay Scoring Engine
// ==========================================
export function calculateSpeedDecayScore(
  basePoints: number,
  remainingTime: number,
  totalTime: number,
  isCorrect: boolean
): number {
  if (!isCorrect) return 0;
  if (totalTime <= 0) return 0;
  return Math.round(basePoints * Math.max(0, Math.min(1, remainingTime / totalTime)));
}

// ==========================================
// 3. Round 1 / Mode 1: Tường Bình Luận Triệu Like (Trending Feed Wall)
// ==========================================
export type Round1Phase =
  | 'PROMPT_BROADCAST'
  | 'ROAST_INPUT'
  | 'DUEL_SHOWDOWN'
  | 'VOTE_ACTIVE'
  | 'VAR_REVEAL'
  | 'ROUND_SUMMARY'
  // Mode 1 Restructured Phases
  | 'PROMPT'
  | 'SUBMITTING'
  | 'COMMENT_INPUT'
  | 'FEED_REACTION'
  | 'POST_REVEAL'
  | 'TOP_TRENDING'
  | 'TRENDING_REVEAL';

export interface PromptItem {
  id: string;
  situation: string;
  category: string;
  context: string;
  // Realistic Mock Social Post additions
  platform?: 'threads' | 'facebook' | 'confessions' | 'tiktok';
  authorName?: string;
  authorHandle?: string;
  authorBadge?: string;
  authorAvatar?: string;
  timeAgo?: string;
  postTag?: string;
  mockStats?: {
    likes: string;
    comments: string;
    shares: string;
  };
  baitComment?: {
    author: string;
    handle: string;
    avatarId?: string;
    text: string;
    likes: string;
  };
  starterTemplates?: string[];
}

export type RoastPrompt = PromptItem;

export interface FeedComment {
  id: string;
  authorId: string;
  authorName: string;
  avatarId?: string;
  text: string;
  timestamp?: number;
  promptIndex?: number;
  reactions: {
    heart: number;
    tomato: number;
    brick: number;
  };
  score: number;
}

export interface TrendingPost {
  id: string;
  playerId: string;
  playerName: string;
  avatarId: string;
  text: string;
  timestamp: number;
  likes: number; // ❤️
  tomatoes: number; // 🍅
  bricks: number; // 🧱
  totalReactions: number;
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
  votesA: string[]; // playerIds
  votesB: string[]; // playerIds
  winnerId?: string;
  revealed?: boolean;
}

export interface Round1State {
  phase: Round1Phase;
  currentPromptIndex: number;
  prompt?: PromptItem;
  prompts?: RoastPrompt[];
  comments?: Record<string, FeedComment>;
  posts?: Record<string, TrendingPost>;
  trendingTopIds?: string[];
  // Backwards compatibility for Quiplash duel flow
  submissions: Record<string, RoastSubmission>;
  duels: DuelPair[];
  currentDuelIndex: number;
}

export type TrendingState = Round1State;

// ==========================================
// 4. Round 2 / Mode 2: Đại Chiến Bóc Phốt 5 Giây (Fact or Cap 5s Reflex)
// ==========================================
export type Round2Phase =
  | 'INTRO'
  | 'PLAYING'
  | 'RESULT'
  | 'ROUND_OVER'
  | 'MICRO_INTRO'
  | 'MICRO_PLAYING'
  | 'MICRO_RESULT'
  | 'ROUND_SUMMARY'
  // Mode 2 Restructured Phases
  | 'COUNTDOWN'
  | 'QUESTION'
  | 'QUESTION_ACTIVE'
  | 'QUESTION_RESULT'
  | 'REVEAL'
  | 'SUMMARY';

export interface FactCapQuestion {
  id: number;
  statement: string;
  isFact: boolean; // true = FACT, false = CAP
  explanation: string;
  category?: string;
  basePoints: number;
}

export type FactOrCapQuestion = FactCapQuestion;

export interface FactCapAnswer {
  choice: 'FACT' | 'CAP';
  timestamp: number;
  remainingTime: number;
  isCorrect: boolean;
  score: number;
  livesRemaining?: number;
  questionIndex?: number;
}

export type MiniGameType =
  | 'CATCH_REPORT'
  | 'SHAKE_OTP'
  | 'DODGE_BRICKS'
  | 'SPOT_DEEPFAKE';

export interface CatchReportPayload {
  postAuthor: string;
  postContent: string;
  decoys: string[];
}

export interface ShakeOtpPayload {
  otpCode: string;
  targetShakes: number;
  targetTaps: number;
}

export interface DodgeBricksPayload {
  hazardTypes: Array<{ icon: string; label: string; speed: number }>;
  spawnRateMs: number;
}

export interface SpotDeepfakePayload {
  glitchLabel: string;
  glitchHint: string;
  hotspot: { x: number; y: number; radius: number }; // normalized percent (0-100)
}

export interface MiniGameConfig {
  id?: string;
  type: MiniGameType;
  title: string;
  instruction: string;
  timeLimitSec: number;
  data?: CatchReportPayload | ShakeOtpPayload | DodgeBricksPayload | SpotDeepfakePayload | any;
}

export interface Round2State {
  phase: Round2Phase;
  currentQuestionIndex?: number;
  questions?: FactCapQuestion[];
  answers?: Record<string, FactCapAnswer>;
  // Backwards compatibility for WarioWare mini-games
  currentGameIndex: number;
  activeGame: MiniGameConfig;
  gamesList: MiniGameConfig[];
  survivorIds: string[];
  lives?: Record<string, number>; // playerId -> remaining lives (0 to 3)
  playerResults: Record<
    string,
    {
      choice?: 'FACT' | 'CAP';
      success?: boolean;
      isCorrect?: boolean;
      reactionTimeMs: number;
      pointsEarned?: number;
      livesRemaining: number;
    }
  >;
}

export type FactCapState = Round2State;

// ==========================================
// 5. Round 3 / Mode 3: Trưng Cầu Dân Ý: Đoán Phe Đa Số (The Consensus Dilemma)
// ==========================================
export type Round3Phase =
  | 'ROLE_ASSIGNMENT'
  | 'CLUE_DISCOVERY'
  | 'HOT_SEAT_DEBATE'
  | 'EXPULSION_VOTE'
  | 'VAR_VERDICT'
  | 'ROUND_SUMMARY'
  // Mode 3 Restructured Phases
  | 'DILEMMA_INTRO'
  | 'VOTING'
  | 'VOTE_AND_BET'
  | 'TUG_REVEAL'
  | 'TUG_OF_WAR_REVEAL'
  | 'SUMMARY';

export interface DilemmaItem {
  id: number;
  title: string;
  topic?: string;
  scenario: string;
  choiceA: string | { text: string; label: string };
  choiceB: string | { text: string; label: string };
  contextMLN131?: string;
}

export type ConsensusDilemma = DilemmaItem;

export interface DilemmaTally {
  countA: number;
  countB: number;
  percentA: number;
  percentB: number;
  majority: 'A' | 'B' | 'DRAW';
}

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
  currentDilemmaIndex?: number;
  dilemma?: DilemmaItem;
  dilemmas?: DilemmaItem[];
  stances?: Record<string, 'A' | 'B'>;
  consensusBets?: Record<string, 'A' | 'B'>;
  tally?: DilemmaTally;
  // Backwards compatibility for Social Deduction mode
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
  playerChoices?: Record<
    string,
    {
      personalChoice: 'A' | 'B';
      betConsensus: 'A' | 'B';
      timeMs: number;
      pointsEarned?: number;
    }
  >;
  voteCountA?: number;
  voteCountB?: number;
  majoritySide?: 'A' | 'B' | 'TIE' | 'DRAW';
}

export type DilemmaState = Round3State;

// ==========================================
// 6. Round 4 / Mode 4: Đấu Trường Chơi Xấu Cướp Điểm (Sabotage Trivia)
// ==========================================
export type SabotageCardType =
  | 'INK_SPLATTER'
  | 'POINT_HEIST'
  | 'TROLL_QUESTION'
  | 'DOUBLE_OR_NOTHING'
  | 'CYBER_SHIELD'
  | 'LAG_SPIKE'
  | 'HACKER_EYE';

export interface SabotageCard {
  id: string;
  type: SabotageCardType;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export type Round4Phase =
  | 'CARD_DRAFT'
  | 'CARD_ATTACK'
  | 'TRIVIA_QUESTION'
  | 'ROUND_RESOLUTION'
  | 'ROUND_SUMMARY'
  // Mode 4 Restructured Phases
  | 'CARD_PICK'
  | 'QUESTION'
  | 'REVEAL'
  | 'SUMMARY';

export interface TriviaQuestion {
  id: number;
  topic: string;
  scenario: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  points: number;
}

export interface QueuedSkill {
  playerId: string;
  playerName: string;
  cardType: SabotageCardType;
  targetPlayerId: string;
  targetPlayerName: string;
  isSelfTarget?: boolean;
  status?: 'PENDING' | 'ACTIVATED' | 'CANCELLED';
  detail?: string;
}

export interface Round4State {
  phase: Round4Phase;
  currentQuestionIndex: number;
  questions: TriviaQuestion[];
  trivia?: TriviaQuestion;
  activeCards?: Record<string, SabotageCard>;
  queuedSkills?: Record<string, QueuedSkill>;
  activeSabotages: Array<{
    id: string;
    fromPlayerId: string;
    fromPlayerName: string;
    targetPlayerId: string;
    cardType: SabotageCardType;
    blocked?: boolean;
  }>;
  playerAnswers: Record<
    string,
    {
      optionIndex: number;
      timeMs: number;
      isCorrect: boolean;
      pointsEarned: number;
    }
  >;
}

export type TriviaState = Round4State;

// ==========================================
// 7. Danmaku Floating Reactions
// ==========================================
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

// ==========================================
// 8. Dev Bot Simulator Config
// ==========================================
export interface DevBotConfig {
  enabled: boolean;
  botCount: number;
  reactionSpeed: 'FAST' | 'REALISTIC' | 'CHAOTIC';
  simulatedDanmaku: boolean;
}

// ==========================================
// 9. Master Game Show State
// ==========================================
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
  hostLanIp?: string;
  availableIps?: { name: string; ip: string }[];
  resetEpoch?: number;
}

export interface GameEvent {
  id: string;
  type: string;
  payload: any;
  timestamp: number;
}

// ==========================================
// 10. Backwards Compatibility Aliases
// ==========================================
export interface QuizQuestion {
  id: number;
  topic: string;
  scenario: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export type MinionRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface MinionUnit {
  id: string;
  typeId: string;
  name: string;
  rarity: MinionRarity;
  playerName: string;
  hp: number;
  maxHp: number;
  damage: number;
  attackSpeed: number;
  lastAttack: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  color: string;
  icon: string;
  specialEffect?: string;
  isMega?: boolean;
}

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

export interface BossState {
  name: string;
  title: string;
  hp: number;
  maxHp: number;
  phase: 1 | 2 | 3;
  isStunned: boolean;
  stunTimer: number;
  isChanneling: boolean;
  channelSkillName: string;
  channelTimer: number;
  whistlesNeeded: number;
  whistlesReceived: number;
  attackCooldown: number;
  lastAttackTime: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PlayerStats {
  id: string;
  name: string;
  score: number;
  correctAnswers: number;
  streak: number;
  whistlesBlown: number;
  tapsInFrenzy: number;
  lastActive: number;
  summonedCount: number;
}

export interface Projectile {
  id: string;
  startX: number;
  startY: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  damage: number;
  color: string;
  playerName: string;
  isCrit: boolean;
}

export interface DamagePopup {
  id: string;
  x: number;
  y: number;
  damage: number;
  isCrit: boolean;
  playerName: string;
  createdAt: number;
}

export interface GameState {
  roomCode: string;
  status: 'lobby' | 'playing' | 'victory' | 'defeat';
  boss: BossState;
  players: Record<string, PlayerStats>;
  units: MinionUnit[];
  activeHazard: string | null;
  totalDamageDealt: number;
  megaFusionCount: Record<string, number>;
  consensusStreak: number;
  startTime: number;
}
