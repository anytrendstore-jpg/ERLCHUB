'use client';

import React from 'react';
import { HubPayProvider, useHubPay } from '@/contexts/HubPayContext';
import HubPayHome from './hubpay/HubPayHome';
import HubPayTransfer from './hubpay/HubPayTransfer';
import HubPayPockets from './hubpay/HubPayPockets';
import HubPayAccounts from './hubpay/HubPayAccounts';
import HubPayCards from './hubpay/HubPayCards';
import HubPayWithdraw from './hubpay/HubPayWithdraw';
import HubPayTaxes from './hubpay/HubPayTaxes';
import HubPayHistory from './hubpay/HubPayHistory';
import HubPaySidebar from './hubpay/HubPaySidebar';

function HubPayContent() {
  const { activeView } = useHubPay();

  const renderView = () => {
    switch (activeView) {
      case 'home': return <HubPayHome />;
      case 'transfer': return <HubPayTransfer />;
      case 'pockets': return <HubPayPockets />;
      case 'accounts': return <HubPayAccounts />;
      case 'cards': return <HubPayCards />;
      case 'withdraw': return <HubPayWithdraw />;
      case 'taxes': return <HubPayTaxes />;
      case 'history': return <HubPayHistory />;
      default: return <HubPayHome />;
    }
  };

  return (
    <div className="h-full flex bg-[#0a0a0f]">
      <HubPaySidebar />
      <div className="flex-1 overflow-hidden">
        {renderView()}
      </div>
    </div>
  );
}

export default function HubPayApp() {
  return (
    <HubPayProvider>
      <HubPayContent />
    </HubPayProvider>
  );
}
