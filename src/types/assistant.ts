/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SessionState = 'disconnected' | 'connecting' | 'listening' | 'speaking';

export type AuraMood = 
  | 'neon_sassy'
  | 'cyber_glam'
  | 'midnight_velvet'
  | 'sunburst_gold'
  | 'emerald_enigma';

export interface AuraThemeConfig {
  id: AuraMood;
  name: string;
  tagline: string;
  primary: string;
  secondary: string;
  glow: string;
  ambientBg: string;
  particleColor: string;
  accentRing: string;
}

export interface ToolCallData {
  id: string;
  name: string;
  args: Record<string, any>;
  timestamp: number;
  status: 'executing' | 'completed' | 'error';
  result?: any;
}

export interface VoiceOption {
  id: string;
  name: string;
  description: string;
  gender: 'female' | 'male';
}

export interface AssistantSettings {
  voice: string;
  auraMood: AuraMood;
  micDeviceId: string;
  inputVolumeThreshold: number;
  soundEffects: boolean;
  haptics: boolean;
}
