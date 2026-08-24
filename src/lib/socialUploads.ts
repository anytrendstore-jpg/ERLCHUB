import { put } from '@vercel/blob';

const MAX_SIZE = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

/** Sube una imagen ya recortada en el cliente (avatar/portada de HubSocial) a Vercel Blob. */
export async function uploadSocialImage(file: File, folder: string): Promise<string> {
  if (!ALLOWED_TYPES.has(file.type)) throw new Error('Formato no permitido — solo JPG, PNG o WEBP');
  if (file.size > MAX_SIZE) throw new Error('La imagen supera el máximo de 8MB');

  const blob = await put(`${folder}/${crypto.randomUUID()}.jpg`, file, { access: 'public', contentType: file.type });
  return blob.url;
}
