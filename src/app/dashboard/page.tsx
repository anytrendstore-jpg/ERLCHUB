'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle } from 'lucide-react';
import { useDiscordAuth } from '@/hooks/useDiscordAuth';
import OSDesktop from '@/components/os/OSDesktop';

/**
 * Escritorio del usuario (ERLC HUB OS).
 *
 * Entra aquí quien ha iniciado sesión con Discord y quien acaba de terminar la
 * whitelist. Si no hay ninguna de las dos cosas, se manda a iniciar sesión.
 */
export default function DashboardPage() {
  const router = useRouter();
  const { session, isLoading, isAuthenticated, user } = useDiscordAuth();

  const [whitelistLoading, setWhitelistLoading] = useState(true);
  const [whitelistApplication, setWhitelistApplication] = useState<any>(null);

  useEffect(() => {
    fetch('/api/whitelist/application', { cache: 'no-store' })
      .then(res => (res.ok ? res.json() : null))
      .then(data => setWhitelistApplication(data?.success ? data.application : null))
      .catch(() => setWhitelistApplication(null))
      .finally(() => setWhitelistLoading(false));
  }, []);

  const loading = isLoading || whitelistLoading;
  const hasAccess = isAuthenticated || Boolean(whitelistApplication);

  useEffect(() => {
    if (!loading && !hasAccess) {
      const timer = setTimeout(() => router.push('/whitelist'), 4000);
      return () => clearTimeout(timer);
    }
  }, [loading, hasAccess, router]);

  /**
   * El escritorio espera un avatar como URL; la sesión de Discord guarda solo
   * el hash. Si el usuario llega desde la whitelist (sin sesión de Discord del
   * sitio), se construye el perfil con los datos de su solicitud.
   */
  const osSession = useMemo(() => {
    const roblox = whitelistApplication?.roblox;
    const character = whitelistApplication?.character;
    const characterName = character ? `${character.firstName} ${character.lastName}` : undefined;
    const robloxExtras = {
      robloxId: roblox?.id,
      robloxUsername: roblox?.verified ? roblox.username : undefined,
      robloxVerified: Boolean(roblox?.verified),
      dni: whitelistApplication?.document?.number,
    };

    if (isAuthenticated && user) {
      const discordAvatar = user.avatar
        ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=128`
        : `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`;

      return {
        user: {
          ...user,
          global_name: characterName || user.global_name || user.username,
          avatar: roblox?.verified && roblox.avatar ? roblox.avatar : discordAvatar,
          ...robloxExtras,
        },
      };
    }

    if (whitelistApplication) {
      const discord = whitelistApplication.discord;
      const discordAvatar = discord.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${discord.username}`;
      return {
        user: {
          id: discord.id,
          username: discord.username,
          global_name: characterName || discord.globalName || discord.username,
          avatar: roblox?.verified && roblox.avatar ? roblox.avatar : discordAvatar,
          email: whitelistApplication.email,
          ...robloxExtras,
        },
      };
    }

    return undefined;
  }, [isAuthenticated, user, whitelistApplication]);

  if (loading) {
    return (
      <main className="w-screen h-screen overflow-hidden bg-[var(--background)] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#8e00f7] mx-auto mb-4" />
          <p className="text-[var(--text-muted)]">Preparando tu escritorio...</p>
        </div>
      </main>
    );
  }

  if (!hasAccess) {
    return (
      <main className="w-screen h-screen overflow-hidden bg-[var(--background)] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="h-14 w-14 text-amber-500 mx-auto mb-4" />
          <h2 className="text-[var(--foreground)] text-xl font-bold mb-2">Necesitas una cuenta</h2>
          <p className="text-[var(--text-muted)] mb-6">
            Inicia sesión con Discord o completa la whitelist para entrar a tu escritorio.
          </p>
          <button
            onClick={() => router.push('/whitelist')}
            className="bg-[#8e00f7] hover:bg-[#a64dfa] text-white px-6 py-2.5 rounded-lg transition-colors"
          >
            Ir a la whitelist
          </button>
        </div>
      </main>
    );
  }

  return <OSDesktop discordSession={osSession} />;
}
