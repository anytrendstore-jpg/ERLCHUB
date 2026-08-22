"use client";

import { useState, useEffect } from 'react';

interface RobloxUser {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  email?: string;
  platform: 'roblox';
}

interface RobloxSession {
  user: RobloxUser;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export function useRobloxAuth() {
  const [session, setSession] = useState<RobloxSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = () => {
    try {
      const sessionCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('roblox_session='))
        ?.split('=')[1];

      if (sessionCookie) {
        const sessionData = JSON.parse(decodeURIComponent(sessionCookie));
        
        if (sessionData.expiresIn) {
          const expirationTime = Date.now() + (sessionData.expiresIn * 1000);
          if (Date.now() < expirationTime) {
            setSession(sessionData);
          } else {
            clearSession();
          }
        }
      }
    } catch (error) {
      console.error('Error checking Roblox session:', error);
      setError('Failed to check session');
    } finally {
      setIsLoading(false);
    }
  };

  const clearSession = () => {
    document.cookie = 'roblox_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    setSession(null);
    setError(null);
  };

  const getRobloxAvatar = (user: RobloxUser, size = 64) => {
    if (user.avatar) {
      return user.avatar;
    }
    return `https://www.roblox.com/headshot-thumbnail/image?userId=${user.id}&width=${size}&height=${size}&format=png`;
  };

  return {
    session,
    isLoading,
    error,
    isAuthenticated: !!session,
    user: session?.user,
    clearSession,
    checkSession,
    getRobloxAvatar,
  };
}