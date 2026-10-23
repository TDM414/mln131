// Client-side Realtime Sync Engine for NETIZEN PARTY: ĐẠI HỘI DÂN MẠNG (MLN131 Edition)
// Dual-channel hybrid: BroadcastChannel (0ms local tabs) + HTTP Delta Polling (cross-device on Vercel/LAN)

import {
  GameMode,
  GameStatus,
  GameShowState,
  SabotageCardType,
  DanmakuMessage,
} from './types';

export type SyncEventListener = (event: any) => void;

class RealtimeSyncEngine {
  private channel: BroadcastChannel | null = null;
  private listeners: Record<string, SyncEventListener[]> = {};
  private pollingInterval: NodeJS.Timeout | null = null;
  private lastTimestamp: number = 0;
  private roomCode: string = 'MLN131';
  private seenEventIds: Set<string> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        this.channel = new BroadcastChannel('netizen_party_game');
        this.channel.onmessage = (msg) => {
          this.triggerLocal(msg.data.type, msg.data.payload);
        };
      } catch (e) {
        console.warn('BroadcastChannel not supported in this environment', e);
      }
    }
  }

  setRoom(room: string) {
    this.roomCode = room.toUpperCase();
  }

  getRoom(): string {
    return this.roomCode;
  }

  on(eventType: string, callback: SyncEventListener) {
    if (!this.listeners[eventType]) {
      this.listeners[eventType] = [];
    }
    this.listeners[eventType].push(callback);
    return () => {
      this.listeners[eventType] = this.listeners[eventType].filter((cb) => cb !== callback);
    };
  }

  private triggerLocal(eventType: string, payload: any) {
    if (this.listeners[eventType]) {
      this.listeners[eventType].forEach((cb) => cb(payload));
    }
    if (this.listeners['*']) {
      this.listeners['*'].forEach((cb) => cb({ type: eventType, payload }));
    }
  }

  // Broadcast to other tabs locally
  private broadcastLocal(eventType: string, payload: any) {
    if (this.channel) {
      try {
        this.channel.postMessage({ type: eventType, payload });
      } catch (err) {
        // Ignore channel post errors
      }
    }
    this.triggerLocal(eventType, payload);
  }

  // Start polling serverless API
  startPolling(isHost: boolean = false) {
    if (this.pollingInterval) clearInterval(this.pollingInterval);

    // Host checks slightly faster (350ms) for ultra-fluid projector animation
    // Clients poll at 700ms to preserve mobile battery & network bandwidth
    const pollRate = isHost ? 350 : 700;

    this.pollingInterval = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/game?room=${encodeURIComponent(this.roomCode)}&since=${this.lastTimestamp}`
        );
        if (!res.ok) return;
        const data = await res.json();

        if (data.events && data.events.length > 0) {
          let maxTimestamp = this.lastTimestamp;
          data.events.forEach((evt: any) => {
            const eventId = evt.id || `${evt.timestamp}_${evt.type}`;
            if (!this.seenEventIds.has(eventId)) {
              this.seenEventIds.add(eventId);
              this.triggerLocal(evt.type, evt.payload);
            }
            if (typeof evt.timestamp === 'number' && evt.timestamp > maxTimestamp) {
              maxTimestamp = evt.timestamp;
            }
          });
          this.lastTimestamp = maxTimestamp;

          // Keep seenEventIds bounded to prevent memory growth
          if (this.seenEventIds.size > 1000) {
            const arr = Array.from(this.seenEventIds);
            this.seenEventIds = new Set(arr.slice(arr.length - 500));
          }
        }

        // Trigger general state update (both whole state and individual props)
        if (data.state) {
          this.triggerLocal('STATE_UPDATE', data.state);
        } else {
          this.triggerLocal('STATE_UPDATE', data);
        }
      } catch (err) {
        // Silently retry on next tick
      }
    }, pollRate);
  }

  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  private async sendAction(action: string, payload: any) {
    this.broadcastLocal(action.toLowerCase(), payload);
    try {
      await fetch('/api/game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomCode: this.roomCode,
          action,
          payload,
        }),
      });
    } catch (e) {
      // Network hiccup; will sync on next poll
    }
  }

  // ==========================================
  // Milestone 1: Master Game Show Action Methods
  // ==========================================

  async joinRoom(playerId: string, name: string, avatarId: string = 'keyboard_warrior', isBot: boolean = false) {
    const payload = { playerId, name, avatarId, isBot, timestamp: Date.now() };
    await this.sendAction('JOIN', payload);
  }

  async setMode(mode: GameMode) {
    await this.sendAction('SET_MODE', { mode });
  }

  async setGameStatus(status: GameStatus) {
    await this.sendAction('SET_STATUS', { status });
  }

  async setStatus(status: GameStatus) {
    await this.sendAction('SET_STATUS', { status });
  }

  async setRoundPhase(phase: string, extraPayload: Record<string, any> = {}) {
    await this.sendAction('SET_ROUND_PHASE', { phase, ...extraPayload });
  }

  async sendDanmaku(
    emoji: string,
    text: string = '',
    senderName: string = 'Chiến sĩ',
    senderAvatar: string = 'keyboard_warrior'
  ) {
    const danmaku: DanmakuMessage = {
      id: Math.random().toString(36).substring(2, 9),
      emoji,
      text,
      senderName,
      senderAvatar,
      timestamp: Date.now(),
    };
    await this.sendAction('DANMAKU', danmaku);
  }

  async submitRoast(
    text: string,
    playerId: string,
    playerName: string,
    avatarId: string = 'keyboard_warrior'
  ) {
    const payload = {
      id: Math.random().toString(36).substring(2, 9),
      playerId,
      playerName,
      avatarId,
      text,
      timestamp: Date.now(),
    };
    await this.sendAction('SUBMIT_ROAST', payload);
  }

  async voteRoast(duelId: string, choice: 'A' | 'B', voterId: string) {
    await this.sendAction('VOTE_ROAST', { duelId, choice, voterId });
  }

  async submitMinigameResult(
    success: boolean,
    reactionTimeMs: number,
    playerId: string
  ) {
    await this.sendAction('MINIGAME_RESULT', { playerId, success, reactionTimeMs });
  }

  async voteExile(suspectPlayerId: string, voterId: string) {
    await this.sendAction('VOTE_EXILE', { suspectPlayerId, voterId });
  }

  async playCard(
    cardType: SabotageCardType,
    targetPlayerId: string,
    fromPlayerId: string,
    fromPlayerName: string,
    isSelfTarget?: boolean
  ) {
    await this.sendAction('PLAY_CARD', {
      cardType,
      targetPlayerId,
      targetId: targetPlayerId,
      fromPlayerId,
      sourceId: fromPlayerId,
      fromPlayerName,
      sourceName: fromPlayerName,
      isSelfTarget: Boolean(isSelfTarget),
    });
  }

  async wipeInk(playerId: string) {
    await this.sendAction('WIPE_INK', { playerId });
  }

  async submitTrivia(
    questionIndex: number,
    optionIndex: number,
    timeMs: number,
    playerId: string
  ) {
    await this.sendAction('SUBMIT_TRIVIA', {
      questionIndex,
      optionIndex,
      timeMs,
      playerId,
    });
  }

  // ==========================================
  // Mode 1: Trending Feed Wall Actions
  // ==========================================
  async submitFeedComment(
    text: string,
    playerId: string,
    playerName: string,
    avatarId: string = 'keyboard_warrior',
    promptIndex?: number
  ) {
    await this.sendAction('SUBMIT_FEED_COMMENT', {
      text,
      playerId,
      playerName,
      avatarId,
      promptIndex,
    });
  }

  async reactFeedPost(
    postId: string,
    reactionType: 'heart' | 'tomato' | 'brick',
    voterId: string
  ) {
    await this.sendAction('REACT_FEED_POST', {
      postId,
      reactionType,
      voterId,
    });
  }

  // ==========================================
  // Mode 2: Fact or Cap 10s Actions
  // ==========================================
  async submitFactOrCap(
    choice: 'FACT' | 'CAP',
    remainingTime: number,
    totalTime: number = 10000,
    playerId: string,
    questionIndex?: number
  ) {
    await this.sendAction('SUBMIT_FACT_OR_CAP', {
      choice,
      remainingTime,
      totalTime,
      playerId,
      questionIndex,
    });
  }

  // ==========================================
  // Mode 3: Consensus Dilemma Actions
  // ==========================================
  async submitDilemmaStance(
    stance: 'A' | 'B',
    playerId: string
  ) {
    await this.sendAction('SUBMIT_DILEMMA_STANCE', {
      stance,
      playerId,
    });
  }

  async submitDilemmaBet(
    predictedMajority: 'A' | 'B',
    remainingTime: number,
    totalTime: number = 20000,
    playerId: string
  ) {
    await this.sendAction('SUBMIT_DILEMMA_BET', {
      predictedMajority,
      remainingTime,
      totalTime,
      playerId,
    });
  }

  // ==========================================
  // Hub Navigation
  // ==========================================
  async returnToHub() {
    await this.sendAction('RETURN_TO_HUB', {});
  }

  async hostUpdateState(patch: Partial<GameShowState>) {
    await this.sendAction('HOST_UPDATE_STATE', patch);
  }

  async resetGame(payload: { resetEpoch?: number } = {}) {
    await this.sendAction('RESET_GAME', { resetEpoch: payload.resetEpoch || Date.now(), ...payload });
  }

  // ==========================================
  // Backwards Compatibility Handlers
  // ==========================================

  async summon(playerId: string, playerName: string, unitTypeId: string, isCrit: boolean) {
    const payload = { playerId, playerName, unitTypeId, isCrit };
    await this.sendAction('SUMMON', payload);
  }

  async whistle(playerId: string, playerName: string) {
    const payload = { playerId, playerName };
    await this.sendAction('WHISTLE', payload);
  }

  async tap(playerId: string, count: number = 1) {
    const payload = { playerId, count };
    await this.sendAction('TAP', payload);
  }

  async hostUpdate(payload: any) {
    await this.sendAction('HOST_UPDATE', payload);
  }
}

export const sync = new RealtimeSyncEngine();
