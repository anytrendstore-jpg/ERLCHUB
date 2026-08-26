"use client";

import { useState } from "react";
import { Coins, Check, AlertCircle } from "lucide-react";
import { useHubCoins } from "@/hooks/useHubCoins";
import { useDiscordAuth } from "@/hooks/useDiscordAuth";

interface BuyWithHubCoinsButtonProps {
  priceInHubCoins: number;
  itemName: string;
  itemType: string;
  itemId: string;
  onSuccess?: () => void;
  className?: string;
}

export default function BuyWithHubCoinsButton({ 
  priceInHubCoins, 
  itemName, 
  itemType, 
  itemId,
  onSuccess,
  className = ""
}: BuyWithHubCoinsButtonProps) {
  const { balance, createTransaction } = useHubCoins();
  const { isAuthenticated } = useDiscordAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handlePurchase = async () => {
    if (!isAuthenticated) {
      setErrorMessage('Debes iniciar sesión para comprar');
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
      return;
    }

    if (balance < priceInHubCoins) {
      setErrorMessage(`No tienes suficientes Hub Coins. Necesitas ${priceInHubCoins - balance} más.`);
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');

    try {
      await createTransaction(
        priceInHubCoins,
        'spend',
        `Compra de ${itemType}: ${itemName}`,
        {
          itemType,
          itemId,
          itemName,
          priceInHubCoins
        }
      );

      setStatus('success');
      onSuccess?.();
      
      setTimeout(() => setStatus('idle'), 3000);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Error al procesar la compra');
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    } finally {
      setIsProcessing(false);
    }
  };

  const getButtonContent = () => {
    if (status === 'success') {
      return (
        <>
          <Check className="h-5 w-5" />
          ¡COMPRA EXITOSA!
        </>
      );
    }

    if (status === 'error') {
      return (
        <>
          <AlertCircle className="h-5 w-5" />
          ERROR
        </>
      );
    }

    if (isProcessing) {
      return (
        <>
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          PROCESANDO...
        </>
      );
    }

    return (
      <>
        <Coins className="h-5 w-5" />
        COMPRAR CON HUB COINS
      </>
    );
  };

  const getButtonClass = () => {
    const baseClass = `w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 mb-2 ${className}`;
    
    if (status === 'success') {
      return `${baseClass} bg-green-600 hover:bg-green-700 text-white`;
    }
    
    if (status === 'error') {
      return `${baseClass} bg-red-600 hover:bg-red-700 text-white`;
    }
    
    if (isProcessing) {
      return `${baseClass} bg-gray-600 text-white cursor-not-allowed`;
    }
    
    if (!isAuthenticated) {
      return `${baseClass} bg-gray-600 text-[var(--text-muted)] cursor-not-allowed`;
    }
    
    if (balance < priceInHubCoins) {
      return `${baseClass} bg-orange-600 hover:bg-orange-700 text-white`;
    }
    
    return `${baseClass} bg-[#8e00f7] hover:bg-[#a64dfa] text-white`;
  };

  return (
    <div>
      <button
        type="button"
        onClick={handlePurchase}
        disabled={isProcessing || (!isAuthenticated && balance < priceInHubCoins)}
        className={getButtonClass()}
      >
        {getButtonContent()}
      </button>
      
      {errorMessage && (
        <div className="mt-2 p-2 bg-red-500/20 border border-red-500/50 rounded-lg">
          <p className="text-red-400 text-sm">{errorMessage}</p>
        </div>
      )}
      
      {balance < priceInHubCoins && isAuthenticated && (
        <div className="mt-2 p-2 bg-orange-500/20 border border-orange-500/50 rounded-lg">
          <p className="text-orange-400 text-sm">
            Tienes {balance} Hub Coins. Necesitas {priceInHubCoins} Hub Coins.
          </p>
          <a 
            href="/tienda/hub-coins" 
            className="text-orange-300 hover:text-orange-200 underline text-sm"
          >
            Comprar más Hub Coins
          </a>
        </div>
      )}
      
      {!isAuthenticated && (
        <div className="mt-2 p-2 bg-gray-500/20 border border-gray-500/50 rounded-lg">
          <p className="text-[var(--text-muted)] text-sm">
            Debes <a href="/ingresar" className="text-[#8e00f7] hover:text-[#a64dfa] underline">iniciar sesión</a> para comprar con Hub Coins.
          </p>
        </div>
      )}
    </div>
  );
}
