// tests/stress/m1_stress_harness.ts
// Empirical Stress Harness for Milestone 1: Delta Sync Engine & /api/game Route

import { NextRequest } from 'next/server';
import { GET, POST } from '../../src/app/api/game/route';

interface StressReport {
  scenario: string;
  expected: string;
  actual: string;
  passed: boolean;
  durationMs: number;
  details?: any;
}

const reports: StressReport[] = [];

function makePostRequest(body: any, rawBody?: string): NextRequest {
  const init: any = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  };
  if (rawBody !== undefined) {
    init.body = rawBody;
  } else {
    init.body = JSON.stringify(body);
  }
  return new NextRequest('http://localhost:3000/api/game', init);
}

function makeGetRequest(room: string = 'MLN131', since: number = 0): NextRequest {
  const url = `http://localhost:3000/api/game?room=${encodeURIComponent(room)}&since=${since}`;
  return new NextRequest(url, { method: 'GET' });
}

async function runScenario(
  name: string,
  expected: string,
  fn: () => Promise<{ actual: string; passed: boolean; details?: any }>
) {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = Math.round(performance.now() - start);
    reports.push({
      scenario: name,
      expected,
      actual: result.actual,
      passed: result.passed,
      durationMs: duration,
      details: result.details,
    });
    console.log(
      `[${result.passed ? 'PASS' : 'FAIL'}] ${name} (${duration}ms) - Actual: ${result.actual}`
    );
  } catch (err: any) {
    const duration = Math.round(performance.now() - start);
    reports.push({
      scenario: name,
      expected,
      actual: `UNCAUGHT_EXCEPTION: ${err.message}`,
      passed: false,
      durationMs: duration,
      details: { stack: err.stack },
    });
    console.log(`[FAIL] ${name} (${duration}ms) - Exception: ${err.message}`);
  }
}

