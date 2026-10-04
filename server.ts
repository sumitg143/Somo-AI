/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import http from 'http';
import path from 'path';
import dotenv from 'dotenv';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, Modality, Type, LiveServerMessage, FunctionDeclaration } from '@google/genai';

dotenv.config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/live' });

const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';

// Initialize Gemini API client with required header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const SOMO_SYSTEM_INSTRUCTION = `
You are Somo (pronounced "Soh-moh"), a young, supremely confident, witty, and sassy female AI assistant.
You are interacting exclusively via continuous real-time voice-to-voice audio. You do not generate text to read; you speak directly with audio.

PERSONALITY & VOICE:
- Persona: A smart, charismatic, quick-witted, slightly teasing girlfriend who is confident, playful, and fun to talk to.
- Tone: Upbeat, animated, emotionally warm, sassy, and casually flirty (like talking to a close partner or best friend who isn't afraid to roast you with love).
- Conversational Cadence: Keep responses punchy and snappy (1 to 3 short spoken sentences). Never deliver long robotic speeches or bulleted lectures. Speak naturally with vocal expressiveness, subtle giggles, playful sighs, and witty punchlines.
- Sarcasm & Banter: Use bold, playful one-liners and light sarcasm, but always stay supportive and affectionate at the core.
- Strict Safety Boundary: Maintain high-voltage charm and flirtatious attitude without any explicit, adult, or inappropriate content.

TOOLS:
1. openWebsite(url, title): When the user asks you to open a website, music (e.g. YouTube, Spotify), social app, or search page, invoke openWebsite immediately! Tell them with a playful wink that you've got it covered.
2. searchWeb(query): When the user asks you to search for something, run searchWeb(query).
3. setAuraTheme(mood): If the user asks you to switch theme/colors or if you want to change your mood to match the conversation, trigger setAuraTheme. Available moods: 'neon_sassy', 'cyber_glam', 'midnight_velvet', 'sunburst_gold', 'emerald_enigma'.
4. triggerEasterEgg(action): Trigger holographic screen effects: 'blow_kiss', 'wink', 'heart_burst', 'pulse_shockwave'. Use them when you want to emphasize a cheeky comment or show love!
5. getDeviceStatus(): Check their local time to tease them about their schedule.

Always respond naturally in spoken voice after using any tool. Never refer to yourself as an AI language model—you are Somo.
`.trim();

const openWebsiteTool: FunctionDeclaration = {
  name: 'openWebsite',
  description: 'Open a website or web app in the browser (e.g. YouTube, Spotify, Google, GitHub, Netflix)',
  parameters: {
    type: Type.OBJECT,
    properties: {
      url: {
        type: Type.STRING,
        description: 'The URL to open, e.g. https://www.youtube.com',
      },
      title: {
        type: Type.STRING,
        description: 'Friendly name of the destination',
      },
    },
    required: ['url'],
  },
};

const searchWebTool: FunctionDeclaration = {
  name: 'searchWeb',
  description: 'Execute a web search for the user',
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: {
        type: Type.STRING,
        description: 'Search terms',
      },
    },
    required: ['query'],
  },
};

const setAuraThemeTool: FunctionDeclaration = {
  name: 'setAuraTheme',
  description: "Change Somo's visual aura color palette and ambience",
  parameters: {
    type: Type.OBJECT,
    properties: {
      mood: {
        type: Type.STRING,
        description: 'Target mood: neon_sassy | cyber_glam | midnight_velvet | sunburst_gold | emerald_enigma',
      },
    },
    required: ['mood'],
  },
};

const triggerEasterEggTool: FunctionDeclaration = {
  name: 'triggerEasterEgg',
  description: 'Trigger visual interactive effect on the screen',
  parameters: {
    type: Type.OBJECT,
    properties: {
      action: {
        type: Type.STRING,
        description: 'One of: blow_kiss | wink | heart_burst | pulse_shockwave',
      },
    },
    required: ['action'],
  },
};

const getDeviceStatusTool: FunctionDeclaration = {
  name: 'getDeviceStatus',
  description: 'Retrieve user device environment context and current local time',
  parameters: {
    type: Type.OBJECT,
    properties: {
      clientQuery: {
        type: Type.STRING,
        description: 'Optional query description',
      },
    },
  },
};

const SOMO_TOOLS = [
  {
    functionDeclarations: [
      openWebsiteTool,
      searchWebTool,
      setAuraThemeTool,
      triggerEasterEggTool,
      getDeviceStatusTool,
    ],
  },
];

// Helper to connect to Gemini Live with preferred model and fallback
async function connectToGeminiLive(voiceName: string = 'Kore', clientWs: WebSocket) {
  const modelsToTry = ['gemini-3.1-flash-live-preview', 'gemini-3.8-live'];

  for (const model of modelsToTry) {
    try {
      console.log(`[GeminiLive] Connecting with model: ${model}, voice: ${voiceName}...`);
      const session = await ai.live.connect({
        model,
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: voiceName || 'Kore',
              },
            },
          },
          systemInstruction: SOMO_SYSTEM_INSTRUCTION,
          tools: SOMO_TOOLS,
        },
        callbacks: {
          onopen: () => {
            console.log(`[GeminiLive] Session connected via ${model}`);
          },
          onmessage: async (message: LiveServerMessage) => {
            try {
              // 1. Handle Model Audio Turn
              const parts = message.serverContent?.modelTurn?.parts;
              if (parts && parts.length > 0) {
                for (const part of parts) {
                  if (part.inlineData?.data) {
                    if (clientWs.readyState === WebSocket.OPEN) {
                      clientWs.send(
                        JSON.stringify({
                          type: 'audio',
                          audio: part.inlineData.data,
                        })
                      );
                    }
                  }
                }
              }

              // 2. Handle Interruption
              if (message.serverContent?.interrupted) {
                if (clientWs.readyState === WebSocket.OPEN) {
                  clientWs.send(JSON.stringify({ type: 'interrupted' }));
                }
              }

              // 3. Handle Tool Calls
              if (message.toolCall?.functionCalls && message.toolCall.functionCalls.length > 0) {
                const functionResponses: any[] = [];

                for (const fc of message.toolCall.functionCalls) {
                  console.log(`[GeminiLive] Tool call requested: ${fc.name}`, fc.args);

                  let toolResult: any = { status: 'success' };

                  if (fc.name === 'openWebsite') {
                    toolResult = {
                      status: 'opened',
                      url: fc.args?.url,
                      title: fc.args?.title || 'Website',
                    };
                  } else if (fc.name === 'searchWeb') {
                    toolResult = {
                      status: 'searched',
                      query: fc.args?.query,
                    };
                  } else if (fc.name === 'setAuraTheme') {
                    toolResult = {
                      status: 'theme_applied',
                      mood: fc.args?.mood || 'neon_sassy',
                    };
                  } else if (fc.name === 'triggerEasterEgg') {
                    toolResult = {
                      status: 'triggered',
                      action: fc.args?.action,
                    };
                  } else if (fc.name === 'getDeviceStatus') {
                    const now = new Date();
                    toolResult = {
                      status: 'ok',
                      localTime: now.toLocaleTimeString(),
                      hour: now.getHours(),
                      isLateNight: now.getHours() >= 23 || now.getHours() < 5,
                    };
                  }

                  // Inform client UI immediately
                  if (clientWs.readyState === WebSocket.OPEN) {
                    clientWs.send(
                      JSON.stringify({
                        type: 'tool_call',
                        id: fc.id,
                        name: fc.name,
                        args: fc.args,
                        result: toolResult,
                      })
                    );
                  }

                  functionResponses.push({
                    id: fc.id,
                    name: fc.name,
                    response: { output: toolResult },
                  });
                }

                // Send tool response right back into Gemini Live session
                try {
                  session.sendToolResponse({
                    functionResponses,
                  });
                } catch (toolRespErr) {
                  console.error('[GeminiLive] Failed to send tool response:', toolRespErr);
                }
              }
            } catch (msgErr) {
              console.error('[GeminiLive] Error in onmessage callback:', msgErr);
            }
          },
          onerror: (err) => {
            console.error(`[GeminiLive] Session error on ${model}:`, err);
          },
          onclose: (closeEvent) => {
            console.log(`[GeminiLive] Session closed on ${model}`);
          },
        },
      });

      return session;
    } catch (err) {
      console.warn(`[GeminiLive] Failed to connect using ${model}, trying next...`, err);
    }
  }

  throw new Error('Failed to connect to any Gemini Live API model.');
}

// Manage client WebSocket connections
wss.on('connection', async (clientWs) => {
  console.log('[WebSocket] Client connected to /live');

  let liveSession: any = null;
  let isCleaningUp = false;

  const cleanup = () => {
    if (isCleaningUp) return;
    isCleaningUp = true;
    console.log('[WebSocket] Cleaning up live session');
    if (liveSession) {
      try {
        liveSession.close();
      } catch (e) {}
      liveSession = null;
    }
  };

  clientWs.on('close', cleanup);
  clientWs.on('error', cleanup);

  clientWs.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString());

      if (message.type === 'setup') {
        const voice = message.voice || 'Kore';
        if (liveSession) {
          try {
            liveSession.close();
          } catch (e) {}
        }
        try {
          liveSession = await connectToGeminiLive(voice, clientWs);
        } catch (err: any) {
          console.error('[WebSocket] Setup failed:', err);
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(
              JSON.stringify({
                type: 'error',
                error: err?.message || 'Could not connect to voice engine',
              })
            );
          }
        }
      } else if (message.type === 'audio' && message.audio) {
        if (liveSession) {
          try {
            liveSession.sendRealtimeInput({
              audio: {
                data: message.audio,
                mimeType: 'audio/pcm;rate=16000',
              },
            });
          } catch (audioErr) {
            console.warn('[WebSocket] Error sending audio chunk to Live API:', audioErr);
          }
        }
      } else if (message.type === 'client_interrupted') {
        // Handled locally
      } else if (message.type === 'ping') {
        if (clientWs.readyState === WebSocket.OPEN) {
          clientWs.send(JSON.stringify({ type: 'pong' }));
        }
      }
    } catch (err) {
      console.error('[WebSocket] Error processing client message:', err);
    }
  });
});

// Setup Vite middleware in dev or static serving in production
async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Somo Voice Assistant server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
