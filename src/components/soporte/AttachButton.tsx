"use client";

import { useRef, useState } from "react";
import { Paperclip, Loader2 } from "lucide-react";
import type { TicketAttachment } from "./TicketAttachments";

const MAX_ATTACHMENTS_PER_MESSAGE = 3;
const ACCEPT = "image/jpeg,image/png,image/gif,image/webp,audio/mpeg,audio/wav,audio/ogg,audio/mp4,video/mp4,video/webm,video/quicktime";

interface AttachButtonProps {
  uploadUrl: string;
  ticketId: string;
  disabled?: boolean;
  pendingCount: number;
  onAdd: (attachment: TicketAttachment) => void;
  onError: (message: string) => void;
}

/** Botón de clip que sube el archivo apenas se elige — el mensaje ya sale con el adjunto listo. */
export default function AttachButton({ uploadUrl, ticketId, disabled, pendingCount, onAdd, onError }: AttachButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const remaining = MAX_ATTACHMENTS_PER_MESSAGE - pendingCount;
    if (remaining <= 0) {
      onError(`Máximo ${MAX_ATTACHMENTS_PER_MESSAGE} adjuntos por mensaje`);
      return;
    }

    setUploading(true);
    try {
      for (const file of Array.from(files).slice(0, remaining)) {
        const form = new FormData();
        form.append("file", file);
        form.append("ticketId", ticketId);
        const res = await fetch(uploadUrl, { method: "POST", body: form });
        const data = await res.json();
        if (data.success) onAdd(data.attachment);
        else onError(data.error || `No se pudo subir ${file.name}`);
      }
    } catch {
      onError("No se pudo subir el archivo");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || uploading || pendingCount >= MAX_ATTACHMENTS_PER_MESSAGE}
        title="Adjuntar imagen, audio o video"
        className="h-10 w-10 sm:h-11 sm:w-11 flex items-center justify-center rounded-lg sm:rounded-xl text-[var(--text-faint)] hover:text-[var(--foreground)] hover:bg-[var(--card-bg-2)] disabled:opacity-40 transition flex-shrink-0"
      >
        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
      </button>
    </>
  );
}
