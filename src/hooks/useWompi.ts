import { useState, useCallback } from "react";

interface WompiPaymentLink {
  id: string;
  url: string;
  status: string;
  amount_in_cents: number;
  currency: string;
  created_at: string;
}

interface WompiResponse {
  success: boolean;
  payment_link?: any;
  checkout_url?: string;
  error?: string;
  details?: any;
}

interface WompiTransaction {
  id: string;
  status: string;
}

export function useWompi() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generatePaymentReference = useCallback((paymentData: {
    name: string;
    description: string;
    amount: number;
    currency: string;
  }) => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `ERLC_${timestamp}_${random}`;
  }, []);

  const convertToCents = useCallback((amount: number, currency: string) => {
    const EXCHANGE_RATES = {
      USD: 4000,   
      EUR: 4300,  
      MXN: 235,    
      PEN: 1050,  
      ARS: 4.6, 
      CLP: 4.2,
      COP: 1 
    };

    const rate = EXCHANGE_RATES[currency] || 1;
    const amountInCOP = amount * rate;
    const amountInCents = Math.round(amountInCOP * 100);
    const montoMinimo = 150000;
    
    return amountInCents;
  }, []);

  const createPaymentSession = useCallback(async (paymentData: {
    name: string;
    description: string;
    amount: number;
    currency: string;
  }): Promise<WompiResponse> => {
    setIsLoading(true);
    setError(null);

    try {
      const paymentReference = generatePaymentReference(paymentData);
      const amountInCents = convertToCents(paymentData.amount, paymentData.currency);

      const response = await fetch("/api/wompi/create-payment-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentReference,
          amountInCents,
          currency: 'COP',
        }),
      });

      const result: WompiResponse = await response.json();

      if (!response.ok || !result.success) {
        const errorMessage = result.error || result.details?.message || "Error al crear sesión de pago";
        throw new Error(errorMessage);
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error desconocido";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const checkTransactionStatus = useCallback(async (transactionId: string): Promise<{
    success: boolean;
    transaction: WompiTransaction;
    status: string;
  }> => {
    try {
      const response = await fetch("/api/wompi/check-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ transactionId }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Error al verificar estado");
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error desconocido";
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    generatePaymentReference,
    convertToCents,
    createPaymentSession,
    checkTransactionStatus,
    isLoading,
    error,
    clearError
  };
}