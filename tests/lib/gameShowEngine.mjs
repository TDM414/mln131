// tests/lib/gameShowEngine.mjs
import { MOCK_AVATARS, MOCK_R1_PROMPTS, MOCK_R2_MINIGAMES, MOCK_SABOTAGE_CARDS, DEV_BOT_NAMES } from '../fixtures/mockData.mjs';

export class GameShowEngine {
  constructor(roomCode = 'MLN131') {
    this.roomCode = roomCode;
    this.mode = 'TOURNAMENT'; // 'TOURNAMENT' | 'FREE_PLAY'
    this.status = 'LOBBY'; // 'LOBBY' | 'ROUND_1' | 'ROUND_2' | 'ROUND_3' | 'ROUND_4' | 'PODIUM'
    this.currentPhase = 'IDLE';
    this.timer = { total: 0, remaining: 0, active: false };
    this.players = new Map();
    this.roundScores = {
      ROUND_1: {},
      ROUND_2: {},
      ROUND_3: {},
      ROUND_4: {}
    };
    this.events = [];
    this.eventCounter = 0;

    // Round 1 State
    this.r1 = {
      activePrompt: null,
      submissions: new Map(), // playerId -> roastText
      duels: [],
      votes: new Map(), // duelId -> Map<voterId, 'A' | 'B'>
      danmaku: []
    };

    // Round 2 State
    this.r2 = {
      activeMiniGame: null,
      lives: new Map(), // playerId -> number (default 3)
      results: new Map() // playerId -> { success, timeMs }
    };

    // Round 3 State
    this.r3 = {
      roles: new Map(), // playerId -> 'NETIZEN' | 'SEEDER'
      messages: [],
      votes: new Map(), // voterId -> suspectId
      expelledPlayers: new Set()
    };

    // Round 4 State
    this.r4 = {
      cards: new Map(), // playerId -> cardId[]
      shields: new Set(), // playerIds with active shield
      inkSplats: new Map(), // playerId -> remainingWipes
      activeBets: new Set(), // playerIds with 2x bet
      trolledPlayers: new Set(), // playerIds with jumbled question
      triviaAnswers: new Map() // playerId -> { questionId, answerIndex, correct }
    };
  }

  emitEvent(type, payload) {
    this.eventCounter++;
    const event = {
      id: `evt_${this.eventCounter}_${Date.now()}`,
      type,
      payload,
      timestamp: Date.now()
    };
    this.events.push(event);
    if (this.events.length > 500) {
      this.events = this.events.slice(-300);
    }
    return event;
  }

  // Sanitization utility
  sanitizeInput(text) {
    if (typeof text !== 'string') return '';
    return text
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .trim();
  }

  // --- Hub & Lobby ---
  setMode(newMode) {
    if (newMode !== 'TOURNAMENT' && newMode !== 'FREE_PLAY') {
      throw new Error(`Invalid mode: ${newMode}`);
    }
    this.mode = newMode;
    this.emitEvent('MODE_CHANGED', { mode: this.mode });
  }

  joinPlayer(playerId, rawName, avatarId = 'keyboard_warrior') {
    if (!playerId) throw new Error('Player ID required');
    const name = this.sanitizeInput(rawName) || `Netizen_${playerId.slice(0, 4)}`;
    const avatar = MOCK_AVATARS.find(a => a.id === avatarId) || MOCK_AVATARS[0];

    const player = {
      id: playerId,
      name,
      avatar,
      totalScore: 0,
      isBot: false,
      connected: true,
      joinedAt: Date.now()
    };

    this.players.set(playerId, player);
    this.emitEvent('PLAYER_JOINED', { player });
    return player;
  }

