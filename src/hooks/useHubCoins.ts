"use client";

import { useState, useEffect } from 'react';
import { useDiscordAuth } from './useDiscordAuth';

interface Transaction {
  _id: string;
  userId: string;
  amount: number;
  type: 'purchase' | 'spend';
  description: string;
  timestamp: string;
  status: string;
  user?: {
    username: string;
    avatar: string;
  };
}

interface HubCoinsData {
  balance: number;
  transactions: Transaction[];
  totalOrders: number;
  loading: boolean;
  error: string | null;
}

export function useHubCoins() {
  const [data, setData] = useState<HubCoinsData>({
    balance: 0,
    transactions: [],
    totalOrders: 0,
    loading: true,
    error: null
  });

  const { user } = useDiscordAuth();
  const fetchBalance = async () => {
    if (!user?.id) return;

    try {
      const response = await fetch(`/api/hub-coins?userId=${user.id}`);
      const result = await response.json();

      if (result.success && result.hubCoins !== null && result.hubCoins !== undefined) {
        setData(prev => ({ ...prev, balance: result.hubCoins }));
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  const fetchTransactions = async () => {
    if (!user?.id) return;

    try {
      const response = await fetch(`/api/hub-coins/transactions?userId=${user.id}&limit=50`);
      const result = await response.json();

      if (result.success && result.transactions && Array.isArray(result.transactions)) {
        setData(prev => ({ 
          ...prev, 
          transactions: result.transactions 
        }));
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const fetchOrders = async () => {
    if (!user?.id) return;

    try {
      const response = await fetch(`/api/hub-coins/orders?userId=${user.id}`);
      const result = await response.json();

      if (result.success && result.totalOrders !== null && result.totalOrders !== undefined) {
        setData(prev => ({ 
          ...prev, 
          totalOrders: result.totalOrders 
        }));
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const createTransaction = async (amount: number, type: 'purchase' | 'spend', description: string, metadata?: any) => {
    if (!user?.id) throw new Error('User not authenticated');

    try {
      const response = await fetch('/api/hub-coins/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          amount,
          type,
          description,
          metadata
        }),
      });

      const result = await response.json();

      if (result.success && result.newBalance !== null && result.newBalance !== undefined) {
        setData(prev => ({ 
          ...prev, 
          balance: result.newBalance,
          transactions: result.transaction ? [result.transaction, ...prev.transactions] : prev.transactions
        }));
        
        if (type === 'purchase') {
          await fetchOrders();
        }

        return result;
      } else {
        throw new Error(result.error || 'Transaction failed');
      }
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  };

  const fetchAll = async () => {
    if (!user?.id) return;

    setData(prev => ({ ...prev, loading: true, error: null }));

    try {
      await Promise.all([
        fetchBalance(),
        fetchTransactions(),
        fetchOrders()
      ]);
    } catch (error) {
      setData(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to fetch data' 
      }));
    } finally {
      setData(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchAll();
    }
  }, [user?.id]);

  return {
    ...data,
    fetchBalance,
    fetchTransactions,
    fetchOrders,
    createTransaction,
    refetch: fetchAll
  };
}