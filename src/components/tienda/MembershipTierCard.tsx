"use client";

import Link from "next/link";
import Image from "next/image";
import { Check, ChevronRight, Star } from "lucide-react";
import { useCardTilt } from "@/hooks/useCardTilt";
import type { Membership } from "@/lib/types";

const VISIBLE_BENEFITS = 5;

interface MembershipTierCardProps {
  membership: Membership;
  billing: "monthly" | "permanent";
  recommended?: boolean;
}

/** Tarjeta de nivel de membresía — checklist de beneficios en vez de solo imagen+precio, como una tabla de precios real. */
export default function MembershipTierCard({ membership, billing, recommended }: MembershipTierCardProps) {
  const tilt = useCardTilt<HTMLDivElement>();
  const price = billing === "monthly" ? membership.priceMonthly : membership.pricePermanent;
  const visible = membership.benefits.slice(0, VISIBLE_BENEFITS);
  const rest = membership.benefits.length - visible.length;

  // Cuántos meses de mensual hacen falta para que el permanente salga más barato — dato real, no inventado.
  const breakEvenMonths = Math.ceil(membership.pricePermanent / membership.priceMonthly);

  return (
    <div
      ref={tilt.ref}
      onMouseMove={tilt.onMouseMove}
      onMouseLeave={tilt.onMouseLeave}
      style={{ '--card-color': membership.color, transform: 'rotateX(var(--tilt-x,0deg)) rotateY(var(--tilt-y,0deg))' } as React.CSSProperties}
      className={`tier-card group relative flex flex-col bg-[#12121c] border rounded-2xl overflow-hidden transition-[transform,border-color,box-shadow] duration-300 [transform-style:preserve-3d] hover:-translate-y-1 ${recommended ? 'border-[color:var(--card-color)]' : 'border-[#1a1a28]'}`}
    >
      {recommended && (
        <div className="absolute top-0 inset-x-0 flex justify-center z-10">
          <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-black px-3 py-1 rounded-b-lg" style={{ backgroundColor: membership.color }}>
            <Star className="h-3 w-3 fill-black" /> Recomendado
          </div>
        </div>
      )}

      <div className="relative w-full h-36 overflow-hidden">
        <Image src={membership.image} alt={membership.name} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
        <div
          className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{ background: 'radial-gradient(220px circle at var(--glow-x,50%) var(--glow-y,50%), rgba(255,255,255,0.12), transparent 60%)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#12121c] to-transparent" />
      </div>

      <div className="p-5 flex flex-col flex-1">
        <h3 className="text-xl font-bold mb-1" style={{ color: membership.color }}>{membership.name}</h3>

        <div className="flex items-baseline gap-1 mb-1">
          <span className="text-3xl font-black text-white">${price}</span>
          <span className="text-gray-500 text-sm">{billing === "monthly" ? "/mes" : " único pago"}</span>
        </div>
        {billing === "permanent" && (
          <p className="text-[11px] text-emerald-400 mb-4">Se paga solo — el mensual lo iguala recién al mes {breakEvenMonths}</p>
        )}
        {billing === "monthly" && <div className="mb-4" />}

        <ul className="space-y-2 mb-6 flex-1">
          {visible.map((benefit, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
              <Check className="h-4 w-4 flex-shrink-0 mt-0.5" style={{ color: membership.color }} />
              {benefit}
            </li>
          ))}
          {rest > 0 && <li className="text-sm text-gray-500 pl-6">+ {rest} beneficios más</li>}
        </ul>

        <Link
          href={`/tienda/membresia/${membership.id}`}
          className="tier-cta w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-semibold text-sm text-white transition-transform group-hover:scale-[1.02]"
          style={{ backgroundColor: membership.color }}
        >
          Ver plan <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      <style jsx>{`
        .tier-card:hover {
          box-shadow: 0 25px 50px -20px color-mix(in srgb, var(--card-color) 45%, transparent);
        }
      `}</style>
    </div>
  );
}