  toggleBots(count = 16) {
    let added = 0;
    for (let i = 0; i < count; i++) {
      const botId = `bot_${i + 1}`;
      if (!this.players.has(botId)) {
        const botName = DEV_BOT_NAMES[i % DEV_BOT_NAMES.length];
        const avatar = MOCK_AVATARS[i % MOCK_AVATARS.length];
        const botPlayer = {
          id: botId,
          name: botName,
          avatar,
          totalScore: 0,
          isBot: true,
          connected: true,
          joinedAt: Date.now()
        };
        this.players.set(botId, botPlayer);
        added++;
      }
    }
    this.emitEvent('BOTS_SPAWNED', { count: added, totalPlayers: this.players.size });
    return added;
  }

  // --- Round 1: Cà Khịa & Check VAR ---
  startRound1(promptIndex = 0) {
    this.status = 'ROUND_1';
    this.currentPhase = 'PROMPT';
    this.r1.activePrompt = MOCK_R1_PROMPTS[promptIndex % MOCK_R1_PROMPTS.length];
    this.r1.submissions.clear();
    this.r1.duels = [];
    this.r1.votes.clear();
    this.r1.danmaku = [];
    this.emitEvent('R1_STARTED', { prompt: this.r1.activePrompt });
  }

  submitRoast(playerId, roastText) {
    if (this.status !== 'ROUND_1' || this.currentPhase !== 'PROMPT') {
      throw new Error('Roast submission is closed');
    }
    if (!this.players.has(playerId)) {
      throw new Error('Player not in room');
    }
    const sanitized = this.sanitizeInput(roastText);
    const clamped = sanitized.slice(0, 120);
    const finalRoast = clamped.length > 0 ? clamped : 'Ủa alo? Không biết nói gì luôn!';

    this.r1.submissions.set(playerId, finalRoast);
    this.emitEvent('ROAST_SUBMITTED', { playerId, length: finalRoast.length });
    return finalRoast;
  }

  pairDuels() {
    this.currentPhase = 'DUEL';
    const playerIds = Array.from(this.r1.submissions.keys());
    if (playerIds.length < 2) {
      // Autocomplete dummy duel if not enough roasts
      this.r1.duels.push({
        id: 'duel_demo',
        candidateA: { playerId: playerIds[0] || 'bot_1', roast: this.r1.submissions.get(playerIds[0]) || 'Phản bác mẫu' },
        candidateB: { playerId: 'bot_2', roast: 'Lập luận sắc bén bảo vệ chính nghĩa!' },
        resolved: false
      });
    } else {
      for (let i = 0; i < playerIds.length - 1; i += 2) {
        this.r1.duels.push({
          id: `duel_${Math.floor(i / 2) + 1}`,
          candidateA: { playerId: playerIds[i], roast: this.r1.submissions.get(playerIds[i]) },
          candidateB: { playerId: playerIds[i + 1], roast: this.r1.submissions.get(playerIds[i + 1]) },
          resolved: false
        });
      }
    }
    this.emitEvent('DUELS_PAIRED', { count: this.r1.duels.length });
    return this.r1.duels;
  }

  sendDanmaku(playerId, reactionType) {
    const validReactions = ['tomato', 'heart', 'brick', 'clown'];
    if (!validReactions.includes(reactionType)) {
      throw new Error(`Invalid reaction: ${reactionType}`);
    }
    const item = {
      id: `danmaku_${Date.now()}_${Math.random()}`,
      playerId,
      reactionType,
      timestamp: Date.now()
    };
    this.r1.danmaku.push(item);
    this.emitEvent('DANMAKU_BURST', item);
    return item;
  }

  voteRoast(voterId, duelId, choice) {
    if (this.currentPhase !== 'DUEL') {
      throw new Error('Voting is not open');
    }
    if (choice !== 'A' && choice !== 'B') {
      throw new Error('Vote choice must be A or B');
    }
    if (!this.r1.votes.has(duelId)) {
      this.r1.votes.set(duelId, new Map());
    }
    const duelVotes = this.r1.votes.get(duelId);
    // Single vote check
    if (duelVotes.has(voterId)) {
      throw new Error('Already voted for this duel');
    }
    duelVotes.set(voterId, choice);
    this.emitEvent('VOTE_CAST', { voterId, duelId, choice });
  }

