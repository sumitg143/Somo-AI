/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SessionState, ToolCallData } from '../types/assistant.ts';
import { AudioStreamer } from './AudioStreamer.ts';
import { MicrophoneStreamer } from './MicrophoneStreamer.ts';

export interface LiveSessionOptions {
  voice?: string;
  micDeviceId?: string;
  onStateChange?: (state: SessionState) => void;
  onToolCall?: (toolCall: ToolCallData) => void;
  onError?: (error: string) => void;
  onUserVolume?: (volume: number) => void;
  onLatency?: (latencyMs: number) => void;
}

export class LiveSession {
  private ws: WebSocket | null = null;
  private audioStreamer: AudioStreamer;
  private micStreamer: MicrophoneStreamer;
  private state: SessionState = 'disconnected';
  private options: LiveSessionOptions;
  private isUserSpeaking: boolean = false;
  private lastPingTime: number = 0;
  private pingInterval: number | null = null;
  private isIntentionalDisconnect: boolean = false;

  constructor(options: LiveSessionOptions = {}) {
    this.options = options;
    this.audioStreamer = new AudioStreamer();
    this.micStreamer = new MicrophoneStreamer();

    this.audioStreamer.onSpeakingChange = (isSpeaking) => {
      if (this.state === 'disconnected' || this.state === 'connecting') return;
      if (isSpeaking) {
        this.setState('speaking');
      } else {
        this.setState('listening');
      }
    };

    this.micStreamer.onAudioData = (base64PCM16) => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          type: 'audio',
          audio: base64PCM16,
        }));
      }
    };

    this.micStreamer.onVolumeChange = (volume) => {
      this.options.onUserVolume?.(volume);
      // Fast local interruption detection: If user speaks strongly while Somo is speaking,
      // stop audio player immediately to feel ultra responsive!
      if (volume > 0.18 && this.state === 'speaking') {
        this.audioStreamer.stop();
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({ type: 'client_interrupted' }));
        }
      }
    };

    this.micStreamer.onError = (err) => {
      console.error('Microphone error:', err);
      this.options.onError?.(`Microphone access error: ${err.message}`);
      this.disconnect();
    };
  }

  private setState(newState: SessionState) {
    if (this.state !== newState) {
      this.state = newState;
      this.options.onStateChange?.(newState);
    }
  }

  public getState(): SessionState {
    return this.state;
  }

  public getAudioStreamer(): AudioStreamer {
    return this.audioStreamer;
  }

  public getMicrophoneStreamer(): MicrophoneStreamer {
    return this.micStreamer;
  }

  /**
   * Connects both the audio hardware and the Gemini Live session.
   */
  public async connect(): Promise<void> {
    if (this.state === 'connecting' || this.state === 'listening' || this.state === 'speaking') {
      return;
    }

    this.isIntentionalDisconnect = false;
    this.setState('connecting');

    try {
      // 1. Resume audio context on user gesture
      await this.audioStreamer.resume();

      // 2. Start microphone capture
      await this.micStreamer.start(this.options.micDeviceId);

      // 3. Connect WebSocket to backend proxy
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/live`;
      
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        // Send initial setup config
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.send(JSON.stringify({
            type: 'setup',
            voice: this.options.voice || 'Kore',
          }));
        }
        this.setState('listening');
        this.startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === 'audio' && msg.audio) {
            this.audioStreamer.addPCM16Chunk(msg.audio);
          } else if (msg.type === 'interrupted') {
            this.audioStreamer.stop();
            this.setState('listening');
          } else if (msg.type === 'tool_call') {
            this.handleIncomingToolCall(msg);
          } else if (msg.type === 'pong') {
            if (this.lastPingTime > 0) {
              const latency = Date.now() - this.lastPingTime;
              this.options.onLatency?.(latency);
            }
          } else if (msg.type === 'error') {
            console.error('Server error message:', msg.error);
            this.options.onError?.(msg.error || 'Server error occurred');
          }
        } catch (e) {
          console.error('Failed to parse WebSocket message:', e);
        }
      };

      this.ws.onerror = (e) => {
        console.error('WebSocket connection error:', e);
        this.options.onError?.('Failed to maintain connection to live assistant');
        this.disconnect();
      };

      this.ws.onclose = () => {
        if (!this.isIntentionalDisconnect) {
          console.warn('WebSocket closed unexpectedly');
        }
        this.disconnect();
      };

    } catch (err: any) {
      console.error('Failed to start LiveSession:', err);
      this.options.onError?.(err?.message || 'Failed to start session');
      this.disconnect();
      throw err;
    }
  }

  private handleIncomingToolCall(msg: any) {
    const toolCallData: ToolCallData = {
      id: msg.id || String(Date.now()),
      name: msg.name,
      args: msg.args || {},
      timestamp: Date.now(),
      status: 'executing',
    };

    this.options.onToolCall?.(toolCallData);

    // If client execution is needed (e.g. openWebsite or searchWeb), perform it
    if (msg.name === 'openWebsite' && msg.args?.url) {
      const url = msg.args.url.startsWith('http') ? msg.args.url : `https://${msg.args.url}`;
      // In modern browsers, window.open might be blocked if not directly in user click,
      // so the UI notification also provides a direct one-tap button
      try {
        window.open(url, '_blank', 'noopener,noreferrer');
      } catch (e) {
        console.warn('Popup blocked, rely on UI toast:', e);
      }
    } else if (msg.name === 'searchWeb' && msg.args?.query) {
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(msg.args.query)}`;
      try {
        window.open(searchUrl, '_blank', 'noopener,noreferrer');
      } catch (e) {
        console.warn('Popup blocked for search:', e);
      }
    }
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.pingInterval = window.setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.lastPingTime = Date.now();
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 5000);
  }

  private stopHeartbeat() {
    if (this.pingInterval) {
      window.clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  public updateVoice(voiceName: string) {
    this.options.voice = voiceName;
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'update_config',
        voice: voiceName,
      }));
    }
  }

  public disconnect(): void {
    this.isIntentionalDisconnect = true;
    this.stopHeartbeat();

    if (this.ws) {
      try {
        this.ws.close();
      } catch (e) {}
      this.ws = null;
    }

    this.micStreamer.stop();
    this.audioStreamer.stop();
    this.setState('disconnected');
  }

  public destroy(): void {
    this.disconnect();
    this.audioStreamer.close();
  }
}
