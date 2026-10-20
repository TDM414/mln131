'use client';

import React, { useEffect } from 'react';
import { UnitTypeDefinition } from '../lib/types';
import { sound } from '../lib/audioSynthesizer';

interface GachaModalProps {
  unit: UnitTypeDefinition;
  isCrit: boolean;
  onClose: () => void;
}

export default function GachaModal({ unit, isCrit, onClose }: GachaModalProps) {
  useEffect(() => {
    sound.playGachaReveal(unit.rarity);

    // Auto-close after 2.5s to keep game flow rapid
    const timer = setTimeout(() => {
      onClose();
    }, 2800);

    return () => clearTimeout(timer);
  }, [unit, onClose]);

  const rarityBorders = {
    common: 'border-cyber-cyan shadow-[0_0_25px_rgba(6,214,160,0.5)]',
    rare: 'border-cyber-gold shadow-[0_0_30px_rgba(255,209,102,0.6)]',
    epic: 'border-cyber-purple shadow-[0_0_35px_rgba(114,9,183,0.7)]',
    legendary: 'border-cyber-yellow shadow-[0_0_50px_rgba(255,183,3,0.9)] animate-glow'
  }[unit.rarity];

  const rarityText = {
    common: 'CHIẾN BINH PHỔ THÔNG',
    rare: 'CHIẾN BINH HIẾM',
    epic: 'BINH CHỦNG SỬ THI',
    legendary: '👑 HUYỀN THOẠI QUỐC GIA 👑'
  }[unit.rarity];

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200 cursor-pointer"
    >
      <div
        className={`relative w-full max-w-sm rounded-2xl bg-cyber-card border-2 ${rarityBorders} p-6 text-center transform transition-all scale-100 animate-in zoom-in-95`}
      >
        {isCrit && (
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-cyber-crimson to-cyber-yellow px-4 py-1 rounded-full text-xs font-black text-black tracking-wider uppercase shadow-lg animate-bounce">
            ⚡ CRITICAL STRIKE x2.5!
          </div>
        )}

        <div className="text-xs font-bold tracking-widest text-slate-400 uppercase mt-2">
          {rarityText}
        </div>

        {/* Big Animated Icon */}
        <div className="my-5 flex justify-center">
          <div className="w-24 h-24 rounded-full flex items-center justify-center text-6xl bg-cyber-dark/80 border border-slate-700 shadow-inner">
            {unit.icon}
          </div>
        </div>

        <h3 className="text-2xl font-black text-white tracking-wide mb-1" style={{ color: unit.color }}>
          {unit.name}
        </h3>

        <p className="text-sm text-slate-300 px-2 mb-4 leading-relaxed">
          {unit.description}
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-2 bg-cyber-dark/60 rounded-xl p-3 mb-4 text-xs">
          <div>
            <span className="text-slate-400 block">Sát Thương</span>
            <span className="font-bold text-cyber-yellow text-sm">+{unit.baseDamage.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-slate-400 block">Kỹ Năng</span>
            <span className="font-bold text-cyber-cyan text-sm">{unit.ability}</span>
          </div>
        </div>

        <div className="text-xs font-semibold text-emerald-400 animate-pulse">
          🚀 Đã xuất quân lên máy chiếu lớp học!
        </div>

        <div className="mt-3 text-[11px] text-slate-500">
          (Chạm vào màn hình để tiếp tục ngay)
        </div>
      </div>
    </div>
  );
}