  resolveDuel(duelId) {
    const duel = this.r1.duels.find(d => d.id === duelId);
    if (!duel) throw new Error('Duel not found');
    const duelVotes = this.r1.votes.get(duelId) || new Map();

    let votesA = 0;
    let votesB = 0;
    for (const choice of duelVotes.values()) {
      if (choice === 'A') votesA++;
      else if (choice === 'B') votesB++;
    }

    let winnerId = null;
    let pointsA = 0;
    let pointsB = 0;

    if (votesA > votesB) {
      winnerId = duel.candidateA.playerId;
      pointsA = 1000;
      pointsB = 250;
    } else if (votesB > votesA) {
      winnerId = duel.candidateB.playerId;
      pointsB = 1000;
      pointsA = 250;
    } else {
      // Tie
      winnerId = 'TIE';
      pointsA = 500;
      pointsB = 500;
    }

    this.awardPoints('ROUND_1', duel.candidateA.playerId, pointsA);
    this.awardPoints('ROUND_1', duel.candidateB.playerId, pointsB);
    duel.resolved = true;

    const result = {
      duelId,
      votesA,
      votesB,
      winnerId,
      pointsA,
      pointsB
    };
    this.emitEvent('VAR_REVEALED', result);
    return result;
  }

  // --- Round 2: 5s WarioWare Micro-Games ---
  startRound2(minigameId = 'catch_report') {
    this.status = 'ROUND_2';
    this.currentPhase = 'PLAYING_5S';
    this.r2.activeMiniGame = MOCK_R2_MINIGAMES.find(g => g.id === minigameId) || MOCK_R2_MINIGAMES[0];
    this.r2.results.clear();

    // Initialize 3 lives for each player
    for (const pid of this.players.keys()) {
      if (!this.r2.lives.has(pid)) {
        this.r2.lives.set(pid, 3);
      }
    }

    this.timer = { total: 5000, remaining: 5000, active: true };
    this.emitEvent('R2_STARTED', { miniGame: this.r2.activeMiniGame });
  }

  submitMinigameResult(playerId, success, timeElapsedMs) {
    if (this.status !== 'ROUND_2' || this.currentPhase !== 'PLAYING_5S') {
      throw new Error('Mini-game is not in active 5s phase');
    }
    const currentLives = this.r2.lives.get(playerId) || 0;
    if (currentLives <= 0) {
      throw new Error('Player already eliminated in Round 2');
    }

    const isWithinTime = timeElapsedMs <= 5000 && timeElapsedMs >= 0;
    const finalSuccess = success && isWithinTime;

    let pointsEarned = 0;
    let newLives = currentLives;

    if (finalSuccess) {
      pointsEarned = Math.max(100, Math.round((5000 - timeElapsedMs) / 5)); // Faster = more points
      this.awardPoints('ROUND_2', playerId, pointsEarned);
    } else {
      newLives = Math.max(0, currentLives - 1);
      this.r2.lives.set(playerId, newLives);
    }

    const record = { success: finalSuccess, timeElapsedMs, remainingLives: newLives, pointsEarned };
    this.r2.results.set(playerId, record);
    this.emitEvent('MINIGAME_COMPLETED', { playerId, record });
    return record;
  }

  // --- Round 3: Seeder vs Netizen Deduction ---
  startRound3(forcedSeederRatio = 0.15) {
    this.status = 'ROUND_3';
    this.currentPhase = 'INVESTIGATION';
    this.r3.roles.clear();
    this.r3.messages = [];
    this.r3.votes.clear();
    this.r3.expelledPlayers.clear();

    const pids = Array.from(this.players.keys());
    const seederCount = Math.max(1, Math.round(pids.length * forcedSeederRatio));

    // Shuffle and assign
    const shuffled = [...pids].sort(() => 0.5 - Math.random());
    shuffled.forEach((pid, idx) => {
      this.r3.roles.set(pid, idx < seederCount ? 'SEEDER' : 'NETIZEN');
    });

    this.emitEvent('R3_STARTED', { totalPlayers: pids.length, seederCount });
  }

