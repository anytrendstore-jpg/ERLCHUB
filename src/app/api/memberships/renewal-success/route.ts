import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const membershipId = searchParams.get('membershipId');
    const transactionId = searchParams.get('transaction_id');
    const status = searchParams.get('status');

    if (!userId || !membershipId) {
      return NextResponse.redirect('https://www.erlchub.pro/tienda/membresia?error=missing_params');
    }

    const db = await connectToDatabase();
    const subscription = await db.collection('membership_subscriptions')
      .findOne({ userId, membershipId });

    if (!subscription) {
      return NextResponse.redirect('https://www.erlchub.pro/tienda/membresia?error=subscription_not_found');
    }

    if (status === 'approved' || !status) {
      const now = new Date();
      const newEndDate = subscription.membershipType === 'monthly'
        ? new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
        : null;
      
      const newNextPaymentDate = subscription.membershipType === 'monthly'
        ? new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
        : null;

      await db.collection('membership_subscriptions').updateOne(
        { userId, membershipId },
        {
          $set: {
            status: 'active',
            startDate: now,
            endDate: newEndDate,
            lastPaymentDate: now,
            nextPaymentDate: newNextPaymentDate,
            transactionId,
            reminderSent: false
          }
        }
      );

      await db.collection('users').updateOne(
        { discordId: userId },
        {
          $set: {
            'membership.status': 'active',
            'membership.startDate': now,
            'membership.endDate': newEndDate
          }
        }
      );

      try {
        await fetch(`${process.env.NEXT_PUBLIC_URL}/api/discord-bot/deliver-membership`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            membershipId,
            membershipName: subscription.membershipName,
            membershipType: subscription.membershipType,
            membershipPrice: subscription.renewalPrice,
            serverId: subscription.serverId,
            transactionId,
            benefits: subscription.benefits,
            roleIds: subscription.roleIds
          })
        });
      } catch (discordError) {
        console.error('Error reactivando membresía en Discord:', discordError);
      }

      const successUrl = `https://www.erlchub.pro/tienda/membresia/renovacion-exitosa?membership=${membershipId}&userId=${userId}`;
      return NextResponse.redirect(successUrl);
    } else {
      return NextResponse.redirect(`https://www.erlchub.pro/tienda/membresia?error=payment_failed&userId=${userId}&membership=${membershipId}`);
    }

  } catch (error) {
    console.error('Error en renovación de membresía:', error);
    return NextResponse.redirect('https://www.erlchub.pro/tienda/membresia?error=internal_error');
  }
}