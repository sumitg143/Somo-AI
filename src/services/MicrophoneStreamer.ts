/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  calculateRMS,
  float32ToInt16PCM,
  int16ToBase64,
  resampleFloat32,
} from '../utils/pcm-audio.ts';

export class MicrophoneStreamer {
  private mediaStream: MediaStream | null = null;
  private audioCtx: AudioContext | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private processorNode: ScriptProcessorNode | null = null;
  private analyser: AnalyserNode | null = null;
  private silentGain: GainNode | null = null;
  private isRecording: boolean = false;
  private targetSampleRate: number = 16000;

  public onAudioData?: (base64PCM16: string) => void;
  public onVolumeChange?: (volume: number) => void;
  public onError?: (error: Error) => void;

  constructor() {}

  public async start(deviceId?: string): Promise<void> {
    if (this.isRecording) return;

    try {
      const constraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
          ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
        },
        video: false,
      };

      this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      // We try to request 16000 directly; some browsers fall back to hardware rate
      this.audioCtx = new AudioContextClass({ sampleRate: this.targetSampleRate });

      if (this.audioCtx.state === 'suspended') {
        await this.audioCtx.resume();
      }

      this.sourceNode = this.audioCtx.createMediaStreamSource(this.mediaStream);

      // Analyser for user mic input visualization
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.4;
      this.sourceNode.connect(this.analyser);

      // 4096 buffer size gives ~85ms chunks at 48kHz or ~256ms at 16kHz
      this.processorNode = this.audioCtx.createScriptProcessor(4096, 1, 1);
      
      const currentSampleRate = this.audioCtx.sampleRate;

      this.processorNode.onaudioprocess = (e) => {
        if (!this.isRecording) return;

        const inputChannelData = e.inputBuffer.getChannelData(0);
        
        // Calculate volume for UI feedback & VAD
        const rms = calculateRMS(inputChannelData);
        this.onVolumeChange?.(rms);

        // Resample if the browser AudioContext is running at another sample rate (e.g. 44.1k or 48k)
        let samples16k: Float32Array;
        if (currentSampleRate !== this.targetSampleRate) {
          samples16k = resampleFloat32(inputChannelData, currentSampleRate, this.targetSampleRate);
        } else {
          samples16k = inputChannelData;
        }

        // Convert to 16-bit PCM little endian
        const int16PCM = float32ToInt16PCM(samples16k);
        const base64Audio = int16ToBase64(int16PCM);

        this.onAudioData?.(base64Audio);
      };

      this.sourceNode.connect(this.processorNode);

      // Connect to a muted gain node to ensure processor keeps running in Chrome/Safari without feedback loop
      this.silentGain = this.audioCtx.createGain();
      this.silentGain.gain.value = 0.0;
      this.processorNode.connect(this.silentGain);
      this.silentGain.connect(this.audioCtx.destination);

      this.isRecording = true;
    } catch (err: any) {
      this.stop();
      const error = err instanceof Error ? err : new Error(String(err));
      this.onError?.(error);
      throw error;
    }
  }

  public stop(): void {
    this.isRecording = false;

    if (this.processorNode) {
      this.processorNode.onaudioprocess = null;
      try {
        this.processorNode.disconnect();
      } catch (e) {}
      this.processorNode = null;
    }

    if (this.sourceNode) {
      try {
        this.sourceNode.disconnect();
      } catch (e) {}
      this.sourceNode = null;
    }

    if (this.silentGain) {
      try {
        this.silentGain.disconnect();
      } catch (e) {}
      this.silentGain = null;
    }

    if (this.analyser) {
      try {
        this.analyser.disconnect();
      } catch (e) {}
      this.analyser = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.audioCtx && this.audioCtx.state !== 'closed') {
      this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
    }

    this.onVolumeChange?.(0);
  }

  public getFrequencyData(array: Uint8Array): void {
    if (this.analyser && this.isRecording) {
      this.analyser.getByteFrequencyData(array as any);
    } else {
      array.fill(0);
    }
  }

  public getTimeDomainData(array: Uint8Array): void {
    if (this.analyser && this.isRecording) {
      this.analyser.getByteTimeDomainData(array as any);
    } else {
      array.fill(128);
    }
  }

  public isActive(): boolean {
    return this.isRecording;
  }
}
