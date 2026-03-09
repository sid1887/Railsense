/**
 * Analytics API Route
 * Returns system metrics and monitoring data
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMetrics } from '@/services/analyticsService';

export async function GET(request: NextRequest) {
  try {
    const metrics = getMetrics();

    return NextResponse.json(metrics, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('[Analytics API] Error:', error);

    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}
