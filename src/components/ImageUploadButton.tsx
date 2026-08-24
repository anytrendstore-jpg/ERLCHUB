'use client';

import { useRef, useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import ImageCropperModal from './ImageCropperModal';

const ACCEPT = 'image/jpeg,image/png,image/webp';

interface ImageUploadButtonProps {
  /** Ancho/alto del recorte final — 1 para avatar cuadrado, ~3 para portada apaisada. */
  aspect: number;
  shape?: 'circle' | 'rect';
  onUploaded: (url: string) => void;
  onError?: (message: string) => void;
  className?: string;
  title?: string;
}

/** Botón que abre el selector de archivos del sistema, recorta la imagen elegida y la sube —
 * pensado para ir al lado de cualquier campo de URL de avatar/portada ya existente. */
export default function ImageUploadButton({ aspect, shape = 'circle', onUploaded, onError, className, title }: ImageUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const onPick = (files: FileList | null) => {
    const file = files?.[0];
    if (file) setPendingFile(file);
    if (inputRef.current) inputRef.current.value = '';
  };

  const onCropped = async (blob: Blob) => {
    setPendingFile(null);
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', new File([blob], 'upload.jpg', { type: 'image/jpeg' }));
      const res = await fetch('/api/social/upload', { method: 'POST', body: form });
      const data = await res.json();
      if (data.success) onUploaded(data.url);
      else onError?.(data.error || 'No se pudo subir la imagen');
    } catch {
      onError?.('No se pudo subir la imagen');
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <input ref={inputRef} type="file" accept={ACCEPT} className="hidden" onChange={(e) => onPick(e.target.files)} />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        title={title || 'Subir desde tu dispositivo'}
        className={className || 'flex items-center justify-center h-9 w-9 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white/60 hover:text-white transition-colors disabled:opacity-50 flex-shrink-0'}
      >
        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
      </button>

      {pendingFile && (
        <ImageCropperModal
          file={pendingFile}
          aspect={aspect}
          shape={shape}
          onCancel={() => setPendingFile(null)}
          onConfirm={onCropped}
        />
      )}
    </>
  );
}
