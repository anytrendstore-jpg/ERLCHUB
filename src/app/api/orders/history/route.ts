import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'User ID requerido' 
      }, { status: 400 });
    }

    const db = await connectToDatabase();

    const transactions = await db.collection('hubcoins_transactions')
      .find({ userId })
      .sort({ timestamp: -1 })
      .toArray();

    const memberships = await db.collection('membership_subscriptions')
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray();

    const whitelistPurchases = await db.collection('whitelist_fast_purchases')
      .find({ userId })
      .sort({ purchasedAt: -1 })
      .toArray();

    const orders = [
      ...transactions.map((transaction: any) => ({
        id: transaction._id?.toString() || `tx_${Date.now()}`,
        type: 'purchase' as const,
        description: transaction.description,
        amount: transaction.amount,
        status: transaction.status,
        createdAt: transaction.timestamp,
        items: transaction.metadata?.items || [],
        metadata: transaction.metadata,
        transactionId: transaction.metadata?.transactionId
      })),

      ...memberships.map((membership: any) => ({
        id: membership._id?.toString() || `mem_${Date.now()}`,
        type: 'membership' as const,
        description: `Membresía ${membership.membershipName} - ${membership.membershipType}`,
        amount: membership.renewalPrice || 0,
        status: membership.status,
        createdAt: membership.createdAt,
        items: membership.benefits || [],
        metadata: {
          membershipId: membership.membershipId,
          membershipType: membership.membershipType,
          membershipName: membership.membershipName,
          benefits: membership.benefits
        },
        transactionId: membership.transactionId
      })),

      ...whitelistPurchases.map((purchase: any) => ({
        id: purchase._id?.toString() || `wf_${Date.now()}`,
        type: 'whitelist_fast' as const,
        description: `Whitelist Fast - ${purchase.selectedServer}`,
        amount: purchase.amount,
        status: purchase.status,
        createdAt: purchase.purchasedAt,
        items: purchase.items || [],
        metadata: {
          kitName: purchase.kitName,
          selectedServer: purchase.selectedServer,
          items: purchase.items
        },
        transactionId: purchase.transactionId
      }))
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({
      success: true,
      orders,
      summary: {
        totalOrders: orders.length,
        completedOrders: orders.filter(o => o.status === 'completed').length,
        pendingOrders: orders.filter(o => o.status === 'pending').length,
        cancelledOrders: orders.filter(o => o.status === 'cancelled' || o.status === 'failed').length,
        totalSpent: orders
          .filter(o => o.status === 'completed')
          .reduce((sum, o) => sum + o.amount, 0)
      }
    });

  } catch (error) {
    console.error('Error obteniendo historial de pedidos:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Error interno del servidor' 
    }, { status: 500 });
  }
}