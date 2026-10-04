/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { AURA_THEMES } from '../constants/themes.ts';
import { AuraMood, SessionState } from '../types/assistant.ts';

interface CyberBackgroundProps {
  mood: AuraMood;
  state: SessionState;
  audioEnergy: number;
}

export const CyberBackground: React.FC<CyberBackgroundProps> = ({
  mood,
  state,
  audioEnergy,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const theme = AURA_THEMES[mood] || AURA_THEMES.neon_sassy;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Particle field
    const particleCount = 42;
    const particles = Array.from({ length: particleCount }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 0.6,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      alpha: Math.random() * 0.6 + 0.2,
      pulseSpeed: Math.random() * 0.02 + 0.01,
      phase: Math.random() * Math.PI * 2,
    }));

    let step = 0;

    const render = () => {
      step += 0.015;
      ctx.clearRect(0, 0, width, height);

      // Render floating subtle particles
      particles.forEach((p) => {
        p.x += p.vx * (1 + audioEnergy * 2);
        p.y += p.vy * (1 + audioEnergy * 2);

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        const currentAlpha = p.alpha * (0.6 + 0.4 * Math.sin(step + p.phase));

        ctx.fillStyle = theme.particleColor;
        ctx.globalAlpha = Math.max(0.1, Math.min(0.85, currentAlpha + audioEnergy * 0.3));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1 + audioEnergy * 0.8), 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.globalAlpha = 1.0;
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme, audioEnergy]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {/* Dynamic Radial Aura Mood Background */}
      <div
        className="absolute inset-0 transition-all duration-1000 ease-out"
        style={{ background: theme.ambientBg }}
      />

      {/* Cyber Grid Subtle Horizon */}
      <div 
        className="absolute inset-0 opacity-[0.035] bg-[linear-gradient(to_right,#ffffff1a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff1a_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" 
      />

      {/* Ambient Pulsing Glow Spotlight behind Orb */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[140px] pointer-events-none transition-all duration-700"
        style={{
          width: state === 'speaking' ? '680px' : state === 'listening' ? '560px' : '440px',
          height: state === 'speaking' ? '680px' : state === 'listening' ? '560px' : '440px',
          backgroundColor: theme.glow,
          opacity: state === 'speaking' ? 0.85 + audioEnergy * 0.4 : state === 'listening' ? 0.65 : 0.35,
          transform: `translate(-50%, -50%) scale(${1 + audioEnergy * 0.25})`,
        }}
      />

      {/* Particle Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-60" />
    </div>
  );
};
