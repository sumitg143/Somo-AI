/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { ExternalLink, Globe, Palette, Sparkles, X, CheckCircle2 } from 'lucide-react';
import { ToolCallData } from '../types/assistant.ts';

interface ToolCallNotificationProps {
  toolCall: ToolCallData | null;
  onDismiss: () => void;
}

export const ToolCallNotification: React.FC<ToolCallNotificationProps> = ({
  toolCall,
  onDismiss,
}) => {
  useEffect(() => {
    if (!toolCall) return;
    const timer = setTimeout(() => {
      onDismiss();
    }, 6500);
    return () => clearTimeout(timer);
  }, [toolCall, onDismiss]);

  if (!toolCall) return null;

  const isWebsite = toolCall.name === 'openWebsite';
  const isSearch = toolCall.name === 'searchWeb';
  const isAura = toolCall.name === 'setAuraTheme';
  const isEasterEgg = toolCall.name === 'triggerEasterEgg';
  const isDevice = toolCall.name === 'getDeviceStatus';

  let icon = <Sparkles className="w-4 h-4 text-pink-400" />;
  let title = 'Action Triggered';
  let description = 'Somo executed a command';
  let actionUrl = '';

  if (isWebsite) {
    icon = <Globe className="w-4 h-4 text-cyan-400" />;
    title = toolCall.args?.title ? `Opening ${toolCall.args.title}` : 'Opening Website';
    actionUrl = toolCall.args?.url || '';
    description = actionUrl;
  } else if (isSearch) {
    icon = <Globe className="w-4 h-4 text-amber-400" />;
    title = `Searching for "${toolCall.args?.query || ''}"`;
    actionUrl = `https://www.google.com/search?q=${encodeURIComponent(toolCall.args?.query || '')}`;
    description = 'Google Search query launched';
  } else if (isAura) {
    icon = <Palette className="w-4 h-4 text-fuchsia-400" />;
    title = `Aura Theme: ${toolCall.args?.mood || 'Updated'}`;
    description = "Somo changed the room's visual atmosphere";
  } else if (isEasterEgg) {
    icon = <Sparkles className="w-4 h-4 text-rose-400" />;
    title = `Somo: ${toolCall.args?.action?.replace('_', ' ') || 'Surprise'}`;
    description = 'Visual expression triggered';
  } else if (isDevice) {
    icon = <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
    title = 'Device Context Checked';
    description = `Local Time: ${toolCall.result?.localTime || new Date().toLocaleTimeString()}`;
  }

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4 pointer-events-auto transition-all animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="bg-[#12131d]/90 border border-white/15 rounded-xl p-3.5 shadow-2xl backdrop-blur-xl flex items-start gap-3">
        <div className="p-2 rounded-lg bg-white/5 border border-white/10 shrink-0 mt-0.5">
          {icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-xs font-semibold text-white truncate">
              {title}
            </h4>
            <button
              onClick={onDismiss}
              className="text-zinc-500 hover:text-zinc-300 p-0.5 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-[11px] text-zinc-400 truncate mt-0.5">
            {description}
          </p>

          {actionUrl && (
            <a
              href={actionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              <span>Visit destination</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};
