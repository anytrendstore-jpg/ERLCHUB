import { put } from '@vercel/blob';
import type { TicketAttachment } from '@/lib/staffServer';

/** Tope por tipo — un video pesa mucho más que una imagen, cada uno con su propio límite razonable. */
const LIMITS: Record<TicketAttachment['kind'], number> = {
  image: 8 * 1024 * 1024,
  audio: 20 * 1024 * 1024,
  video: 50 * 1024 * 1024,
  file: 0,
};

const ALLOWED_TYPES: Record<string, TicketAttachment['kind']> = {
  'image/jpeg': 'image', 'image/png': 'image', 'image/gif': 'image', 'image/webp': 'image',
  'audio/mpeg': 'audio', 'audio/wav': 'audio', 'audio/ogg': 'audio', 'audio/mp4': 'audio', 'audio/x-m4a': 'audio',
  'video/mp4': 'video', 'video/webm': 'video', 'video/quicktime': 'video',
};

export const MAX_ATTACHMENTS_PER_MESSAGE = 3;

export function classifyAttachment(contentType: string): { kind: TicketAttachment['kind']; maxSize: number } | null {
  const kind = ALLOWED_TYPES[contentType];
  if (!kind) return null;
  return { kind, maxSize: LIMITS[kind] };
}

/**
 * Los PATCH de tickets reciben el array de adjuntos ya subidos (de vuelta del propio cliente,
 * que los obtuvo de /upload) — sin este chequeo, alguien podría mandar cualquier URL/tipo
 * inventado en el body del PATCH sin pasar nunca por /upload. Solo se acepta lo que realmente
 * salió de un blob de Vercel con un `kind`/`contentType` de los permitidos.
 */
export function isValidAttachment(a: unknown): a is TicketAttachment {
  if (!a || typeof a !== 'object') return false;
  const att = a as Record<string, unknown>;
  return (
    typeof att.url === 'string' && att.url.startsWith('https://') && att.url.includes('.blob.vercel-storage.com/') &&
    typeof att.name === 'string' &&
    typeof att.contentType === 'string' && ALLOWED_TYPES[att.contentType] !== undefined &&
    typeof att.size === 'number' &&
    (att.kind === 'image' || att.kind === 'video' || att.kind === 'audio')
  );
}

/** Sube un adjunto de ticket a Vercel Blob y devuelve el registro listo para guardar en el mensaje. */
export async function uploadTicketAttachment(file: File, ticketId: string): Promise<TicketAttachment> {
  const info = classifyAttachment(file.type);
  if (!info) throw new Error('Tipo de archivo no permitido — solo imágenes, audio o video');
  if (file.size > info.maxSize) throw new Error(`El archivo supera el máximo permitido (${Math.round(info.maxSize / (1024 * 1024))}MB)`);

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-80);
  const blob = await put(`tickets/${ticketId}/${crypto.randomUUID()}-${safeName}`, file, { access: 'public' });

  return {
    url: blob.url,
    name: file.name.slice(0, 120),
    contentType: file.type,
    size: file.size,
    kind: info.kind,
  };
}
