/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { HeaderBar } from './components/HeaderBar.tsx';
import { CyberBackground } from './components/CyberBackground.tsx';
import { AuraOrb } from './components/AuraOrb.tsx';
import { WaveformVisualizer } from './components/WaveformVisualizer.tsx';
import { ToolCallNotification } from './components/ToolCallNotification.tsx';
import { EasterEggLayer } from './components/EasterEggLayer.tsx';
import { VoicePromptsDrawer } from './components/VoicePromptsDrawer.tsx';
import { SettingsModal } from './components/SettingsModal.tsx';
import { LiveSession } from './services/LiveSession.ts';
import { AuraMood, SessionState, ToolCallData } from './types/assistant.ts';
import { AURA_THEMES } from './constants/themes.ts';
import { AlertCircle } from 'lucide-react';

export default function App() {
  const [state, setState] = useState<SessionState>('disconnected');
  const [auraMood, setAuraMood] = useState<AuraMood>('neon_sassy');
  const [voiceName, setVoiceName] = useState<string>('Kore');
  const [micDeviceId, setMicDeviceId] = useState<string>('');
  const [latencyMs, setLatencyMs] = useState<number | undefined>(undefined);
  const [activeToolCall, setActiveToolCall] = useState<ToolCallData | null>(null);
  const [activeEasterEgg, setActiveEasterEgg] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [audioEnergy, setAudioEnergy] = useState<number>(0);
  const [userMicVolume, setUserMicVolume] = useState<number>(0);

  const sessionRef = useRef<LiveSession | null>(null);

  // Initialize or update live session
  const getOrCreateSession = useCallback(() => {
    if (!sessionRef.current) {
      sessionRef.current = new LiveSession({
        voice: voiceName,
        micDeviceId: micDeviceId || undefined,
        onStateChange: (newState) => {
          setState(newState);
        },
        onUserVolume: (vol) => {
          setUserMicVolume(vol);
        },
        onLatency: (lat) => {
          setLatencyMs(lat);
        },
        onError: (err) => {
          setErrorMessage(err);
          setState('disconnected');
        },
        onToolCall: (toolCall) => {
          setActiveToolCall(toolCall);

          // Handle special UI updates from tools
          if (toolCall.name === 'setAuraTheme' && toolCall.args?.mood) {
            const mood = toolCall.args.mood as AuraMood;
            if (AURA_THEMES[mood]) {
              setAuraMood(mood);
            }
          } else if (toolCall.name === 'triggerEasterEgg' && toolCall.args?.action) {
            setActiveEasterEgg(toolCall.args.action);
          }
        },
      });
    }
    return sessionRef.current;
  }, [voiceName, micDeviceId]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (sessionRef.current) {
        sessionRef.current.destroy();
        sessionRef.current = null;
      }
    };
  }, []);

  const handleToggleSession = async () => {
    setErrorMessage(null);
    const session = getOrCreateSession();

    if (state === 'disconnected') {
      try {
        await session.connect();
      } catch (err: any) {
        console.error('Session connection failed:', err);
        setErrorMessage(err?.message || 'Could not connect to voice service');
      }
    } else if (state === 'speaking') {
      // Tap while speaking interrupts Somo
      session.getAudioStreamer().stop();
      setState('listening');
    } else {
      // Tap while listening or connecting disconnects
      session.disconnect();
    }
  };

  const handleCycleMood = () => {
    const moods: AuraMood[] = [
      'neon_sassy',
      'cyber_glam',
      'midnight_velvet',
      'sunburst_gold',
      'emerald_enigma',
    ];
    const currentIndex = moods.indexOf(auraMood);
    const nextMood = moods[(currentIndex + 1) % moods.length];
    setAuraMood(nextMood);
  };

  const handleSelectVoice = (newVoice: string) => {
    setVoiceName(newVoice);
    if (sessionRef.current) {
      sessionRef.current.updateVoice(newVoice);
    }
  };

  const currentTheme = AURA_THEMES[auraMood] || AURA_THEMES.neon_sassy;

  return (
    <div className="relative w-screen h-screen overflow-hidden flex flex-col justify-between bg-[#07070b] text-[#f2f4f8] font-sans select-none">
      {/* Dynamic Futuristic Ambient Background */}
      <CyberBackground
        mood={auraMood}
        state={state}
        audioEnergy={audioEnergy}
      />

      {/* Floating Easter Egg Animation Layer */}
      <EasterEggLayer
        action={activeEasterEgg}
        onFinished={() => setActiveEasterEgg(null)}
      />

      {/* Top Header Navigation */}
      <HeaderBar
        state={state}
        currentMood={auraMood}
        voiceName={voiceName}
        latencyMs={latencyMs}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onCycleMood={handleCycleMood}
      />

      {/* Real-time Tool Call Notification Banner */}
      <ToolCallNotification
        toolCall={activeToolCall}
        onDismiss={() => setActiveToolCall(null)}
      />

      {/* Error Banner */}
      {errorMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4">
          <div className="bg-red-500/20 border border-red-500/40 rounded-xl p-3 text-xs text-red-200 backdrop-blur-xl flex items-center justify-between shadow-xl">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="ml-2 text-zinc-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Central Visual Stage */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4">
        {/* Core Glowing Aura Orb */}
        <AuraOrb
          state={state}
          mood={auraMood}
          audioEnergy={audioEnergy}
          userMicVolume={userMicVolume}
          onToggle={handleToggleSession}
        />

        {/* Live Audio Oscilloscope & Frequency Spectrum */}
        <div className="mt-8 flex justify-center w-full">
          <WaveformVisualizer
            state={state}
            mood={auraMood}
            audioStreamer={sessionRef.current ? sessionRef.current.getAudioStreamer() : null}
            micStreamer={sessionRef.current ? sessionRef.current.getMicrophoneStreamer() : null}
            onEnergyUpdate={setAudioEnergy}
          />
        </div>
      </main>

      {/* Bottom Dock / Prompt Suggestions */}
      <footer className="relative z-20 pb-6 px-4">
        <VoicePromptsDrawer />
      </footer>

      {/* Configuration & Diagnostic Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentVoice={voiceName}
        onSelectVoice={handleSelectVoice}
        currentMood={auraMood}
        onSelectMood={setAuraMood}
        currentMicId={micDeviceId}
        onSelectMic={(id) => {
          setMicDeviceId(id);
          if (sessionRef.current && state !== 'disconnected') {
            sessionRef.current.disconnect();
          }
        }}
      />
    </div>
  );
}
