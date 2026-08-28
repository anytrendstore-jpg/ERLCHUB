import crypto from 'crypto';

/**
 * Cliente server-to-server de la API de Wompi Colombia para Payment Sources (tarjetas
 * tokenizadas) — la pieza que permite cobrar la renovación mensual de una membresía sin que
 * el usuario esté presente. La tokenización de la tarjeta en sí (POST /v1/tokens/cards) NO
 * vive acá — esa parte corre en el navegador del usuario (ver CardTokenizeForm.tsx) porque
 * Wompi la certifica como "browser-safe": este servidor nunca ve un número de tarjeta.
 *
 * Todo lo de acá usa la PRIVATE KEY — nunca se importa desde un componente cliente.
 */

const WOMPI_API_BASE = 'https://api.wompi.co/v1';
const PUBLIC_KEY = process.env.WOMPI_PUBLIC_KEY;
const PRIVATE_KEY = process.env.WOMPI_PRIVATE_KEY;
const INTEGRITY_KEY = process.env.WOMPI_INTEGRITY_KEY;

function assertConfigured() {
  if (!PUBLIC_KEY || !PRIVATE_KEY || !INTEGRITY_KEY) {
    throw new Error('Wompi no está configurado (faltan WOMPI_PUBLIC_KEY / WOMPI_PRIVATE_KEY / WOMPI_INTEGRITY_KEY)');
  }
}

/** GET /v1/merchants/{public_key} — tokens de aceptación obligatorios para crear un Payment Source. */
async function getAcceptanceTokens(): Promise<{ acceptanceToken: string; personalAuthToken: string }> {
  assertConfigured();
  const res = await fetch(`${WOMPI_API_BASE}/merchants/${PUBLIC_KEY}`);
  if (!res.ok) throw new Error(`No se pudo consultar el comercio en Wompi (HTTP ${res.status})`);
  const json = await res.json();
  const acceptanceToken = json?.data?.presigned_acceptance?.acceptance_token;
  const personalAuthToken = json?.data?.presigned_personal_data_auth?.acceptance_token;
  if (!acceptanceToken || !personalAuthToken) throw new Error('Wompi no devolvió los tokens de aceptación esperados');
  return { acceptanceToken, personalAuthToken };
}

/**
 * POST /v1/payment_sources — convierte un card_token (de un solo uso, ya obtenido en el
 * navegador) en un payment_source_id reutilizable para cobros futuros. Requiere la private key.
 */
export async function createPaymentSource(input: { cardToken: string; customerEmail: string }): Promise<{ id: number; status: string }> {
  assertConfigured();
  const { acceptanceToken, personalAuthToken } = await getAcceptanceTokens();

  const res = await fetch(`${WOMPI_API_BASE}/payment_sources`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${PRIVATE_KEY}` },
    body: JSON.stringify({
      type: 'CARD',
      token: input.cardToken,
      customer_email: input.customerEmail,
      acceptance_token: acceptanceToken,
      accept_personal_auth: personalAuthToken,
    }),
  });

  const json = await res.json();
  if (!res.ok || !json?.data?.id) {
    throw new Error(json?.error?.messages ? JSON.stringify(json.error.messages) : `No se pudo guardar el método de pago (HTTP ${res.status})`);
  }
  return { id: json.data.id, status: json.data.status };
}

function signTransaction(reference: string, amountInCents: number, currency: string): string {
  assertConfigured();
  return crypto.createHash('sha256').update(`${reference}${amountInCents}${currency}${INTEGRITY_KEY}`).digest('hex');
}

/**
 * POST /v1/transactions con payment_source_id — cobra sin que el usuario esté presente. El
 * resultado real (aprobado/rechazado) llega de forma asíncrona por el webhook de Wompi
 * (src/app/api/wompi/events/route.ts), igual que cualquier otro pago — esta función solo
 * confirma que Wompi aceptó CREAR el intento de cobro.
 */
export async function chargePaymentSource(input: {
  paymentSourceId: number;
  amountInCents: number;
  reference: string;
  customerEmail: string;
}): Promise<{ id: string; status: string }> {
  assertConfigured();
  const signature = signTransaction(input.reference, input.amountInCents, 'COP');

  const res = await fetch(`${WOMPI_API_BASE}/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${PRIVATE_KEY}` },
    body: JSON.stringify({
      amount_in_cents: input.amountInCents,
      currency: 'COP',
      customer_email: input.customerEmail,
      reference: input.reference,
      payment_source_id: input.paymentSourceId,
      payment_method: { installments: 1 },
      signature,
    }),
  });

  const json = await res.json();
  if (!res.ok || !json?.data?.id) {
    throw new Error(json?.error?.messages ? JSON.stringify(json.error.messages) : `No se pudo iniciar el cobro (HTTP ${res.status})`);
  }
  return { id: json.data.id, status: json.data.status };
}