  postDiscussion(playerId, rawMessage) {
    if (this.r3.expelledPlayers.has(playerId)) {
      throw new Error('Expelled players cannot speak in discussion');
    }
    const message = this.sanitizeInput(rawMessage);
    if (!message) throw new Error('Message cannot be empty');

    const msgEntry = {
      id: `msg_${Date.now()}_${Math.random()}`,
      playerId,
      message,
      timestamp: Date.now()
    };
    this.r3.messages.push(msgEntry);
    this.emitEvent('DISCUSSION_POSTED', msgEntry);
    return msgEntry;
  }

  castExpulsionVote(voterId, suspectId) {
    if (this.currentPhase !== 'EXPULSION_VOTE' && this.currentPhase !== 'INVESTIGATION') {
      throw new Error('Expulsion voting is closed');
    }
    if (this.r3.expelledPlayers.has(voterId)) {
      throw new Error('Expelled players cannot vote');
    }
    if (voterId === suspectId) {
      throw new Error('Cannot vote to expel yourself');
    }
    this.r3.votes.set(voterId, suspectId);
    this.emitEvent('EXPULSION_VOTE_CAST', { voterId, suspectId });
  }

  resolveExpulsion() {
    this.currentPhase = 'EXILE_VAR';
    const tally = new Map();
    for (const suspectId of this.r3.votes.values()) {
      tally.set(suspectId, (tally.get(suspectId) || 0) + 1);
    }

    let mostVotedId = null;
    let maxVotes = 0;
    for (const [suspectId, count] of tally.entries()) {
      if (count > maxVotes) {
        maxVotes = count;
        mostVotedId = suspectId;
      }
    }

    let expelledRole = null;
    if (mostVotedId && maxVotes > 0) {
      this.r3.expelledPlayers.add(mostVotedId);
      expelledRole = this.r3.roles.get(mostVotedId);
      if (expelledRole === 'SEEDER') {
        // Rewarding all netizens who voted correctly
        for (const [voterId, suspect] of this.r3.votes.entries()) {
          if (suspect === mostVotedId && this.r3.roles.get(voterId) === 'NETIZEN') {
            this.awardPoints('ROUND_3', voterId, 800);
          }
        }
      }
    }

    const outcome = {
      expelledId: mostVotedId,
      votes: maxVotes,
      revealedRole: expelledRole
    };
    this.emitEvent('EXILE_VERDICT', outcome);
    return outcome;
  }

  // --- Round 4: Sabotage & High Stakes Trivia Final ---
  startRound4() {
    this.status = 'ROUND_4';
    this.currentPhase = 'SABOTAGE_DRAFT';
    this.r4.shields.clear();
    this.r4.inkSplats.clear();
    this.r4.activeBets.clear();
    this.r4.trolledPlayers.clear();
    this.r4.triviaAnswers.clear();

    // Deal 3 random sabotage cards to each player
    for (const pid of this.players.keys()) {
      const dealt = [
        MOCK_SABOTAGE_CARDS[0].id,
        MOCK_SABOTAGE_CARDS[1].id,
        MOCK_SABOTAGE_CARDS[Math.floor(Math.random() * MOCK_SABOTAGE_CARDS.length)].id
      ];
      this.r4.cards.set(pid, dealt);
    }

    this.emitEvent('R4_STARTED', { cardCount: 3 });
  }

