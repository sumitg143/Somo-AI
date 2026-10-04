/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Palette, Settings, Sparkles } from 'lucide-react';
import { AURA_THEMES } from '../constants/themes.ts';
import { AuraMood, SessionState } from '../types/assistant.ts';

interface HeaderBarProps {
  state: SessionState;
  currentMood: AuraMood;
  voiceName: string;
  latencyMs?: number;
  onOpenSettings: () => void;
  onCycleMood: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  state,
  currentMood,
  voiceName,
  latencyMs,
  onOpenSettings,
  onCycleMood,
}) => {
  const theme = AURA_THEMES[currentMood] || AURA_THEMES.neon_sassy;

  return (
    <header className="relative z-30 w-full px-5 py-4 flex items-center justify-between border-b border-white/5 bg-[#07070b]/60 backdrop-blur-xl">
      {/* Brand & Clean Metadata */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-full transition-all duration-500"
            style={{
              backgroundColor: theme.primary,
              boxShadow: `0 0 10px ${theme.primary}`,
            }}
          />
          <span className="text-lg font-bold tracking-tight text-white font-['Outfit']">
            Somo
          </span>
        </div>

        {/* Clean Unboxed Metadata with Typographic Separators (Zero-pill compliant) */}
        <div className="hidden sm:flex items-center gap-2 text-xs text-zinc-400">
          <span aria-hidden="true" className="text-zinc-600">·</span>
          <span>Voice AI</span>
          <span aria-hidden="true" className="text-zinc-600">·</span>
          <span>{voiceName}</span>
          {latencyMs !== undefined && latencyMs > 0 && (
            <>
              <span aria-hidden="true" className="text-zinc-600">·</span>
              <span>{latencyMs}ms</span>
            </>
          )}
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-2">
        {/* Quick Aura Mood Cycler Button */}
        <button
          onClick={onCycleMood}
          type="button"
          aria-label={`Current aura: ${theme.name}. Tap to change aura mood.`}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors cursor-pointer"
        >
          <Palette className="w-3.5 h-3.5" style={{ color: theme.primary }} />
          <span className="hidden xs:inline">{theme.name}</span>
        </button>

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          type="button"
          aria-label="Open Assistant Settings"
          className="p-2 text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg transition-colors cursor-pointer"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
