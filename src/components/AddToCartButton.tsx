"use client";

import { useState } from "react";
import { ShoppingCart, Check, LogIn } from "lucide-react";
import { useDiscordAuth } from "@/hooks/useDiscordAuth";

interface AddToCartButtonProps {
  onClick: () => void;
  disabled?: boolean;
  text?: string;
  className?: string;
  children?: React.ReactNode;
  requireAuth?: boolean;
}

export default function AddToCartButton({ 
  onClick, 
  disabled = false, 
  text = "Agregar al Carrito", 
  className = "",
  children,
  requireAuth = true
}: AddToCartButtonProps) {
  const [isAdded, setIsAdded] = useState(false);
  const { isAuthenticated } = useDiscordAuth();

  const handleClick = () => {
    if (disabled) return;
    
    // Verificar autenticación si se requiere
    if (requireAuth && !isAuthenticated) {
      // Redirigir a página de inicio de sesión
      window.location.href = 'https://www.erlchub.pro/ingresar';
      return;
    }
    
    onClick();
    setIsAdded(true);
    
    // Reset after 2 seconds
    setTimeout(() => {
      setIsAdded(false);
    }, 2000);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 mb-2 ${
        disabled 
          ? "bg-gray-600 text-[var(--text-muted)] cursor-not-allowed" 
          : isAdded 
            ? "bg-green-600 hover:bg-green-700 text-white"
            : (requireAuth && !isAuthenticated)
              ? "bg-orange-600 hover:bg-orange-700 text-white"
              : "bg-[#8e00f7] hover:bg-[#a64dfa] text-white"
      } ${className}`}
    >
      {isAdded ? (
        <>
          <Check className="h-5 w-5" />
          AGREGADO EXITOSAMENTE
        </>
      ) : (requireAuth && !isAuthenticated) ? (
        <>
          <LogIn className="h-5 w-5" />
          INICIAR SESIÓN PARA COMPRAR
        </>
      ) : (
        <>
          <ShoppingCart className="h-5 w-5" />
          {children || text}
        </>
      )}
    </button>
  );
}