  playSabotageCard(attackerId, targetId, cardId) {
    const playerCards = this.r4.cards.get(attackerId) || [];
    const cardIndex = playerCards.indexOf(cardId);
    if (cardIndex === -1) {
      throw new Error(`Attacker does not hold card ${cardId}`);
    }

    // Remove card from hand
    playerCards.splice(cardIndex, 1);
    this.r4.cards.set(attackerId, playerCards);

    // Self-targeted cards
    if (cardId === 'CARD_SHIELD') {
      this.r4.shields.add(attackerId);
      this.emitEvent('SHIELD_ACTIVATED', { playerId: attackerId });
      return { success: true, effect: 'SHIELD_ACTIVATED' };
    }

    if (cardId === 'CARD_BET_2X') {
      this.r4.activeBets.add(attackerId);
      this.emitEvent('BET_2X_ACTIVATED', { playerId: attackerId });
      return { success: true, effect: 'BET_2X_ACTIVATED' };
    }

    // Target-directed cards: Check shield
    if (this.r4.shields.has(targetId)) {
      this.r4.shields.delete(targetId); // Shield absorbs and breaks
      this.emitEvent('ATTACK_DEFLECTED', { attackerId, targetId, cardId });
      return { success: false, blockedByShield: true };
    }

    if (cardId === 'CARD_INK') {
      this.r4.inkSplats.set(targetId, 7); // Requires 7 wipes
      this.emitEvent('INK_SPLATTED', { attackerId, targetId, wipesNeeded: 7 });
      return { success: true, effect: 'INK_SPLATTED' };
    }

    if (cardId === 'CARD_HEIST') {
      const targetPlayer = this.players.get(targetId);
      if (!targetPlayer) throw new Error('Target player not found');
      const stolenPoints = Math.floor(targetPlayer.totalScore * 0.5);
      targetPlayer.totalScore -= stolenPoints;
      this.awardPoints('ROUND_4', attackerId, stolenPoints);
      this.emitEvent('POINTS_HEISTED', { attackerId, targetId, stolenPoints });
      return { success: true, stolenPoints };
    }

    if (cardId === 'CARD_TROLL') {
      this.r4.trolledPlayers.add(targetId);
      this.emitEvent('TROLL_APPLIED', { attackerId, targetId });
      return { success: true, effect: 'TROLL_APPLIED' };
    }

    throw new Error(`Unknown card: ${cardId}`);
  }

  wipeInk(playerId) {
    const current = this.r4.inkSplats.get(playerId) || 0;
    if (current <= 1) {
      this.r4.inkSplats.delete(playerId);
      this.emitEvent('INK_CLEARED', { playerId });
      return 0;
    }
    const remaining = current - 1;
    this.r4.inkSplats.set(playerId, remaining);
    return remaining;
  }

  submitTriviaAnswer(playerId, questionId, isCorrect) {
    let basePoints = isCorrect ? 1000 : 0;
    let multiplier = 1;

    if (this.r4.activeBets.has(playerId)) {
      multiplier = 2;
      this.r4.activeBets.delete(playerId);
      if (!isCorrect) {
        basePoints = -500; // Penalty for greedy bet
      }
    }

    const finalPoints = basePoints * multiplier;
    this.awardPoints('ROUND_4', playerId, finalPoints);
    const result = { playerId, questionId, isCorrect, finalPoints };
    this.r4.triviaAnswers.set(playerId, result);
    this.emitEvent('TRIVIA_ANSWERED', result);
    return result;
  }

  // --- Grand Podium & Helper ---
  awardPoints(roundKey, playerId, points) {
    const player = this.players.get(playerId);
    if (!player) return;

    if (!this.roundScores[roundKey]) {
      this.roundScores[roundKey] = {};
    }
    this.roundScores[roundKey][playerId] = (this.roundScores[roundKey][playerId] || 0) + points;

    // In Tournament mode, accumulate global score
    if (this.mode === 'TOURNAMENT') {
      player.totalScore = Math.max(0, player.totalScore + points);
    }
  }

  finalizePodium() {
    this.status = 'PODIUM';
    this.currentPhase = 'CEREMONY';

    const ranked = Array.from(this.players.values()).sort((a, b) => b.totalScore - a.totalScore);
    const podium = {
      champion: ranked[0] || null,
      runnerUp: ranked[1] || null,
      thirdPlace: ranked[2] || null,
      allRankings: ranked
    };

    this.emitEvent('PODIUM_FINALIZED', {
      champion: podium.champion ? podium.champion.name : 'None',
      topScore: podium.champion ? podium.champion.totalScore : 0
    });
    return podium;
  }
}
