/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { Mic, Palette, Volume2, X, Check, Sparkles } from 'lucide-react';
import { AVAILABLE_VOICES, AURA_THEMES } from '../constants/themes.ts';
import { AuraMood } from '../types/assistant.ts';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentVoice: string;
  onSelectVoice: (voiceId: string) => void;
  currentMood: AuraMood;
  onSelectMood: (mood: AuraMood) => void;
  currentMicId: string;
  onSelectMic: (deviceId: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  currentVoice,
  onSelectVoice,
  currentMood,
  onSelectMood,
  currentMicId,
  onSelectMic,
}) => {
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    // Enumerate microphones
    navigator.mediaDevices
      ?.enumerateDevices()
      .then((devices) => {
        const audioInputs = devices.filter((d) => d.kind === 'audioinput');
        setAudioDevices(audioInputs);
      })
      .catch((err) => {
        console.warn('Could not list media devices:', err);
      });
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#0e101a] border border-white/10 rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-pink-500/10 text-pink-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-['Outfit']">
                Assistant Settings
              </h3>
              <p className="text-xs text-zinc-400">
                Customize Somo&apos;s voice tone and visual ambience
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close settings"
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5 space-y-6">
          {/* Voice Personality Selection */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Volume2 className="w-4 h-4 text-pink-400" />
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                Voice Persona
              </label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {AVAILABLE_VOICES.map((v) => {
                const isSelected = currentVoice === v.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => onSelectVoice(v.id)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-pink-500/15 border-pink-500/50 text-white shadow-[0_0_15px_rgba(236,72,153,0.15)]'
                        : 'bg-white/[0.03] border-white/5 text-zinc-300 hover:bg-white/[0.06]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">
                        {v.name}
                      </span>
                      {isSelected && <Check className="w-4 h-4 text-pink-400" />}
                    </div>
                    <p className="text-[11px] text-zinc-400 mt-1">
                      {v.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Visual Aura Themes */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Palette className="w-4 h-4 text-cyan-400" />
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                Aura Mood Theme
              </label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {Object.values(AURA_THEMES).map((theme) => {
                const isSelected = currentMood === theme.id;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => onSelectMood(theme.id)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-white/10 border-white/30 text-white shadow-lg'
                        : 'bg-white/[0.03] border-white/5 text-zinc-300 hover:bg-white/[0.06]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full shrink-0 shadow-md"
                        style={{
                          backgroundColor: theme.primary,
                          boxShadow: `0 0 10px ${theme.primary}`,
                        }}
                      />
                      <div>
                        <div className="text-xs font-bold text-white">
                          {theme.name}
                        </div>
                        <div className="text-[10px] text-zinc-400 truncate max-w-[140px]">
                          {theme.tagline}
                        </div>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-white" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Microphone Source */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Mic className="w-4 h-4 text-emerald-400" />
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                Audio Input Device
              </label>
            </div>
            <select
              value={currentMicId}
              onChange={(e) => onSelectMic(e.target.value)}
              className="w-full bg-[#181a26] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-pink-500/50"
            >
              <option value="">Default Microphone</option>
              {audioDevices.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || `Microphone ${d.deviceId.slice(0, 6)}`}
                </option>
              ))}
            </select>
          </div>

          {/* Persona Card Description */}
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
            <h4 className="text-xs font-semibold text-zinc-200 mb-1">
              About Somo
            </h4>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Somo is equipped with continuous real-time audio-to-audio speech processing powered by Gemini Live API. She hears your 16kHz PCM stream directly and responds in natural 24kHz audio without latency text roundtrips.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-white bg-pink-600 hover:bg-pink-500 rounded-xl transition-colors cursor-pointer shadow-lg"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
