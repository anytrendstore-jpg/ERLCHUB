"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface SessionStartedHandlerProps {
  onSessionStarted: (isNewUser: boolean, username: string) => void;
}

export default function SessionStartedHandler({ onSessionStarted }: SessionStartedHandlerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const sessionStarted = searchParams.get('session') === 'started';
    if (sessionStarted) {
      // Obtener datos del usuario de la cookie
      const cookie = document.cookie.split(';').find(c => c.trim().startsWith('discord_session='));
      let username = '';
      let isNewUser = true;
      
      if (cookie) {
        try {
          const sessionData = JSON.parse(decodeURIComponent(cookie.split('=')[1]));
          username = sessionData.user?.global_name || sessionData.user?.username || '';
          
          // Verificar si es usuario recurrente (simulado - podrías usar localStorage o backend)
          const hasVisitedBefore = localStorage.getItem('hasVisitedBefore');
          isNewUser = !hasVisitedBefore;
          localStorage.setItem('hasVisitedBefore', 'true');
        } catch (error) {
          console.error('Error parsing session data:', error);
        }
      }
      
      onSessionStarted(isNewUser, username);
      
      // Redirigir al inicio después de 3 segundos
      const timer = setTimeout(() => {
        router.push('/');
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [searchParams, router, onSessionStarted]);

  return null;
}
