/**
 * API Route: /api/system/data-quality
 * Provides provider health and data quality diagnostics
 */

import { NextResponse } from 'next/server';
import { getProviderStats } from '@/services/providerAdapter';

export const dynamic = 'force-dynamic';

export async function GET() {
  const providers = getProviderStats();

  return NextResponse.json({
    generatedAt: Date.now(),
    providers,
    notes: [
      'Quality scores are computed per train at fetch time.',
      'Use train-details or train-stream for per-train quality flags.'
    ]
  });
}
