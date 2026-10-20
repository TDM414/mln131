// End-to-End Live HTTP Verification: Human Player ("Diệu Linh") + Bots
const BASE_URL = 'http://localhost:3000/api/game';
const ROOM = 'ROOM_VERIFY_LIVE';

async function postAction(action, payload = {}) {
  const res = await fetch(`${BASE_URL}?room=${ROOM}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roomCode: ROOM, action, payload }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`POST ${action} failed (${res.status}): ${text}`);
  }
  return await res.json();
}

async function getState() {
  const res = await fetch(`${BASE_URL}?room=${ROOM}`);
  if (!res.ok) {
    throw new Error(`GET state failed: ${res.status}`);
  }
  return await res.json();
}

async function runLiveVerification() {
  console.log('===============================================================');
  console.log(' LIVE VERIFICATION: HUMAN PLAYER ("Diệu Linh") WITH BOTS');
  console.log('===============================================================\n');

  // Step 1: Reset Game
  await postAction('RESET_GAME');
  console.log('[1] Room reset successfully.');

  // Step 2: Human Player "Diệu Linh" Joins
  const humanId = 'player_dieu_linh';
  await postAction('JOIN', {
    playerId: humanId,
    name: 'Diệu Linh',
    avatarId: 'keyboard_warrior',
  });
  console.log('[2] Human player "Diệu Linh" joined.');

  // Step 3: 8 Bots Join
  const botIds = [];
  for (let i = 1; i <= 8; i++) {
    const bId = `bot_${i}`;
    botIds.push(bId);
    await postAction('JOIN', {
      playerId: bId,
      name: `Sinh Viên K65 #${i}`,
      avatarId: 'fact_checker',
    });
  }
  console.log(`[3] 8 Bots joined the room. Total players: 9.`);

  let s = await getState();
  if (Object.keys(s.players).length !== 9) {
    throw new Error(`Expected 9 players, got ${Object.keys(s.players).length}`);
  }

  // ==================== ROUND 1: CHẤM HỎI TRENDING ====================
  console.log('\n--- TESTING VÒNG 1: CHẤM HỎI TRENDING ---');
  await postAction('SET_STATUS', { status: 'ROUND_1' });
  await postAction('SET_ROUND_PHASE', { phase: 'FEED_OPEN' });

  // Diệu Linh posts a comment
  await postAction('SUBMIT_FEED_COMMENT', {
    playerId: humanId,
    text: 'Dân chủ XHCN là quyền lực thuộc về nhân dân, bảo đảm công bằng xã hội!',
    promptIndex: 0,
  });

  // Bots post comments
  for (let i = 0; i < 4; i++) {
    await postAction('SUBMIT_FEED_COMMENT', {
      playerId: botIds[i],
      text: `Góc nhìn phản biện từ sinh viên #${i + 1} về cơ cấu xã hội`,
      promptIndex: 0,
    });
  }

  s = await getState();
  const comments = Object.values(s.round1State.comments);
  const humanComment = comments.find((c) => c.authorId === humanId);
  if (!humanComment) throw new Error('Human comment not found in round1State!');
  console.log(`[V1] Diệu Linh posted comment ID: ${humanComment.id}`);

  // Bots react heavily to Diệu Linh's comment (mimicking DevBotSimulator 75% human priority)
  for (let i = 0; i < 6; i++) {
    await postAction('REACT_FEED_POST', {
      postId: humanComment.id,
      reactionType: i % 2 === 0 ? 'heart' : 'fire',
      voterId: botIds[i],
    });
  }

  // Diệu Linh also reacts to bot 0's comment
  const botComment = comments.find((c) => c.authorId === botIds[0]);
  if (botComment) {
    await postAction('REACT_FEED_POST', {
      postId: botComment.id,
      reactionType: 'laugh',
      voterId: humanId,
    });
  }

  // Host wraps up V1 -> Top Trending
  s = await getState();
  const dieuLinhV1 = s.players[humanId];
  console.log(`[V1] Diệu Linh reactions score: ${dieuLinhV1.roundScores.ROUND_1} PTS (Total: ${dieuLinhV1.score})`);
  if (!dieuLinhV1.roundScores.ROUND_1 || dieuLinhV1.roundScores.ROUND_1 < 500) {
    throw new Error(`Expected Diệu Linh V1 score >= 500 from reactions, got ${dieuLinhV1.roundScores.ROUND_1}`);
  }

  // Host awards Top Trending Bonus (+3,000 PTS for rank 1)
  await postAction('HOST_UPDATE_STATE', {
    players: {
      [humanId]: {
        ...dieuLinhV1,
        score: dieuLinhV1.score + 3000,
        roundScores: {
          ...dieuLinhV1.roundScores,
          ROUND_1: (dieuLinhV1.roundScores.ROUND_1 || 0) + 3000,
        },
      },
    },
  });
  s = await getState();
  console.log(`[V1] Diệu Linh after Top Trending award: ${s.players[humanId].score} PTS`);

  // ==================== ROUND 2: BÓC PHỐT THỰC HƯ ====================
  console.log('\n--- TESTING VÒNG 2: BÓC PHỐT THỰC HƯ (10s REFLEX) ---');
  await postAction('SET_STATUS', { status: 'ROUND_2' });
  await postAction('SET_ROUND_PHASE', { phase: 'QUESTION_ACTIVE' });

  // Diệu Linh answers CAP correctly with 7500ms remaining
  await postAction('SUBMIT_FACT_OR_CAP', {
    choice: 'CAP',
    remainingTime: 7500,
    totalTime: 10000,
    playerId: humanId,
    questionIndex: 0,
  });

  // Host reveals and wraps up round
  await postAction('SET_ROUND_PHASE', { phase: 'REVEAL' });
  await postAction('SET_ROUND_PHASE', { phase: 'ROUND_SUMMARY' });

  s = await getState();
  const dieuLinhV2 = s.players[humanId];
  console.log(`[V2] Diệu Linh V2 score: ${dieuLinhV2.roundScores.ROUND_2} PTS (Total: ${dieuLinhV2.score}, Lives: ${dieuLinhV2.r2Lives})`);
  if (!dieuLinhV2.roundScores.ROUND_2 || dieuLinhV2.roundScores.ROUND_2 < 1500) {
    throw new Error(`Expected Diệu Linh V2 score >= 1500, got ${dieuLinhV2.roundScores.ROUND_2}`);
  }

  // ==================== ROUND 3: KÉO CO ĐỒNG THUẬN (3 DILEMMAS) ====================
  console.log('\n--- TESTING VÒNG 3: KÉO CO ĐỒNG THUẬN (3 DILEMMAS) ---');
  await postAction('SET_STATUS', { status: 'ROUND_3' });

  for (let dilemmaIdx = 0; dilemmaIdx < 3; dilemmaIdx++) {
    console.log(`  > Testing Dilemma ${dilemmaIdx + 1}/3...`);
    await postAction('SET_ROUND_PHASE', { phase: 'VOTING' });

    // Diệu Linh votes Stance A
    await postAction('SUBMIT_DILEMMA_STANCE', { stance: 'A', playerId: humanId });
    // 5 bots vote A, 3 bots vote B (Majority is A)
    for (let b = 0; b < 5; b++) {
      await postAction('SUBMIT_DILEMMA_STANCE', { stance: 'A', playerId: botIds[b] });
    }
    for (let b = 5; b < 8; b++) {
      await postAction('SUBMIT_DILEMMA_STANCE', { stance: 'B', playerId: botIds[b] });
    }

    // Diệu Linh bets on consensus winning stance: A
    await postAction('SUBMIT_DILEMMA_BET', {
      bet: 'A',
      remainingTime: 16000,
      totalTime: 20000,
      playerId: humanId,
    });

    // Reveal consensus -> TUG_REVEAL triggers server re-evaluation of bets!
    await postAction('SET_ROUND_PHASE', { phase: 'TUG_REVEAL' });
  }

  s = await getState();
  const dieuLinhV3 = s.players[humanId];
  console.log(`[V3] Diệu Linh V3 score: ${dieuLinhV3.roundScores.ROUND_3} PTS (Total: ${dieuLinhV3.score})`);
  if (!dieuLinhV3.roundScores.ROUND_3 || dieuLinhV3.roundScores.ROUND_3 <= 0) {
    throw new Error(`Expected Diệu Linh V3 score > 0, got ${dieuLinhV3.roundScores.ROUND_3}`);
  }

  // ==================== ROUND 4: TRUY TÌM CHÂN LÝ & PHÁ HOẠI ====================
  console.log('\n--- TESTING VÒNG 4: TRUY TÌM CHÂN LÝ & PHÁ HOẠI ---');
  await postAction('SET_STATUS', { status: 'ROUND_4' });

  // Phase 1: Card Pick / Draft
  await postAction('SET_ROUND_PHASE', { phase: 'CARD_PICK' });
  s = await getState();
  console.log(`[V4] Round 4 initialized with phase: ${s.round4State.phase}`);

  // Phase 2: Card Attack / Sabotage
  await postAction('SET_ROUND_PHASE', { phase: 'CARD_ATTACK' });

  // Diệu Linh casts POINT_HEIST on bot_1
  console.log(`[V4] Diệu Linh casts POINT_HEIST on ${botIds[0]}...`);
  await postAction('PLAY_CARD', {
    cardType: 'POINT_HEIST',
    targetId: botIds[0],
    sourceId: humanId,
    sourceName: 'Diệu Linh',
  });

  // Bot 2 casts INK_SPLATTER on Diệu Linh
  console.log(`[V4] Bot 2 casts INK_SPLATTER on Diệu Linh...`);
  await postAction('PLAY_CARD', {
    cardType: 'INK_SPLATTER',
    targetId: humanId,
    sourceId: botIds[1],
    sourceName: 'Sinh Viên K65 #2',
  });

  // Diệu Linh wipes ink
  console.log(`[V4] Diệu Linh wipes ink...`);
  await postAction('WIPE_INK', { playerId: humanId });

  // Phase 3: High-Stakes Trivia
  await postAction('SET_ROUND_PHASE', { phase: 'TRIVIA_QUESTION' });

  // Diệu Linh submits correct trivia answer (Option index 1, speed 2500ms)
  console.log(`[V4] Diệu Linh submits correct Trivia answer...`);
  await postAction('SUBMIT_TRIVIA', {
    questionIndex: 0,
    optionIndex: 1,
    timeMs: 2500,
    playerId: humanId,
  });

  // Host advances to resolution & summary
  await postAction('SET_ROUND_PHASE', { phase: 'ROUND_RESOLUTION' });
  await postAction('SET_ROUND_PHASE', { phase: 'ROUND_SUMMARY' });

  s = await getState();
  const dieuLinhV4 = s.players[humanId];
  console.log(`[V4] Diệu Linh V4 score: ${dieuLinhV4.roundScores.ROUND_4} PTS (Total: ${dieuLinhV4.score})`);
  if (!dieuLinhV4.roundScores.ROUND_4 || dieuLinhV4.roundScores.ROUND_4 <= 0) {
    throw new Error(`Expected Diệu Linh V4 score > 0, got ${dieuLinhV4.roundScores.ROUND_4}`);
  }

  // ==================== GRAND PODIUM & MATRIX SCOREBOARD ====================
  console.log('\n--- TESTING GRAND PODIUM & SCOREBOARD MATRIX ---');
  await postAction('SET_STATUS', { status: 'PODIUM' });

  s = await getState();
  const pFinal = s.players[humanId];
  const r1 = pFinal.roundScores.ROUND_1 || 0;
  const r2 = pFinal.roundScores.ROUND_2 || 0;
  const r3 = pFinal.roundScores.ROUND_3 || 0;
  const r4 = pFinal.roundScores.ROUND_4 || 0;
  const computedSum = r1 + r2 + r3 + r4;

  console.log(`Diệu Linh Scores Summary:`);
  console.log(`  - Vòng 1 (Trending):  ${r1} PTS`);
  console.log(`  - Vòng 2 (Bóc Phốt):  ${r2} PTS`);
  console.log(`  - Vòng 3 (Kéo Co):    ${r3} PTS`);
  console.log(`  - Vòng 4 (Sabotage):  ${r4} PTS`);
  console.log(`  - Cumulative Total:   ${pFinal.score} PTS (Sum check: ${computedSum})`);

  if (pFinal.score !== computedSum) {
    throw new Error(`Cumulative score mismatch! Score: ${pFinal.score}, Sum: ${computedSum}`);
  }

  // Sorted leaderboard
  const leaderboard = Object.values(s.players).sort((a, b) => b.score - a.score);
  const rank = leaderboard.findIndex((p) => p.id === humanId) + 1;
  console.log(`Diệu Linh Rank: #${rank} / ${leaderboard.length}`);

  if (rank <= 0) {
    throw new Error('Human player "Diệu Linh" is missing from leaderboard!');
  }

  console.log('\n===============================================================');
  console.log(' ALL VERIFICATION STEPS PASSED SUCCESSFULLY! ZERO ERRORS!');
  console.log('===============================================================\n');
}

runLiveVerification().catch((err) => {
  console.error('\n❌ LIVE VERIFICATION FAILED:', err);
  process.exit(1);
});
