"use client";

import { Download, Music } from "lucide-react";

export interface TicketAttachment {
  url: string;
  name: string;
  contentType: string;
  size: number;
  kind: "image" | "video" | "audio" | "file";
}

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

/** Adjuntos de un mensaje de ticket — mismo componente para el lado jugador y el panel de staff. */
export default function TicketAttachments({ attachments }: { attachments?: TicketAttachment[] }) {
  if (!attachments || attachments.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 mt-2">
      {attachments.map((a, i) => {
        if (a.kind === "image") {
          return (
            <a key={i} href={a.url} target="_blank" rel="noopener noreferrer" className="block max-w-[220px] rounded-lg overflow-hidden border border-white/10 hover:border-[#8e00f7]/50 transition-colors">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={a.url} alt={a.name} className="w-full h-auto object-cover" />
            </a>
          );
        }
        if (a.kind === "video") {
          return (
            <video key={i} src={a.url} controls className="max-w-[260px] rounded-lg border border-white/10" />
          );
        }
        if (a.kind === "audio") {
          return (
            <div key={i} className="flex items-center gap-2 max-w-[280px]">
              <Music className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0" />
              <audio src={a.url} controls className="h-9 flex-1" />
            </div>
          );
        }
        return (
          <a key={i} href={a.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-3 py-2 transition-colors">
            <Download className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{a.name}</span>
            <span className="text-[var(--text-faint)] flex-shrink-0">{formatSize(a.size)}</span>
          </a>
        );
      })}
    </div>
  );
}
