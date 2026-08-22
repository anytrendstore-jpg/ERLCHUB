"use client";

import { useState, useEffect } from 'react';
import { useDiscordAuth } from './useDiscordAuth';

interface TiendaStats {
  totalOrders: number;
  hubCoinsOrders: number;
  membershipOrders: number;
  whitelistOrders: number;
  activeUsers: number;
  breakdown: {
    hubCoins: number;
    memberships: number;
    whitelist: number;
  };
}

export function useTiendaStats() {
  const [stats, setStats] = useState<TiendaStats>({
    totalOrders: 0,
    hubCoinsOrders: 0,
    membershipOrders: 0,
    whitelistOrders: 0,
    activeUsers: 0,
    breakdown: {
      hubCoins: 0,
      memberships: 0,
      whitelist: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/tienda/stats');
        const result = await response.json();
        
        if (result.success) {
          setStats(result.stats);
        } else {
          setError(result.error || 'Error obteniendo estadísticas');
        }
      } catch (err) {
        console.error('Error fetching tienda stats:', err);
        setError('Error de conexión');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, loading, error };
}