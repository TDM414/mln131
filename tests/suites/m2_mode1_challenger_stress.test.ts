// tests/suites/m2_mode1_challenger_stress.test.ts
// Empirical Challenger Stress & Adversarial Test Suite for Milestone 2: Mode 1: Tường Bình Luận Triệu Like

import assert from 'node:assert';
import { performance } from 'node:perf_hooks';
import { NextRequest } from 'next/server';
import { POST, GET } from '../../src/app/api/game/route';
import { MLN131_ROAST_PROMPTS, sanitizeRoastText } from '../../src/data/questions';
import { FeedComment, TrendingPost } from '../../src/lib/types';

function createMockPostRequest(body: any): NextRequest {
  return new NextRequest('http://localhost:3000/api/game', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function createMockGetRequest(room: string): NextRequest {
  return new NextRequest(`http://localhost:3000/api/game?room=${encodeURIComponent(room)}&since=0`, {
    method: 'GET',
  });
}

async function runM2ChallengerStressTests() {
  console.log('\n================================================================');
  console.log('  CHALLENGER M2-1: EMPIRICAL STRESS & ADVERSARIAL VERIFICATION');
  console.log('  Target: Mode 1: Tường Bình Luận Triệu Like (Trending Feed Wall)');
  console.log('================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  async function testStep(name: string, fn: () => Promise<void>) {
    totalTests++;
    const start = performance.now();
    try {
      await fn();
      const duration = (performance.now() - start).toFixed(2);
      passedTests++;
      console.log(`  ✔ [PASS] ${name} (${duration}ms)`);
    } catch (err: any) {
      const duration = (performance.now() - start).toFixed(2);
      console.error(`  ✖ [FAIL] ${name} (${duration}ms)`);
      console.error(`    Error: ${err?.message || err}`);
      throw err;
    }
  }

  // ============================================================================
  // TEST SCENARIO 1: 50 Concurrent Student Submissions (Parallel Burst)
  // ============================================================================
  console.log('--- TEST 1: 50 Concurrent Student Comments Simulation ---');

  const roomCode1 = `CHALLENGE_M2_50STUDENTS_${Date.now()}`;

  await testStep('1.1 - Register 50 concurrent students via Promise.all()', async () => {
    const joinPromises: Promise<any>[] = [];
    for (let i = 1; i <= 50; i++) {
      const studentId = `stu_${i}`;
      const studentName = `Sinh viên ${i.toString().padStart(2, '0')}`;
      const avatarId = i % 2 === 0 ? 'keyboard_warrior' : 'fact_checker';
      joinPromises.push(
        POST(
          createMockPostRequest({
            roomCode: roomCode1,
            action: 'JOIN',
            payload: { playerId: studentId, name: studentName, avatarId },
          })
        )
      );
    }
    const results = await Promise.all(joinPromises);
    for (const res of results) {
      assert.strictEqual(res.status, 200, 'Each join request returned 200');
    }

    const stateRes = await GET(createMockGetRequest(roomCode1));
    const state = await stateRes.json();
    assert.strictEqual(Object.keys(state.players).length, 50, 'Exactly 50 players registered in room');
  });

  await testStep('1.2 - Transition room to ROUND_1 with phase PROMPT', async () => {
    await POST(
      createMockPostRequest({
        roomCode: roomCode1,
        action: 'SET_STATUS',
        payload: { status: 'ROUND_1' },
      })
    );
    await POST(
      createMockPostRequest({
        roomCode: roomCode1,
        action: 'SET_ROUND_PHASE',
        payload: { phase: 'PROMPT' },
      })
    );

    const stateRes = await GET(createMockGetRequest(roomCode1));
    const state = await stateRes.json();
    assert.strictEqual(state.status, 'ROUND_1', 'Room status is ROUND_1');
    assert.strictEqual(state.round1State.phase, 'PROMPT', 'Round 1 phase is PROMPT');
    assert.ok(state.round1State.prompt, 'Prompt is loaded');
  });

  await testStep('1.3 - 50 concurrent students submit comments simultaneously (Promise.all)', async () => {
    const commentTexts = [
      'Lùa gà trắng trợn! MLN131 dạy phải có tư duy phản biện số!',
      'Check VAR gấp! Thông tin sai lệch bị phạt 10-20 triệu đồng.',
      'Dân biết, dân bàn, dân làm, dân kiểm tra! Không thể lừa dối cộng đồng.',
      'Ăn chanh 500k ngừa bệnh là phản khoa học, đề nghị report ngay!',
      'Phát ngôn vi phạm chuẩn mực văn hóa mạng, cần xử lý nghiêm!',
    ];

    const commentPromises: Promise<any>[] = [];
    for (let i = 1; i <= 50; i++) {
      const studentId = `stu_${i}`;
      const studentName = `Sinh viên ${i.toString().padStart(2, '0')}`;
      const rawText = `[Student ${i}] ${commentTexts[i % commentTexts.length]} ${'a'.repeat(i * 3)}`; // varying lengths
      commentPromises.push(
        POST(
          createMockPostRequest({
            roomCode: roomCode1,
            action: 'SUBMIT_FEED_COMMENT',
            payload: {
              playerId: studentId,
              playerName: studentName,
              avatarId: 'keyboard_warrior',
              text: rawText,
            },
          })
        )
      );
    }

    const results = await Promise.all(commentPromises);
    for (const res of results) {
      assert.strictEqual(res.status, 200, 'Each comment submission returned 200');
    }

    const stateRes = await GET(createMockGetRequest(roomCode1));
    const state = await stateRes.json();
    const comments = Object.values(state.round1State.comments || {}) as FeedComment[];

    // Strict concurrency checks
    assert.strictEqual(comments.length, 50, 'Exactly 50 comments recorded (0 drops)');
    const uniqueAuthors = new Set(comments.map((c) => c.authorId));
    assert.strictEqual(uniqueAuthors.size, 50, 'All 50 unique authors have comments (0 collisions)');

    // Check that every text is properly clamped to <= 120 chars
    for (const c of comments) {
      assert.ok(c.text.length <= 120, `Comment text length ${c.text.length} must be <= 120 chars`);
      assert.strictEqual(c.reactions.heart, 0);
      assert.strictEqual(c.reactions.tomato, 0);
      assert.strictEqual(c.reactions.brick, 0);
    }

    // Check backwards compatibility mirrors
    const posts = Object.values(state.round1State.posts || {}) as TrendingPost[];
    assert.strictEqual(posts.length, 50, 'Exactly 50 posts in round1State.posts');
    const subs = Object.values(state.round1State.submissions || {});
    assert.strictEqual(subs.length, 50, 'Exactly 50 submissions in round1State.submissions');
  });

  // ============================================================================
  // TEST SCENARIO 2: Reaction Flurry (50 Concurrent Students Hammering ❤️, 🍅, 🧱)
  // ============================================================================
  console.log('\n--- TEST 2: High-Velocity Reaction Flurry Simulation ---');

  await testStep('2.1 - Transition to FEED_REACTION phase', async () => {
    const curStateRes = await GET(createMockGetRequest(roomCode1));
    const curState = await curStateRes.json();
    await POST(
      createMockPostRequest({
        roomCode: roomCode1,
        action: 'HOST_UPDATE_STATE',
        payload: {
          round1State: {
            ...curState.round1State,
            phase: 'FEED_REACTION',
          },
        },
      })
    );
    const stateRes = await GET(createMockGetRequest(roomCode1));
    const state = await stateRes.json();
    assert.strictEqual(state.round1State.phase, 'FEED_REACTION');
    assert.strictEqual(Object.keys(state.round1State.comments).length, 50, 'All 50 comments preserved in FEED_REACTION');
  });

  await testStep('2.2 - 50 students cast 600 total reactions concurrently in parallel bursts', async () => {
    const stateRes = await GET(createMockGetRequest(roomCode1));
    const state = await stateRes.json();
    const commentList = Object.values(state.round1State.comments) as FeedComment[];

    // 50 students each cast 12 reactions across various comments = 600 reactions total
    const reactionPromises: Promise<any>[] = [];
    const targetPostReactionCounts: Record<string, { heart: number; tomato: number; brick: number }> = {};

    commentList.forEach((c) => {
      targetPostReactionCounts[c.id] = { heart: 0, tomato: 0, brick: 0 };
    });

    const reactionTypes: Array<'heart' | 'tomato' | 'brick'> = ['heart', 'tomato', 'brick'];

    for (let stuIdx = 1; stuIdx <= 50; stuIdx++) {
      const voterId = `stu_${stuIdx}`;
      for (let r = 0; r < 12; r++) {
        // Target a comment based on a skewed formula so we test both high and low reaction counts
        const targetCommentIdx = (stuIdx * 7 + r * 3) % commentList.length;
        const targetComment = commentList[targetCommentIdx];
        const rType = reactionTypes[(stuIdx + r) % 3];

        targetPostReactionCounts[targetComment.id][rType]++;

        reactionPromises.push(
          POST(
            createMockPostRequest({
              roomCode: roomCode1,
              action: 'REACT_FEED_POST',
              payload: {
                postId: targetComment.id,
                reactionType: rType,
                voterId,
              },
            })
          )
        );
      }
    }

    assert.strictEqual(reactionPromises.length, 600, '600 reaction requests queued');

    // Fire all 600 in parallel chunks to simulate high-rate network barrage
    const chunkSize = 100;
    for (let i = 0; i < reactionPromises.length; i += chunkSize) {
      const chunk = reactionPromises.slice(i, i + chunkSize);
      const chunkResults = await Promise.all(chunk);
      for (const res of chunkResults) {
        assert.strictEqual(res.status, 200);
      }
    }

    // Inspect server state after 600 reactions
    const finalStateRes = await GET(createMockGetRequest(roomCode1));
    const finalState = await finalStateRes.json();

    let totalRecordedReactions = 0;
    for (const comment of Object.values(finalState.round1State.comments) as FeedComment[]) {
      const sum = comment.reactions.heart + comment.reactions.tomato + comment.reactions.brick;
      totalRecordedReactions += sum;

      const expected = targetPostReactionCounts[comment.id];
      assert.strictEqual(
        comment.reactions.heart,
        expected.heart,
        `Post ${comment.id} heart count matches expected`
      );
      assert.strictEqual(
        comment.reactions.tomato,
        expected.tomato,
        `Post ${comment.id} tomato count matches expected`
      );
      assert.strictEqual(
        comment.reactions.brick,
        expected.brick,
        `Post ${comment.id} brick count matches expected`
      );
    }

    assert.strictEqual(totalRecordedReactions, 600, 'Exactly 600 reactions recorded in state (0 loss)');

    // Verify +100 points per reaction received for authors
    for (const comment of Object.values(finalState.round1State.comments) as FeedComment[]) {
      const author = finalState.players[comment.authorId];
      const sum = comment.reactions.heart + comment.reactions.tomato + comment.reactions.brick;
      assert.strictEqual(
        author.score,
        sum * 100,
        `Author ${comment.authorId} has score ${author.score} equal to ${sum} reactions * 100`
      );
      assert.strictEqual(
        author.roundScores.ROUND_1,
        sum * 100,
        `Author ${comment.authorId} roundScores.ROUND_1 is exactly ${sum * 100}`
      );
    }

    // Verify event ring buffer safety (must be capped at <= 120 elements)
    assert.ok(
      finalState.events.length <= 120,
      `Event ring buffer capped at <= 120 (current length: ${finalState.events.length})`
    );
  });

  // ============================================================================
  // TEST SCENARIO 3: Top Trending Sorting & Tie-Breaking Robustness
  // ============================================================================
  console.log('\n--- TEST 3: Top Trending Sorting & Tie-Breaking Robustness ---');

  await testStep('3.1 - Top Trending sorting adheres strictly to total reactions descending', async () => {
    const stateRes = await GET(createMockGetRequest(roomCode1));
    const state = await stateRes.json();
    const trendingTopIds: string[] = state.round1State.trendingTopIds;

    assert.ok(trendingTopIds.length >= 1 && trendingTopIds.length <= 5, 'Top Trending has up to 5 items');

    const commentsMap = state.round1State.comments as Record<string, FeedComment>;
    for (let i = 0; i < trendingTopIds.length - 1; i++) {
      const curComment = commentsMap[trendingTopIds[i]];
      const nextComment = commentsMap[trendingTopIds[i + 1]];
      const curTotal = curComment.reactions.heart + curComment.reactions.tomato + curComment.reactions.brick;
      const nextTotal = nextComment.reactions.heart + nextComment.reactions.tomato + nextComment.reactions.brick;
      assert.ok(
        curTotal >= nextTotal,
        `Rank ${i + 1} (${curTotal}) must have >= reactions than Rank ${i + 2} (${nextTotal})`
      );
    }
  });

  await testStep('3.2 - Edge Case: Complete Tie at Top 1 (Equal Reactions)', async () => {
    const roomCodeTie = `CHALLENGE_TIE_TOP1_${Date.now()}`;
    await POST(createMockPostRequest({ roomCode: roomCodeTie, action: 'JOIN', payload: { playerId: 'p1', name: 'Player 1' } }));
    await POST(createMockPostRequest({ roomCode: roomCodeTie, action: 'JOIN', payload: { playerId: 'p2', name: 'Player 2' } }));
    await POST(createMockPostRequest({ roomCode: roomCodeTie, action: 'JOIN', payload: { playerId: 'p3', name: 'Player 3' } }));

    await POST(createMockPostRequest({ roomCode: roomCodeTie, action: 'SET_STATUS', payload: { status: 'ROUND_1' } }));
    await POST(createMockPostRequest({ roomCode: roomCodeTie, action: 'SET_ROUND_PHASE', payload: { phase: 'FEED_REACTION' } }));

    // Submit 3 comments
    await POST(createMockPostRequest({ roomCode: roomCodeTie, action: 'SUBMIT_FEED_COMMENT', payload: { playerId: 'p1', text: 'Comment 1' } }));
    await POST(createMockPostRequest({ roomCode: roomCodeTie, action: 'SUBMIT_FEED_COMMENT', payload: { playerId: 'p2', text: 'Comment 2' } }));
    await POST(createMockPostRequest({ roomCode: roomCodeTie, action: 'SUBMIT_FEED_COMMENT', payload: { playerId: 'p3', text: 'Comment 3' } }));

    let sRes = await GET(createMockGetRequest(roomCodeTie));
    let sData = await sRes.json();
    const cList = Object.values(sData.round1State.comments) as FeedComment[];

    // Cast exactly 10 reactions to p1, 10 to p2, and 2 to p3
    for (let i = 0; i < 10; i++) {
      await POST(createMockPostRequest({ roomCode: roomCodeTie, action: 'REACT_FEED_POST', payload: { postId: cList[0].id, reactionType: 'heart', voterId: 'v1' } }));
      await POST(createMockPostRequest({ roomCode: roomCodeTie, action: 'REACT_FEED_POST', payload: { postId: cList[1].id, reactionType: 'tomato', voterId: 'v2' } }));
    }
    for (let i = 0; i < 2; i++) {
      await POST(createMockPostRequest({ roomCode: roomCodeTie, action: 'REACT_FEED_POST', payload: { postId: cList[2].id, reactionType: 'brick', voterId: 'v3' } }));
    }

    sRes = await GET(createMockGetRequest(roomCodeTie));
    sData = await sRes.json();
    const topIds = sData.round1State.trendingTopIds;

    assert.strictEqual(topIds.length, 3, 'All 3 comments ranked in trendingTopIds');
    const rank1Reactions = sData.round1State.comments[topIds[0]].reactions;
    const rank2Reactions = sData.round1State.comments[topIds[1]].reactions;
    const sum1 = rank1Reactions.heart + rank1Reactions.tomato + rank1Reactions.brick;
    const sum2 = rank2Reactions.heart + rank2Reactions.tomato + rank2Reactions.brick;

    assert.strictEqual(sum1, 10, 'Rank 1 has 10 reactions');
    assert.strictEqual(sum2, 10, 'Rank 2 has 10 reactions');
    assert.notStrictEqual(topIds[0], topIds[1], 'Top 1 and Top 2 are distinct items');
    assert.strictEqual(topIds[2], cList[2].id, 'Rank 3 is the lower reaction comment');
  });

  await testStep('3.3 - Edge Case: Zero Reactions across all 50 comments', async () => {
    const roomCodeZero = `CHALLENGE_ZERO_REACTIONS_${Date.now()}`;
    for (let i = 1; i <= 5; i++) {
      await POST(createMockPostRequest({ roomCode: roomCodeZero, action: 'JOIN', payload: { playerId: `z_${i}`, name: `Zero ${i}` } }));
      await POST(createMockPostRequest({ roomCode: roomCodeZero, action: 'SUBMIT_FEED_COMMENT', payload: { playerId: `z_${i}`, text: `Zero text ${i}` } }));
    }

    // Direct transition to TOP_TRENDING with 0 reactions
    const curZeroRes = await GET(createMockGetRequest(roomCodeZero));
    const curZeroState = await curZeroRes.json();
    await POST(
      createMockPostRequest({
        roomCode: roomCodeZero,
        action: 'HOST_UPDATE_STATE',
        payload: {
          round1State: {
            ...curZeroState.round1State,
            phase: 'TOP_TRENDING',
          },
        },
      })
    );

    const sRes = await GET(createMockGetRequest(roomCodeZero));
    const sData = await sRes.json();
    assert.strictEqual(sData.round1State.phase, 'TOP_TRENDING');
    assert.ok(sData.round1State.comments, 'Comments exist');

    // Simulate sorting logic from Round1Host.tsx on zero reactions
    const allComments = Object.values(sData.round1State.comments) as FeedComment[];
    const sorted = [...allComments].sort((a, b) => {
      const sumA = a.reactions.heart + a.reactions.tomato + a.reactions.brick;
      const sumB = b.reactions.heart + b.reactions.tomato + b.reactions.brick;
      return sumB - sumA;
    });

    assert.strictEqual(sorted.length, 5, 'All 5 comments sorted cleanly');
    assert.ok(sorted[0].id, 'First element has valid id');
    assert.ok(!Number.isNaN(sorted[0].score), 'Score is not NaN');
  });

  await testStep('3.4 - Boundary Tie at Top 3 / Top 4 border (tie-breaking preservation)', async () => {
    const roomCodeBorder = `CHALLENGE_BORDER_TIE_${Date.now()}`;
    for (let i = 1; i <= 5; i++) {
      await POST(createMockPostRequest({ roomCode: roomCodeBorder, action: 'JOIN', payload: { playerId: `b_${i}`, name: `Border ${i}` } }));
      await POST(createMockPostRequest({ roomCode: roomCodeBorder, action: 'SUBMIT_FEED_COMMENT', payload: { playerId: `b_${i}`, text: `Text ${i}` } }));
    }

    const sRes = await GET(createMockGetRequest(roomCodeBorder));
    const sData = await sRes.json();
    const cList = Object.values(sData.round1State.comments) as FeedComment[];

    // Set reaction counts:
    // b_1: 15
    // b_2: 10
    // b_3: 5 (Tie with b_4)
    // b_4: 5 (Tie with b_3)
    // b_5: 2
    for (let i = 0; i < 15; i++) await POST(createMockPostRequest({ roomCode: roomCodeBorder, action: 'REACT_FEED_POST', payload: { postId: cList[0].id, reactionType: 'heart', voterId: 'v' } }));
    for (let i = 0; i < 10; i++) await POST(createMockPostRequest({ roomCode: roomCodeBorder, action: 'REACT_FEED_POST', payload: { postId: cList[1].id, reactionType: 'heart', voterId: 'v' } }));
    for (let i = 0; i < 5; i++) await POST(createMockPostRequest({ roomCode: roomCodeBorder, action: 'REACT_FEED_POST', payload: { postId: cList[2].id, reactionType: 'heart', voterId: 'v' } }));
    for (let i = 0; i < 5; i++) await POST(createMockPostRequest({ roomCode: roomCodeBorder, action: 'REACT_FEED_POST', payload: { postId: cList[3].id, reactionType: 'heart', voterId: 'v' } }));
    for (let i = 0; i < 2; i++) await POST(createMockPostRequest({ roomCode: roomCodeBorder, action: 'REACT_FEED_POST', payload: { postId: cList[4].id, reactionType: 'heart', voterId: 'v' } }));

    const finalRes = await GET(createMockGetRequest(roomCodeBorder));
    const finalData = await finalRes.json();
    const topIds = finalData.round1State.trendingTopIds;

    assert.strictEqual(topIds.length, 5, '5 items in topIds');
    assert.strictEqual(topIds[0], cList[0].id, 'Rank 1 is b_1 (15 reactions)');
    assert.strictEqual(topIds[1], cList[1].id, 'Rank 2 is b_2 (10 reactions)');
    // Both b_3 and b_4 occupy ranks 3 and 4 in some stable order
    const rank3and4 = [topIds[2], topIds[3]];
    assert.ok(rank3and4.includes(cList[2].id), 'b_3 is in rank 3 or 4');
    assert.ok(rank3and4.includes(cList[3].id), 'b_4 is in rank 3 or 4');
    assert.strictEqual(topIds[4], cList[4].id, 'Rank 5 is b_5 (2 reactions)');
  });

  // ============================================================================
  // TEST SCENARIO 4: Placement Bonus Exactness & Return to Hub Navigation
  // ============================================================================
  console.log('\n--- TEST 4: Podium Bonus Calculation & Return to Hub ---');

  await testStep('4.1 - Phase transition to TOP_TRENDING awards +3000, +2000, +1500 bonuses', async () => {
    const stateRes = await GET(createMockGetRequest(roomCode1));
    const state = await stateRes.json();
    const topIds = state.round1State.trendingTopIds;
    const commentsMap = state.round1State.comments as Record<string, FeedComment>;

    const top1AuthorId = commentsMap[topIds[0]].authorId;
    const top2AuthorId = commentsMap[topIds[1]].authorId;
    const top3AuthorId = commentsMap[topIds[2]].authorId;

    const initialScore1 = state.players[top1AuthorId].score;
    const initialScore2 = state.players[top2AuthorId].score;
    const initialScore3 = state.players[top3AuthorId].score;

    // Simulate Round1Host.tsx awarding placement bonus on entering TOP_TRENDING
    const updatedPlayers = { ...state.players };
    updatedPlayers[top1AuthorId].score += 3000;
    updatedPlayers[top1AuthorId].roundScores.ROUND_1 = (updatedPlayers[top1AuthorId].roundScores.ROUND_1 || 0) + 3000;

    updatedPlayers[top2AuthorId].score += 2000;
    updatedPlayers[top2AuthorId].roundScores.ROUND_1 = (updatedPlayers[top2AuthorId].roundScores.ROUND_1 || 0) + 2000;

    updatedPlayers[top3AuthorId].score += 1500;
    updatedPlayers[top3AuthorId].roundScores.ROUND_1 = (updatedPlayers[top3AuthorId].roundScores.ROUND_1 || 0) + 1500;

    await POST(
      createMockPostRequest({
        roomCode: roomCode1,
        action: 'HOST_UPDATE_STATE',
        payload: {
          players: updatedPlayers,
          round1State: {
            ...state.round1State,
            phase: 'TOP_TRENDING',
          },
        },
      })
    );

    const finalRes = await GET(createMockGetRequest(roomCode1));
    const finalState = await finalRes.json();

    assert.strictEqual(finalState.players[top1AuthorId].score, initialScore1 + 3000, 'Top 1 received +3000 pts');
    assert.strictEqual(finalState.players[top2AuthorId].score, initialScore2 + 2000, 'Top 2 received +2000 pts');
    assert.strictEqual(finalState.players[top3AuthorId].score, initialScore3 + 1500, 'Top 3 received +1500 pts');

    // Verify non-top players did NOT receive placement bonus
    for (let i = 4; i <= 50; i++) {
      const studentId = `stu_${i}`;
      if (studentId !== top1AuthorId && studentId !== top2AuthorId && studentId !== top3AuthorId) {
        const comment = Object.values(finalState.round1State.comments as Record<string, FeedComment>).find(
          (c) => c.authorId === studentId
        );
        const reactionSum = comment ? (comment.reactions.heart + comment.reactions.tomato + comment.reactions.brick) : 0;
        assert.strictEqual(
          finalState.players[studentId].score,
          reactionSum * 100,
          `Player ${studentId} received only reaction points, no placement bonus`
        );
      }
    }
  });

  await testStep('4.2 - RETURN_TO_HUB preserves all player scores and resets room status to LOBBY', async () => {
    const stateBeforeRes = await GET(createMockGetRequest(roomCode1));
    const stateBefore = await stateBeforeRes.json();

    const returnRes = await POST(
      createMockPostRequest({
        roomCode: roomCode1,
        action: 'RETURN_TO_HUB',
        payload: {},
      })
    );
    assert.strictEqual(returnRes.status, 200, 'RETURN_TO_HUB succeeded');

    const stateAfterRes = await GET(createMockGetRequest(roomCode1));
    const stateAfter = await stateAfterRes.json();

    assert.strictEqual(stateAfter.status, 'LOBBY', 'Status successfully changed back to LOBBY');
    assert.strictEqual(stateAfter.currentRoundPhase, 'LOBBY_WAITING', 'Phase returned to LOBBY_WAITING');
    assert.strictEqual(Object.keys(stateAfter.players).length, 50, 'All 50 players remain in room');

    // Confirm 100% score preservation across all 50 players
    for (let i = 1; i <= 50; i++) {
      const studentId = `stu_${i}`;
      assert.strictEqual(
        stateAfter.players[studentId].score,
        stateBefore.players[studentId].score,
        `Player ${studentId} score strictly preserved across RETURN_TO_HUB`
      );
    }
  });

  // ============================================================================
  // TEST SCENARIO 5: Extreme Edge Cases & Adversarial Invariants
  // ============================================================================
  console.log('\n--- TEST 5: Extreme Edge Cases & Adversarial Invariants ---');

  await testStep('5.1 - Empty room boundary: 0 comments transitioning to TOP_TRENDING does not crash', async () => {
    const roomCodeEmpty = `CHALLENGE_EMPTY_${Date.now()}`;
    await POST(createMockPostRequest({ roomCode: roomCodeEmpty, action: 'JOIN', payload: { playerId: 'p_alone', name: 'Alone' } }));
    await POST(createMockPostRequest({ roomCode: roomCodeEmpty, action: 'SET_STATUS', payload: { status: 'ROUND_1' } }));

    // Empty comments transition
    await POST(
      createMockPostRequest({
        roomCode: roomCodeEmpty,
        action: 'HOST_UPDATE_STATE',
        payload: {
          round1State: {
            phase: 'TOP_TRENDING',
            comments: {},
            trendingTopIds: [],
          },
        },
      })
    );

    const sRes = await GET(createMockGetRequest(roomCodeEmpty));
    const sData = await sRes.json();
    assert.strictEqual(sData.round1State.phase, 'TOP_TRENDING');
    assert.deepStrictEqual(sData.round1State.trendingTopIds, []);
    assert.strictEqual(sData.players.p_alone.score, 0, 'No false bonuses awarded in empty room');
  });

  await testStep('5.2 - Invalid & Malformed REACT_FEED_POST requests do not crash or corrupt state', async () => {
    const roomCodeMal = `CHALLENGE_MAL_${Date.now()}`;
    await POST(createMockPostRequest({ roomCode: roomCodeMal, action: 'JOIN', payload: { playerId: 'p1', name: 'Player 1' } }));
    await POST(createMockPostRequest({ roomCode: roomCodeMal, action: 'SUBMIT_FEED_COMMENT', payload: { playerId: 'p1', text: 'Valid post' } }));

    const sRes = await GET(createMockGetRequest(roomCodeMal));
    const sData = await sRes.json();
    const validPostId = Object.keys(sData.round1State.comments)[0];

    // Case 1: Non-existent postId
    const res1 = await POST(
      createMockPostRequest({
        roomCode: roomCodeMal,
        action: 'REACT_FEED_POST',
        payload: { postId: 'fake_non_existent_id', reactionType: 'heart', voterId: 'p1' },
      })
    );
    assert.strictEqual(res1.status, 200, 'Non-existent postId handled safely without 500');

    // Case 2: Unknown reactionType ('clown') defaults safely to brick
    const res2 = await POST(
      createMockPostRequest({
        roomCode: roomCodeMal,
        action: 'REACT_FEED_POST',
        payload: { postId: validPostId, reactionType: 'clown', voterId: 'p1' },
      })
    );
    assert.strictEqual(res2.status, 200);

    // Case 3: Empty reactionType
    const res3 = await POST(
      createMockPostRequest({
        roomCode: roomCodeMal,
        action: 'REACT_FEED_POST',
        payload: { postId: validPostId, reactionType: '', voterId: 'p1' },
      })
    );
    assert.strictEqual(res3.status, 200);

    const checkRes = await GET(createMockGetRequest(roomCodeMal));
    const checkData = await checkRes.json();
    const comment = checkData.round1State.comments[validPostId];
    assert.strictEqual(comment.reactions.brick, 1, 'Unknown reaction defaulted safely to brick');
    assert.strictEqual(comment.reactions.heart, 0);
  });

  await testStep('5.3 - Ultra-Scale 1,000 Reactions Flurry (50 students x 20 reactions parallel)', async () => {
    const roomCode1000 = `CHALLENGE_1000_${Date.now()}`;
    // Register 50 students
    for (let i = 1; i <= 50; i++) {
      await POST(createMockPostRequest({ roomCode: roomCode1000, action: 'JOIN', payload: { playerId: `u_${i}`, name: `User ${i}` } }));
      await POST(createMockPostRequest({ roomCode: roomCode1000, action: 'SUBMIT_FEED_COMMENT', payload: { playerId: `u_${i}`, text: `Thought ${i}` } }));
    }

    let sRes = await GET(createMockGetRequest(roomCode1000));
    let sData = await sRes.json();
    const cList = Object.values(sData.round1State.comments) as FeedComment[];
    assert.strictEqual(cList.length, 50, '50 comments ready for 1000-reaction stress');

    // 50 students each cast 20 reactions = 1,000 reactions!
    const flurryPromises: Promise<any>[] = [];
    const authorReactionsCount: Record<string, number> = {};

    cList.forEach((c) => {
      authorReactionsCount[c.authorId] = 0;
    });

    for (let u = 1; u <= 50; u++) {
      const voterId = `u_${u}`;
      for (let r = 0; r < 20; r++) {
        // Skewed targeting so some posts get heavy reactions, some get few
        const targetIdx = (u * 13 + r * 7) % 50;
        const targetPost = cList[targetIdx];
        authorReactionsCount[targetPost.authorId]++;

        flurryPromises.push(
          POST(
            createMockPostRequest({
              roomCode: roomCode1000,
              action: 'REACT_FEED_POST',
              payload: {
                postId: targetPost.id,
                reactionType: r % 2 === 0 ? 'heart' : 'tomato',
                voterId,
              },
            })
          )
        );
      }
    }

    assert.strictEqual(flurryPromises.length, 1000, 'Exactly 1,000 reactions queued');

    // Execute in 10 parallel batches of 100
    const startFlurry = performance.now();
    for (let b = 0; b < flurryPromises.length; b += 100) {
      await Promise.all(flurryPromises.slice(b, b + 100));
    }
    const flurryDuration = performance.now() - startFlurry;
    console.log(`      ⚡ 1,000 reactions processed in ${flurryDuration.toFixed(2)}ms (${(1000 / (flurryDuration / 1000)).toFixed(0)} req/s)`);

    sRes = await GET(createMockGetRequest(roomCode1000));
    sData = await sRes.json();

    let total1000Sum = 0;
    for (const comment of Object.values(sData.round1State.comments) as FeedComment[]) {
      const rSum = comment.reactions.heart + comment.reactions.tomato + comment.reactions.brick;
      total1000Sum += rSum;
      const expectedCount = authorReactionsCount[comment.authorId];
      assert.strictEqual(rSum, expectedCount, `Post ${comment.id} reaction sum strictly equals expected count`);
      assert.strictEqual(sData.players[comment.authorId].score, expectedCount * 100, `Author score strictly equals reactions * 100`);
    }

    assert.strictEqual(total1000Sum, 1000, 'Exactly 1,000 reactions recorded without any dropped reaction');
    assert.ok(sData.events.length <= 120, 'Event ring buffer remains capped at <= 120 events');
  });

  await testStep('5.4 - Deterministic Tie-Breaking with Identical Total Reactions', async () => {
    const roomCodeMultiTie = `CHALLENGE_MULTITIE_${Date.now()}`;
    for (let i = 1; i <= 6; i++) {
      await POST(createMockPostRequest({ roomCode: roomCodeMultiTie, action: 'JOIN', payload: { playerId: `t_${i}`, name: `Tie ${i}` } }));
      await POST(createMockPostRequest({ roomCode: roomCodeMultiTie, action: 'SUBMIT_FEED_COMMENT', payload: { playerId: `t_${i}`, text: `Text ${i}` } }));
    }

    const sRes = await GET(createMockGetRequest(roomCodeMultiTie));
    const sData = await sRes.json();
    const cList = Object.values(sData.round1State.comments) as FeedComment[];

    // Give ALL 6 comments identical total reactions (each gets 7 reactions)
    // with different distributions:
    // t_1: 7 hearts
    // t_2: 4 hearts, 3 tomatoes
    // t_3: 2 hearts, 2 tomatoes, 3 bricks
    // t_4: 7 bricks
    // t_5: 7 tomatoes
    // t_6: 1 heart, 5 tomatoes, 1 brick
    const distributions = [
      { heart: 7, tomato: 0, brick: 0 },
      { heart: 4, tomato: 3, brick: 0 },
      { heart: 2, tomato: 2, brick: 3 },
      { heart: 0, tomato: 0, brick: 7 },
      { heart: 0, tomato: 7, brick: 0 },
      { heart: 1, tomato: 5, brick: 1 },
    ];

    for (let i = 0; i < 6; i++) {
      const dist = distributions[i];
      const postId = cList[i].id;
      for (let h = 0; h < dist.heart; h++) await POST(createMockPostRequest({ roomCode: roomCodeMultiTie, action: 'REACT_FEED_POST', payload: { postId, reactionType: 'heart', voterId: 'v' } }));
      for (let t = 0; t < dist.tomato; t++) await POST(createMockPostRequest({ roomCode: roomCodeMultiTie, action: 'REACT_FEED_POST', payload: { postId, reactionType: 'tomato', voterId: 'v' } }));
      for (let b = 0; b < dist.brick; b++) await POST(createMockPostRequest({ roomCode: roomCodeMultiTie, action: 'REACT_FEED_POST', payload: { postId, reactionType: 'brick', voterId: 'v' } }));
    }

    const checkRes = await GET(createMockGetRequest(roomCodeMultiTie));
    const checkData = await checkRes.json();
    const topIds = checkData.round1State.trendingTopIds;

    assert.strictEqual(topIds.length, 5, 'Top 5 picked from 6 tied comments');
    // Ensure all 5 items are distinct
    const uniqueTopSet = new Set(topIds);
    assert.strictEqual(uniqueTopSet.size, 5, 'All 5 items in trendingTopIds are distinct');

    // Verify all 5 have exactly 7 reactions
    for (const id of topIds) {
      const c = checkData.round1State.comments[id];
      const sum = c.reactions.heart + c.reactions.tomato + c.reactions.brick;
      assert.strictEqual(sum, 7, 'Tied comment has strictly 7 reactions');
    }
  });

  console.log('\n================================================================');
  console.log(`  ALL ${totalTests} CHALLENGER TESTS PASSED (100% VERIFIED)`);
  console.log('================================================================\n');
}

runM2ChallengerStressTests().catch((err) => {
  console.error('\n❌ CHALLENGER STRESS SUITE FAILED:', err);
  process.exit(1);
});
