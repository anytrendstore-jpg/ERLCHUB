import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { secret } = await request.json();
    
    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const results = await runMembershipTasks();

    return NextResponse.json({
      success: true,
      message: 'Membership cron tasks completed successfully',
      results
    });

  } catch (error) {
    console.error('Error in membership cron:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    const authHeader = request.headers.get('authorization');
    // Vercel Cron manda 'Authorization: Bearer <CRON_SECRET>' automáticamente — se acepta
    // también ?secret= como respaldo si algo externo lo dispara (mismo criterio que /api/cron/payroll).
    const ok = secret === process.env.CRON_SECRET || authHeader === `Bearer ${process.env.CRON_SECRET}`;
    if (!ok) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const results = await runMembershipTasks();

    return NextResponse.json({
      success: true,
      message: 'Membership cron tasks completed successfully',
      results
    });

  } catch (error) {
    console.error('Error in membership cron:', error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 });
  }
}

async function runMembershipTasks() {
  const results = {
    remindersSent: 0,
    membershipsExpired: 0,
    autoRenewalsAttempted: 0,
    autoRenewalsSuccessful: 0,
    errors: [] as string[]
  };

  try {
    const reminderResponse = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/memberships/reminders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'check' })
    });

    if (reminderResponse.ok) {
      const reminderData = await reminderResponse.json();
      results.remindersSent = reminderData.remindersSent?.length || 0;
    } else {
      results.errors.push('Failed to send reminders');
    }

    const expiredResponse = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/memberships/manage`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (expiredResponse.ok) {
      results.membershipsExpired = 1; 
    } else {
      results.errors.push('Failed to check expired memberships');
    }
    results.autoRenewalsAttempted = 0;
    results.autoRenewalsSuccessful = 0;

    return results;

  } catch (error) {
    console.error('Error running membership tasks:', error);
    results.errors.push(error instanceof Error ? error.message : 'Unknown error');
    return results;
  }
}