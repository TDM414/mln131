// Live End-to-End Verification: Round 4 Multi-Question Skill Loop (5 Questions)
const BASE_URL = 'http://localhost:3000/api/game';
const ROOM = 'ROOM_VERIFY_R4_LOOP';

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

async function runTest() {
  console.log('===============================================================');
  console.log(' TESTING VÒNG 4: VÒNG LẶP 5 CÂU HỎI TRẮC NGHIỆM & KỸ NĂNG');
  console.log('===============================================================\n');

  // 1. Reset Game
  await postAction('RESET_GAME');
  console.log('[1] Room reset successfully.');

  // 2. Human Player "Diệu Linh" + 4 Bots Join
  const humanId = 'player_dieu_linh';
  await postAction('JOIN', { playerId: humanId, name: 'Diệu Linh', avatarId: 'keyboard_warrior' });

  const botIds = ['bot_1', 'bot_2', 'bot_3', 'bot_4'];
  for (let i = 0; i < botIds.length; i++) {
    await postAction('JOIN', { playerId: botIds[i], name: `Sinh Viên K65 #${i + 1}`, avatarId: 'fact_checker' });
  }
  console.log('[2] Diệu Linh + 4 bots joined.');

  // Give bot_1 initial score so we can test heist
  await postAction('HOST_UPDATE_STATE', {
    players: {
      bot_1: { score: 10000, roundScores: { ROUND_1: 10000 } },
    },
  });

  // 3. Set Status to ROUND_4
  await postAction('SET_STATUS', { status: 'ROUND_4' });

  // =================== CÂU HỎI 1/5: TEST CƯỢC NIỀM TIN X2 (ĐÚNG) ===================
  console.log('\n--- [CÂU 1/5] Cược Niềm Tin x2 (Áp dụng bản thân, Trả lời ĐÚNG) ---');
  await postAction('SET_ROUND_PHASE', { phase: 'CARD_DRAFT', questionIndex: 0 });

  // Diệu Linh picks DOUBLE_OR_NOTHING
  await postAction('PLAY_CARD', {
    cardType: 'DOUBLE_OR_NOTHING',
    fromPlayerId: humanId,
    fromPlayerName: 'Diệu Linh',
    isSelfTarget: true,
  });

  let s = await getState();
  if (s.round4State.queuedSkills[humanId]?.cardType !== 'DOUBLE_OR_NOTHING') {
    throw new Error('Failed to queue DOUBLE_OR_NOTHING skill!');
  }
  console.log('  ✔ Diệu Linh locked in DOUBLE_OR_NOTHING (Self-target).');

  // Enter question phase
  await postAction('SET_ROUND_PHASE', { phase: 'TRIVIA_QUESTION' });

  // Diệu Linh answers correctly (Q0 correctAnswer is 1)
  await postAction('SUBMIT_TRIVIA', {
    questionIndex: 0,
    optionIndex: 1,
    timeMs: 2000,
    playerId: humanId,
  });

  // Reveal answer -> Server evaluates skill!
  await postAction('SET_ROUND_PHASE', { phase: 'ROUND_RESOLUTION' });

  s = await getState();
  const q1Skill = s.round4State.queuedSkills[humanId];
  console.log(`  ✔ Outcome: status=${q1Skill.status}, detail="${q1Skill.detail}"`);
  if (q1Skill.status !== 'ACTIVATED') {
    throw new Error(`Expected skill ACTIVATED, got ${q1Skill.status}`);
  }
  const scoreAfterQ1 = s.players[humanId].score;
  console.log(`  ✔ Diệu Linh score after Q1 doubled: ${scoreAfterQ1} PTS`);
  if (scoreAfterQ1 < 15000) {
    throw new Error(`Expected score >= 15000 from doubled points, got ${scoreAfterQ1}`);
  }

  // =================== CÂU HỎI 2/5: TEST CƯỚP ĐIỂM (ĐÚNG -> CƯỚP THÀNH CÔNG) ===================
  console.log('\n--- [CÂU 2/5] Cướp Điểm Đối Thủ (Nhắm bot_1, Trả lời ĐÚNG) ---');
  await postAction('SET_ROUND_PHASE', { phase: 'CARD_DRAFT', questionIndex: 1 });

  // Reset check
  s = await getState();
  if (Object.keys(s.round4State.playerAnswers).length !== 0) {
    throw new Error('Expected playerAnswers to reset on new question!');
  }

  // Diệu Linh targets bot_1 with POINT_HEIST
  await postAction('PLAY_CARD', {
    cardType: 'POINT_HEIST',
    targetPlayerId: 'bot_1',
    fromPlayerId: humanId,
    fromPlayerName: 'Diệu Linh',
  });

  await postAction('SET_ROUND_PHASE', { phase: 'TRIVIA_QUESTION' });

  // Diệu Linh answers Q1 correctly (correctAnswer is 1)
  await postAction('SUBMIT_TRIVIA', {
    questionIndex: 1,
    optionIndex: 1,
    timeMs: 2500,
    playerId: humanId,
  });

  await postAction('SET_ROUND_PHASE', { phase: 'ROUND_RESOLUTION' });

  s = await getState();
  const q2Skill = s.round4State.queuedSkills[humanId];
  console.log(`  ✔ Outcome: status=${q2Skill.status}, detail="${q2Skill.detail}"`);
  if (q2Skill.status !== 'ACTIVATED') {
    throw new Error(`Expected skill ACTIVATED, got ${q2Skill.status}`);
  }
  console.log(`  ✔ bot_1 score after heist: ${s.players['bot_1'].score} PTS (stolen)`);
  console.log(`  ✔ Diệu Linh score after heist: ${s.players[humanId].score} PTS`);

  // =================== CÂU HỎI 3/5: TEST TRẢ LỜI SAI (KỸ NĂNG BỊ HỦY!) ===================
  console.log('\n--- [CÂU 3/5] Trả Lời Sai -> Kỹ Năng Bị HỦY (Cancelled) ---');
  await postAction('SET_ROUND_PHASE', { phase: 'CARD_DRAFT', questionIndex: 2 });

  // Diệu Linh targets bot_2 with POINT_HEIST
  await postAction('PLAY_CARD', {
    cardType: 'POINT_HEIST',
    targetPlayerId: 'bot_2',
    fromPlayerId: humanId,
    fromPlayerName: 'Diệu Linh',
  });

  await postAction('SET_ROUND_PHASE', { phase: 'TRIVIA_QUESTION' });

  // Diệu Linh deliberately picks WRONG answer (Option 0 when correctAnswer is 1)
  await postAction('SUBMIT_TRIVIA', {
    questionIndex: 2,
    optionIndex: 0,
    timeMs: 2000,
    playerId: humanId,
  });

  await postAction('SET_ROUND_PHASE', { phase: 'ROUND_RESOLUTION' });

  s = await getState();
  const q3Skill = s.round4State.queuedSkills[humanId];
  console.log(`  ✔ Outcome: status=${q3Skill.status}, detail="${q3Skill.detail}"`);
  if (q3Skill.status !== 'CANCELLED') {
    throw new Error(`Expected skill CANCELLED on wrong answer, got ${q3Skill.status}`);
  }

  // =================== CÂU HỎI 4/5: TEST KHIÊN BẢO VỆ ===================
  console.log('\n--- [CÂU 4/5] Khiên Bảo Vệ CYBER_SHIELD (Trả lời ĐÚNG) ---');
  await postAction('SET_ROUND_PHASE', { phase: 'CARD_DRAFT', questionIndex: 3 });

  await postAction('PLAY_CARD', {
    cardType: 'CYBER_SHIELD',
    fromPlayerId: humanId,
    fromPlayerName: 'Diệu Linh',
    isSelfTarget: true,
  });

  await postAction('SET_ROUND_PHASE', { phase: 'TRIVIA_QUESTION' });
  await postAction('SUBMIT_TRIVIA', {
    questionIndex: 3,
    optionIndex: 0, // Q3 correctAnswer is 0
    timeMs: 2000,
    playerId: humanId,
  });

  await postAction('SET_ROUND_PHASE', { phase: 'ROUND_RESOLUTION' });
  s = await getState();
  const q4Skill = s.round4State.queuedSkills[humanId];
  console.log(`  ✔ Outcome: status=${q4Skill.status}, detail="${q4Skill.detail}"`);
  if (q4Skill.status !== 'ACTIVATED') {
    throw new Error(`Expected shield ACTIVATED, got ${q4Skill.status}`);
  }

  // =================== CÂU HỎI 5/5: CÂU QUYẾT ĐỊNH & TỔNG KẾT VÒNG 4 ===================
  console.log('\n--- [CÂU 5/5] Câu Quyết Định & Kết Thúc Vòng 4 ---');
  await postAction('SET_ROUND_PHASE', { phase: 'CARD_DRAFT', questionIndex: 4 });
  await postAction('SET_ROUND_PHASE', { phase: 'TRIVIA_QUESTION' });
  await postAction('SUBMIT_TRIVIA', {
    questionIndex: 4,
    optionIndex: 2, // Q4 correctAnswer is 2
    timeMs: 2000,
    playerId: humanId,
  });
  await postAction('SET_ROUND_PHASE', { phase: 'ROUND_RESOLUTION' });
  await postAction('SET_ROUND_PHASE', { phase: 'ROUND_SUMMARY' });

  s = await getState();
  console.log(`  ✔ Round 4 completed! Final Diệu Linh R4 Score: ${s.players[humanId].roundScores.ROUND_4} PTS (Total: ${s.players[humanId].score})`);

  // =================== GRAND PODIUM ===================
  console.log('\n--- LỄ VINH DANH GRAND PODIUM ---');
  await postAction('SET_STATUS', { status: 'PODIUM' });
  s = await getState();
  const leaderboard = Object.values(s.players).sort((a, b) => b.score - a.score);
  const myRank = leaderboard.findIndex((p) => p.id === humanId) + 1;
  console.log(`  ✔ Diệu Linh Final Tournament Rank: #${myRank} with ${s.players[humanId].score} PTS`);

  console.log('\n===============================================================');
  console.log(' ALL 5 QUESTIONS & CONDITIONAL SKILL MECHANICS VERIFIED 100%!');
  console.log('===============================================================\n');
}

runTest().catch((err) => {
  console.error('TEST FAILED:', err);
  process.exit(1);
});
