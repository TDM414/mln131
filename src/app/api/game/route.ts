import { NextRequest, NextResponse } from 'next/server';
import os from 'os';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

function getHostLanIp(): string {
  try {
    const nets = os.networkInterfaces();
    // Prioritize Wi-Fi or Ethernet
    for (const name of Object.keys(nets)) {
      if (name.toLowerCase().includes('wi-fi') || name.toLowerCase().includes('wireless')) {
        for (const net of nets[name] || []) {
          if (net.family === 'IPv4' && !net.internal && !net.address.startsWith('169.254')) {
            return net.address;
          }
        }
      }
    }
    for (const name of Object.keys(nets)) {
      for (const net of nets[name] || []) {
        if (net.family === 'IPv4' && !net.internal && !net.address.startsWith('169.254')) {
          return net.address;
        }
      }
    }
  } catch {}
  return '127.0.0.1';
}

function getAllHostLanIps(): { name: string; ip: string }[] {
  const result: { name: string; ip: string }[] = [];
  try {
    const nets = os.networkInterfaces();
    for (const name of Object.keys(nets)) {
      for (const net of nets[name] || []) {
        if (net.family === 'IPv4' && !net.internal && !net.address.startsWith('169.254')) {
          result.push({ name, ip: net.address });
        }
      }
    }
  } catch {}
  return result;
}
import {
  GameShowState,
  GameEvent,
  Player,
  Round1State,
  Round2State,
  Round3State,
  Round4State,
  calculateSpeedDecayScore,
  FeedComment,
  TrendingPost,
  FactCapQuestion,
  FactCapAnswer,
  DilemmaItem,
  DilemmaTally,
} from '../../../lib/types';
import {
  MLN131_ROAST_PROMPTS,
  MLN131_FACT_OR_CAP_QUESTIONS,
  MLN131_CONSENSUS_DILEMMAS,
  MLN131_QUESTIONS,
  sanitizeRoastText,
} from '../../../data/questions';

interface RoomSession extends GameShowState {
  createdAt: number;
  lastActive: number;
  // Legacy fields for backwards compatibility
  bossHp: number;
  bossMaxHp: number;
  isStunned: boolean;
  activeHazard: string | null;
  whistlesNeeded: number;
  whistlesReceived: number;
}

// In-memory state store for rooms (persists across requests on modern serverless runtimes)
const rooms: Record<string, RoomSession> = {};

function createInitialRound1State(): Round1State {
  const initialPrompt = MLN131_ROAST_PROMPTS[0];
  return {
    phase: 'PROMPT',
    currentPromptIndex: 0,
    prompt: initialPrompt,
    prompts: MLN131_ROAST_PROMPTS,
    comments: {},
    posts: {},
    trendingTopIds: [],
    // Compatibility fields
    submissions: {},
    duels: [],
    currentDuelIndex: 0,
  };
}

function createInitialRound2State(): Round2State {
  return {
    phase: 'COUNTDOWN',
    currentQuestionIndex: 0,
    questions: MLN131_FACT_OR_CAP_QUESTIONS,
    answers: {},
    // Compatibility fields
    currentGameIndex: 0,
    activeGame: {
      type: 'CATCH_REPORT',
      title: 'Tóm Nút Báo Cáo',
      instruction: 'Nút Report đang trốn chạy giữa rừng tin rác! Bấm trúng trước khi hết giờ!',
      timeLimitSec: 5,
    },
    gamesList: [
      {
        type: 'CATCH_REPORT',
        title: 'Tóm Nút Báo Cáo',
        instruction: 'Nút Report đang trốn chạy! Bấm trúng trước khi hết 5 giây!',
        timeLimitSec: 5,
      },
      {
        type: 'SHAKE_OTP',
        title: 'Lắc Lấy Mã Xác Thực OTP',
        instruction: 'Lắc mạnh điện thoại (hoặc chạm liên tục) để giải mã OTP bảo mật!',
        timeLimitSec: 5,
      },
      {
        type: 'DODGE_BRICKS',
        title: 'Né Gạch Đá Drama',
        instruction: 'Gạch đá và comment độc hại đang rơi! Kéo nhân vật sang trái/phải né ngay!',
        timeLimitSec: 5,
      },
      {
        type: 'SPOT_DEEPFAKE',
        title: 'Soi Lỗi Deepfake',
        instruction: 'Ảnh do AI sinh có 1 lỗi giải phẫu quái đản! Chạm vào điểm bất thường!',
        timeLimitSec: 5,
      },
    ],
    survivorIds: [],
    playerResults: {},
  };
}

function createInitialRound3State(): Round3State {
  const initialDilemma = MLN131_CONSENSUS_DILEMMAS[0];
  return {
    phase: 'DILEMMA_INTRO',
    currentDilemmaIndex: 0,
    dilemma: initialDilemma,
    dilemmas: MLN131_CONSENSUS_DILEMMAS,
    stances: {},
    consensusBets: {},
    tally: {
      countA: 0,
      countB: 0,
      percentA: 50,
      percentB: 50,
      majority: 'DRAW',
    },
    // Compatibility fields
    clues: [
      {
        id: 'c1',
        author: 'NickSeeder99',
        content: 'Dự án đầu tư cam kết lãi 30%/tháng do chuyên gia hàng đầu bảo chứng! Inbox ngay kẻo lỡ!',
        engagement: '1,200 haha, 80 bình luận copy-paste giống hệt nhau',
        isBotnetSeeder: true,
        anomalyHint: 'Toàn bộ tài khoản tương tác đều mới tạo dưới 3 ngày và không có avatar.'
      },
      {
        id: 'c2',
        author: 'SinhVienKiemChung',
        content: 'Mọi người cẩn thận! Website này mạo danh cổng thông tin trường học để đánh cắp tài khoản.',
        engagement: '450 share, nhiều giảng viên xác nhận',
        isBotnetSeeder: false,
        anomalyHint: 'Thông tin có đường dẫn kiểm chứng và tên miền chính thống.'
      }
    ],
    nominatedSuspectIds: [],
    votes: {},
  };
}

