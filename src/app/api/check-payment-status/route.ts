import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get('transaction_id');

    if (!transactionId) {
      return NextResponse.json({ success: false, error: 'Transaction ID required' }, { status: 400 });
    }

    const wompiResponse = await fetch(`https://production.wompi.co/v1/transactions/${transactionId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer pub_prod_A0bBsgOOfJgc719xoHaV5H01lycc8Cvr'
      }
    });

    if (!wompiResponse.ok) {
      throw new Error('Failed to fetch transaction status');
    }

    const wompiData = await wompiResponse.json();
    
    return NextResponse.json({
      success: true,
      status: wompiData.data?.status,
      transaction: wompiData.data
    });

  } catch (error) {
    console.error('Error checking payment status:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to check payment status' 
    }, { status: 500 });
  }
}