/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Heart, Sparkles } from 'lucide-react';

interface EasterEggLayerProps {
  action: string | null;
  onFinished: () => void;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  scale: number;
  rotation: number;
  opacity: number;
}

export const EasterEggLayer: React.FC<EasterEggLayerProps> = ({
  action,
  onFinished,
}) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!action) return;

    const count = action === 'heart_burst' || action === 'blow_kiss' ? 18 : 24;
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    const newParticles: Particle[] = Array.from({ length: count }).map((_, i) => {
      const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
      const speed = Math.random() * 4 + 3;
      return {
        id: Math.random(),
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        scale: Math.random() * 0.8 + 0.6,
        rotation: Math.random() * 360,
        opacity: 1,
      };
    });

    setParticles(newParticles);

    const timer = setTimeout(() => {
      setParticles([]);
      onFinished();
    }, 2800);

    return () => clearTimeout(timer);
  }, [action, onFinished]);

  if (!action || particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
      {/* Shockwave circle for shockwave action */}
      {action === 'pulse_shockwave' && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full border-4 border-cyan-400 animate-ping opacity-75 duration-1000" />
      )}

      {/* Floating animated elements */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute transition-transform duration-1000 ease-out"
          style={{
            left: `${p.x + p.vx * 35}px`,
            top: `${p.y + p.vy * 35}px`,
            transform: `translate(-50%, -50%) scale(${p.scale}) rotate(${p.rotation}deg)`,
            opacity: p.opacity,
          }}
        >
          {action === 'heart_burst' && (
            <Heart className="w-8 h-8 text-pink-500 fill-pink-500 drop-shadow-[0_0_12px_rgba(236,72,153,0.8)]" />
          )}

          {action === 'blow_kiss' && (
            <span className="text-3xl filter drop-shadow-[0_0_12px_rgba(244,63,94,0.8)]">
              💋
            </span>
          )}

          {action === 'wink' && (
            <Sparkles className="w-8 h-8 text-amber-300 fill-amber-300 drop-shadow-[0_0_12px_rgba(252,211,77,0.8)]" />
          )}

          {action === 'pulse_shockwave' && (
            <div className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_14px_#22d3ee]" />
          )}
        </div>
      ))}
    </div>
  );
};
