/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, MessageCircle } from 'lucide-react';
import { CONVERSATION_STARTERS } from '../constants/themes.ts';

interface VoicePromptsDrawerProps {
  onSelectPrompt?: (prompt: string) => void;
}

export const VoicePromptsDrawer: React.FC<VoicePromptsDrawerProps> = ({
  onSelectPrompt,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="w-full max-w-lg mx-auto z-20 transition-all duration-300">
      {/* Drawer Toggle Bar */}
      <div className="flex items-center justify-center">
        <button
          onClick={() => setIsOpen(!isOpen)}
          type="button"
          aria-expanded={isOpen}
          aria-label="Toggle voice conversation ideas"
          className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 bg-[#12131d]/70 hover:bg-[#12131d] border border-white/10 rounded-full backdrop-blur-md transition-colors cursor-pointer"
        >
          <MessageCircle className="w-3.5 h-3.5 text-pink-400" />
          <span>Need ideas on what to say to Somo?</span>
          {isOpen ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronUp className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Expanded Cards */}
      {isOpen && (
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 bg-[#0d0e17]/85 border border-white/10 rounded-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-200">
          {CONVERSATION_STARTERS.map((item, idx) => (
            <div
              key={idx}
              className="p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 transition-all text-left flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1">
                  <span className="font-semibold text-zinc-200">{item.title}</span>
                  <span className="text-zinc-500">{item.moodTag}</span>
                </div>
                <p className="text-xs text-zinc-300 italic group-hover:text-pink-300 transition-colors">
                  &ldquo;{item.spokenPrompt}&rdquo;
                </p>
              </div>

              <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-zinc-500">
                <span>Speak aloud to Somo</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
