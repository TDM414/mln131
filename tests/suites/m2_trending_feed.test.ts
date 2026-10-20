// tests/suites/m2_trending_feed.test.ts
// Comprehensive Automated Test Suite for Milestone 2: Mode 1: Tường Bình Luận Triệu Like (Trending Feed Wall)

import assert from 'node:assert';
import { NextRequest } from 'next/server';
import { POST, GET } from '../../src/app/api/game/route';
import { MLN131_ROAST_PROMPTS, ROAST_QUICK_CHIPS, VIETNAMESE_ROAST_BANK } from '../../src/data/questions';
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

async function runM2TrendingFeedTests() {
  console.log('\n======================================================');
  console.log('--- STARTING MILESTONE 2: MODE 1 TEST SUITE ---');
  console.log('======================================================\n');

  const roomCode = `M2_FEED_TEST_${Date.now()}`;

  // -----------------------------------------------------------
  // STEP 1: Room Creation & Multi-Student Registration
  // -----------------------------------------------------------
  console.log('Step 1: Registering 5 students in room', roomCode);
  const students = [
    { id: 'stu_1', name: 'Nguyễn Văn Tuấn', avatarId: 'keyboard_warrior' },
    { id: 'stu_2', name: 'Trần Thị Mai', avatarId: 'genz_slang_queen' },
    { id: 'stu_3', name: 'Lê Hoàng Nam', avatarId: 'fact_checker' },
    { id: 'stu_4', name: 'Phạm Minh Đức', avatarId: 'righteous_netizen' },
    { id: 'stu_5', name: 'Vũ Thảo Linh', avatarId: 'drama_queen' },
  ];

  for (const stu of students) {
    const res = await POST(
      createMockPostRequest({
        roomCode,
        action: 'JOIN',
        payload: {
          playerId: stu.id,
          name: stu.name,
          avatarId: stu.avatarId,
        },
      })
    );
    assert.strictEqual(res.status, 200, `Player ${stu.name} joined successfully`);
  }

  let getRes = await GET(createMockGetRequest(roomCode));
  let stateData = await getRes.json();
  assert.strictEqual(Object.keys(stateData.players).length, 5, 'All 5 students registered in room state');
  console.log('✔ 5 students successfully registered in lobby.');

  // -----------------------------------------------------------
  // STEP 2: Transition to ROUND_1 / PROMPT phase
  // -----------------------------------------------------------
  console.log('\nStep 2: Transitioning status to ROUND_1 with phase PROMPT');
  await POST(
    createMockPostRequest({
      roomCode,
      action: 'SET_STATUS',
      payload: { status: 'ROUND_1' },
    })
  );

  await POST(
    createMockPostRequest({
      roomCode,
      action: 'SET_ROUND_PHASE',
      payload: { phase: 'PROMPT' },
    })
  );

  getRes = await GET(createMockGetRequest(roomCode));
  stateData = await getRes.json();
  assert.strictEqual(stateData.status, 'ROUND_1', 'GameShow status is ROUND_1');
  assert.strictEqual(stateData.round1State.phase, 'PROMPT', 'Round 1 phase is PROMPT');
  assert(stateData.round1State.prompt, 'Prompt scenario is loaded');
  assert.strictEqual(stateData.round1State.prompt.id, MLN131_ROAST_PROMPTS[0].id, 'Initial prompt matches MLN131 curriculum');
  console.log('✔ Mode 1 successfully initialized with MLN131 prompt:', stateData.round1State.prompt.category);

  // -----------------------------------------------------------
  // STEP 3: Multi-Student Comment Submission
  // -----------------------------------------------------------
  console.log('\nStep 3: All 5 students submit comments on the prompt concurrently');
  const submittedComments = [
    {
      playerId: 'stu_1',
      playerName: 'Nguyễn Văn Tuấn',
      avatarId: 'keyboard_warrior',
      text: 'Ăn chanh luộc ngừa virus thì giáo trình MLN131 xin phép quỳ lạy bạn ơi! Lùa gà trắng trợn!',
    },
    {
      playerId: 'stu_2',
      playerName: 'Trần Thị Mai',
      avatarId: 'genz_slang_queen',
      text: 'Ủa alo? Check VAR ngay và luôn, KOL 5 triệu follow mà phát ngôn đỉnh nóc kịch trần thế này!',
    },
    {
      playerId: 'stu_3',
      playerName: 'Lê Hoàng Nam',
      avatarId: 'fact_checker',
      text: 'Theo Luật An ninh mạng, hành vi tung tin sai sự thật về y tế cộng đồng bị phạt từ 10-20 triệu!',
    },
    {
      playerId: 'stu_4',
      playerName: 'Phạm Minh Đức',
      avatarId: 'righteous_netizen',
      text: 'Dân biết, dân bàn, dân kiểm tra! Cần tỉnh táo trước các chiêu trò trục lợi tâm lý số.',
    },
    {
      playerId: 'stu_5',
      playerName: 'Vũ Thảo Linh',
      avatarId: 'drama_queen',
      text: 'Chanh 500k/lạng chắc hái từ sao Hỏa về! Nhanh trí bấm Report cho bay kênh!',
    },
  ];

  for (const c of submittedComments) {
    const postRes = await POST(
      createMockPostRequest({
        roomCode,
        action: 'SUBMIT_FEED_COMMENT',
        payload: c,
      })
    );
    assert.strictEqual(postRes.status, 200, `Comment submitted for ${c.playerName}`);
  }

  getRes = await GET(createMockGetRequest(roomCode));
  stateData = await getRes.json();
  const commentsMap = stateData.round1State.comments;
  const commentsList: FeedComment[] = Object.values(commentsMap || {});
  assert.strictEqual(commentsList.length, 5, 'All 5 comments are recorded in round1State.comments');

  // Verify posts compatibility
  const postsMap = stateData.round1State.posts;
  const postsList: TrendingPost[] = Object.values(postsMap || {});
  assert.strictEqual(postsList.length, 5, 'All 5 posts recorded in round1State.posts for backwards compatibility');

  // Verify that each author matches
  for (const c of submittedComments) {
    const found = commentsList.find((item) => item.authorId === c.playerId);
    assert(found, `Comment found for player ${c.playerId}`);
    assert.strictEqual(found.authorName, c.playerName);
    assert.strictEqual(found.text, c.text);
    assert.strictEqual(found.reactions.heart, 0);
    assert.strictEqual(found.reactions.tomato, 0);
    assert.strictEqual(found.reactions.brick, 0);
  }
  console.log('✔ Multi-comment submission verified with 5 unique author comments.');

  // -----------------------------------------------------------
  // STEP 4: Phase Transition to FEED_REACTION
  // -----------------------------------------------------------
  console.log('\nStep 4: Transitioning phase to FEED_REACTION (Live Reaction Wall)');
  await POST(
    createMockPostRequest({
      roomCode,
      action: 'HOST_UPDATE_STATE',
      payload: {
        round1State: {
          ...stateData.round1State,
          phase: 'FEED_REACTION',
        },
      },
    })
  );

  getRes = await GET(createMockGetRequest(roomCode));
  stateData = await getRes.json();
  assert.strictEqual(stateData.round1State.phase, 'FEED_REACTION', 'Phase updated to FEED_REACTION');
  console.log('✔ Phase is now FEED_REACTION. Ready for reaction barrage.');

  // -----------------------------------------------------------
  // STEP 5: Reaction Barrage Aggregation
  // -----------------------------------------------------------
  console.log('\nStep 5: Simulating 30s live reaction barrage (❤️, 🍅, 🧱)');
  // We want to create a clear ranking:
  // Post of stu_2 (Trần Thị Mai) -> Most reactions: 5 hearts + 2 tomatoes + 1 brick = 8 total
  // Post of stu_1 (Nguyễn Văn Tuấn) -> 2nd: 3 hearts + 2 tomatoes + 1 brick = 6 total
  // Post of stu_3 (Lê Hoàng Nam) -> 3rd: 2 hearts + 1 tomato + 1 brick = 4 total
  // Post of stu_5 (Vũ Thảo Linh) -> 4th: 1 heart + 1 tomato = 2 total
  // Post of stu_4 (Phạm Minh Đức) -> 5th: 1 heart = 1 total

  const commentOfStu2 = commentsList.find((c) => c.authorId === 'stu_2')!;
  const commentOfStu1 = commentsList.find((c) => c.authorId === 'stu_1')!;
  const commentOfStu3 = commentsList.find((c) => c.authorId === 'stu_3')!;
  const commentOfStu5 = commentsList.find((c) => c.authorId === 'stu_5')!;
  const commentOfStu4 = commentsList.find((c) => c.authorId === 'stu_4')!;

  const reactionsToCast = [
    // Post 2 (stu_2): 5 hearts, 2 tomatoes, 1 brick (8 reactions)
    { postId: commentOfStu2.id, type: 'heart', voter: 'stu_1' },
    { postId: commentOfStu2.id, type: 'heart', voter: 'stu_3' },
    { postId: commentOfStu2.id, type: 'heart', voter: 'stu_4' },
    { postId: commentOfStu2.id, type: 'heart', voter: 'stu_5' },
    { postId: commentOfStu2.id, type: 'heart', voter: 'stu_1' },
    { postId: commentOfStu2.id, type: 'tomato', voter: 'stu_3' },
    { postId: commentOfStu2.id, type: 'tomato', voter: 'stu_4' },
    { postId: commentOfStu2.id, type: 'brick', voter: 'stu_5' },

    // Post 1 (stu_1): 3 hearts, 2 tomatoes, 1 brick (6 reactions)
    { postId: commentOfStu1.id, type: 'heart', voter: 'stu_2' },
    { postId: commentOfStu1.id, type: 'heart', voter: 'stu_3' },
    { postId: commentOfStu1.id, type: 'heart', voter: 'stu_4' },
    { postId: commentOfStu1.id, type: 'tomato', voter: 'stu_5' },
    { postId: commentOfStu1.id, type: 'tomato', voter: 'stu_2' },
    { postId: commentOfStu1.id, type: 'brick', voter: 'stu_3' },

    // Post 3 (stu_3): 2 hearts, 1 tomato, 1 brick (4 reactions)
    { postId: commentOfStu3.id, type: 'heart', voter: 'stu_1' },
    { postId: commentOfStu3.id, type: 'heart', voter: 'stu_2' },
    { postId: commentOfStu3.id, type: 'tomato', voter: 'stu_4' },
    { postId: commentOfStu3.id, type: 'brick', voter: 'stu_5' },

    // Post 5 (stu_5): 1 heart, 1 tomato (2 reactions)
    { postId: commentOfStu5.id, type: 'heart', voter: 'stu_1' },
    { postId: commentOfStu5.id, type: 'tomato', voter: 'stu_2' },

    // Post 4 (stu_4): 1 heart (1 reaction)
    { postId: commentOfStu4.id, type: 'heart', voter: 'stu_1' },
  ];

  for (const r of reactionsToCast) {
    const res = await POST(
      createMockPostRequest({
        roomCode,
        action: 'REACT_FEED_POST',
        payload: {
          postId: r.postId,
          reactionType: r.type,
          voterId: r.voter,
        },
      })
    );
    assert.strictEqual(res.status, 200);
  }

  getRes = await GET(createMockGetRequest(roomCode));
  stateData = await getRes.json();

  const c2 = stateData.round1State.comments[commentOfStu2.id];
  assert.strictEqual(c2.reactions.heart, 5, 'Post 2 has 5 hearts');
  assert.strictEqual(c2.reactions.tomato, 2, 'Post 2 has 2 tomatoes');
  assert.strictEqual(c2.reactions.brick, 1, 'Post 2 has 1 brick');
  const sum2 = c2.reactions.heart + c2.reactions.tomato + c2.reactions.brick;
  assert.strictEqual(sum2, 8, 'Post 2 total reactions = 8');

  const c1 = stateData.round1State.comments[commentOfStu1.id];
  const sum1 = c1.reactions.heart + c1.reactions.tomato + c1.reactions.brick;
  assert.strictEqual(sum1, 6, 'Post 1 total reactions = 6');

  const c3 = stateData.round1State.comments[commentOfStu3.id];
  const sum3 = c3.reactions.heart + c3.reactions.tomato + c3.reactions.brick;
  assert.strictEqual(sum3, 4, 'Post 3 total reactions = 4');

  const c5 = stateData.round1State.comments[commentOfStu5.id];
  const sum5 = c5.reactions.heart + c5.reactions.tomato + c5.reactions.brick;
  assert.strictEqual(sum5, 2, 'Post 5 total reactions = 2');

  const c4 = stateData.round1State.comments[commentOfStu4.id];
  const sum4 = c4.reactions.heart + c4.reactions.tomato + c4.reactions.brick;
  assert.strictEqual(sum4, 1, 'Post 4 total reactions = 1');

  // Verify real-time reaction point award (+100 per reaction received)
  assert.strictEqual(stateData.players.stu_2.score, 8 * 100, 'Author 2 earned 800 pts from 8 reactions');
  assert.strictEqual(stateData.players.stu_1.score, 6 * 100, 'Author 1 earned 600 pts from 6 reactions');
  assert.strictEqual(stateData.players.stu_3.score, 4 * 100, 'Author 3 earned 400 pts from 4 reactions');
  assert.strictEqual(stateData.players.stu_5.score, 2 * 100, 'Author 5 earned 200 pts from 2 reactions');
  assert.strictEqual(stateData.players.stu_4.score, 1 * 100, 'Author 4 earned 100 pts from 1 reaction');

  // Verify auto-computed trendingTopIds order
  const topIds: string[] = stateData.round1State.trendingTopIds;
  assert.strictEqual(topIds[0], commentOfStu2.id, 'Top 1 is Post 2 (stu_2)');
  assert.strictEqual(topIds[1], commentOfStu1.id, 'Top 2 is Post 1 (stu_1)');
  assert.strictEqual(topIds[2], commentOfStu3.id, 'Top 3 is Post 3 (stu_3)');
  assert.strictEqual(topIds[3], commentOfStu5.id, 'Top 4 is Post 5 (stu_5)');
  assert.strictEqual(topIds[4], commentOfStu4.id, 'Top 5 is Post 4 (stu_4)');

  console.log('✔ Reaction aggregation and realtime +100/reaction points verified perfectly.');
  console.log('✔ Trending ranking order verified:', topIds);

  // -----------------------------------------------------------
  // STEP 6: Phase Transition to TOP_TRENDING & Placement Bonuses
  // -----------------------------------------------------------
  console.log('\nStep 6: Transitioning to TOP_TRENDING & awarding podium bonuses (+3000, +2000, +1500)');
  // Host updates phase to TOP_TRENDING and awards placement bonuses
  const updatedPlayers = { ...stateData.players };
  // Top 1: stu_2 (+3000)
  updatedPlayers.stu_2.score += 3000;
  updatedPlayers.stu_2.roundScores.ROUND_1 = (updatedPlayers.stu_2.roundScores.ROUND_1 || 0) + 3000;

  // Top 2: stu_1 (+2000)
  updatedPlayers.stu_1.score += 2000;
  updatedPlayers.stu_1.roundScores.ROUND_1 = (updatedPlayers.stu_1.roundScores.ROUND_1 || 0) + 2000;

  // Top 3: stu_3 (+1500)
  updatedPlayers.stu_3.score += 1500;
  updatedPlayers.stu_3.roundScores.ROUND_1 = (updatedPlayers.stu_3.roundScores.ROUND_1 || 0) + 1500;

  await POST(
    createMockPostRequest({
      roomCode,
      action: 'HOST_UPDATE_STATE',
      payload: {
        players: updatedPlayers,
        round1State: {
          ...stateData.round1State,
          phase: 'TOP_TRENDING',
        },
      },
    })
  );

  getRes = await GET(createMockGetRequest(roomCode));
  stateData = await getRes.json();
  assert.strictEqual(stateData.round1State.phase, 'TOP_TRENDING', 'Phase is TOP_TRENDING');

  // Verify final calculated scores
  // stu_2: 800 + 3000 = 3800
  assert.strictEqual(stateData.players.stu_2.score, 3800, 'Top 1 (stu_2) score = 3800');
  assert.strictEqual(stateData.players.stu_2.roundScores.ROUND_1, 3800, 'stu_2 roundScores.ROUND_1 = 3800');

  // stu_1: 600 + 2000 = 2600
  assert.strictEqual(stateData.players.stu_1.score, 2600, 'Top 2 (stu_1) score = 2600');
  assert.strictEqual(stateData.players.stu_1.roundScores.ROUND_1, 2600, 'stu_1 roundScores.ROUND_1 = 2600');

  // stu_3: 400 + 1500 = 1900
  assert.strictEqual(stateData.players.stu_3.score, 1900, 'Top 3 (stu_3) score = 1900');
  assert.strictEqual(stateData.players.stu_3.roundScores.ROUND_1, 1900, 'stu_3 roundScores.ROUND_1 = 1900');

  // stu_5: 200 (no placement bonus)
  assert.strictEqual(stateData.players.stu_5.score, 200, 'Rank 4 (stu_5) score = 200');

  // stu_4: 100 (no placement bonus)
  assert.strictEqual(stateData.players.stu_4.score, 100, 'Rank 5 (stu_4) score = 100');

  console.log('✔ Top Trending podium bonus calculation verified:');
  console.log('    🥇 Top 1 (Trần Thị Mai): 3,800 PTS (+3000 bonus + 800 reactions)');
  console.log('    🥈 Top 2 (Nguyễn Văn Tuấn): 2,600 PTS (+2000 bonus + 600 reactions)');
  console.log('    🥉 Top 3 (Lê Hoàng Nam): 1,900 PTS (+1500 bonus + 400 reactions)');

  // -----------------------------------------------------------
  // STEP 7: Return to Hub Action (Navigation & Score Preservation)
  // -----------------------------------------------------------
  console.log('\nStep 7: Testing RETURN_TO_HUB button action');
  const returnRes = await POST(
    createMockPostRequest({
      roomCode,
      action: 'RETURN_TO_HUB',
      payload: {},
    })
  );
  assert.strictEqual(returnRes.status, 200, 'RETURN_TO_HUB action successful');

  getRes = await GET(createMockGetRequest(roomCode));
  stateData = await getRes.json();
  assert.strictEqual(stateData.status, 'LOBBY', 'Status returned to LOBBY');
  assert.strictEqual(stateData.currentRoundPhase, 'LOBBY_WAITING', 'Phase returned to LOBBY_WAITING');

  // Confirm scores are preserved across return to hub
  assert.strictEqual(stateData.players.stu_2.score, 3800, 'Scores preserved: stu_2 has 3800 pts');
  assert.strictEqual(stateData.players.stu_1.score, 2600, 'Scores preserved: stu_1 has 2600 pts');
  assert.strictEqual(stateData.players.stu_3.score, 1900, 'Scores preserved: stu_3 has 1900 pts');
  assert.strictEqual(stateData.players.stu_5.score, 200, 'Scores preserved: stu_5 has 200 pts');
  assert.strictEqual(stateData.players.stu_4.score, 100, 'Scores preserved: stu_4 has 100 pts');
  console.log('✔ Successfully returned to Hub with all player scores intact!');

  console.log('\n======================================================');
  console.log('✔ ALL MILESTONE 2: MODE 1 AUTOMATED TESTS PASSED (100%)');
  console.log('======================================================\n');
}

runM2TrendingFeedTests().catch((err) => {
  console.error('❌ M2 Trending Feed Test Suite Failed:', err);
  process.exit(1);
});
