'use client';

import React, { useEffect, useRef } from 'react';
import { MinionUnit, Projectile, DamagePopup, BossState } from '../lib/types';
import { sound } from '../lib/audioSynthesizer';

interface ArenaCanvasProps {
  boss: BossState;
  units: MinionUnit[];
  projectiles: Projectile[];
  damagePopups: DamagePopup[];
  onBossDamage: (damage: number, isCrit: boolean, playerName: string) => void;
  onRemoveUnit: (id: string) => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  life: number;
}

export default function ArenaCanvas({
  boss,
  units,
  projectiles,
  damagePopups,
  onBossDamage,
  onRemoveUnit
}: ArenaCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number>(0);
  const bossHoverOffset = useRef<number>(0);
  const hitFlashRef = useRef<number>(0);

  // Trigger hit flash when boss takes damage
  useEffect(() => {
    hitFlashRef.current = 5; // flash for 5 frames
  }, [boss.hp]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle canvas resizing
    const resizeCanvas = () => {
      canvas.width = canvas.parentElement?.clientWidth || 1200;
      canvas.height = canvas.parentElement?.clientHeight || 650;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let lastTime = performance.now();

    const render = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      const width = canvas.width;
      const height = canvas.height;

      // Clear with dark cyber gradient
      ctx.fillStyle = '#0b0f19';
      ctx.fillRect(0, 0, width, height);

      // Draw Cyber Grid floor
      ctx.strokeStyle = 'rgba(30, 41, 59, 0.4)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 1. DRAW BOSS
      const bossX = width / 2;
      bossHoverOffset.current = Math.sin(time * 0.003) * 8;
      const bossY = 120 + bossHoverOffset.current;
      const bossRadius = 65;

      // Channeling hazard aura
      if (boss.isChanneling) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(bossX, bossY, bossRadius + 30 + Math.sin(time * 0.01) * 10, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(239, 35, 60, 0.25)';
        ctx.fill();
        ctx.strokeStyle = '#ef233c';
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 6]);
        ctx.stroke();
        ctx.restore();
      }

      // Stun aura
      if (boss.isStunned) {
        ctx.save();
        for (let s = 0; s < 4; s++) {
          const starAngle = time * 0.005 + (s * Math.PI) / 2;
          const starX = bossX + Math.cos(starAngle) * (bossRadius + 15);
          const starY = bossY + Math.sin(starAngle) * (bossRadius * 0.4) - 25;
          ctx.fillStyle = '#ffd166';
          ctx.font = '20px Arial';
          ctx.fillText('💫', starX - 10, starY);
        }
        ctx.restore();
      }

      // Boss Body (Cyber Mecha / Tyrant)
      ctx.save();
      ctx.shadowColor = boss.isStunned ? '#ffd166' : hitFlashRef.current > 0 ? '#ffffff' : '#d90429';
      ctx.shadowBlur = hitFlashRef.current > 0 ? 30 : 20;

      // Head / Throne
      ctx.fillStyle = hitFlashRef.current > 0 ? '#ffffff' : boss.isStunned ? '#334155' : '#1e1b4b';
      ctx.beginPath();
      ctx.arc(bossX, bossY, bossRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = boss.isStunned ? '#64748b' : '#ef233c';
      ctx.stroke();

      // Boss Core (Glowing reactor)
      const corePulse = Math.sin(time * 0.008) * 0.3 + 0.7;
      ctx.beginPath();
      ctx.arc(bossX, bossY + 10, 22, 0, Math.PI * 2);
      ctx.fillStyle = boss.isStunned ? '#64748b' : `rgba(239, 35, 60, ${corePulse})`;
      ctx.fill();

      // Boss Face details (Glowing cyber visor / eyes)
      ctx.fillStyle = boss.isStunned ? '#0f172a' : '#ffd166';
      ctx.fillRect(bossX - 30, bossY - 20, 20, 8);
      ctx.fillRect(bossX + 10, bossY - 20, 20, 8);

      // Boss Label & Title
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(boss.name, bossX, bossY - bossRadius - 15);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px sans-serif';
      ctx.fillText(boss.title, bossX, bossY - bossRadius - 32);

      ctx.restore();

      if (hitFlashRef.current > 0) hitFlashRef.current--;

      // 2. UPDATE & DRAW PARTICLES
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= 0.02;
        p.life--;

        if (p.alpha <= 0 || p.life <= 0) {
          particlesRef.current.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 3. UPDATE & DRAW MINION UNITS
      const now = Date.now();
      units.forEach((unit) => {
        // Move upward toward boss if not yet reached combat range
        const targetY = 240;
        if (unit.y > targetY) {
          unit.y -= unit.speed;
        }

        const size = unit.isMega ? 32 : 18;
        const uX = unit.x;
        const uY = unit.y;

        ctx.save();

        // Unit Aura Glow
        ctx.shadowColor = unit.color;
        ctx.shadowBlur = unit.isMega ? 25 : 12;

        // Mega unit rotating shield
        if (unit.isMega) {
          ctx.beginPath();
          ctx.arc(uX, uY, size + 10, 0, Math.PI * 2);
          ctx.strokeStyle = '#ffd166';
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Draw Unit Icon
        ctx.font = `${size * 1.5}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(unit.icon, uX, uY);

        // Player Name overhead
        ctx.shadowBlur = 0;
        ctx.font = 'bold 11px sans-serif';
        ctx.fillStyle = '#f8fafc';
        ctx.fillText(unit.playerName, uX, uY - size - 6);

        // Mini HP Bar
        const hpPercent = Math.max(0, unit.hp / unit.maxHp);
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(uX - 16, uY + size + 2, 32, 4);
        ctx.fillStyle = unit.color;
        ctx.fillRect(uX - 16, uY + size + 2, 32 * hpPercent, 4);

        ctx.restore();

        // Unit Attack Logic
        if (unit.y <= targetY + 20 && now - unit.lastAttack >= unit.attackSpeed) {
          unit.lastAttack = now;

          // Spawn laser/projectile toward boss
          projectiles.push({
            id: Math.random().toString(),
            startX: uX,
            startY: uY,
            x: uX,
            y: uY,
            targetX: bossX + (Math.random() * 40 - 20),
            targetY: bossY + (Math.random() * 30 - 15),
            speed: 12,
            damage: unit.damage,
            color: unit.color,
            playerName: unit.playerName,
            isCrit: unit.rarity === 'legendary' || unit.isMega || false
          });

          // Play laser sound occasionally
          if (Math.random() < 0.25) {
            sound.playLaser(unit.rarity === 'legendary');
          }
        }
      });

      // 4. UPDATE & DRAW PROJECTILES
      for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        const dx = p.targetX - p.x;
        const dy = p.targetY - p.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 15) {
          // HIT BOSS!
          projectiles.splice(i, 1);
          onBossDamage(p.damage, p.isCrit, p.playerName);

          // Spawn impact particles
          for (let k = 0; k < (p.isCrit ? 12 : 6); k++) {
            particlesRef.current.push({
              x: p.targetX,
              y: p.targetY,
              vx: (Math.random() - 0.5) * 8,
              vy: (Math.random() - 0.5) * 8,
              color: p.color,
              size: Math.random() * 4 + 2,
              alpha: 1,
              life: 30
            });
          }
          continue;
        }

        // Advance projectile
        p.x += (dx / dist) * p.speed;
        p.y += (dy / dist) * p.speed;

        ctx.save();
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.isCrit ? 4 : 2.5;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - (dx / dist) * 12, p.y - (dy / dist) * 12);
        ctx.stroke();
        ctx.restore();
      }

      // 5. DRAW FLOATING DAMAGE POPUPS
      for (let i = damagePopups.length - 1; i >= 0; i--) {
        const pop = damagePopups[i];
        const age = now - pop.createdAt;
        if (age > 1000) {
          damagePopups.splice(i, 1);
          continue;
        }

        const alpha = 1 - age / 1000;
        const yOffset = (age / 1000) * 50;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.font = pop.isCrit ? 'bold 22px sans-serif' : 'bold 15px sans-serif';
        ctx.fillStyle = pop.isCrit ? '#ffd166' : '#ffffff';
        ctx.shadowColor = pop.isCrit ? '#ffb703' : '#000000';
        ctx.shadowBlur = 8;
        ctx.textAlign = 'center';
        ctx.fillText(
          `${pop.isCrit ? '💥 CRIT! ' : '+'}${pop.damage.toLocaleString()} (${pop.playerName})`,
          pop.x,
          pop.y - yOffset
        );
        ctx.restore();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [boss, units, projectiles, damagePopups, onBossDamage]);

  return (
    <div className="relative w-full h-full min-h-[550px] overflow-hidden rounded-xl border border-cyber-border bg-cyber-dark">
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
}
