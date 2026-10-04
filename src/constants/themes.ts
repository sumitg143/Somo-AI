/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AuraMood, AuraThemeConfig, VoiceOption } from '../types/assistant.ts';

export const AURA_THEMES: Record<AuraMood, AuraThemeConfig> = {
  neon_sassy: {
    id: 'neon_sassy',
    name: 'Neon Sassy',
    tagline: 'Electric Magenta & Velvet Rose',
    primary: '#ec4899', // pink-500
    secondary: '#8b5cf6', // purple-500
    glow: 'rgba(236, 72, 153, 0.45)',
    ambientBg: 'radial-gradient(ellipse at 50% 40%, rgba(236, 72, 153, 0.18) 0%, rgba(139, 92, 246, 0.12) 45%, rgba(7, 7, 11, 0.98) 80%)',
    particleColor: '#f472b6',
    accentRing: 'border-pink-500/40 shadow-[0_0_50px_rgba(236,72,153,0.35)]',
  },
  cyber_glam: {
    id: 'cyber_glam',
    name: 'Cyber Glam',
    tagline: 'Ultra Cyan & Radiant Orchid',
    primary: '#06b6d4', // cyan-500
    secondary: '#d946ef', // fuchsia-500
    glow: 'rgba(6, 182, 212, 0.45)',
    ambientBg: 'radial-gradient(ellipse at 50% 40%, rgba(6, 182, 212, 0.18) 0%, rgba(217, 70, 239, 0.12) 45%, rgba(7, 7, 11, 0.98) 80%)',
    particleColor: '#22d3ee',
    accentRing: 'border-cyan-500/40 shadow-[0_0_50px_rgba(6,182,212,0.35)]',
  },
  midnight_velvet: {
    id: 'midnight_velvet',
    name: 'Midnight Velvet',
    tagline: 'Deep Cosmic Indigo & Amethyst',
    primary: '#6366f1', // indigo-500
    secondary: '#a855f7', // purple-500
    glow: 'rgba(99, 102, 241, 0.45)',
    ambientBg: 'radial-gradient(ellipse at 50% 40%, rgba(99, 102, 241, 0.18) 0%, rgba(168, 85, 247, 0.12) 45%, rgba(7, 7, 11, 0.98) 80%)',
    particleColor: '#818cf8',
    accentRing: 'border-indigo-500/40 shadow-[0_0_50px_rgba(99,102,241,0.35)]',
  },
  sunburst_gold: {
    id: 'sunburst_gold',
    name: 'Sunburst Gold',
    tagline: 'Warm Amber, Sunset & Coral',
    primary: '#f59e0b', // amber-500
    secondary: '#f43f5e', // rose-500
    glow: 'rgba(245, 158, 11, 0.45)',
    ambientBg: 'radial-gradient(ellipse at 50% 40%, rgba(245, 158, 11, 0.18) 0%, rgba(244, 63, 94, 0.12) 45%, rgba(7, 7, 11, 0.98) 80%)',
    particleColor: '#fbbf24',
    accentRing: 'border-amber-500/40 shadow-[0_0_50px_rgba(245,158,11,0.35)]',
  },
  emerald_enigma: {
    id: 'emerald_enigma',
    name: 'Emerald Enigma',
    tagline: 'Hyper Emerald & Mint Spark',
    primary: '#10b981', // emerald-500
    secondary: '#06b6d4', // cyan-500
    glow: 'rgba(16, 185, 129, 0.45)',
    ambientBg: 'radial-gradient(ellipse at 50% 40%, rgba(16, 185, 129, 0.18) 0%, rgba(6, 182, 212, 0.12) 45%, rgba(7, 7, 11, 0.98) 80%)',
    particleColor: '#34d399',
    accentRing: 'border-emerald-500/40 shadow-[0_0_50px_rgba(16,185,129,0.35)]',
  },
};

export const AVAILABLE_VOICES: VoiceOption[] = [
  {
    id: 'Kore',
    name: 'Kore (Recommended)',
    description: 'Vibrant, warm, sassy, and expressive female voice',
    gender: 'female',
  },
  {
    id: 'Zephyr',
    name: 'Zephyr',
    description: 'Crisp, breezy, modern, and confident tone',
    gender: 'female',
  },
  {
    id: 'Puck',
    name: 'Puck',
    description: 'Playful, dynamic, energetic presence',
    gender: 'male',
  },
  {
    id: 'Fenrir',
    name: 'Fenrir',
    description: 'Deep, resonant, magnetic charisma',
    gender: 'male',
  },
  {
    id: 'Charon',
    name: 'Charon',
    description: 'Smooth, calm, velvet baritone',
    gender: 'male',
  },
];

export const CONVERSATION_STARTERS = [
  {
    title: 'Roast me with love',
    spokenPrompt: 'Hey Somo, be honest... what is your first impression of me?',
    moodTag: 'Playful',
  },
  {
    title: 'Ask about her favorite music',
    spokenPrompt: 'Somo, open up YouTube and find me a song with real attitude.',
    moodTag: 'Tools',
  },
  {
    title: 'Test her witty comeback',
    spokenPrompt: 'Why should I talk to you instead of other boring AI assistants?',
    moodTag: 'Sassy',
  },
  {
    title: 'Check late-night vibes',
    spokenPrompt: 'Check my device status. Am I staying up way too late right now?',
    moodTag: 'Tools',
  },
  {
    title: 'Change the room mood',
    spokenPrompt: 'Change your aura theme to cyber glam and show me some attitude.',
    moodTag: 'Aura',
  },
  {
    title: 'Send some love',
    spokenPrompt: 'Somo, blow me a kiss and tell me something sweet.',
    moodTag: 'Easter Egg',
  },
];
