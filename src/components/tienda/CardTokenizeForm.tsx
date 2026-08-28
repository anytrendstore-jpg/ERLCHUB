"use client";

import { useState } from "react";
import { CreditCard, Loader2, Lock } from "lucide-react";

interface CardTokenizeFormProps {
  onTokenized: (cardToken: string) => void;
  submitLabel?: string;
}

/**
 * Formulario de tarjeta que tokeniza DIRECTO contra Wompi (POST /v1/tokens/cards, con la
 * public key) desde el navegador — nunca manda estos datos a nuestro propio backend. Wompi
 * certifica este endpoint como seguro para uso client-side ("browser-safe", PCI-DSS). Solo el
 * token resultante (un string opaco, no reversible a los datos reales) sale de este componente.
 */
export default function CardTokenizeForm({ onTokenized, submitLabel = "Guardar tarjeta" }: CardTokenizeFormProps) {
  const [number, setNumber] = useState("");
  const [cvc, setCvc] = useState("");
  const [expMonth, setExpMonth] = useState("");
  const [expYear, setExpYear] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const publicKey = process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY;
    if (!publicKey) {
      setError("Pagos no configurados. Contactá a soporte.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("https://api.wompi.co/v1/tokens/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${publicKey}` },
        body: JSON.stringify({
          number: number.replace(/\s/g, ""),
          cvc,
          exp_month: expMonth,
          exp_year: expYear,
          card_holder: cardHolder,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.data?.id) {
        throw new Error(data?.error?.messages ? JSON.stringify(data.error.messages) : "No se pudo validar la tarjeta");
      }
      onTokenized(data.data.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error tokenizando la tarjeta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex items-center gap-2 text-[var(--text-muted)] text-xs mb-1">
        <Lock className="h-3.5 w-3.5" />
        Tu tarjeta se procesa directo con Wompi — nunca pasa por nuestros servidores.
      </div>

      <div>
        <label className="text-xs text-[var(--text-muted)] block mb-1">Número de tarjeta</label>
        <input
          required
          inputMode="numeric"
          maxLength={19}
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          placeholder="4242 4242 4242 4242"
          className="w-full px-3 py-2 bg-[var(--card-bg-2)] border border-[#2a2a3a] rounded-lg text-[var(--foreground)] text-sm focus:outline-none focus:border-[#8e00f7]"
        />
      </div>

      <div>
        <label className="text-xs text-[var(--text-muted)] block mb-1">Titular</label>
        <input
          required
          value={cardHolder}
          onChange={(e) => setCardHolder(e.target.value)}
          placeholder="Como aparece en la tarjeta"
          className="w-full px-3 py-2 bg-[var(--card-bg-2)] border border-[#2a2a3a] rounded-lg text-[var(--foreground)] text-sm focus:outline-none focus:border-[#8e00f7]"
        />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-xs text-[var(--text-muted)] block mb-1">Mes</label>
          <input required inputMode="numeric" maxLength={2} value={expMonth} onChange={(e) => setExpMonth(e.target.value)} placeholder="MM"
            className="w-full px-3 py-2 bg-[var(--card-bg-2)] border border-[#2a2a3a] rounded-lg text-[var(--foreground)] text-sm focus:outline-none focus:border-[#8e00f7]" />
        </div>
        <div>
          <label className="text-xs text-[var(--text-muted)] block mb-1">Año</label>
          <input required inputMode="numeric" maxLength={2} value={expYear} onChange={(e) => setExpYear(e.target.value)} placeholder="AA"
            className="w-full px-3 py-2 bg-[var(--card-bg-2)] border border-[#2a2a3a] rounded-lg text-[var(--foreground)] text-sm focus:outline-none focus:border-[#8e00f7]" />
        </div>
        <div>
          <label className="text-xs text-[var(--text-muted)] block mb-1">CVC</label>
          <input required inputMode="numeric" maxLength={4} value={cvc} onChange={(e) => setCvc(e.target.value)} placeholder="123"
            className="w-full px-3 py-2 bg-[var(--card-bg-2)] border border-[#2a2a3a] rounded-lg text-[var(--foreground)] text-sm focus:outline-none focus:border-[#8e00f7]" />
        </div>
      </div>

      {error && <p className="text-red-400 text-xs">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-[#8e00f7] hover:bg-[#7a00d4] disabled:bg-gray-600 text-white font-semibold py-2.5 rounded-lg transition-colors"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
        {loading ? "Validando..." : submitLabel}
      </button>
    </form>
  );
}