function createInitialRound4State(): Round4State {
  const triviaQuestions = MLN131_QUESTIONS.slice(0, 5).map((q) => ({
    id: q.id,
    topic: q.topic,
    scenario: q.scenario,
    options: q.options,
    correctAnswer: q.correctAnswer,
    explanation: q.explanation,
    points: 10000,
  }));
  return {
    phase: 'CARD_DRAFT',
    currentQuestionIndex: 0,
    questions: triviaQuestions,
    trivia: triviaQuestions[0],
    activeCards: {},
    activeSabotages: [],
    queuedSkills: {},
    playerAnswers: {},
  };
}

function getOrCreateRoom(roomCode: string): RoomSession {
  const code = roomCode.toUpperCase();
  if (!rooms[code]) {
    rooms[code] = {
      roomCode: code,
      mode: 'TOURNAMENT',
      status: 'LOBBY',
      currentRoundPhase: 'LOBBY_WAITING',
      timer: {
        total: 0,
        remaining: 0,
        active: false,
      },
      players: {},
      roundScores: {
        ROUND_1: {},
        ROUND_2: {},
        ROUND_3: {},
        ROUND_4: {},
      },
      round1State: createInitialRound1State(),
      round2State: createInitialRound2State(),
      round3State: createInitialRound3State(),
      round4State: createInitialRound4State(),
      recentEvents: [],
      devBotConfig: {
        enabled: false,
        botCount: 15,
        reactionSpeed: 'REALISTIC',
        simulatedDanmaku: true,
      },
      createdAt: Date.now(),
      lastActive: Date.now(),
      resetEpoch: Date.now(),
      hostLanIp: getHostLanIp(),
      availableIps: getAllHostLanIps(),
      // Legacy Boss state fields
      bossHp: 1000000,
      bossMaxHp: 1000000,
      isStunned: false,
      activeHazard: null,
      whistlesNeeded: 12,
      whistlesReceived: 0,
    };
  }
  return rooms[code];
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const roomCode = searchParams.get('room') || 'MLN131';
  const since = parseInt(searchParams.get('since') || '0', 10);

  const room = getOrCreateRoom(roomCode);
  room.lastActive = Date.now();
  const currentHostIp = getHostLanIp();
  const currentAvailableIps = getAllHostLanIps();
  room.hostLanIp = currentHostIp;
  room.availableIps = currentAvailableIps;

  // Return state snapshot and incremental delta events since client timestamp
  const newEvents = room.recentEvents.filter((e) => e.timestamp >= since);

  return NextResponse.json(
    {
      roomCode: room.roomCode,
      mode: room.mode,
      status: room.status,
      currentRoundPhase: room.currentRoundPhase,
      timer: room.timer,
      playerCount: Object.keys(room.players).length,
      players: room.players,
      roundScores: room.roundScores,
      round1State: room.round1State,
      round2State: room.round2State,
      round3State: room.round3State,
      round4State: room.round4State,
      devBotConfig: room.devBotConfig,
      resetEpoch: room.resetEpoch,
      hostLanIp: currentHostIp,
      availableIps: currentAvailableIps,
      state: room, // Full GameShowState for state-first clients
      events: newEvents,
      // Legacy Boss fields
      bossHp: room.bossHp,
      bossMaxHp: room.bossMaxHp,
      isStunned: room.isStunned,
      activeHazard: room.activeHazard,
      whistlesNeeded: room.whistlesNeeded,
      whistlesReceived: room.whistlesReceived,
      serverTime: Date.now(),
    },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    }
  );
}

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Malformed or missing JSON payload' },
      { status: 400 }
    );
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json(
      { success: false, error: 'Request body must be a valid JSON object' },
      { status: 400 }
    );
  }

  const roomCode = typeof body.roomCode === 'string' && body.roomCode.trim() ? body.roomCode.trim() : 'MLN131';
  const action = typeof body.action === 'string' ? body.action : '';
  const rawPayload = body.payload !== undefined ? body.payload : body.data;
  const payload = (rawPayload && typeof rawPayload === 'object') ? rawPayload : {};

  const room = getOrCreateRoom(roomCode);
  room.lastActive = Date.now();

  const eventId = Math.random().toString(36).substring(2, 9);
  const timestamp = Date.now();

  // 1. Join Room
  if (action === 'JOIN') {
    const { playerId, name, avatarId = 'keyboard_warrior', isBot = false } = payload;
    const cleanPlayerId = typeof playerId === 'string' && playerId.trim()
      ? playerId.trim()
      : (typeof playerId === 'number' ? String(playerId) : '');
    const cleanName = typeof name === 'string'
      ? name.trim()
      : (typeof name === 'number' ? String(name) : '');
    const cleanAvatar = typeof avatarId === 'string' && avatarId ? avatarId : 'keyboard_warrior';

    if (cleanPlayerId && cleanName) {
      if (!room.players[cleanPlayerId]) {
        room.players[cleanPlayerId] = {
          id: cleanPlayerId,
          name: cleanName,
          avatarId: cleanAvatar,
          score: 0,
          roundScores: {},
          connected: true,
          isBot: Boolean(isBot),
          lastActive: timestamp,
          streak: 0,
          r2Lives: 3,
        };
      } else {
        room.players[cleanPlayerId].name = cleanName;
        room.players[cleanPlayerId].avatarId = cleanAvatar;
        room.players[cleanPlayerId].connected = true;
        room.players[cleanPlayerId].lastActive = timestamp;
      }

      room.recentEvents.push({
        id: eventId,
        type: 'player_join',
        payload: room.players[cleanPlayerId],
        timestamp,
      });
    }
  }

  // 2. Set Game Mode (TOURNAMENT vs FREE_PLAY)
  else if (action === 'SET_MODE') {
    if (payload?.mode === 'TOURNAMENT' || payload?.mode === 'FREE_PLAY') {
      room.mode = payload.mode;
      room.recentEvents.push({
        id: eventId,
        type: 'mode_changed',
        payload: { mode: payload.mode },
        timestamp,
      });
    }
  }

  // 3. Set Game Status (LOBBY, ROUND_1..4, PODIUM)
  else if (action === 'SET_STATUS') {
    if (typeof payload?.status === 'string') {
      room.status = payload.status;
      room.recentEvents.push({
        id: eventId,
        type: 'status_changed',
        payload: { status: payload.status },
        timestamp,
      });
    }
  }

  // 4. Set Round Phase
  else if (action === 'SET_ROUND_PHASE') {
    if (typeof payload?.phase === 'string') {
      const targetPhase = payload.phase;
      room.currentRoundPhase = targetPhase;

      // Round 1 Server-authoritative phase logic
      if (room.status === 'ROUND_1') {
        room.round1State.phase = targetPhase as any;
        if (typeof payload?.currentPromptIndex === 'number') {
          room.round1State.currentPromptIndex = payload.currentPromptIndex;
        }
      }

      // Round 2 Server-authoritative phase logic
      if (room.status === 'ROUND_2') {
        room.round2State.phase = targetPhase as any;

        if (targetPhase === 'REVEAL') {
          // Timeout: record answer with 0 points for any player who didn't submit an answer
          if (!room.round2State.answers) room.round2State.answers = {};
          const answers = room.round2State.answers;
          for (const [pId, player] of Object.entries(room.players)) {
            if (!answers[pId]) {
              answers[pId] = {
                choice: 'CAP',
                timestamp,
                remainingTime: 0,
                isCorrect: false,
                score: 0,
                livesRemaining: 3,
                questionIndex: room.round2State.currentQuestionIndex || 0,
              };
            }
          }
        } else if (targetPhase === 'ROUND_SUMMARY' || targetPhase === 'SUMMARY') {
          // Pure points mode: no surviving lives bonus
        } else if (targetPhase === 'QUESTION_ACTIVE') {
          // New question: reset current question answers
          room.round2State.answers = {};
        }
      }

      // Round 3 Server-authoritative phase logic
      else if (room.status === 'ROUND_3') {
        room.round3State.phase = targetPhase as any;

        if (targetPhase === 'TUG_REVEAL' || targetPhase === 'REVEAL') {
          const allStances = Object.values(room.round3State.stances || {});
          const countA = allStances.filter((s) => s === 'A').length;
          const countB = allStances.filter((s) => s === 'B').length;
          const majority = countA > countB ? 'A' : countB > countA ? 'B' : 'DRAW';
          room.round3State.majoritySide = majority;
          room.round3State.tally = {
            countA,
            countB,
            percentA: allStances.length > 0 ? Math.round((countA / allStances.length) * 100) : 50,
            percentB: allStances.length > 0 ? 100 - Math.round((countA / allStances.length) * 100) : 50,
            majority,
          };

          // Re-evaluate and award consensus bets for all players who guessed correctly
          const bets = room.round3State.consensusBets || {};
          for (const [pId, bet] of Object.entries(bets)) {
            const player = room.players[pId];
            if (player) {
              const wonBet = majority === 'DRAW' || bet === majority;
              if (wonBet) {
                const pChoice = room.round3State.playerChoices?.[pId];
                const remainingTime = pChoice ? Math.max(1000, 20000 - pChoice.timeMs) : 15000;
                const pts = majority === 'DRAW'
                  ? 2500
                  : calculateSpeedDecayScore(5000, remainingTime, 20000, true);

                if (!pChoice?.pointsEarned) {
                  player.score += pts;
                  player.roundScores.ROUND_3 = (player.roundScores.ROUND_3 || 0) + pts;
                  if (!room.round3State.playerChoices) room.round3State.playerChoices = {};
                  room.round3State.playerChoices[pId] = {
                    personalChoice: room.round3State.stances?.[pId] || 'A',
                    betConsensus: bet,
                    timeMs: pChoice?.timeMs || 5000,
                    pointsEarned: pts,
                  };
                }
              }
            }
          }
        } else if (targetPhase === 'VOTING' || targetPhase === 'DILEMMA_INTRO') {
          room.round3State.stances = {};
          room.round3State.consensusBets = {};
          room.round3State.playerChoices = {};
          room.round3State.tally = { countA: 0, countB: 0, percentA: 50, percentB: 50, majority: 'DRAW' };
          if (typeof payload?.currentDilemmaIndex === 'number') {
            room.round3State.currentDilemmaIndex = payload.currentDilemmaIndex;
          }
        }
      }

      // Round 4 Server-authoritative phase logic
      else if (room.status === 'ROUND_4') {
        if (targetPhase === 'CARD_PICK' || targetPhase === 'CARD_DRAFT') {
          room.round4State.phase = 'CARD_DRAFT';
          if (typeof payload?.questionIndex === 'number') {
            room.round4State.currentQuestionIndex = payload.questionIndex;
            room.round4State.trivia = room.round4State.questions[payload.questionIndex];
          }
          // Reset answers and queued skills for this new question
          room.round4State.playerAnswers = {};
          room.round4State.queuedSkills = {};
          for (const p of Object.values(room.players)) {
            if (p.r4Debuffs) {
              p.r4Debuffs.isFrozen = false;
              p.r4Debuffs.eliminatedOptions = undefined;
            }
          }
        } else if (targetPhase === 'CARD_ATTACK') {
          room.round4State.phase = 'CARD_ATTACK';
        } else if (targetPhase === 'QUESTION' || targetPhase === 'TRIVIA_QUESTION') {
          room.round4State.phase = 'TRIVIA_QUESTION';
        } else if (targetPhase === 'REVEAL' || targetPhase === 'ROUND_RESOLUTION') {
          room.round4State.phase = 'ROUND_RESOLUTION';

          // Evaluate queued skills! Only apply if answer is correct!
          const queued = room.round4State.queuedSkills || {};
          const answers = room.round4State.playerAnswers || {};
          const qIdx = room.round4State.currentQuestionIndex || 0;
          const currentQ = room.round4State.questions[qIdx];

          for (const [pId, skill] of Object.entries(queued)) {
            const player = room.players[pId];
            if (!player) continue;

            const pAnswer = answers[pId];
            const isCorrect = pAnswer?.isCorrect ?? false;

            if (isCorrect) {
              skill.status = 'ACTIVATED';

              if (skill.cardType === 'DOUBLE_OR_NOTHING') {
                const baseEarned = pAnswer?.pointsEarned || 0;
                player.score += baseEarned; // Double it!
                player.roundScores.ROUND_4 = (player.roundScores.ROUND_4 || 0) + baseEarned;
                skill.detail = `Nhân đôi thành công! +${baseEarned * 2} PTS`;
              } else if (skill.cardType === 'POINT_HEIST') {
                const targetPlayer = room.players[skill.targetPlayerId];
                if (targetPlayer && targetPlayer.id !== player.id) {
                  // Check if target has CYBER_SHIELD activated
                  const targetSkill = queued[targetPlayer.id];
                  const targetAnswer = answers[targetPlayer.id];
                  const targetShielded = targetSkill?.cardType === 'CYBER_SHIELD' && targetAnswer?.isCorrect;

                  if (targetShielded) {
                    skill.status = 'CANCELLED';
                    skill.detail = `${targetPlayer.name} có Khiên Bảo Vệ chặn đứng!`;
                  } else {
                    const stealAmount = Math.max(1000, Math.min(3500, Math.floor(targetPlayer.score * 0.3)));
                    if (targetPlayer.score > 0) {
                      const actualStolen = Math.min(targetPlayer.score, stealAmount);
                      targetPlayer.score -= actualStolen;
                      targetPlayer.roundScores.ROUND_4 = Math.max(0, (targetPlayer.roundScores.ROUND_4 || 0) - actualStolen);
                      player.score += actualStolen;
                      player.roundScores.ROUND_4 = (player.roundScores.ROUND_4 || 0) + actualStolen;
                      skill.detail = `Cướp thành công +${actualStolen} PTS từ ${targetPlayer.name}!`;
                    } else {
                      skill.detail = `${targetPlayer.name} có 0 điểm, không cướp được gì!`;
                    }
                  }
                }
              } else if (skill.cardType === 'INK_SPLATTER') {
                const targetPlayer = room.players[skill.targetPlayerId];
                if (targetPlayer && targetPlayer.id !== player.id) {
                  const targetSkill = queued[targetPlayer.id];
                  const targetAnswer = answers[targetPlayer.id];
                  const targetShielded = targetSkill?.cardType === 'CYBER_SHIELD' && targetAnswer?.isCorrect;

                  if (targetShielded) {
                    skill.status = 'CANCELLED';
                    skill.detail = `${targetPlayer.name} có Khiên Bảo Vệ chặn mực!`;
                  } else {
                    if (!targetPlayer.r4Debuffs) {
                      targetPlayer.r4Debuffs = { inkWipesLeft: 0, isBlindedByInk: false, multiplier: 1 };
                    }
                    targetPlayer.r4Debuffs.isBlindedByInk = true;
                    targetPlayer.r4Debuffs.inkWipesLeft = 5;
                    skill.detail = `Xịt mực thành công lên ${targetPlayer.name} ở câu tiếp theo!`;
                  }
                }
              } else if (skill.cardType === 'CYBER_SHIELD') {
                skill.detail = `Khiên kích hoạt thành công, bảo vệ an toàn!`;
              } else if (skill.cardType === 'LAG_SPIKE') {
                const targetPlayer = room.players[skill.targetPlayerId];
                if (targetPlayer && targetPlayer.id !== player.id) {
                  const targetSkill = queued[targetPlayer.id];
                  const targetAnswer = answers[targetPlayer.id];
                  const targetShielded = targetSkill?.cardType === 'CYBER_SHIELD' && targetAnswer?.isCorrect;

                  if (targetShielded) {
                    skill.status = 'CANCELLED';
                    skill.detail = `${targetPlayer.name} có Khiên Bảo Vệ chặn Đóng Băng!`;
                  } else {
                    if (!targetPlayer.r4Debuffs) {
                      targetPlayer.r4Debuffs = { inkWipesLeft: 0, isBlindedByInk: false, multiplier: 1 };
                    }
                    targetPlayer.r4Debuffs.isFrozen = true;
                    skill.detail = `Đóng băng phím thành công 3s lên ${targetPlayer.name} ở câu tiếp theo!`;
                  }
                }
              } else if (skill.cardType === 'HACKER_EYE') {
                skill.detail = `Mắt Thần kích hoạt thành công, loại bỏ 2 đáp án sai!`;
              }

              // Append to activeSabotages for projector animation
              room.round4State.activeSabotages.push({
                id: `sab_${Date.now()}_${pId}`,
                fromPlayerId: pId,
                fromPlayerName: player.name,
                targetPlayerId: skill.targetPlayerId,
                cardType: skill.cardType,
                blocked: skill.status === 'CANCELLED',
              });
            } else {
              // Answer was WRONG: Skill is CANCELLED!
              skill.status = 'CANCELLED';
              if (skill.cardType === 'DOUBLE_OR_NOTHING') {
                const penalty = 5000;
                player.score = Math.max(0, player.score - penalty);
                player.roundScores.ROUND_4 = Math.max(0, (player.roundScores.ROUND_4 || 0) - penalty);
                skill.detail = `Trả lời sai: Phạt cược liều -${penalty} PTS!`;
              } else {
                skill.detail = `Trả lời sai: Kỹ năng bị HỦY!`;
              }
            }
          }
        } else if (targetPhase === 'SUMMARY' || targetPhase === 'ROUND_SUMMARY') {
          room.round4State.phase = 'ROUND_SUMMARY';
        } else {
          room.round4State.phase = targetPhase as any;
        }
      }

      room.recentEvents.push({
        id: eventId,
        type: 'phase_changed',
        payload: { phase: targetPhase },
        timestamp,
      });
    }
  }

  // 5. Danmaku Reaction Stream
  else if (action === 'DANMAKU') {
    room.recentEvents.push({
      id: eventId,
      type: 'danmaku',
      payload,
      timestamp,
    });
  }

  // 6. Round 1 / Mode 1: Feed Comment Submission
  else if (action === 'SUBMIT_FEED_COMMENT' || action === 'SUBMIT_COMMENT') {
    const { playerId, text, playerName, avatarId } = payload;
    if (playerId && text && typeof text === 'string') {
      const sanitized = sanitizeRoastText(text);
      const commentId = Math.random().toString(36).substring(2, 9);
      const player = room.players[playerId];
      const authorName = playerName || player?.name || 'Chiến sĩ';
      const authorAvatar = avatarId || player?.avatarId || 'keyboard_warrior';

      const feedComment: FeedComment = {
        id: commentId,
        authorId: playerId,
        authorName,
        avatarId: authorAvatar,
        text: sanitized,
        timestamp,
        promptIndex: typeof payload.promptIndex === 'number' ? payload.promptIndex : (room.round1State?.currentPromptIndex || 0),
        reactions: { heart: 0, tomato: 0, brick: 0 },
        score: 0,
      };

      if (!room.round1State.comments) room.round1State.comments = {};
      room.round1State.comments[commentId] = feedComment;

      const post: TrendingPost = {
        id: commentId,
        playerId,
        playerName: authorName,
        avatarId: authorAvatar,
        text: sanitized,
        timestamp,
        likes: 0,
        tomatoes: 0,
        bricks: 0,
        totalReactions: 0,
      };

      if (!room.round1State.posts) room.round1State.posts = {};
      room.round1State.posts[commentId] = post;

      // Compatibility with roast submissions
      room.round1State.submissions[playerId] = {
        id: commentId,
        playerId,
        playerName: authorName,
        avatarId: authorAvatar,
        text: sanitized,
        timestamp,
      };

      // Award base participation points (+300 PTS) for contributing a comment
      if (playerId && room.players[playerId]) {
        room.players[playerId].score += 300;
        room.players[playerId].roundScores.ROUND_1 =
          (room.players[playerId].roundScores.ROUND_1 || 0) + 300;
      }

      room.recentEvents.push({
        id: eventId,
        type: 'feed_comment_submitted',
        payload: { comment: feedComment, post },
        timestamp,
      });
    }
  }

  // 6b. Round 1 / Mode 1: React to Feed Post (Strict 1-Vote Per Player, No Direct Score Spamming)
  else if (action === 'REACT_FEED_POST' || action === 'REACT_FEED') {
    const { postId, reactionType, voterId } = payload;
    if (postId && reactionType && voterId) {
      const normalizedReaction: 'heart' | 'tomato' | 'brick' =
        reactionType === 'like' || reactionType === 'heart'
          ? 'heart'
          : (reactionType === 'tomato' ? 'tomato' : 'brick');

      const comment = room.round1State.comments?.[postId];
      const post = room.round1State.posts?.[postId];

      if (comment) {
        if (!room.round1State.commentVoters) room.round1State.commentVoters = {};
        if (!room.round1State.commentVoters[postId]) room.round1State.commentVoters[postId] = {};

        const prevReaction = room.round1State.commentVoters[postId][voterId];

        // 1. Same reaction already clicked by this voter: ignore completely (anti-spam)
        if (prevReaction === normalizedReaction) {
          // Do nothing
        }
        // 2. Switching to a different reaction: decrement old, increment new
        else if (prevReaction && prevReaction !== normalizedReaction) {
          comment.reactions[prevReaction] = Math.max(0, (comment.reactions[prevReaction] || 1) - 1);
          comment.reactions[normalizedReaction] = (comment.reactions[normalizedReaction] || 0) + 1;
          room.round1State.commentVoters[postId][voterId] = normalizedReaction;

          if (post) {
            if (prevReaction === 'heart') post.likes = Math.max(0, (post.likes || 1) - 1);
            else if (prevReaction === 'tomato') post.tomatoes = Math.max(0, (post.tomatoes || 1) - 1);
            else if (prevReaction === 'brick') post.bricks = Math.max(0, (post.bricks || 1) - 1);

            if (normalizedReaction === 'heart') post.likes = (post.likes || 0) + 1;
            else if (normalizedReaction === 'tomato') post.tomatoes = (post.tomatoes || 0) + 1;
            else if (normalizedReaction === 'brick') post.bricks = (post.bricks || 0) + 1;
          }
        }
        // 3. First time voting on this comment: increment new reaction and track voter
        else {
          comment.reactions[normalizedReaction] = (comment.reactions[normalizedReaction] || 0) + 1;
          room.round1State.commentVoters[postId][voterId] = normalizedReaction;

          if (post) {
            if (normalizedReaction === 'heart') post.likes = (post.likes || 0) + 1;
            else if (normalizedReaction === 'tomato') post.tomatoes = (post.tomatoes || 0) + 1;
            else if (normalizedReaction === 'brick') post.bricks = (post.bricks || 0) + 1;
            post.totalReactions = (post.totalReactions || 0) + 1;
          }

          // Record voter participation for this prompt (to award +50 PTS after top is determined)
          const pIdx = typeof comment.promptIndex === 'number' ? comment.promptIndex : (room.round1State?.currentPromptIndex || 0);
          if (!room.round1State.promptVoters) room.round1State.promptVoters = {};
          if (!room.round1State.promptVoters[pIdx]) room.round1State.promptVoters[pIdx] = {};
          room.round1State.promptVoters[pIdx][voterId] = true;
        }

        // NOTE: No live score additions during clicks! Points are awarded ONLY after prompt ends in POST_REVEAL!
      }

      // Recompute Top Trending IDs
      const allComments = Object.values(room.round1State.comments || {});
      if (allComments.length > 0) {
        room.round1State.trendingTopIds = allComments
          .sort((a, b) => {
            const sumA = a.reactions.heart + a.reactions.tomato + a.reactions.brick;
            const sumB = b.reactions.heart + b.reactions.tomato + b.reactions.brick;
            return sumB - sumA;
          })
          .slice(0, 5)
          .map((c) => c.id);
      }

      room.recentEvents.push({
        id: eventId,
        type: 'feed_reacted',
        payload: { postId, reactionType: normalizedReaction, voterId, authorId: comment?.authorId },
        timestamp,
      });
    }
  }

  // Legacy Round 1: Roast Submission
  else if (action === 'SUBMIT_ROAST') {
    const { playerId, text } = payload;
    if (playerId && text && typeof text === 'string') {
      room.round1State.submissions[playerId] = payload;
      room.recentEvents.push({
        id: eventId,
        type: 'roast_submitted',
        payload,
        timestamp,
      });
    }
  }

  // Legacy Round 1: Vote Roast Duel
  else if (action === 'VOTE_ROAST') {
    const { duelId, choice, voterId } = payload;
    if (duelId && voterId) {
      const duel = room.round1State.duels.find((d) => d.id === duelId);
      if (duel) {
        if (choice === 'A') {
          duel.votesB = duel.votesB.filter((id) => id !== voterId);
          if (!duel.votesA.includes(voterId)) {
            duel.votesA.push(voterId);
          }
        } else if (choice === 'B') {
          duel.votesA = duel.votesA.filter((id) => id !== voterId);
          if (!duel.votesB.includes(voterId)) {
            duel.votesB.push(voterId);
          }
        }
      }
      room.recentEvents.push({
        id: eventId,
        type: 'vote_cast',
        payload,
        timestamp,
      });
    }
  }

  // 8. Round 2 / Mode 2: Submit Fact or Cap
  else if (action === 'SUBMIT_FACT_OR_CAP') {
    const { choice, reactionTimeMs, remainingTime: clientRemainingTime, totalTime = 10000, playerId, questionIndex } = payload;
    if ((choice === 'FACT' || choice === 'CAP') && playerId && room.players[playerId]) {
      if (room.round2State.answers?.[playerId]) {
        return NextResponse.json({ success: true, timestamp, alreadySubmitted: true });
      }

      const qIdx = typeof questionIndex === 'number' ? questionIndex : (room.round2State.currentQuestionIndex || 0);
      const question = room.round2State.questions?.[qIdx] || MLN131_FACT_OR_CAP_QUESTIONS[0];
      const isCorrect = (question.isFact && choice === 'FACT') || (!question.isFact && choice === 'CAP');

      const remainingTime = typeof clientRemainingTime === 'number'
        ? clientRemainingTime
        : Math.max(0, totalTime - (Number(reactionTimeMs) || 0));

      const pointsEarned = calculateSpeedDecayScore(question.basePoints || 1500, remainingTime, totalTime, isCorrect);

      const player = room.players[playerId];
      player.r2Lives = 3;
      const nextLives = 3;

      if (isCorrect) {
        player.score += pointsEarned;
        player.roundScores.ROUND_2 = (player.roundScores.ROUND_2 || 0) + pointsEarned;
      }

      if (!room.round2State.answers) room.round2State.answers = {};
      room.round2State.answers[playerId] = {
        choice,
        timestamp,
        remainingTime,
        isCorrect,
        score: pointsEarned,
        livesRemaining: nextLives,
        questionIndex: qIdx,
      };

      // Compatibility
      if (!room.round2State.playerResults) room.round2State.playerResults = {};
      room.round2State.playerResults[playerId] = {
        choice,
        success: isCorrect,
        isCorrect,
        reactionTimeMs: totalTime - remainingTime,
        pointsEarned,
        livesRemaining: nextLives,
      };

      room.recentEvents.push({
        id: eventId,
        type: 'fact_or_cap_submitted',
        payload: {
          playerId,
          choice,
          isCorrect,
          pointsEarned,
          livesRemaining: nextLives,
          remainingTime,
        },
        timestamp,
      });
    }
  }

  // Legacy Round 2: 5s Micro-game Result
  else if (action === 'MINIGAME_RESULT') {
    const { playerId, success, reactionTimeMs = 5000 } = payload;
    if (playerId && room.players[playerId]) {
      const isSuccess = Boolean(success);
      const currentLives = room.players[playerId].r2Lives ?? 3;
      const nextLives = isSuccess ? currentLives : Math.max(0, currentLives - 1);
      room.players[playerId].r2Lives = nextLives;

      if (isSuccess) {
        const bonus = Math.max(500, 2000 - (Number(reactionTimeMs) || 0));
        room.players[playerId].score += bonus;
        room.players[playerId].roundScores.ROUND_2 =
          (room.players[playerId].roundScores.ROUND_2 || 0) + bonus;
      }

      room.round2State.playerResults[playerId] = {
        success: isSuccess,
        reactionTimeMs: Number(reactionTimeMs) || 0,
        livesRemaining: nextLives,
      };
      room.recentEvents.push({
        id: eventId,
        type: 'minigame_done',
        payload,
        timestamp,
      });
    }
  }

  // 9a. Round 3 / Mode 3: Dilemma Stance (A or B)
  else if (action === 'SUBMIT_DILEMMA_STANCE') {
    const { stance, playerId } = payload;
    if ((stance === 'A' || stance === 'B') && playerId) {
      if (!room.round3State.stances) room.round3State.stances = {};
      room.round3State.stances[playerId] = stance;

      // Recalculate Tug-of-war tally
      const allStances = Object.values(room.round3State.stances);
      const countA = allStances.filter((s) => s === 'A').length;
      const countB = allStances.filter((s) => s === 'B').length;
      const total = countA + countB;
      const percentA = total > 0 ? Math.round((countA / total) * 100) : 50;
      const percentB = total > 0 ? 100 - percentA : 50;
      const majority = countA > countB ? 'A' : (countB > countA ? 'B' : 'DRAW');

      room.round3State.tally = { countA, countB, percentA, percentB, majority };
      room.round3State.voteCountA = countA;
      room.round3State.voteCountB = countB;
      room.round3State.majoritySide = majority;

      room.recentEvents.push({
        id: eventId,
        type: 'dilemma_stance_submitted',
        payload: { playerId, stance, tally: room.round3State.tally },
        timestamp,
      });
    }
  }

  // 9b. Round 3 / Mode 3: Consensus Bet (Guessed Majority A or B)
  else if (action === 'SUBMIT_DILEMMA_BET') {
    const { bet, predictedMajority, remainingTime = 15000, totalTime = 20000, playerId } = payload;
    const choiceBet = (predictedMajority === 'A' || predictedMajority === 'B')
      ? predictedMajority
      : (bet === 'A' || bet === 'B' ? bet : 'A');

    if (playerId) {
      if (!room.round3State.consensusBets) room.round3State.consensusBets = {};
      room.round3State.consensusBets[playerId] = choiceBet;

      if (!room.round3State.playerChoices) room.round3State.playerChoices = {};
      room.round3State.playerChoices[playerId] = {
        personalChoice: room.round3State.stances?.[playerId] || 'A',
        betConsensus: choiceBet,
        timeMs: Math.max(0, totalTime - remainingTime),
      };

      // Score evaluation if majority is already settled or updated
      const majority = room.round3State.tally?.majority;
      const wonBet = majority && majority !== 'DRAW' && majority === choiceBet;
      const basePoints = 5000;
      const pts = calculateSpeedDecayScore(basePoints, remainingTime, totalTime, Boolean(wonBet));

      if (wonBet && room.players[playerId]) {
        room.players[playerId].score += pts;
        room.players[playerId].roundScores.ROUND_3 =
          (room.players[playerId].roundScores.ROUND_3 || 0) + pts;
        room.round3State.playerChoices[playerId].pointsEarned = pts;
      }

      room.recentEvents.push({
        id: eventId,
        type: 'dilemma_bet_submitted',
        payload: { playerId, bet: choiceBet, pointsEarned: pts, wonBet: Boolean(wonBet) },
        timestamp,
      });
    }
  }

  // Legacy Round 3: Expulsion Vote
  else if (action === 'VOTE_EXILE') {
    const { suspectPlayerId, voterId } = payload;
    if (voterId && suspectPlayerId) {
      room.round3State.votes[voterId] = suspectPlayerId;
      room.recentEvents.push({
        id: eventId,
        type: 'exile_voted',
        payload,
        timestamp,
      });
    }
  }

  // 10. Round 4: Sabotage Card Queueing (Before answering question)
  else if (action === 'PLAY_CARD' || action === 'QUEUE_SKILL') {
    const {
      cardType,
      targetPlayerId,
      targetId,
      fromPlayerId,
      sourceId,
      fromPlayerName,
      sourceName,
      isSelfTarget,
    } = payload;
    const sId = fromPlayerId || sourceId;
    const sName = fromPlayerName || sourceName || 'Ẩn danh';
    const isSelf = Boolean(
      isSelfTarget ||
      cardType === 'DOUBLE_OR_NOTHING' ||
      cardType === 'CYBER_SHIELD' ||
      cardType === 'HACKER_EYE'
    );
    const tId = isSelf ? sId : (targetPlayerId || targetId || sId);
    const targetPlayer = room.players[tId];
    const tName = isSelf ? (sName + ' (Chính mình)') : (targetPlayer?.name || 'Đối thủ');

    if (cardType && sId) {
      if (!room.round4State.queuedSkills) {
        room.round4State.queuedSkills = {};
      }
      room.round4State.queuedSkills[sId] = {
        playerId: sId,
        playerName: sName,
        cardType,
        targetPlayerId: tId,
        targetPlayerName: tName,
        isSelfTarget: isSelf,
        status: 'PENDING',
      };

      room.recentEvents.push({
        id: eventId,
        type: 'card_queued',
        payload: {
          fromPlayerId: sId,
          fromPlayerName: sName,
          targetPlayerId: tId,
          targetPlayerName: tName,
          cardType,
          isSelfTarget: isSelf,
        },
        timestamp,
      });
    }
  }

  // 11. Round 4: Wipe Ink
  else if (action === 'WIPE_INK') {
    const { playerId } = payload;
    if (playerId && room.players[playerId]) {
      const player = room.players[playerId];
      if (player && player.r4Debuffs?.inkWipesLeft) {
        player.r4Debuffs.inkWipesLeft -= 1;
        if (player.r4Debuffs.inkWipesLeft <= 0) {
          player.r4Debuffs.isBlindedByInk = false;
        }
      }
      room.recentEvents.push({
        id: eventId,
        type: 'ink_wiped',
        payload,
        timestamp,
      });
    }
  }

  // 12. Round 4: Submit Trivia Answer (with Speed-Decay scoring)
  else if (action === 'SUBMIT_TRIVIA') {
    const { questionIndex, optionIndex, timeMs, playerId } = payload;
    if (typeof questionIndex === 'number' && typeof optionIndex === 'number' && playerId && room.players[playerId]) {
      const player = room.players[playerId];
      const question = room.round4State.questions[questionIndex];
      if (question) {
        const isCorrect = optionIndex === question.correctAnswer;
        const multiplier = player.r4Debuffs?.multiplier || 1;
        const totalTime = 20000;
        const remainingTime = Math.max(0, totalTime - (Number(timeMs) || 0));
        const pts = calculateSpeedDecayScore(question.points || 10000, remainingTime, totalTime, isCorrect) * multiplier;
        player.score += pts;
        player.roundScores.ROUND_4 = (player.roundScores.ROUND_4 || 0) + pts;

        room.round4State.playerAnswers[playerId] = {
          optionIndex,
          timeMs: Number(timeMs) || 0,
          isCorrect,
          pointsEarned: pts,
        };
      }
      room.recentEvents.push({
        id: eventId,
        type: 'trivia_submitted',
        payload,
        timestamp,
      });
    }
  }

  // 13. Return to Hub (Standalone Mode exit)
  else if (action === 'RETURN_TO_HUB') {
    room.status = 'LOBBY';
    room.currentRoundPhase = 'LOBBY_WAITING';
    room.recentEvents.push({
      id: eventId,
      type: 'returned_to_hub',
      payload: {},
      timestamp,
    });
  }

  // 13. Host General State Patch
  else if (action === 'HOST_UPDATE_STATE') {
    if (payload && typeof payload === 'object') {
      const incomingPlayers = payload.players;
      if (incomingPlayers && typeof incomingPlayers === 'object') {
        for (const [pId, pData] of Object.entries(incomingPlayers as Record<string, any>)) {
          if (!room.players[pId]) {
            room.players[pId] = pData;
          } else {
            const serverP = room.players[pId];
            serverP.score = Math.max(serverP.score || 0, pData.score || 0);
            if (pData.roundScores && typeof pData.roundScores === 'object') {
              const rScores = serverP.roundScores as Record<string, number | undefined>;
              for (const [rKey, rVal] of Object.entries(pData.roundScores)) {
                rScores[rKey] = Math.max(
                  rScores[rKey] || 0,
                  Number(rVal) || 0
                );
              }
            }
            if (pData.r2Lives !== undefined && pData.r2Lives !== null) {
              serverP.r2Lives = Math.min(serverP.r2Lives ?? 3, pData.r2Lives);
            }
            if (pData.r4Debuffs) {
              serverP.r4Debuffs = { ...serverP.r4Debuffs, ...pData.r4Debuffs };
            }
          }
        }
        delete payload.players;
      }

      Object.assign(room, payload);
      room.recentEvents.push({
        id: eventId,
        type: 'state_patched',
        payload,
        timestamp,
      });
    }
  }

  // 14. Reset Game back to Lobby
  else if (action === 'RESET_GAME') {
    room.status = 'LOBBY';
    room.currentRoundPhase = 'LOBBY_WAITING';
    room.resetEpoch = payload?.resetEpoch || timestamp;
    room.round1State = createInitialRound1State();
    room.round2State = createInitialRound2State();
    room.round3State = createInitialRound3State();
    room.round4State = createInitialRound4State();
    // Reset player scores & debuffs
    Object.values(room.players).forEach((p) => {
      p.score = 0;
      p.roundScores = {};
      p.streak = 0;
      p.r2Lives = 3;
      p.r4Debuffs = undefined;
      p.r4Cards = undefined;
    });
    room.recentEvents.push({
      id: eventId,
      type: 'game_reset',
      payload: {},
      timestamp,
    });
  }

  // ==========================================
  // Legacy Actions for Backwards Compatibility
  // ==========================================
  else if (action === 'SUMMON') {
    const { playerId, isCrit } = payload;
    if (playerId && room.players[playerId]) {
      room.players[playerId].score += isCrit ? 5000 : 2500;
    }
    room.recentEvents.push({
      id: eventId,
      type: 'summon',
      payload,
      timestamp,
    });
  } else if (action === 'WHISTLE') {
    const { playerId } = payload;
    if (playerId && room.players[playerId]) {
      room.players[playerId].score += 3000;
    }
    room.whistlesReceived += 1;
    room.recentEvents.push({
      id: eventId,
      type: 'whistle',
      payload,
      timestamp,
    });
  } else if (action === 'TAP') {
    const { playerId, count = 1 } = payload;
    if (playerId && room.players[playerId]) {
      room.players[playerId].score += (Number(count) || 1) * 500;
    }
    room.recentEvents.push({
      id: eventId,
      type: 'tap',
      payload,
      timestamp,
    });
  } else if (action === 'HOST_UPDATE') {
    if (typeof payload?.bossHp === 'number') room.bossHp = payload.bossHp;
    if (payload?.status) room.status = payload.status;
    if (typeof payload?.isStunned === 'boolean') room.isStunned = payload.isStunned;
    if (payload?.activeHazard !== undefined) room.activeHazard = payload.activeHazard;
    if (payload?.round4State && typeof payload.round4State === 'object') {
      room.round4State = {
        ...room.round4State,
        ...payload.round4State,
      };
      if (payload.round4State.phase) {
        room.currentRoundPhase = payload.round4State.phase;
      }
    }
    room.recentEvents.push({
      id: eventId,
      type: 'host_update',
      payload,
      timestamp,
    });
  }

  // Keep ring buffer capped at 120 events
  if (room.recentEvents.length > 120) {
    room.recentEvents = room.recentEvents.slice(room.recentEvents.length - 100);
  }

  return NextResponse.json({ success: true, timestamp });
}
