"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

function HandlerContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkPaymentStatus = async () => {
      try {
        const transactionId = searchParams.get('transaction_id');
        const reference = searchParams.get('reference');
        const status = searchParams.get('status');
        const error = searchParams.get('error');
        const paymentStatus = searchParams.get('payment_status');
        const resultCode = searchParams.get('result_code');
        const errorMessage = searchParams.get('error_message');
        
        console.log('Handler - All URL parameters:', { 
          transactionId, 
          reference, 
          status, 
          error, 
          paymentStatus, 
          resultCode, 
          errorMessage 
        });

        const isCancelled = (
          status === 'cancelled' || 
          error === 'cancelled' || 
          status === 'error' || 
          error === 'error' ||
          paymentStatus === 'cancelled' ||
          paymentStatus === 'error' ||
          paymentStatus === 'failed' ||
          resultCode === 'CANCELED' ||
          resultCode === 'ERROR' ||
          errorMessage?.toLowerCase().includes('cancel') ||
          errorMessage?.toLowerCase().includes('error')
        );
        
        if (isCancelled) {
          console.log('Handler - Payment cancelled/failed, redirecting to cancelled page');
          window.location.href = 'https://www.erlchub.pro/tienda/checkout/cancelled';
          return;
        }

        if (transactionId) {
          try {
            const response = await fetch(`/api/check-payment-status?transaction_id=${transactionId}`);
            const data = await response.json();
            
            console.log('Handler - Wompi API response:', data);
            
            if (data.success) {
              const transactionStatus = data.status || data.data?.status;
              const isTransactionFailed = (
                transactionStatus === 'ERROR' || 
                transactionStatus === 'CANCELLED' || 
                transactionStatus === 'DECLINED' ||
                transactionStatus === 'FAILED' ||
                transactionStatus === 'REJECTED'
              );
              
              if (isTransactionFailed) {
                console.log('Handler - Transaction failed, redirecting to cancelled. Status:', transactionStatus);
                window.location.href = 'https://www.erlchub.pro/tienda/checkout/cancelled';
                return;
              }
              
              const params = new URLSearchParams();
              if (transactionId) params.set('transaction_id', transactionId);
              if (reference) params.set('reference', reference);
              if (status) params.set('status', status);
              if (error) params.set('error', error);
              
              const successUrl = `https://www.erlchub.pro/tienda/checkout/success?${params.toString()}`;
              console.log('Handler - Redirecting to success:', successUrl);
              window.location.href = successUrl;
              return;
            }
          } catch (apiError) {
            console.error('Handler - API error:', apiError);
          }
        } else {
          window.location.href = 'https://www.erlchub.pro/tienda/checkout/cancelled';
          return;
        }

        window.location.href = 'https://www.erlchub.pro/tienda/checkout/success';
      } catch (error) {
        console.error('Handler - Error:', error);
        window.location.href = 'https://www.erlchub.pro/tienda/checkout/success';
      } finally {
        setIsLoading(false);
      }
    };

    setTimeout(checkPaymentStatus, 100);
  }, [searchParams]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0a12] pt-20">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="w-12 h-12 border-4 border-[#8e00f7] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Procesando tu pago...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a12] pt-20">
      <Navbar />
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-gray-400">Redirigiendo...</p>
      </div>
      <Footer />
    </div>
  );
}

export default function CheckoutHandlerPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a0a12] pt-20">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="w-12 h-12 border-4 border-[#8e00f7] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Cargando...</p>
        </div>
        <Footer />
      </div>
    }>
      <HandlerContent />
    </Suspense>
  );
}