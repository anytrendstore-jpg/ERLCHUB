"use client";

import { useEffect, useState } from "react";
import { currencies as staticCurrencies } from "@/lib/shopData";
import type { CurrencyRate } from "@/lib/types";

/**
 * Mismo array de monedas de shopData.ts (código/nombre/símbolo/bandera — eso no cambia) pero
 * con `rateToUSD` actualizado con el tipo de cambio real del día (GET /api/exchange-rates,
 * que a su vez consulta open.er-api.com). Mientras carga, o si la consulta falla, se muestran
 * los valores de referencia estáticos — nunca se rompe la UI por esto.
 */
export function useExchangeRates() {
  const [currencies, setCurrencies] = useState<CurrencyRate[]>(staticCurrencies);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/exchange-rates")
      .then((r) => r.json())
      .then((data) => {
        if (!data.success) return;
        setCurrencies(staticCurrencies.map((c) => ({ ...c, rateToUSD: data.rates[c.code] ?? c.rateToUSD })));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { currencies, loading };
}
