'use client';

import React, { useEffect, useState } from 'react';
import { Gift, Search, X, User as UserIcon } from 'lucide-react';

export interface GiftRecipient {
  id: string;
  name: string;
  avatar?: string;
}

const ACCENT_CLASSES: Record<string, string> = {
  blue: 'bg-blue-600 text-white',
  cyan: 'bg-cyan-500 text-[#060a14]',
  red: 'bg-red-600 text-white',
  emerald: 'bg-emerald-600 text-white',
  pink: 'bg-pink-600 text-white',
  amber: 'bg-amber-500 text-black',
};

interface GiftPickerProps {
  giftTo: GiftRecipient | null;
  onChange: (u: GiftRecipient | null) => void;
  /** Clave del color de acento para el estado activo (ver ACCENT_CLASSES). */
  accent?: keyof typeof ACCENT_CLASSES;
  /** 'dark' (por defecto, para el resto de apps del OS) o 'light' (para MercadoLibre, que usa fondo blanco). */
  theme?: 'dark' | 'light';
  className?: string;
}

const THEME = {
  dark: {
    label: 'text-white/50',
    inactive: 'bg-white/10 text-white/60 hover:bg-white/15',
    chip: 'bg-white/5 border border-white/10',
    chipText: 'text-white',
    chipAvatarFallback: 'bg-white/10',
    clearBtn: 'text-white/40 hover:text-white',
    inputWrap: 'bg-white/5 border border-white/10 focus-within:border-white/30',
    input: 'text-white placeholder-white/30',
    searchIcon: 'text-white/30',
    resultHover: 'hover:bg-white/10',
    resultText: 'text-white/80',
  },
  light: {
    label: 'text-[#666]',
    inactive: 'bg-black/5 text-[#666] hover:bg-black/10',
    chip: 'bg-black/[0.03] border border-[#E6E6E6]',
    chipText: 'text-[#333]',
    chipAvatarFallback: 'bg-black/10',
    clearBtn: 'text-[#999] hover:text-[#333]',
    inputWrap: 'bg-white border border-[#DDD] focus-within:border-[#3483FA]',
    input: 'text-[#333] placeholder-[#999]',
    searchIcon: 'text-[#999]',
    resultHover: 'hover:bg-black/5',
    resultText: 'text-[#333]',
  },
} as const;

/** Selector reutilizable "¿Para quién es esta compra?" — comprar para mí o regalarle a otro jugador real. */
export default function GiftPicker({ giftTo, onChange, accent = 'blue', theme = 'dark', className = '' }: GiftPickerProps) {
  const activeClass = ACCENT_CLASSES[accent] || ACCENT_CLASSES.blue;
  const t = THEME[theme];
  const [mode, setMode] = useState<'me' | 'gift'>(giftTo ? 'gift' : 'me');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GiftRecipient[]>([]);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const t = setTimeout(() => {
      fetch(`/api/social/search?q=${encodeURIComponent(query.trim())}`, { cache: 'no-store' })
        .then((r) => r.json())
        .then((d) => {
          if (d.success) setResults(d.users.map((u: any) => ({ id: u.discordId, name: u.displayName, avatar: u.avatar })));
        });
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  const selectMe = () => { setMode('me'); onChange(null); setQuery(''); setResults([]); };
  const selectGiftMode = () => setMode('gift');
  const selectRecipient = (u: GiftRecipient) => { onChange(u); setQuery(''); setResults([]); };
  const clearRecipient = () => { onChange(null); setQuery(''); };

  return (
    <div className={className}>
      <p className={`text-xs font-medium mb-1.5 ${t.label}`}>¿Para quién es esta compra?</p>
      <div className="flex gap-2 mb-2">
        <button
          type="button"
          onClick={selectMe}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors ${mode === 'me' ? activeClass : t.inactive}`}
        >
          <UserIcon className="w-3.5 h-3.5" /> Para mí
        </button>
        <button
          type="button"
          onClick={selectGiftMode}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors ${mode === 'gift' ? activeClass : t.inactive}`}
        >
          <Gift className="w-3.5 h-3.5" /> Regalar
        </button>
      </div>

      {mode === 'gift' && (
        giftTo ? (
          <div className={`flex items-center gap-2 p-2 rounded-lg ${t.chip}`}>
            {giftTo.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={giftTo.avatar} alt="" className="w-6 h-6 rounded-full flex-shrink-0" />
            ) : (
              <div className={`w-6 h-6 rounded-full flex-shrink-0 ${t.chipAvatarFallback}`} />
            )}
            <span className={`text-xs flex-1 truncate ${t.chipText}`}>Regalo para <b>{giftTo.name}</b></span>
            <button type="button" onClick={clearRecipient} className={`flex-shrink-0 ${t.clearBtn}`}><X className="w-3.5 h-3.5" /></button>
          </div>
        ) : (
          <div className="relative">
            <Search className={`absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${t.searchIcon}`} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar jugador por nombre o @usuario..."
              className={`w-full rounded-lg pl-8 pr-2 py-2 text-xs focus:outline-none ${t.inputWrap} ${t.input}`}
            />
            {results.length > 0 && (
              <div className="mt-1.5 max-h-32 overflow-y-auto space-y-1">
                {results.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => selectRecipient(u)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left ${t.resultHover}`}
                  >
                    {u.avatar ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={u.avatar} alt="" className="w-5 h-5 rounded-full" />
                    ) : (
                      <div className={`w-5 h-5 rounded-full ${t.chipAvatarFallback}`} />
                    )}
                    <span className={`text-xs truncate ${t.resultText}`}>{u.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
}
