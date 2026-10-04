/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Mic, MicOff, Power, Sparkles, Volume2 } from 'lucide-react';
import { AURA_THEMES } from '../constants/themes.ts';
import { AuraMood, SessionState } from '../types/assistant.ts';

interface AuraOrbProps {
  state: SessionState;
  mood: AuraMood;
  audioEnergy: number; // 0.0 to 1.0 (from assistant or mic)
  userMicVolume: number; // 0.0 to 1.0 (from mic VAD)
  onToggle: () => void;
}

export const AuraOrb: React.FC<AuraOrbProps> = ({
  state,
  mood,
  audioEnergy,
  userMicVolume,
  onToggle,
}) => {
  const theme = AURA_THEMES[mood] || AURA_THEMES.neon_sassy;

  // Compute dynamic scale and glow based on state and audio energy
  const reactiveEnergy = state === 'speaking' ? audioEnergy : userMicVolume;
  const orbScale = 1 + (state === 'speaking' ? reactiveEnergy * 0.28 : state === 'listening' ? userMicVolume * 0.2 : 0);

  return (
    <div className="relative flex flex-col items-center justify-center select-none touch-manipulation">
      {/* Outer Soundwaves / Ripples when listening & user speaking */}
      {state === 'listening' && userMicVolume > 0.08 && (
        <>
          <div
            className="absolute rounded-full border border-current pointer-events-none animate-ping opacity-40 transition-colors duration-500"
            style={{
              width: `${260 + userMicVolume * 140}px`,
              height: `${260 + userMicVolume * 140}px`,
              color: theme.primary,
              animationDuration: '1.4s',
            }}
          />
          <div
            className="absolute rounded-full border border-current pointer-events-none opacity-25"
            style={{
              width: `${320 + userMicVolume * 180}px`,
              height: `${320 + userMicVolume * 180}px`,
              color: theme.secondary,
            }}
          />
        </>
      )}

      {/* Outer Gyro Ring 1 (Slow rotating orbital ring) */}
      <div
        className={`absolute rounded-full pointer-events-none transition-all duration-700 ${
          state === 'connecting'
            ? 'animate-spin'
            : state === 'speaking'
            ? 'animate-[spin_10s_linear_infinite]'
            : 'animate-[spin_24s_linear_infinite]'
        }`}
        style={{
          width: '310px',
          height: '310px',
          border: `1.5px dashed ${theme.primary}55`,
          transform: `scale(${orbScale * 1.05})`,
        }}
      />

      {/* Outer Gyro Ring 2 (Counter rotating) */}
      <div
        className={`absolute rounded-full pointer-events-none transition-all duration-700 ${
          state === 'connecting'
            ? 'animate-[spin_3s_linear_infinite_reverse]'
            : state === 'speaking'
            ? 'animate-[spin_14s_linear_infinite_reverse]'
            : 'animate-[spin_32s_linear_infinite_reverse]'
        }`}
        style={{
          width: '270px',
          height: '270px',
          border: `1px solid ${theme.secondary}44`,
          transform: `scale(${orbScale * 1.02})`,
        }}
      />

      {/* Main Touch / Click Button */}
      <button
        onClick={onToggle}
        type="button"
        aria-label={
          state === 'disconnected'
            ? 'Awaken Somo'
            : state === 'connecting'
            ? 'Connecting...'
            : state === 'speaking'
            ? 'Tap to interrupt Somo'
            : 'Disconnect session'
        }
        className="relative group z-10 w-52 h-52 sm:w-60 sm:h-60 rounded-full flex items-center justify-center cursor-pointer transition-transform duration-300 active:scale-95 focus:outline-none"
        style={{
          transform: `scale(${orbScale})`,
        }}
      >
        {/* Core Glowing Halo */}
        <div
          className="absolute inset-0 rounded-full blur-2xl transition-all duration-500 opacity-80 group-hover:opacity-100"
          style={{
            background: `radial-gradient(circle, ${theme.primary} 0%, ${theme.secondary} 70%, transparent 100%)`,
            filter: `blur(${state === 'speaking' ? 28 + reactiveEnergy * 20 : 20}px)`,
          }}
        />

        {/* Holographic Plasma Orb Body */}
        <div
          className="relative w-44 h-44 sm:w-52 sm:h-52 rounded-full overflow-hidden flex items-center justify-center border border-white/20 shadow-2xl backdrop-blur-md transition-all duration-500"
          style={{
            background:
              state === 'disconnected'
                ? 'radial-gradient(circle at 35% 35%, rgba(45, 45, 65, 0.9) 0%, rgba(15, 15, 25, 0.95) 100%)'
                : state === 'connecting'
                ? `radial-gradient(circle at 35% 35%, ${theme.primary}aa 0%, #0d0f17 100%)`
                : state === 'speaking'
                ? `radial-gradient(circle at 35% 35%, #ffffff 0%, ${theme.primary} 45%, ${theme.secondary} 80%, #07070b 100%)`
                : `radial-gradient(circle at 35% 35%, ${theme.primary}cc 0%, ${theme.secondary}99 50%, #0c0d14 100%)`,
            boxShadow:
              state === 'speaking'
                ? `0 0 60px ${theme.primary}, 0 0 100px ${theme.secondary}88, inset 0 0 30px #ffffff99`
                : state === 'listening'
                ? `0 0 45px ${theme.primary}99, inset 0 0 20px #ffffff55`
                : state === 'connecting'
                ? `0 0 50px ${theme.primary}88`
                : '0 0 25px rgba(255,255,255,0.06)',
          }}
        >
          {/* Internal Plasma Waves Texture */}
          <div
            className={`absolute inset-0 opacity-40 mix-blend-overlay pointer-events-none ${
              state !== 'disconnected' ? 'animate-pulse' : ''
            }`}
            style={{
              background: `repeating-linear-gradient(45deg, transparent, transparent 10px, ${theme.primary}33 10px, ${theme.primary}33 20px)`,
            }}
          />

          {/* Central Iconography / Status Graphic */}
          <div className="relative z-20 flex flex-col items-center justify-center text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
            {state === 'disconnected' && (
              <div className="flex flex-col items-center gap-1.5 text-zinc-300 group-hover:text-white transition-colors">
                <Power className="w-10 h-10 stroke-[2] mb-1" />
                <span className="text-[11px] font-semibold tracking-widest uppercase opacity-85 font-mono">
                  TAP TO WAKE
                </span>
              </div>
            )}

            {state === 'connecting' && (
              <div className="flex flex-col items-center gap-2 text-white">
                <Sparkles className="w-10 h-10 animate-spin stroke-[2]" />
                <span className="text-[11px] font-semibold tracking-widest uppercase opacity-90 font-mono">
                  CONNECTING
                </span>
              </div>
            )}

            {state === 'listening' && (
              <div className="flex flex-col items-center gap-1.5 text-white">
                <div className="relative">
                  <Mic className="w-11 h-11 stroke-[2.2]" />
                  {userMicVolume > 0.08 && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-ping" />
                  )}
                </div>
                <span className="text-[11px] font-semibold tracking-widest uppercase opacity-90 font-mono">
                  {userMicVolume > 0.12 ? 'HEARING YOU' : 'LISTENING'}
                </span>
              </div>
            )}

            {state === 'speaking' && (
              <div className="flex flex-col items-center gap-1.5 text-white">
                <Volume2 className="w-11 h-11 stroke-[2.2] animate-bounce" />
                <span className="text-[11px] font-semibold tracking-widest uppercase opacity-95 font-mono">
                  SOMO SPEAKING
                </span>
              </div>
            )}
          </div>

          {/* Glass Gloss Sheen */}
          <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent rounded-t-full pointer-events-none" />
        </div>
      </button>

      {/* Subtitle / Status Hint */}
      <div className="mt-8 text-center px-4 max-w-xs transition-opacity duration-300">
        <p className="text-sm font-medium tracking-wide text-zinc-300">
          {state === 'disconnected' && 'Tap the orb to start live voice session'}
          {state === 'connecting' && 'Establishing real-time neural link with Somo...'}
          {state === 'listening' && 'Speak naturally. Somo is listening.'}
          {state === 'speaking' && 'Tap the orb or speak to interrupt.'}
        </p>
      </div>
    </div>
  );
};
