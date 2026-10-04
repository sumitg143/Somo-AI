/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import { AURA_THEMES } from '../constants/themes.ts';
import { AudioStreamer } from '../services/AudioStreamer.ts';
import { MicrophoneStreamer } from '../services/MicrophoneStreamer.ts';
import { AuraMood, SessionState } from '../types/assistant.ts';

interface WaveformVisualizerProps {
  state: SessionState;
  mood: AuraMood;
  audioStreamer: AudioStreamer | null;
  micStreamer: MicrophoneStreamer | null;
  onEnergyUpdate?: (energy: number) => void;
}

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
  state,
  mood,
  audioStreamer,
  micStreamer,
  onEnergyUpdate,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const theme = AURA_THEMES[mood] || AURA_THEMES.neon_sassy;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const freqData = new Uint8Array(128);
    const timeData = new Uint8Array(128);

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      let maxVal = 0;
      let sum = 0;

      // Read appropriate stream data
      if (state === 'speaking' && audioStreamer) {
        audioStreamer.getFrequencyData(freqData);
        audioStreamer.getTimeDomainData(timeData);
      } else if (state === 'listening' && micStreamer) {
        micStreamer.getFrequencyData(freqData);
        micStreamer.getTimeDomainData(timeData);
      } else {
        freqData.fill(0);
        timeData.fill(128);
      }

      for (let i = 0; i < freqData.length; i++) {
        sum += freqData[i];
        if (freqData[i] > maxVal) maxVal = freqData[i];
      }

      const avgEnergy = sum / (freqData.length * 255);
      onEnergyUpdate?.(avgEnergy);

      // Draw subtle symmetrical frequency bars in the bottom
      const barCount = 36;
      const barWidth = 3;
      const gap = 6;
      const totalWidth = barCount * (barWidth + gap);
      const startX = (width - totalWidth) / 2;

      for (let i = 0; i < barCount; i++) {
        // Sample from frequency data
        const index = Math.floor((i / barCount) * 48);
        const val = freqData[index] || 0;
        const normalized = val / 255;
        const barHeight = Math.max(3, normalized * (height * 0.7));

        const x = startX + i * (barWidth + gap);
        const y = (height - barHeight) / 2;

        const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
        gradient.addColorStop(0, theme.primary);
        gradient.addColorStop(1, theme.secondary);

        ctx.fillStyle = gradient;
        ctx.globalAlpha = state === 'disconnected' ? 0.15 : 0.35 + normalized * 0.65;

        // Rounded bar
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 2);
        ctx.fill();
      }

      // Draw glowing oscilloscope center wave
      if (state === 'speaking' || state === 'listening') {
        ctx.lineWidth = 2;
        ctx.strokeStyle = state === 'speaking' ? theme.primary : '#ffffff';
        ctx.shadowColor = theme.primary;
        ctx.shadowBlur = 10;
        ctx.globalAlpha = 0.8;

        ctx.beginPath();
        const sliceWidth = width / timeData.length;
        let x = 0;

        for (let i = 0; i < timeData.length; i++) {
          const v = timeData[i] / 128.0;
          const y = (v * height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }

          x += sliceWidth;
        }

        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      ctx.globalAlpha = 1.0;
      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [state, theme, audioStreamer, micStreamer, onEnergyUpdate]);

  return (
    <div className="w-full max-w-md h-16 relative flex items-center justify-center pointer-events-none">
      <canvas
        ref={canvasRef}
        width={420}
        height={64}
        className="w-full h-full object-contain"
      />
    </div>
  );
};
