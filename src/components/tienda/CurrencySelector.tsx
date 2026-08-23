"use client";

import Image from "next/image";
import { currencies } from "@/lib/shopData";
import type { CurrencyRate } from "@/lib/types";

const FLAG_BY_CODE: Record<string, string> = {
  USD: "usa-bandera",
  EUR: "eu-bandera",
  MXN: "mexico-bandera",
  COP: "colombia-bandera",
  ARS: "argentina-bandera",
  PEN: "peru-bandera",
  CLP: "chile-bandera",
};

interface CurrencySelectorProps {
  value: CurrencyRate;
  onChange: (currency: CurrencyRate) => void;
  className?: string;
}

/** Selector de moneda con banderas — antes copiado y pegado en tienda/page.tsx, kit/[id] y membresia/[id]. */
export default function CurrencySelector({ value, onChange, className }: CurrencySelectorProps) {
  return (
    <div className={`flex flex-wrap gap-2 ${className || ""}`}>
      {currencies.map((currency) => (
        <button
          key={currency.code}
          type="button"
          onClick={() => onChange(currency)}
          className={`flex items-center gap-1 px-3 py-1 rounded-lg border-2 transition-all text-xs ${
            value.code === currency.code
              ? "border-[#8e00f7] bg-[#8e00f7]/10"
              : "border-[#1a1a28] bg-[#12121c] hover:border-[#3a3a4a]"
          }`}
        >
          <div className="w-5 h-3 rounded-sm overflow-hidden flex-shrink-0">
            <Image
              src={`/banderas/${FLAG_BY_CODE[currency.code] || "usa-bandera"}.png`}
              alt={currency.name}
              width={20}
              height={12}
              className="object-cover"
            />
          </div>
          <span>{currency.code}</span>
        </button>
      ))}
    </div>
  );
}
