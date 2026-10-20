'use client';

import React, { useEffect, useRef } from 'react';
import { DanmakuMessage } from '../lib/types';
import { sync } from '../lib/syncEngine';
import { sound } from '../lib/audioSynthesizer';

interface DanmakuCanvasProps {
  className?: string;
}

type ParticleType =
  | 'EMOJI_BARRAGE'
  | 'SPLAT_PROJECTILE'
  | 'SPLAT_DROPLET'
  | 'FLOATING_HEART'
  | 'TEXT_PILL';

interface DanmakuParticle {
  active: boolean;
  type: ParticleType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  gravity: number;
  baseY: number;
  wobbleFreq: number;
  wobbleAmp: number;
  scale: number;
  alpha: number;
  life: number;
  maxLife: number;
  emoji: string;
  text: string;
  senderName: string;
  color: string;
  targetY: number;
  splatTriggered: boolean;
  rotation: number;
  vRot: number;
  size: number;
}

const POOL_SIZE = 120; // 80 primary + 40 burst droplets

export default function DanmakuCanvas({ className = '' }: DanmakuCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const poolRef = useRef<DanmakuParticle[]>([]);
  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const laneIndexRef = useRef<number>(0);

  // Initialize Particle Pool once
  if (poolRef.current.length === 0) {
    const pool: DanmakuParticle[] = [];
    for (let i = 0; i < POOL_SIZE; i++) {
      pool.push({
        active: false,
        type: 'EMOJI_BARRAGE',
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        gravity: 0,
        baseY: 0,
        wobbleFreq: 0,
        wobbleAmp: 0,
        scale: 1,
        alpha: 1,
        life: 0,
        maxLife: 1,
        emoji: '🔥',
        text: '',
        senderName: '',
        color: '#FFD166',
        targetY: 0,
        splatTriggered: false,
        rotation: 0,
        vRot: 0,
        size: 32,
      });
    }
    poolRef.current = pool;
  }

  const allocateParticle = (): DanmakuParticle | null => {
    const pool = poolRef.current;
    for (let i = 0; i < pool.length; i++) {
      if (!pool[i].active) {
        return pool[i];
      }
    }
    return null;
  };

  const spawnDropletBurst = (
    originX: number,
    originY: number,
    isTomato: boolean
  ) => {
    const count = 10;
    for (let i = 0; i < count; i++) {
      const p = allocateParticle();
      if (!p) break;
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = Math.random() * 220 + 80;
      p.active = true;
      p.type = 'SPLAT_DROPLET';
      p.x = originX;
      p.y = originY;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.gravity = 400;
      p.baseY = originY;
      p.wobbleFreq = 0;
      p.wobbleAmp = 0;
      p.scale = 1;
      p.alpha = 1;
      p.life = 0;
      p.maxLife = 0.65;
      p.emoji = '';
      p.text = '';
      p.senderName = '';
      p.color = isTomato ? '#EF233C' : '#E76F51';
      p.splatTriggered = true;
      p.rotation = Math.random() * Math.PI * 2;
      p.vRot = (Math.random() - 0.5) * 10;
      p.size = isTomato ? Math.random() * 8 + 4 : Math.random() * 10 + 5;
    }
  };

  const spawnDanmaku = (msg: DanmakuMessage) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const width = canvas.width / (window.devicePixelRatio || 1);
    const height = canvas.height / (window.devicePixelRatio || 1);

    const emoji = msg.emoji || '🔥';
    const text = (msg.text || '').trim();
    const sender = msg.senderName || 'Netizen';

    // 1. SPLAT PROJECTILE (Tomato 🍅 & Brick 🧱)
    if (emoji === '🍅' || emoji === '🧱') {
      const p = allocateParticle();
      if (!p) return;
      const startX = Math.random() * (width * 0.7) + width * 0.15;
      const startY = height + 30;
      const targetY = height * (0.2 + Math.random() * 0.45);
      const flightDuration = 0.75;
      const vy = -((startY - targetY) / flightDuration + 0.5 * 700 * flightDuration);

      p.active = true;
      p.type = 'SPLAT_PROJECTILE';
      p.x = startX;
      p.y = startY;
      p.vx = (Math.random() - 0.5) * 120;
      p.vy = vy;
      p.gravity = 700;
      p.baseY = startY;
      p.wobbleFreq = 0;
      p.wobbleAmp = 0;
      p.scale = 1;
      p.alpha = 1;
      p.life = 0;
      p.maxLife = 2.0;
      p.emoji = emoji;
      p.text = '';
      p.senderName = sender;
      p.color = emoji === '🍅' ? '#EF233C' : '#E76F51';
      p.targetY = targetY;
      p.splatTriggered = false;
      p.rotation = 0;
      p.vRot = (Math.random() - 0.5) * 12;
      p.size = 44;
      return;
    }

    // 2. FLOATING HEART (❤️)
    if (emoji === '❤️') {
      const p = allocateParticle();
      if (!p) return;
      p.active = true;
      p.type = 'FLOATING_HEART';
      p.x = Math.random() * (width * 0.8) + width * 0.1;
      p.y = height + 20;
      p.vx = 0;
      p.vy = -(Math.random() * 60 + 90);
      p.gravity = 0;
      p.baseY = p.y;
      p.wobbleFreq = Math.random() * 3 + 2;
      p.wobbleAmp = Math.random() * 25 + 15;
      p.scale = Math.random() * 0.4 + 0.8;
      p.alpha = 1;
      p.life = 0;
      p.maxLife = (height + 50) / 90;
      p.emoji = emoji;
      p.text = '';
      p.senderName = sender;
      p.color = '#EF233C';
      p.splatTriggered = false;
      p.rotation = 0;
      p.vRot = 0;
      p.size = 38;
      return;
    }

    // 3. TEXT PILL (Custom Netizen comment)
    if (text.length > 0) {
      const p = allocateParticle();
      if (!p) return;
      // Stagger vertical lanes (10% to 80% screen height)
      const lane = (laneIndexRef.current % 7) + 1;
      laneIndexRef.current++;
      const laneY = (height * (0.08 + lane * 0.11));

      p.active = true;
      p.type = 'TEXT_PILL';
      p.x = width + 20;
      p.y = laneY;
      p.vx = -(Math.random() * 100 + 190);
      p.vy = 0;
      p.gravity = 0;
      p.baseY = laneY;
      p.wobbleFreq = Math.random() * 2 + 1;
      p.wobbleAmp = 6;
      p.scale = 1;
      p.alpha = 1;
      p.life = 0;
      p.maxLife = (width + 600) / 190;
      p.emoji = emoji;
      p.text = text;
      p.senderName = sender;
      p.color = '#FFD166';
      p.splatTriggered = false;
      p.rotation = 0;
      p.vRot = 0;
      p.size = 18;
      return;
    }

    // 4. EMOJI BARRAGE (Standard Horizontal Barrage)
    const p = allocateParticle();
    if (!p) return;
    const lane = (laneIndexRef.current % 8) + 1;
    laneIndexRef.current++;
    const laneY = height * (0.07 + lane * 0.10);

    p.active = true;
    p.type = 'EMOJI_BARRAGE';
    p.x = width + 30;
    p.y = laneY;
    p.vx = -(Math.random() * 140 + 220);
    p.vy = 0;
    p.gravity = 0;
    p.baseY = laneY;
    p.wobbleFreq = Math.random() * 3 + 2;
    p.wobbleAmp = Math.random() * 12 + 6;
    p.scale = Math.random() * 0.3 + 0.9;
    p.alpha = 1;
    p.life = 0;
    p.maxLife = (width + 200) / 220;
    p.emoji = emoji;
    p.text = '';
    p.senderName = sender;
    p.color = '#FFFFFF';
    p.splatTriggered = false;
    p.rotation = 0;
    p.vRot = 0;
    p.size = 36;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // High-DPI Retina setup
    const handleResize = () => {
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // Subscribe to realtime Danmaku events from syncEngine
    const unsubscribe = sync.on('danmaku', (msg: DanmakuMessage) => {
      spawnDanmaku(msg);
    });

    // 60 FPS RequestAnimationFrame Animation Loop
    let isRunning = true;
    const renderLoop = (timestamp: number) => {
      if (!isRunning) return;

      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = timestamp;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        const dpr = window.devicePixelRatio || 1;
        ctx.save();
        ctx.scale(dpr, dpr);
        const w = canvas.width / dpr;
        const h = canvas.height / dpr;
        ctx.clearRect(0, 0, w, h);

        const pool = poolRef.current;
        for (let i = 0; i < pool.length; i++) {
          const p = pool[i];
          if (!p.active) continue;

          p.life += dt;
          if (p.life >= p.maxLife) {
            p.active = false;
            continue;
          }

          // 1. UPDATE PHYSICS ACCORDING TO PARTICLE TYPE
          if (p.type === 'EMOJI_BARRAGE') {
            p.x += p.vx * dt;
            p.y = p.baseY + Math.sin(timestamp * 0.003 * p.wobbleFreq) * p.wobbleAmp;
            if (p.x < -100) p.active = false;
          } else if (p.type === 'FLOATING_HEART') {
            p.y += p.vy * dt;
            p.x += Math.sin(timestamp * 0.004 * p.wobbleFreq) * (p.wobbleAmp * dt * 2.5);
            p.alpha = Math.max(0, 1 - p.life / p.maxLife);
            if (p.y < -50) p.active = false;
          } else if (p.type === 'SPLAT_PROJECTILE') {
            p.vy += p.gravity * dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.rotation += p.vRot * dt;

            // Trigger splat at apex or upon reaching target plane
            if (!p.splatTriggered && p.vy >= -50 && p.y <= p.targetY + 80) {
              p.splatTriggered = true;
              p.active = false;
              sound.playSplat();
              spawnDropletBurst(p.x, p.y, p.emoji === '🍅');
              continue;
            }
            if (p.y > h + 100 && p.vy > 0) {
              p.active = false;
            }
          } else if (p.type === 'SPLAT_DROPLET') {
            p.vy += p.gravity * dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.rotation += p.vRot * dt;
            p.alpha = Math.max(0, 1 - p.life / p.maxLife);
          } else if (p.type === 'TEXT_PILL') {
            p.x += p.vx * dt;
            p.y = p.baseY + Math.sin(timestamp * 0.002 * p.wobbleFreq) * p.wobbleAmp;
            if (p.x < -500) p.active = false;
          }

          // 2. RENDER PARTICLE ON CANVAS
          if (!p.active) continue;

          ctx.save();
          ctx.globalAlpha = p.alpha;

          if (p.type === 'EMOJI_BARRAGE') {
            ctx.font = `${p.size * p.scale}px "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(p.emoji, p.x, p.y);
          } else if (p.type === 'FLOATING_HEART') {
            ctx.font = `${p.size * p.scale}px "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('❤️', p.x, p.y);
          } else if (p.type === 'SPLAT_PROJECTILE') {
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            ctx.font = `${p.size}px "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(p.emoji, 0, 0);
          } else if (p.type === 'SPLAT_DROPLET') {
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            ctx.fillStyle = p.color;
            if (p.color === '#EF233C') {
              // Liquid droplet circle
              ctx.beginPath();
              ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
              ctx.fill();
            } else {
              // Brick shard rectangle
              ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
            }
          } else if (p.type === 'TEXT_PILL') {
            // Measure text for neo-brutalist badge
            ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            const textMetrics = ctx.measureText(p.text);
            const senderMetrics = ctx.measureText(` (${p.senderName})`);
            const totalWidth = 36 + textMetrics.width + senderMetrics.width + 24;
            const badgeHeight = 36;
            const radius = 18;

            // Neo-brutalist drop shadow (4px offset)
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.roundRect(p.x + 4, p.y - badgeHeight / 2 + 4, totalWidth, badgeHeight, radius);
            ctx.fill();

            // Background pill
            ctx.fillStyle = '#111827';
            ctx.beginPath();
            ctx.roundRect(p.x, p.y - badgeHeight / 2, totalWidth, badgeHeight, radius);
            ctx.fill();

            // 2px Cyber Border
            ctx.strokeStyle = '#FFD166';
            ctx.lineWidth = 2.5;
            ctx.stroke();

            // Emoji icon
            ctx.font = '20px "Apple Color Emoji", "Segoe UI Emoji", sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(p.emoji, p.x + 10, p.y);

            // Comment text
            ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(p.text, p.x + 38, p.y);

            // Sender badge
            ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
            ctx.fillStyle = '#94A3B8';
            ctx.fillText(` (${p.senderName})`, p.x + 38 + textMetrics.width, p.y);
          }

          ctx.restore();
        }

        ctx.restore();
      }

      animFrameRef.current = requestAnimationFrame(renderLoop);
    };

    animFrameRef.current = requestAnimationFrame(renderLoop);

    return () => {
      isRunning = false;
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', handleResize);
      unsubscribe();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none z-20 w-full h-full ${className}`}
    />
  );
}
