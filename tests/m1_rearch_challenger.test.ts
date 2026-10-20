// tests/m1_rearch_challenger.test.ts
// Empirical Challenger Verification Harness for Milestone 1:
// 1. Question Bank Integrity & Sanitization Stress
// 2. HostLobby SSR & Component Simulation
// 3. Concurrency & Stress Testing on /api/game (50 concurrent students across all 4 modes)

import assert from 'node:assert';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { NextRequest } from 'next/server';

// Domain imports
import {
  MLN131_QUESTIONS,
  MLN131_ROAST_PROMPTS,
  MLN131_FACT_OR_CAP_QUESTIONS,
  MLN131_CONSENSUS_DILEMMAS,
  ROAST_QUICK_CHIPS,
  VIETNAMESE_ROAST_BANK,
  PROFANITY_FILTER_WORDS,
  sanitizeRoastText,
} from '../src/data/questions';
import { calculateSpeedDecayScore, GameShowState } from '../src/lib/types';
import HostLobby from '../src/components/HostLobby';
import { GET, POST } from '../src/app/api/game/route';

console.log('\n================================================================');
console.log('  CHALLENGER M1 REARCH 2: EMPIRICAL VERIFICATION SUITE');
console.log('================================================================\n');

async function runChallengerSuite() {
  let passedCount = 0;
  let testCount = 0;

  function record(name: string, ok: boolean, msg?: string) {
    testCount++;
    if (ok) {
      passedCount++;
      console.log(`  ✔ [PASS] ${name}`);
    } else {
      console.error(`  ✖ [FAIL] ${name}${msg ? ` - ${msg}` : ''}`);
      throw new Error(`Assertion failed in "${name}": ${msg}`);
    }
  }

  // ==========================================================================
  // SECTION 1: QUESTION BANK EMPIRICAL AUDIT & EDGE CASES
  // ==========================================================================
  console.log('--- SECTION 1: Question Bank Integrity & Sanitization ---');

  // 1.1 Trivia Questions (MLN131_QUESTIONS)
  record('1.1.1 MLN131_QUESTIONS is non-empty array with at least 10 questions',
    Array.isArray(MLN131_QUESTIONS) && MLN131_QUESTIONS.length >= 10
  );

  const qIds = new Set<number>();
  for (const q of MLN131_QUESTIONS) {
    record(`1.1.2 Question #${q.id} valid structure`,
      typeof q.id === 'number' &&
      !qIds.has(q.id) &&
      typeof q.topic === 'string' && q.topic.trim().length > 0 &&
      typeof q.scenario === 'string' && q.scenario.trim().length > 10 &&
      Array.isArray(q.options) && q.options.length >= 2 &&
      q.options.every((opt) => typeof opt === 'string' && opt.trim().length > 0) &&
      typeof q.correctAnswer === 'number' &&
      q.correctAnswer >= 0 && q.correctAnswer < q.options.length &&
      typeof q.explanation === 'string' && q.explanation.trim().length > 5
    );
    qIds.add(q.id);
  }

  // 1.2 Roast Prompts (MLN131_ROAST_PROMPTS)
  record('1.2.1 MLN131_ROAST_PROMPTS is non-empty array with at least 8 prompts',
    Array.isArray(MLN131_ROAST_PROMPTS) && MLN131_ROAST_PROMPTS.length >= 8
  );

  const promptIds = new Set<string>();
  for (const p of MLN131_ROAST_PROMPTS) {
    record(`1.2.2 Roast prompt "${p.id}" valid structure`,
      typeof p.id === 'string' && !promptIds.has(p.id) &&
      typeof p.category === 'string' && p.category.trim().length > 0 &&
      typeof p.situation === 'string' && p.situation.trim().length > 10 &&
      typeof p.context === 'string' && p.context.trim().length > 5
    );
    promptIds.add(p.id);
  }

  // 1.3 Fact or Cap Questions (MLN131_FACT_OR_CAP_QUESTIONS)
  record('1.3.1 MLN131_FACT_OR_CAP_QUESTIONS has >= 10 questions',
    Array.isArray(MLN131_FACT_OR_CAP_QUESTIONS) && MLN131_FACT_OR_CAP_QUESTIONS.length >= 10
  );

  const factCapIds = new Set<number>();
  let trueCount = 0;
  let falseCount = 0;
  for (const fc of MLN131_FACT_OR_CAP_QUESTIONS) {
    record(`1.3.2 Fact/Cap #${fc.id} valid structure & basePoints`,
      typeof fc.id === 'number' && !factCapIds.has(fc.id) &&
      typeof fc.statement === 'string' && fc.statement.trim().length > 15 &&
      typeof fc.isFact === 'boolean' &&
      typeof fc.explanation === 'string' && fc.explanation.trim().length > 15 &&
      typeof fc.category === 'string' && fc.category.trim().length > 0 &&
      fc.basePoints === 1000
    );
    factCapIds.add(fc.id);
    if (fc.isFact) trueCount++; else falseCount++;
  }
  record('1.3.3 Fact/Cap question distribution has balanced true/false statements',
    trueCount >= 4 && falseCount >= 4,
    `trueCount=${trueCount}, falseCount=${falseCount}`
  );

  // 1.4 Consensus Dilemmas (MLN131_CONSENSUS_DILEMMAS)
  record('1.4.1 MLN131_CONSENSUS_DILEMMAS has >= 6 dilemmas',
    Array.isArray(MLN131_CONSENSUS_DILEMMAS) && MLN131_CONSENSUS_DILEMMAS.length >= 6
  );

  const dilemmaIds = new Set<number>();
  for (const d of MLN131_CONSENSUS_DILEMMAS) {
    record(`1.4.2 Dilemma #${d.id} valid structure`,
      typeof d.id === 'number' && !dilemmaIds.has(d.id) &&
      typeof d.title === 'string' && d.title.trim().length > 5 &&
      typeof d.topic === 'string' && d.topic.trim().length > 0 &&
      typeof d.scenario === 'string' && d.scenario.trim().length > 20 &&
      typeof d.choiceA === 'string' && d.choiceA.trim().length > 5 &&
      typeof d.choiceB === 'string' && d.choiceB.trim().length > 5 &&
      typeof d.contextMLN131 === 'string' && d.contextMLN131.trim().length > 10
    );
    dilemmaIds.add(d.id);
  }

  // 1.5 Quick Chips & Bank
  record('1.5.1 Quick chips & Roast bank are populated',
    ROAST_QUICK_CHIPS.length >= 10 && VIETNAMESE_ROAST_BANK.length >= 20 && PROFANITY_FILTER_WORDS.length >= 10
  );

  // 1.6 Sanitization function edge case testing
  record('1.6.1 sanitizeRoastText handles null/undefined/empty string without crashing',
    sanitizeRoastText('') === '' &&
    // @ts-ignore
    sanitizeRoastText(null) === '' &&
    // @ts-ignore
    sanitizeRoastText(undefined) === ''
  );

  const longText = 'A'.repeat(200);
  record('1.6.2 sanitizeRoastText clamps length to 120 characters',
    sanitizeRoastText(longText).length === 120
  );

  const profanityInput = 'Bọn mày ngu vl thật đấy';
  const sanitizedOutput = sanitizeRoastText(profanityInput);
  record('1.6.3 sanitizeRoastText masks profanity words with VAR marker',
    sanitizedOutput.includes('[VAR đã che 🎦]') && !sanitizedOutput.includes('vl')
  );

  // ==========================================================================
  // SECTION 2: HOSTLOBBY SSR & RENDER VERIFICATION
  // ==========================================================================
  console.log('\n--- SECTION 2: HostLobby Component SSR & Handler Export ---');

  const mockState: GameShowState = {
    roomCode: 'TEST99',
    mode: 'TOURNAMENT',
    status: 'LOBBY',
    currentRoundPhase: 'LOBBY_WAITING',
    timer: { total: 0, remaining: 0, active: false },
    players: {
      p1: {
        id: 'p1',
        name: 'Chiến sĩ Alpha',
        avatarId: 'keyboard_warrior',
        score: 1500,
        roundScores: { ROUND_1: 1500 },
        connected: true,
        isBot: false,
        lastActive: Date.now(),
        streak: 1,
      },
      p2: {
        id: 'p2',
        name: 'Chiến sĩ Beta',
        avatarId: 'fact_checker',
        score: 3000,
        roundScores: { ROUND_1: 3000 },
        connected: true,
        isBot: true,
        lastActive: Date.now(),
        streak: 2,
      },
    },
    roundScores: { ROUND_1: {}, ROUND_2: {}, ROUND_3: {}, ROUND_4: {} },
    round1State: {} as any,
    round2State: {} as any,
    round3State: {} as any,
    round4State: {} as any,
    recentEvents: [],
    devBotConfig: { enabled: true, botCount: 2, reactionSpeed: 'FAST', simulatedDanmaku: true },
  };

  let tournamentStarted = false;
  let startedRound: any = null;
  let selectedMode: any = null;
  let resetTriggered = false;

  const props = {
    state: mockState,
    onStartTournament: () => { tournamentStarted = true; },
    onStartRound: (round: any) => { startedRound = round; },
    onSelectMode: (mode: any) => { selectedMode = mode; },
    onResetLobby: () => { resetTriggered = true; },
  };

  // SSR string rendering test
  let htmlOutput = '';
  try {
    htmlOutput = renderToString(React.createElement(HostLobby, props));
    record('2.1 HostLobby renders cleanly with React renderToString (No SSR crash)', typeof htmlOutput === 'string' && htmlOutput.length > 500);
  } catch (err: any) {
    record('2.1 HostLobby renders cleanly with React renderToString (No SSR crash)', false, err.message);
  }

  // Check required UI elements in rendered HTML
  record('2.2 Rendered HTML contains room code TEST99', htmlOutput.includes('TEST99'));
  record('2.3 Rendered HTML contains prominent Mode 4 quick launch banner button',
    htmlOutput.includes('Thử Ngay Mode 4: Đấu Trường Chơi Xấu Cướp Điểm')
  );
  record('2.4 Rendered HTML in Tournament mode contains all 4 round genres',
    htmlOutput.includes('Trending Feed Wall') &&
    htmlOutput.includes('Fact or Cap 5s Reflex') &&
    htmlOutput.includes('The Consensus Dilemma') &&
    htmlOutput.includes('Sabotage Trivia Final')
  );
  record('2.5 Rendered HTML displays connected players and BOT tag',
    htmlOutput.includes('Chiến sĩ Alpha') &&
    htmlOutput.includes('Chiến sĩ Beta') &&
    htmlOutput.includes('BOT')
  );

  // Test Free-play mode rendering
  const freePlayState: GameShowState = {
    ...mockState,
    mode: 'FREE_PLAY',
  };
  const freePlayHtml = renderToString(React.createElement(HostLobby, { ...props, state: freePlayState }));
  record('2.6 HostLobby renders Free-Play mode with individual round start triggers and titles',
    freePlayHtml.includes('CHỌN CHƠI LẺ RIÊNG TỪNG VÒNG (FREE-PLAY)') &&
    freePlayHtml.includes('VÒNG 1: TƯỜNG BÌNH LUẬN TRIỆU LIKE') &&
    freePlayHtml.includes('VÒNG 2: ĐẠI CHIẾN BÓC PHỐT 5 GIÂY') &&
    freePlayHtml.includes('VÒNG 3: TRƯNG CẦU DÂN Ý: ĐOÁN PHE ĐA SỐ') &&
    freePlayHtml.includes('VÒNG 4: ĐẤU TRƯỜNG CHƠI XẤU CƯỚP ĐIỂM')
  );

  // Test Empty players state
  const emptyState: GameShowState = {
    ...mockState,
    players: {},
  };
  const emptyHtml = renderToString(React.createElement(HostLobby, { ...props, state: emptyState }));
  record('2.7 HostLobby handles zero players gracefully without crashing',
    emptyHtml.includes('Chưa có ai vào phòng!')
  );

  // ==========================================================================
  // SECTION 3: CONCURRENT REQUEST SIMULATION ON /api/game ROUTE
  // ==========================================================================
  console.log('\n--- SECTION 3: Concurrent Request Handling (50 Simulated Students) ---');

  const concurrentRoom = `CONCURRENT_CHALLENGE_${Date.now()}`;

  function mockPost(body: any): NextRequest {
    return new NextRequest('http://localhost:3000/api/game', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  function mockGet(since: number = 0): NextRequest {
    return new NextRequest(`http://localhost:3000/api/game?room=${concurrentRoom}&since=${since}`, {
      method: 'GET',
    });
  }

  // 3.1 50 Concurrent Joins
  const joinRequests = [];
  for (let i = 1; i <= 50; i++) {
    joinRequests.push(
      POST(mockPost({
        roomCode: concurrentRoom,
        action: 'JOIN',
        payload: {
          playerId: `student_${i}`,
          name: `Sinh Viên ${i}`,
          avatarId: 'keyboard_warrior',
          isBot: i > 35, // 15 bots
        },
      }))
    );
  }
  const joinResponses = await Promise.all(joinRequests);
  const allJoinOk = joinResponses.every((res) => res.status === 200);

  const getAfterJoin = await (await GET(mockGet())).json();
  const joinedCount = Object.keys(getAfterJoin.players || {}).length;
  record('3.1 50 concurrent students joined successfully without data race or loss',
    allJoinOk && joinedCount === 50,
    `joinedCount=${joinedCount}`
  );

  // 3.2 50 Concurrent Mode 1 Comment Submissions
  const commentRequests = [];
  for (let i = 1; i <= 50; i++) {
    commentRequests.push(
      POST(mockPost({
        roomCode: concurrentRoom,
        action: 'SUBMIT_FEED_COMMENT',
        payload: {
          playerId: `student_${i}`,
          text: `Bình luận cà khịa số #${i} về tin giả AI!`,
        },
      }))
    );
  }
  const commentResponses = await Promise.all(commentRequests);
  const allCommentOk = commentResponses.every((res) => res.status === 200);

  const getAfterComments = await (await GET(mockGet())).json();
  const commentsStored = Object.keys(getAfterComments.round1State?.comments || {}).length;
  record('3.2 50 concurrent Mode 1 comments submitted and stored in state',
    allCommentOk && commentsStored === 50,
    `commentsStored=${commentsStored}`
  );

  // 3.3 100 Concurrent Reactions to Top Posts
  const commentIds = Object.keys(getAfterComments.round1State.comments);
  const targetPostId = commentIds[0];
  const reactionRequests = [];
  for (let i = 1; i <= 50; i++) {
    reactionRequests.push(
      POST(mockPost({
        roomCode: concurrentRoom,
        action: 'REACT_FEED_POST',
        payload: {
          postId: targetPostId,
          reactionType: i % 2 === 0 ? 'heart' : 'tomato',
          voterId: `student_${i}`,
        },
      }))
    );
  }
  const reactionResponses = await Promise.all(reactionRequests);
  const allReactionOk = reactionResponses.every((r) => r.status === 200);

  const getAfterReactions = await (await GET(mockGet())).json();
  const targetComment = getAfterReactions.round1State.comments[targetPostId];
  const totalReactions = targetComment.reactions.heart + targetComment.reactions.tomato;
  record('3.3 50 concurrent reactions aggregated correctly into post reactions',
    allReactionOk && totalReactions === 50,
    `totalReactions=${totalReactions}`
  );

  // 3.4 50 Concurrent Mode 2 Fact/Cap Submissions with Speed-Decay
  const factCapRequests = [];
  for (let i = 1; i <= 50; i++) {
    const reactionTimeMs = 500 + i * 50; // Between 550ms and 3000ms
    factCapRequests.push(
      POST(mockPost({
        roomCode: concurrentRoom,
        action: 'SUBMIT_FACT_OR_CAP',
        payload: {
          playerId: `student_${i}`,
          choice: i % 3 === 0 ? 'CAP' : 'FACT', // Question 0 is isFact=false, so CAP is correct
          questionIndex: 0,
          reactionTimeMs,
          totalTime: 5000,
        },
      }))
    );
  }
  const factCapResponses = await Promise.all(factCapRequests);
  const allFactCapOk = factCapResponses.every((r) => r.status === 200);

  const getAfterFactCap = await (await GET(mockGet())).json();
  const answersRecorded = Object.keys(getAfterFactCap.round2State?.answers || {}).length;
  record('3.4 50 concurrent Mode 2 Fact/Cap answers scored and stored',
    allFactCapOk && answersRecorded === 50,
    `answersRecorded=${answersRecorded}`
  );

  // Verify correctness and speed decay on recorded answers
  const sampleCorrect = getAfterFactCap.round2State.answers['student_3']; // chose CAP -> correct
  const sampleWrong = getAfterFactCap.round2State.answers['student_1']; // chose FACT -> wrong
  record('3.5 Speed-decay scoring correctly awards points only to correct answers',
    sampleCorrect.isCorrect === true && sampleCorrect.score > 0 &&
    sampleWrong.isCorrect === false && sampleWrong.score === 0,
    `correctScore=${sampleCorrect?.score}, wrongScore=${sampleWrong?.score}`
  );

  // 3.6 50 Concurrent Mode 3 Dilemma Stances & Consensus Bets
  const stanceRequests = [];
  for (let i = 1; i <= 50; i++) {
    stanceRequests.push(
      POST(mockPost({
        roomCode: concurrentRoom,
        action: 'SUBMIT_DILEMMA_STANCE',
        payload: {
          playerId: `student_${i}`,
          stance: i <= 35 ? 'A' : 'B', // 35 A vs 15 B (A is majority)
        },
      }))
    );
  }
  await Promise.all(stanceRequests);

  const getAfterStances = await (await GET(mockGet())).json();
  const tally = getAfterStances.round3State?.tally;
  record('3.6 Mode 3 Tug-of-war tally aggregates accurately (35 A vs 15 B -> 70% vs 30%)',
    tally?.countA === 35 &&
    tally?.countB === 15 &&
    tally?.percentA === 70 &&
    tally?.percentB === 30 &&
    tally?.majority === 'A',
    `countA=${tally?.countA}, countB=${tally?.countB}, percentA=${tally?.percentA}`
  );

  // 3.7 50 Concurrent Consensus Bets
  const betRequests = [];
  for (let i = 1; i <= 50; i++) {
    betRequests.push(
      POST(mockPost({
        roomCode: concurrentRoom,
        action: 'SUBMIT_DILEMMA_BET',
        payload: {
          playerId: `student_${i}`,
          predictedMajority: i <= 40 ? 'A' : 'B',
          remainingTime: 15000,
          totalTime: 20000,
        },
      }))
    );
  }
  await Promise.all(betRequests);

  const getAfterBets = await (await GET(mockGet())).json();
  const betsCount = Object.keys(getAfterBets.round3State?.consensusBets || {}).length;
  record('3.7 50 concurrent consensus bets recorded without loss',
    betsCount === 50,
    `betsCount=${betsCount}`
  );

  // 3.8 Standalone Return-to-Hub under concurrency
  const returnRes = await POST(mockPost({
    roomCode: concurrentRoom,
    action: 'RETURN_TO_HUB',
    payload: {},
  }));
  const stateAfterReturn = await (await GET(mockGet())).json();
  record('3.8 RETURN_TO_HUB restores status to LOBBY cleanly',
    returnRes.status === 200 && stateAfterReturn.status === 'LOBBY'
  );

  console.log('\n================================================================');
  console.log(`  CHALLENGER RESULT: ${passedCount}/${testCount} TESTS PASSED`);
  console.log('================================================================\n');

  return { passedCount, testCount };
}

runChallengerSuite().catch((err) => {
  console.error('\nCHALLENGER FAILURE:', err);
  process.exit(1);
});
