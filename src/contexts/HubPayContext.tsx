'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { HubPayWallet, HubPayWithdrawal } from '@/lib/osTypes';

const EMPTY_WALLET: HubPayWallet = {
  availableBalance: 0,
  hubCoinsBalance: 0,
  retainedBalance: 0,
  totalBalance: 0,
  pockets: [],
  accounts: [],
  cards: [],
  transactions: [],
  taxes: [],
};

const WALLET_POLL_MS = 8000;

interface HubPayContextType {
  wallet: HubPayWallet;
  loading: boolean;
  activeView: 'home' | 'transfer' | 'pockets' | 'accounts' | 'cards' | 'withdraw' | 'taxes' | 'history' | 'loans';

  setActiveView: (view: HubPayContextType['activeView']) => void;
  refreshWallet: () => Promise<void>;

  sendMoney: (toUser: string, amount: number, description: string) => Promise<{ success: boolean; error?: string }>;
  deposit: (amount: number) => Promise<boolean>;
  createPocket: (name: string, icon: string, color: string, goal?: number) => Promise<void>;
  moveToPocket: (pocketId: string, amount: number) => Promise<void>;
  moveFromPocket: (pocketId: string, amount: number) => Promise<void>;
  togglePocketLock: (pocketId: string) => Promise<void>;

  createCard: (color: 'blue' | 'black' | 'gradient') => Promise<void>;
  freezeCard: (cardId: string) => Promise<void>;
  deleteCard: (cardId: string) => Promise<void>;
  createAccount: (type: 'savings' | 'checking' | 'business') => Promise<void>;

  requestWithdrawal: (amount: number, method: 'bank' | 'crypto' | 'cash') => Promise<HubPayWithdrawal>;
}

const HubPayContext = createContext<HubPayContextType | undefined>(undefined);

export function HubPayProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<HubPayWallet>(EMPTY_WALLET);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<HubPayContextType['activeView']>('home');

  const refreshWallet = useCallback(async () => {
    try {
      const res = await fetch('/api/hubpay/wallet', { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        const w = data.wallet;
        setWallet({
          ...w,
          transactions: (w.transactions || []).map((t: any) => ({ ...t, timestamp: new Date(t.timestamp) })),
          accounts: (w.accounts || []).map((a: any) => ({ ...a, createdAt: new Date(a.createdAt) })),
          taxes: (w.taxes || []).map((t: any) => ({ ...t, timestamp: new Date(t.timestamp) })),
          withdrawals: (w.withdrawals || []).map((wd: any) => ({ ...wd, createdAt: new Date(wd.createdAt), completedAt: wd.completedAt ? new Date(wd.completedAt) : undefined })),
        });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshWallet();
    const interval = setInterval(refreshWallet, WALLET_POLL_MS);
    return () => clearInterval(interval);
  }, [refreshWallet]);

  const sendMoney = useCallback(async (toUser: string, amount: number, description: string): Promise<{ success: boolean; error?: string }> => {
    const res = await fetch('/api/hubpay/transfer', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toUser, amount, description }),
    });
    const data = await res.json();
    if (data.success) await refreshWallet();
    return { success: Boolean(data.success), error: data.error };
  }, [refreshWallet]);

  const deposit = useCallback(async (amount: number): Promise<boolean> => {
    const res = await fetch('/api/hubpay/deposit', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount }),
    });
    const data = await res.json();
    if (data.success) await refreshWallet();
    return Boolean(data.success);
  }, [refreshWallet]);

  const createPocket = useCallback(async (name: string, icon: string, color: string, goal?: number) => {
    await fetch('/api/hubpay/pockets', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, icon, color, goal }),
    });
    await refreshWallet();
  }, [refreshWallet]);

  const moveToPocket = useCallback(async (pocketId: string, amount: number) => {
    await fetch('/api/hubpay/pockets', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pocketId, action: 'moveTo', amount }),
    });
    await refreshWallet();
  }, [refreshWallet]);

  const moveFromPocket = useCallback(async (pocketId: string, amount: number) => {
    await fetch('/api/hubpay/pockets', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pocketId, action: 'moveFrom', amount }),
    });
    await refreshWallet();
  }, [refreshWallet]);

  const togglePocketLock = useCallback(async (pocketId: string) => {
    await fetch('/api/hubpay/pockets', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pocketId, action: 'toggleLock' }),
    });
    await refreshWallet();
  }, [refreshWallet]);

  const createCard = useCallback(async (color: 'blue' | 'black' | 'gradient') => {
    await fetch('/api/hubpay/cards', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ color }),
    });
    await refreshWallet();
  }, [refreshWallet]);

  const freezeCard = useCallback(async (cardId: string) => {
    await fetch('/api/hubpay/cards', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cardId, action: 'freeze' }),
    });
    await refreshWallet();
  }, [refreshWallet]);

  const deleteCard = useCallback(async (cardId: string) => {
    await fetch('/api/hubpay/cards', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ cardId, action: 'delete' }),
    });
    await refreshWallet();
  }, [refreshWallet]);

  const createAccount = useCallback(async (type: 'savings' | 'checking' | 'business') => {
    await fetch('/api/hubpay/accounts', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type }),
    });
    await refreshWallet();
  }, [refreshWallet]);

  const requestWithdrawal = useCallback(async (amount: number, method: 'bank' | 'crypto' | 'cash'): Promise<HubPayWithdrawal> => {
    const res = await fetch('/api/hubpay/withdraw', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount, method }),
    });
    const data = await res.json();
    await refreshWallet();
    return {
      id: data.transaction?.id || `wth_${Date.now()}`,
      amount,
      method,
      status: data.success ? 'pending' : 'failed',
      createdAt: new Date(),
    };
  }, [refreshWallet]);

  return (
    <HubPayContext.Provider value={{
      wallet,
      loading,
      activeView,
      setActiveView,
      refreshWallet,
      sendMoney,
      deposit,
      createPocket,
      moveToPocket,
      moveFromPocket,
      togglePocketLock,
      createCard,
      freezeCard,
      deleteCard,
      createAccount,
      requestWithdrawal
    }}>
      {children}
    </HubPayContext.Provider>
  );
}

export function useHubPay() {
  const context = useContext(HubPayContext);
  if (context === undefined) {
    throw new Error('useHubPay must be used within a HubPayProvider');
  }
  return context;
}