export async function runAllStressTests() {
  console.log('===============================================================');
  console.log('  STARTING EMPIRICAL STRESS TESTS FOR MILESTONE 1 (/api/game)');
  console.log('===============================================================\n');

  const testRoom = `TEST_M1_${Date.now()}`;

  // ------------------------------------------------------------------------
  // TEST 1: Concurrent Joins (50 players)
  // ------------------------------------------------------------------------
  await runScenario(
    'Concurrent Joins (50 players)',
    'All 50 unique players successfully joined without race conditions or data loss',
    async () => {
      const joinPromises = [];
      for (let i = 1; i <= 50; i++) {
        const req = makePostRequest({
          roomCode: testRoom,
          action: 'JOIN',
          payload: {
            playerId: `player_${i}`,
            name: `Học Viên Dân Mạng ${i}`,
            avatarId: 'keyboard_warrior',
            isBot: false,
          },
        });
        joinPromises.push(POST(req));
      }

      const responses = await Promise.all(joinPromises);
      const allOk = responses.every((res) => res.status === 200);

      // Verify room state via GET
      const getReq = makeGetRequest(testRoom, 0);
      const getRes = await GET(getReq);
      const data = await getRes.json();

      const playerCount = Object.keys(data.players || {}).length;
      const passed = allOk && playerCount === 50;

      return {
        passed,
        actual: `HTTP All 200: ${allOk}, Stored Players: ${playerCount}/50`,
        details: { playerCount, allOk },
      };
    }
  );

  // ------------------------------------------------------------------------
  // TEST 2: Rapid Polling Intervals under high traffic
  // ------------------------------------------------------------------------
  await runScenario(
    'Rapid Polling Intervals (50 clients polling every 50ms for 1.5s with simultaneous writes)',
    'Zero dropped GET responses, latency under 50ms average, consistent delta catchup',
    async () => {
      let pollCount = 0;
      let errorCount = 0;
      const latencies: number[] = [];

      const stopTime = Date.now() + 1500;
      const activePollers = [];

      // 50 concurrent polling loops
      for (let i = 1; i <= 50; i++) {
        activePollers.push(
          (async () => {
            let lastSince = 0;
            while (Date.now() < stopTime) {
              const start = performance.now();
              try {
                const req = makeGetRequest(testRoom, lastSince);
                const res = await GET(req);
                latencies.push(performance.now() - start);
                if (res.status === 200) {
                  pollCount++;
                  const json = await res.json();
                  if (json.events && json.events.length > 0) {
                    lastSince = json.events[json.events.length - 1].timestamp;
                  }
                } else {
                  errorCount++;
                }
              } catch (e) {
                errorCount++;
              }
              await new Promise((r) => setTimeout(r, 50));
            }
          })()
        );
      }

      // Simultaneously push 20 Danmaku events into the room
      const writer = (async () => {
        for (let j = 0; j < 20; j++) {
          const req = makePostRequest({
            roomCode: testRoom,
            action: 'DANMAKU',
            payload: {
              emoji: '🍅',
              text: `Gạch đá bay lần ${j}`,
              senderName: 'Troll Bot',
            },
          });
          await POST(req);
          await new Promise((r) => setTimeout(r, 60));
        }
      })();

      await Promise.all([...activePollers, writer]);

      const avgLatency =
        latencies.length > 0
          ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
          : 0;

      const passed = errorCount === 0 && pollCount >= 500 && avgLatency < 50;

      return {
        passed,
        actual: `Polls: ${pollCount}, Errors: ${errorCount}, AvgLatency: ${avgLatency}ms`,
        details: { pollCount, errorCount, avgLatency },
      };
    }
  );

  // ------------------------------------------------------------------------
  // TEST 3: Ring Buffer Overflow (150+ events) & Memory Bounding
  // ------------------------------------------------------------------------
  await runScenario(
    'Ring Buffer Overflow (250 events injected in rapid burst)',
    'Event buffer bounded at <= 120 events; oldest events trimmed; newest retained',
    async () => {
      const burstRoom = `BURST_${Date.now()}`;

      // Emit 250 events in a rapid burst
      for (let i = 1; i <= 250; i++) {
        const req = makePostRequest({
          roomCode: burstRoom,
          action: 'DANMAKU',
          payload: {
            seq: i,
            emoji: '🔥',
            text: `Event sequence #${i}`,
          },
        });
        await POST(req);
      }

      // Query room state
      const getReq = makeGetRequest(burstRoom, 0);
      const getRes = await GET(getReq);
      const data = await getRes.json();

      const bufferLen = data.events.length;
      // In route.ts: when length > 120, trims to length - 100 => bounds buffer between 100 and 120
      const isBounded = bufferLen <= 120 && bufferLen >= 100;

      // Verify the retained events are the latest sequence numbers
      const lastEvent = data.events[data.events.length - 1];
      const firstEvent = data.events[0];
      const latestSeq = lastEvent?.payload?.seq;
      const oldestRetainedSeq = firstEvent?.payload?.seq;

      // With hysteresis (trimming to 100 when > 120), after 250 pushes the oldest sequence is ~148
      const passed = isBounded && latestSeq === 250 && oldestRetainedSeq >= 130 && oldestRetainedSeq <= 155;

      return {
        passed,
        actual: `BufferLength: ${bufferLen} (bounded <= 120: ${isBounded}), OldestSeq: ${oldestRetainedSeq}, NewestSeq: ${latestSeq}`,
        details: { bufferLen, isBounded, oldestRetainedSeq, latestSeq },
      };
    }
  );

  // ------------------------------------------------------------------------
  // TEST 4: Memory Boundedness Invariant (Heap growth after 2,000 events)
  // ------------------------------------------------------------------------
  await runScenario(
    'Memory Boundedness Invariant (2,000 consecutive events in a single room)',
    'Heap memory remains stable, no unbounded event list growth',
    async () => {
      const memRoom = `MEM_${Date.now()}`;
      if (global.gc) global.gc();
      const memBefore = process.memoryUsage().heapUsed;

      for (let i = 1; i <= 2000; i++) {
        const req = makePostRequest({
          roomCode: memRoom,
          action: 'DANMAKU',
          payload: {
            index: i,
            text: 'A'.repeat(200),
          },
        });
        await POST(req);
      }

      if (global.gc) global.gc();
      const memAfter = process.memoryUsage().heapUsed;
      const heapGrowthMb = Math.round((memAfter - memBefore) / (1024 * 1024) * 100) / 100;

      const getReq = makeGetRequest(memRoom, 0);
      const getRes = await GET(getReq);
      const data = await getRes.json();

      const passed = data.events.length <= 120;

      return {
        passed,
        actual: `RetainedEvents: ${data.events.length} (<= 120), HeapDelta: ${heapGrowthMb} MB`,
        details: { eventCount: data.events.length, heapGrowthMb },
      };
    }
  );

  // ------------------------------------------------------------------------
  // TEST 5: Malformed Action Payloads (Adversarial Robustness)
  // ------------------------------------------------------------------------
  const malformedCases = [
    { name: 'Missing body (empty)', rawBody: '' },
    { name: 'Invalid JSON body syntax', rawBody: '{ invalid json ]' },
    { name: 'Empty JSON object {}', body: {} },
    { name: 'Unknown action name', body: { action: 'EXPLOIT_ROOM', payload: {} } },
    { name: 'JOIN with undefined payload', body: { action: 'JOIN' } },
    { name: 'JOIN with null payload', body: { action: 'JOIN', payload: null } },
    { name: 'JOIN with non-string numeric name', body: { action: 'JOIN', payload: { playerId: 'p1', name: 12345 } } },
    { name: 'SUBMIT_ROAST with undefined payload', body: { action: 'SUBMIT_ROAST' } },
    { name: 'VOTE_ROAST with undefined payload', body: { action: 'VOTE_ROAST' } },
    { name: 'MINIGAME_RESULT with undefined payload', body: { action: 'MINIGAME_RESULT' } },
    { name: 'VOTE_EXILE with undefined payload', body: { action: 'VOTE_EXILE' } },
    { name: 'PLAY_CARD with undefined payload', body: { action: 'PLAY_CARD' } },
    { name: 'WIPE_INK with undefined payload', body: { action: 'WIPE_INK' } },
    { name: 'SUBMIT_TRIVIA with undefined payload', body: { action: 'SUBMIT_TRIVIA' } },
    { name: 'HOST_UPDATE with undefined payload', body: { action: 'HOST_UPDATE' } },
    { name: 'HOST_UPDATE_STATE with null payload', body: { action: 'HOST_UPDATE_STATE', payload: null } },
    { name: 'SET_MODE with undefined payload', body: { action: 'SET_MODE' } },
    { name: 'SET_STATUS with undefined payload', body: { action: 'SET_STATUS' } },
  ];

  for (const tc of malformedCases) {
    await runScenario(
      `Malformed Payload: ${tc.name}`,
      'Server handles malformed payload safely (400 or graceful fallback, no 500 unhandled crash)',
      async () => {
        const req = tc.rawBody !== undefined ? makePostRequest(null, tc.rawBody) : makePostRequest(tc.body);
        let res: any;
        try {
          res = await POST(req);
        } catch (err: any) {
          return {
            passed: false,
            actual: `THREW_UNCAUGHT_EXCEPTION: ${err.message}`,
            details: { error: err.message, stack: err.stack },
          };
        }

        const status = res.status;
        const text = await res.text();
        // If it throws an uncaught error in NextRequest handler, status might be 500 or it might throw
        const isCrash = status === 500;
        return {
          passed: !isCrash && status !== undefined,
          actual: `HTTP Status: ${status}, Response: ${text.slice(0, 100)}`,
          details: { status, text: text.slice(0, 100) },
        };
      }
    );
  }

  // ------------------------------------------------------------------------
  // TEST 6: State Consistency Check After Mixed Chaos
  // ------------------------------------------------------------------------
  await runScenario(
    'Room State Consistency Invariant After Concurrency and Malformed Requests',
    'Room maintains structural integrity, scores are valid numbers, players map is consistent',
    async () => {
      const getReq = makeGetRequest(testRoom, 0);
      const getRes = await GET(getReq);
      const data = await getRes.json();

      const players = data.players || {};
      const playerIds = Object.keys(players);
      const hasCorruptedPlayer = playerIds.some((id) => {
        const p = players[id];
        return typeof p.score !== 'number' || isNaN(p.score) || !p.name;
      });

      const scoresValid = typeof data.roundScores === 'object' && data.roundScores !== null;
      const modeValid = data.mode === 'TOURNAMENT' || data.mode === 'FREE_PLAY';
      const statusValid = typeof data.status === 'string';

      const passed = !hasCorruptedPlayer && scoresValid && modeValid && statusValid;

      return {
        passed,
        actual: `Players: ${playerIds.length}, Corrupted: ${hasCorruptedPlayer}, ScoresValid: ${scoresValid}, Mode: ${data.mode}`,
        details: { playerIdsCount: playerIds.length, hasCorruptedPlayer, scoresValid, mode: data.mode },
      };
    }
  );

  console.log('\n===============================================================');
  console.log('  TEST SUMMARY');
  console.log('===============================================================');
  const total = reports.length;
  const passed = reports.filter((r) => r.passed).length;
  const failed = reports.filter((r) => !r.passed).length;

  console.log(`Total: ${total} | Passed: ${passed} | Failed: ${failed}`);

  return { total, passed, failed, reports };
}

if (import.meta.url === `file:///${process.argv[1]?.replace(/\\/g, '/')}`) {
  runAllStressTests().then((res) => {
    process.exit(res.failed > 0 ? 1 : 0);
  });
}
