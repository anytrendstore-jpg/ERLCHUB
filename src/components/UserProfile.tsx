"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { User, LogOut, Gift, ChevronDown, ChevronUp, Package, ShoppingCart, Percent, ShieldCheck, LayoutDashboard } from "lucide-react";
import { useDiscordAuth } from "@/hooks/useDiscordAuth";
import { useHubCoins } from "@/hooks/useHubCoins";
import { useWhitelistStatus } from "@/hooks/useWhitelistStatus";

export default function UserProfile() {
  const { user, guilds, clearSession } = useDiscordAuth();
  const { balance } = useHubCoins();
  const { isStaff } = useWhitelistStatus();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // IDs de usuarios que pueden ver el botón de descuentos
  const ALLOWED_USER_IDS = ["1166814841583960167", "917085596189593631"];
  const canSeeDiscounts = user?.id && ALLOWED_USER_IDS.includes(user.id);

  // Obtener membresía del usuario desde sus datos
  const userMembership = user?.membership?.name || null; 

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      clearSession();
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
      clearSession();
      window.location.href = '/';
    }
  };

  if (!user) return null;

  return (
    <div className="relative">
      {/* Profile Button */}
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center gap-1.5 sm:gap-2 border border-[var(--card-border-soft)] rounded-full px-2.5 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-all duration-200 hover:bg-[var(--card-bg-2)] hover:border-[#8e00f7]"
        style={{ background: "color-mix(in srgb, var(--card-bg) 80%, transparent)" }}
      >
        {user.avatar && (
          <img
            src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=32`}
            alt={user.username}
            className="w-5 h-5 sm:w-6 sm:h-6 rounded-full"
          />
        )}
        <span className="text-[var(--text-muted)] hidden sm:block">{user.global_name || user.username}</span>
        {isDropdownOpen ? (
          <ChevronUp className="h-3 w-3 sm:h-4 sm:w-4 text-[var(--text-muted)]" />
        ) : (
          <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 text-[var(--text-muted)]" />
        )}
      </button>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-56 sm:w-64 bg-[var(--card-bg)] border border-[var(--card-border-soft)] rounded-xl shadow-xl z-50 overflow-hidden">
          {/* User Info */}
          <div className="p-3 sm:p-4 border-b border-[var(--card-border-soft)]">
            <div className="flex items-center gap-2 sm:gap-3">
              {user.avatar && (
                <img
                  src={`https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=64`}
                  alt={user.username}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full"
                />
              )}
              <div className="min-w-0 flex-1">
                <div className="text-[var(--foreground)] font-medium text-sm sm:text-base truncate">{user.global_name || user.username}</div>
                <div className="text-[var(--text-muted)] text-xs sm:text-sm truncate">@{user.username}</div>
              </div>
            </div>
          </div>

          {/* Hub Coins */}
          <div className="p-3 sm:p-4 border-b border-[var(--card-border-soft)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Image
                  src="/hub-coins.png"
                  alt="Hub Coins"
                  width={20}
                  height={20}
                  className="w-4 h-4 sm:w-5 sm:h-5"
                />
                <span className="text-[var(--text-muted)] text-xs sm:text-sm">Hub Coins:</span>
              </div>
              <span className="text-[#fbbf24] font-bold text-sm sm:text-base">{balance.toLocaleString()}</span>
            </div>
          </div>

          {/* Membership */}
          <div className="p-3 sm:p-4 border-b border-[var(--card-border-soft)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gift className="h-4 w-4 sm:h-5 sm:w-5 text-[#8e00f7]" />
                <span className="text-[var(--text-muted)] text-xs sm:text-sm">MEMBRESÍA:</span>
              </div>
              {userMembership ? (
                <span className="text-[#8e00f7] font-bold text-sm sm:text-base">{userMembership}</span>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-2 gap-1">
                  <span className="text-[var(--text-muted)] text-xs sm:text-sm">Ninguna</span>
                </div>
              )}
            </div>
          </div>

          {/* Menu Items */}
          <div className="p-2">
            {isStaff && (
              <Link
                href="/staff"
                className="flex items-center gap-2 sm:gap-3 w-full px-2 sm:px-3 py-2 mb-1 text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition-all duration-200 ring-1 ring-blue-500/30"
                onClick={() => setIsDropdownOpen(false)}
              >
                <ShieldCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm font-semibold">Panel de Staff</span>
              </Link>
            )}

            <Link
              href="/dashboard"
              className="flex items-center gap-2 sm:gap-3 w-full px-2 sm:px-3 py-2 text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-bg-2)] rounded-lg transition-all duration-200"
              onClick={() => setIsDropdownOpen(false)}
            >
              <LayoutDashboard className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="text-xs sm:text-sm">Mi Dashboard</span>
            </Link>

            <Link
              href="/perfil"
              className="flex items-center gap-2 sm:gap-3 w-full px-2 sm:px-3 py-2 text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-bg-2)] rounded-lg transition-all duration-200"
              onClick={() => setIsDropdownOpen(false)}
            >
              <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="text-xs sm:text-sm">Mi Perfil</span>
            </Link>
            
            <Link
              href="/pedidos"
              className="flex items-center gap-2 sm:gap-3 w-full px-2 sm:px-3 py-2 text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-bg-2)] rounded-lg transition-all duration-200"
              onClick={() => setIsDropdownOpen(false)}
            >
              <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="text-xs sm:text-sm">Mis Pedidos</span>
            </Link>
            
                        
            <Link
              href="/tienda/hub-coins"
              className="flex items-center gap-2 sm:gap-3 w-full px-2 sm:px-3 py-2 text-[var(--text-muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-bg-2)] rounded-lg transition-all duration-200"
              onClick={() => setIsDropdownOpen(false)}
            >
              <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="text-xs sm:text-sm">Comprar Hub Coins</span>
            </Link>
            
            {canSeeDiscounts && (
              <Link
                href="/descuentos"
                className="flex items-center gap-2 sm:gap-3 w-full px-2 sm:px-3 py-2 text-[#fbbf24] hover:text-[#fbbf24]/80 hover:bg-[#fbbf24]/10 rounded-lg transition-all duration-200"
                onClick={() => setIsDropdownOpen(false)}
              >
                <Percent className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm font-medium">Gestión de Descuentos</span>
              </Link>
            )}

            <div className="border-t border-[var(--card-border-soft)] my-2"></div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-2 sm:gap-3 w-full px-2 sm:px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-all duration-200"
            >
              <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="text-xs sm:text-sm">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      )}

      {/* Overlay */}
      {isDropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </div>
  );
}
