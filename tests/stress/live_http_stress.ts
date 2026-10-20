// tests/stress/live_http_stress.ts
// Live HTTP stress test against running Next.js instance on port 3001

interface HttpResult {
  url: string;
  method: string;
  status: number;
  data: any;
  durationMs: number;
  error?: string;
}

const BASE_URL = 'http://localhost:3001/api/game';

async function fetchHttp(body?: any, rawBody?: string): Promise<HttpResult> {
  const start = performance.now();
  try {
    const init: RequestInit = {
      method: body !== undefined || rawBody !== undefined ? 'POST' : 'GET',
      headers: { 'Content-Type': 'application/json' },
    };
    if (rawBody !== undefined) {
      init.body = rawBody;
    } else if (body !== undefined) {
      init.body = JSON.stringify(body);
    }

    const res = await fetch(BASE_URL, init);
    const duration = Math.round(performance.now() - start);
    let data: any = null;
    const text = await res.text();
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    return {
      url: BASE_URL,
      method: init.method || 'GET',
      status: res.status,
      data,
      durationMs: duration,
    };
  } catch (err: any) {
    return {
      url: BASE_URL,
      method: 'POST',
      status: 0,
      data: null,
      durationMs: Math.round(performance.now() - start),
      error: err.message,
    };
  }
}

async function runLiveTests() {
  console.log('Testing live HTTP server at', BASE_URL);

  // 1. Health check
  const health = await fetchHttp();
  console.log('GET Health check status:', health.status);

  // 2. 50 concurrent joins over HTTP
  const joinPromises = [];
  for (let i = 1; i <= 50; i++) {
    joinPromises.push(
      fetchHttp({
        roomCode: 'LIVE_TEST',
        action: 'JOIN',
        payload: {
          playerId: `netizen_${i}`,
          name: `Sinh Viên ${i}`,
          avatarId: 'keyboard_warrior',
        },
      })
    );
  }
  const joinResults = await Promise.all(joinPromises);
  const successJoins = joinResults.filter((r) => r.status === 200).length;
  console.log(`Live 50 concurrent joins: ${successJoins}/50 returned HTTP 200`);

  // 3. Malformed payloads over live HTTP
  const malformed = [
    { name: 'Empty body', raw: '' },
    { name: 'Malformed JSON', raw: '{ bad json' },
    { name: 'JOIN missing payload', body: { action: 'JOIN' } },
    { name: 'JOIN null payload', body: { action: 'JOIN', payload: null } },
    { name: 'JOIN number name', body: { action: 'JOIN', payload: { playerId: 'p1', name: 999 } } },
    { name: 'SUBMIT_ROAST missing payload', body: { action: 'SUBMIT_ROAST' } },
    { name: 'VOTE_ROAST missing payload', body: { action: 'VOTE_ROAST' } },
    { name: 'MINIGAME_RESULT missing payload', body: { action: 'MINIGAME_RESULT' } },
  ];

  for (const m of malformed) {
    const res = await fetchHttp(m.body, m.raw);
    console.log(`Malformed [${m.name}] -> HTTP ${res.status}:`, typeof res.data === 'string' ? res.data.slice(0, 80) : res.data);
  }
}

runLiveTests().catch(console.error);
