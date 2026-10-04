/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { base64ToFloat32PCM } from '../utils/pcm-audio.ts';

export class AudioStreamer {
  private audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private nextStartTime: number = 0;
  private activeSources: Set<AudioBufferSourceNode> = new Set();
  private isSpeaking: boolean = false;
  private checkEndTimeout: number | null = null;

  public onSpeakingChange?: (isSpeaking: boolean) => void;

  constructor() {
    // Lazy init on first user interaction
  }

  private initContext(): AudioContext {
    if (!this.audioCtx || this.audioCtx.state === 'closed') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioContextClass({ sampleRate: 24000 });
      
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.85;

      this.gainNode = this.audioCtx.createGain();
      this.gainNode.gain.value = 1.0;

      this.analyser.connect(this.gainNode);
      this.gainNode.connect(this.audioCtx.destination);
    }

    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch((err) => {
        console.warn('Failed to resume AudioContext:', err);
      });
    }

    return this.audioCtx;
  }

  /**
   * Resumes or ensures the AudioContext is running.
   */
  public async resume(): Promise<void> {
    const ctx = this.initContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
  }

  /**
   * Schedules a base64 encoded 24kHz PCM chunk for gapless playback.
   */
  public addPCM16Chunk(base64Data: string): void {
    if (!base64Data) return;

    try {
      const ctx = this.initContext();
      const float32Samples = base64ToFloat32PCM(base64Data);
      if (float32Samples.length === 0) return;

      const audioBuffer = ctx.createBuffer(1, float32Samples.length, 24000);
      audioBuffer.copyToChannel(float32Samples as any, 0);

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;

      if (this.analyser) {
        source.connect(this.analyser);
      } else {
        source.connect(ctx.destination);
      }

      const currentTime = ctx.currentTime;
      // Schedule immediately or seamlessly stitch to the tail of the previous chunk
      const startTime = Math.max(currentTime, this.nextStartTime);
      source.start(startTime);
      this.nextStartTime = startTime + audioBuffer.duration;

      this.activeSources.add(source);

      if (!this.isSpeaking) {
        this.isSpeaking = true;
        this.onSpeakingChange?.(true);
      }

      if (this.checkEndTimeout) {
        window.clearTimeout(this.checkEndTimeout);
        this.checkEndTimeout = null;
      }

      source.onended = () => {
        this.activeSources.delete(source);
        if (this.activeSources.size === 0) {
          // Allow small buffer margin before marking speaking as false
          this.checkEndTimeout = window.setTimeout(() => {
            if (this.activeSources.size === 0) {
              this.isSpeaking = false;
              this.nextStartTime = 0;
              this.onSpeakingChange?.(false);
            }
          }, 60);
        }
      };
    } catch (err) {
      console.error('Error scheduling audio chunk:', err);
    }
  }

  /**
   * Immediately stops all current and queued audio playback (for user interruptions).
   */
  public stop(): void {
    if (this.checkEndTimeout) {
      window.clearTimeout(this.checkEndTimeout);
      this.checkEndTimeout = null;
    }

    this.activeSources.forEach((source) => {
      try {
        source.stop();
        source.disconnect();
      } catch (e) {
        // Source might have already finished
      }
    });

    this.activeSources.clear();
    this.nextStartTime = 0;

    if (this.isSpeaking) {
      this.isSpeaking = false;
      this.onSpeakingChange?.(false);
    }
  }

  /**
   * Returns current frequency domain byte data for visualizer.
   */
  public getFrequencyData(array: Uint8Array): void {
    if (this.analyser && this.isSpeaking) {
      this.analyser.getByteFrequencyData(array as any);
    } else {
      array.fill(0);
    }
  }

  /**
   * Returns current time domain byte data for waveform visualizer.
   */
  public getTimeDomainData(array: Uint8Array): void {
    if (this.analyser && this.isSpeaking) {
      this.analyser.getByteTimeDomainData(array as any);
    } else {
      array.fill(128); // 128 is center line
    }
  }

  public getSpeakingState(): boolean {
    return this.isSpeaking;
  }

  public setVolume(volume: number): void {
    if (this.gainNode) {
      this.gainNode.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  public close(): void {
    this.stop();
    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close().catch(() => {});
    }
    this.audioCtx = null;
    this.analyser = null;
    this.gainNode = null;
  }
}
