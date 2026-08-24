'use client';

import { Heart, MessageCircle } from 'lucide-react';
import type { Post } from './types';
import { reactionsOf } from './types';

/** Grilla de 3 columnas al estilo Instagram — posts con imagen muestran la foto,
 * posts de solo texto muestran una tarjeta degradada con el texto truncado. */
export default function ProfileGrid({ posts, onOpenPost }: { posts: Post[]; onOpenPost: (post: Post) => void }) {
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {posts.map((post) => (
        <button
          key={post.id}
          onClick={() => onOpenPost(post)}
          className="group relative aspect-square overflow-hidden rounded-lg bg-white/5 ring-1 ring-white/[0.06]"
        >
          {post.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.imageUrl} alt="" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
          ) : (
            <div className="w-full h-full flex items-center justify-center p-3 bg-[linear-gradient(135deg,rgba(139,92,246,0.28),rgba(18,18,28,1)_55%,rgba(217,70,239,0.15))]">
              <p className="text-white/70 text-[11px] text-center leading-snug line-clamp-6">{post.text}</p>
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors duration-200 flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100">
            <span className="flex items-center gap-1 text-white text-xs font-semibold">
              <Heart className="w-4 h-4 fill-white" /> {reactionsOf(post).length}
            </span>
            <span className="flex items-center gap-1 text-white text-xs font-semibold">
              <MessageCircle className="w-4 h-4 fill-white" /> {post.comments.length}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
