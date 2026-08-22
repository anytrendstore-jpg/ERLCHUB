"use client";

import { useState, useEffect } from 'react';

interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string;
  email?: string;
  global_name?: string;
  membership?: {
    id: string;
    name: string;
    type: 'monthly' | 'permanent';
    purchasedAt: string;
    expiresAt: string | null;
  };
}

interface DiscordGuild {
  id: string;
  name: string;
  icon: string;
  owner: boolean;
  permissions: string;
  features: string[];
}

interface DiscordSession {
  user: DiscordUser;
  guilds: DiscordGuild[];
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export function useDiscordAuth() {
  const [session, setSession] = useState<DiscordSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = () => {
    console.log('=== checkSession iniciado ===');
    console.log('URL actual:', window.location.href);
    console.log('Document.cookie completa:', document.cookie);
    
    try {
      const cookies = document.cookie.split('; ');
      
      const sessionCookie = cookies.find(row => row.startsWith('discord_session='));
      
      if (sessionCookie) {
        const cookieValue = sessionCookie.split('=')[1];
        
        if (cookieValue) {
          try {
            const sessionData = JSON.parse(decodeURIComponent(cookieValue));
            
            if (sessionData && sessionData.accessToken && sessionData.user) {
              setSession(sessionData);
              setError(null);
            } else {
              clearSession();
            }
          } catch (parseError) {
            clearSession();
          }
        } else {
          clearSession();
        }
      } else {
        setError(null);
      }
    } catch (error) {
      console.error('❌ Error checking Discord session:', error);
      setError('Failed to check session');
      clearSession();
    } finally {
      setIsLoading(false);
    }
  };

  const clearSession = () => {
    document.cookie = 'discord_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    setSession(null);
    setError(null);
  };

  const refreshAccessToken = async () => {
    if (!session?.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refreshToken: session.refreshToken,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const newTokenData = await response.json();
      
      const updatedSession = {
        ...session,
        accessToken: newTokenData.access_token,
        refreshToken: newTokenData.refresh_token || session.refreshToken,
        expiresIn: newTokenData.expires_in,
        tokenType: newTokenData.token_type,
      };

      setSession(updatedSession);
      
      document.cookie = `discord_session=${encodeURIComponent(JSON.stringify(updatedSession))}; max-age=${newTokenData.expires_in || 604800}; path=/;`;

      return updatedSession;
    } catch (error) {
      console.error('Error refreshing token:', error);
      clearSession();
      throw error;
    }
  };

  const getDiscordAvatar = (user: DiscordUser, size = 64) => {
    if (user.avatar) {
      return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=${size}`;
    }
    const defaultAvatarIndex = parseInt(user.discriminator) % 5;
    return `https://cdn.discordapp.com/embed/avatars/${defaultAvatarIndex}.png?size=${size}`;
  };

  const getGuildIcon = (guild: DiscordGuild, size = 64) => {
    if (guild.icon) {
      return `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=${size}`;
    }
    return `https://cdn.discordapp.com/embed/avatars/0.png?size=${size}`;
  };

  return {
    session,
    isLoading,
    error,
    isAuthenticated: !!session,
    user: session?.user,
    guilds: session?.guilds || [],
    clearSession,
    refreshAccessToken,
    checkSession,
    getDiscordAvatar,
    getGuildIcon,
  };
}