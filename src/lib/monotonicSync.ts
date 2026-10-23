// Monotonic State Guard for NETIZEN PARTY: ĐẠI HỘI DÂN MẠNG (MLN131 Edition)
// Prevents serverless multi-container desynchronization (flickering/jumping between LOBBY and active rounds)

import { GameShowState, GameStatus } from './types';

export const STATUS_RANK: Record<GameStatus, number> = {
  'LOBBY': 0,
  'ROUND_1': 1,
  'ROUND_2': 2,
  'ROUND_3': 3,
  'ROUND_4': 4,
  'PODIUM': 5,
};

export const R1_PHASE_RANK: Record<string, number> = {
  'PROMPT': 0,
  'PROMPT_BROADCAST': 0,
  'ROAST_INPUT': 0,
  'SUBMITTING': 0,
  'COMMENT_INPUT': 0,
  'FEED_REACTION': 1,
  'POST_REVEAL': 2,
  'TOP_TRENDING': 3,
  'TRENDING_REVEAL': 3,
  'ROUND_SUMMARY': 3,
};

/**
 * Merges incoming partial state with previous state monotonically.
 * Ensures the client NEVER jumps backwards to older phases or loses players
 * even when Vercel serverless functions route requests across different lambda instances.
 */
export function mergeMonotonicState<T extends Partial<GameShowState>>(
  prev: T,
  incoming: Partial<GameShowState>,
  isManualReset: boolean = false
): T {
  if (!incoming) return prev;

  // 1. Session / Epoch Reset: allows resetting back to LOBBY cleanly on F5 or Host reset
  const isNewEpoch = Boolean(
    incoming.resetEpoch && (!prev.resetEpoch || incoming.resetEpoch > prev.resetEpoch)
  );
  if (isManualReset || isNewEpoch) {
    return {
      ...prev,
      ...incoming,
      status: 'LOBBY',
      currentRoundPhase: 'LOBBY_WAITING',
      players: incoming.players || prev.players || {},
      resetEpoch: incoming.resetEpoch || Date.now(),
    } as T;
  }

  // 2. Monotonic Status Guard
  const currentStatus = (prev.status as GameStatus) || 'LOBBY';
  const currentRank = STATUS_RANK[currentStatus] ?? 0;
  const incomingStatus = (incoming.status as GameStatus) || currentStatus;
  const incomingRank = STATUS_RANK[incomingStatus] ?? 0;

  // If incoming rank is lower than current rank, reject downgrade (e.g. ignore LOBBY from cold lambda while playing ROUND_1)
  const targetStatus = incomingRank >= currentRank ? incomingStatus : currentStatus;

  // 3. Accumulative Player Merge (Preserve all active players across lambdas)
  const mergedPlayers = { ...(prev.players || {}) };
  if (incoming.players) {
    for (const [id, incPlayer] of Object.entries(incoming.players)) {
      if (!mergedPlayers[id]) {
        mergedPlayers[id] = incPlayer;
      } else {
        mergedPlayers[id] = {
          ...mergedPlayers[id],
          ...incPlayer,
          score: Math.max(mergedPlayers[id].score || 0, incPlayer.score || 0),
          roundScores: {
            ...mergedPlayers[id].roundScores,
            ...incPlayer.roundScores,
          },
        };
      }
    }
  }

  // 4. Monotonic Round 1 Guard
  let mergedRound1 = prev.round1State ? { ...prev.round1State } : incoming.round1State ? { ...incoming.round1State } : undefined;
  if (incoming.round1State) {
    const incR1 = incoming.round1State;
    const prevPromptIdx = prev.round1State?.currentPromptIndex ?? 0;
    const incPromptIdx = incR1.currentPromptIndex ?? 0;
    const isNewPrompt = incPromptIdx > prevPromptIdx;

    let targetPhase = prev.round1State?.phase || 'PROMPT';
    if (isNewPrompt) {
      // Advancing to next prompt: allow returning to PROMPT phase
      targetPhase = incR1.phase || 'PROMPT';
    } else if (incPromptIdx === prevPromptIdx) {
      // Within the same prompt: enforce monotonic progression
      const currentPhaseRank = R1_PHASE_RANK[prev.round1State?.phase || 'PROMPT'] ?? 0;
      const incPhaseRank = R1_PHASE_RANK[incR1.phase || 'PROMPT'] ?? 0;
      targetPhase = incPhaseRank >= currentPhaseRank ? (incR1.phase || 'PROMPT') : (prev.round1State?.phase || 'PROMPT');
    }

    mergedRound1 = {
      ...(prev.round1State || {}),
      ...incR1,
      phase: targetPhase,
      currentPromptIndex: Math.max(prevPromptIdx, incPromptIdx),
      comments: {
        ...(prev.round1State?.comments || {}),
        ...(incR1.comments || {}),
      },
      commentVoters: {
        ...(prev.round1State?.commentVoters || {}),
        ...(incR1.commentVoters || {}),
      },
      promptVoters: {
        ...(prev.round1State?.promptVoters || {}),
        ...(incR1.promptVoters || {}),
      },
      submissions: {
        ...(prev.round1State?.submissions || {}),
        ...(incR1.submissions || {}),
      },
    } as any;
  }

  // 5. Monotonic Round 2 Guard (Question answers MUST reset when question advances)
  let mergedRound2 = prev.round2State ? { ...prev.round2State } : incoming.round2State ? { ...incoming.round2State } : undefined;
  if (incoming.round2State) {
    const prevQIdx = prev.round2State?.currentQuestionIndex ?? 0;
    const incQIdx = incoming.round2State.currentQuestionIndex ?? 0;
    const isNewQuestion = incQIdx > prevQIdx;

    mergedRound2 = {
      ...(prev.round2State || {}),
      ...incoming.round2State,
      currentQuestionIndex: Math.max(prevQIdx, incQIdx),
      answers: isNewQuestion
        ? (incoming.round2State.answers || {})
        : {
            ...(prev.round2State?.answers || {}),
            ...(incoming.round2State.answers || {}),
          },
    } as any;
  }

  // 6. Monotonic Round 3 Guard (Stances, bets, and choices MUST reset when dilemma advances)
  let mergedRound3 = prev.round3State ? { ...prev.round3State } : incoming.round3State ? { ...incoming.round3State } : undefined;
  if (incoming.round3State) {
    const prevDIdx = prev.round3State?.currentDilemmaIndex ?? 0;
    const incDIdx = incoming.round3State.currentDilemmaIndex ?? 0;
    const isNewDilemma = incDIdx !== prevDIdx;

    mergedRound3 = {
      ...(prev.round3State || {}),
      ...incoming.round3State,
      currentDilemmaIndex: incDIdx,
      stances: isNewDilemma
        ? (incoming.round3State.stances || {})
        : {
            ...(prev.round3State?.stances || {}),
            ...(incoming.round3State.stances || {}),
          },
      consensusBets: isNewDilemma
        ? (incoming.round3State.consensusBets || {})
        : {
            ...(prev.round3State?.consensusBets || {}),
            ...(incoming.round3State.consensusBets || {}),
          },
      playerChoices: isNewDilemma
        ? (incoming.round3State.playerChoices || {})
        : {
            ...(prev.round3State?.playerChoices || {}),
            ...(incoming.round3State.playerChoices || {}),
          },
    } as any;
  }

  // 7. Monotonic Round 4 Guard (Per-question answers and skills MUST reset when advancing)
  let mergedRound4 = prev.round4State ? { ...prev.round4State } : incoming.round4State ? { ...incoming.round4State } : undefined;
  if (incoming.round4State) {
    const prevQIdx = prev.round4State?.currentQuestionIndex ?? 0;
    const incQIdx = incoming.round4State.currentQuestionIndex ?? 0;
    const isNewQuestion = incQIdx > prevQIdx;

    mergedRound4 = {
      ...(prev.round4State || {}),
      ...incoming.round4State,
      currentQuestionIndex: Math.max(prevQIdx, incQIdx),
      playerAnswers: isNewQuestion
        ? (incoming.round4State.playerAnswers || {})
        : {
            ...(prev.round4State?.playerAnswers || {}),
            ...(incoming.round4State.playerAnswers || {}),
          },
      queuedSkills: isNewQuestion
        ? (incoming.round4State.queuedSkills || {})
        : {
            ...(prev.round4State?.queuedSkills || {}),
            ...(incoming.round4State.queuedSkills || {}),
          },
    } as any;
  }

  return {
    ...prev,
    ...incoming,
    status: targetStatus,
    currentRoundPhase:
      incomingRank >= currentRank
        ? incoming.currentRoundPhase || prev.currentRoundPhase
        : prev.currentRoundPhase,
    players: mergedPlayers,
    round1State: mergedRound1,
    round2State: mergedRound2,
    round3State: mergedRound3,
    round4State: mergedRound4,
  } as T;
}
