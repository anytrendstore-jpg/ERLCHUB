/**
 * Tasas de cambio reales (USD como base) — reemplaza los valores fijos hardcodeados que había
 * antes tanto en la UI (`shopData.ts`'s `currencies[].rateToUSD`) como en el cálculo real del
 * monto cobrado en Wompi (`USD_TO_COP = 4000` fijo en los endpoints de checkout). Fuente:
 * open.er-api.com, gratuita, sin API key, actualiza 1 vez al día — se cachea en memoria del
 * proceso por 1 hora para no golpearla en cada checkout.
 */

interface CachedRates {
  rates: Record<string, number>;
  fetchedAt: number;
}

let cache: CachedRates | null = null;
const CACHE_TTL_MS = 60 * 60 * 1000;

/** Valores de referencia SOLO por si la API externa está caída — no se actualizan a mano, es la única red de seguridad. */
const FALLBACK_RATES: Record<string, number> = {
  USD: 1, EUR: 0.92, MXN: 17.15, COP: 3950, ARS: 875, PEN: 3.72, CLP: 940,
};

async function fetchRates(): Promise<Record<string, number>> {
  const res = await fetch('https://open.er-api.com/v6/latest/USD', { signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (json.result !== 'success' || !json.rates) throw new Error('Respuesta inesperada de open.er-api.com');
  return json.rates;
}

export async function getExchangeRates(): Promise<{ rates: Record<string, number>; source: 'live' | 'fallback'; updatedAt: number }> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return { rates: cache.rates, source: 'live', updatedAt: cache.fetchedAt };
  }
  try {
    const rates = await fetchRates();
    cache = { rates, fetchedAt: Date.now() };
    return { rates, source: 'live', updatedAt: cache.fetchedAt };
  } catch (error) {
    console.error('No se pudo consultar el tipo de cambio real, usando valores de referencia:', error);
    return { rates: FALLBACK_RATES, source: 'fallback', updatedAt: Date.now() };
  }
}

/** Tasa USD -> COP real, para calcular el monto exacto que se cobra en Wompi (que solo acepta COP). */
export async function getUsdToCopRate(): Promise<number> {
  const { rates } = await getExchangeRates();
  return rates.COP || FALLBACK_RATES.COP;
}
