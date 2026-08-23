"use client";

import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { useCardTilt } from "@/hooks/useCardTilt";

interface ProductCardProps {
  href: string;
  image: string;
  name: string;
  description: string;
  color: string;
  priceLabel: React.ReactNode;
  badge?: React.ReactNode;
}

/**
 * Tarjeta de producto (membresía o kit) — antes cada grilla tenía su propia versión con
 * hover manejado por JS mutando `style` directo. Ahora el brillo por color de cada item
 * se pasa como CSS var (`--card-color`) y el hover/tilt son puramente CSS + el mismo
 * `useCardTilt` ya usado en selección de personajes/ordenador.
 */
export default function ProductCard({ href, image, name, description, color, priceLabel, badge }: ProductCardProps) {
  const tilt = useCardTilt<HTMLAnchorElement>();

  return (
    <Link
      href={href}
      ref={tilt.ref}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={tilt.onMouseLeave}
      style={{ '--card-color': color, transform: 'rotateX(var(--tilt-x,0deg)) rotateY(var(--tilt-y,0deg))' } as React.CSSProperties}
      className="product-card group relative bg-[#12121c] border border-[#1a1a28] rounded-2xl overflow-hidden transition-[transform,border-color,box-shadow] duration-300 [transform-style:preserve-3d] hover:-translate-y-1"
    >
      <div className="relative w-full h-48 overflow-hidden">
        <Image src={image} alt={name} fill className="object-cover object-top transition-transform duration-500 group-hover:scale-105" />
        <div
          className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ background: 'radial-gradient(220px circle at var(--glow-x,50%) var(--glow-y,50%), rgba(255,255,255,0.12), transparent 60%)' }}
        />
        {badge && <div className="absolute top-3 right-3">{badge}</div>}
      </div>

      <div className="p-5">
        <h3 className="text-lg font-bold mb-2 transition-colors" style={{ color }}>{name}</h3>
        <p className="text-gray-400 text-sm mb-4 line-clamp-2">{description}</p>

        <div className="flex items-center justify-between">
          <div className="text-white font-bold text-sm">{priceLabel}</div>
          <span className="flex items-center gap-1 text-sm transition-colors" style={{ color }}>
            Ver <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>

      <style jsx>{`
        .product-card:hover {
          background-color: color-mix(in srgb, var(--card-color) 12%, #12121c);
          border-color: color-mix(in srgb, var(--card-color) 45%, transparent);
          box-shadow: 0 20px 45px -20px color-mix(in srgb, var(--card-color) 55%, transparent);
        }
      `}</style>
    </Link>
  );
}
