/**
 * API Route: /api/train-details
 * Returns UNIFIED train data with all intelligence features
 *
 * Response: UnifiedTrainResponse (canonical format)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUnifiedTrainData } from '@/services/trainOrchestratorService';

export async function GET(request: NextRequest) {
  const trainNumber = request.nextUrl.searchParams.get('trainNumber');

  try {
    if (!trainNumber) {
      return NextResponse.json(
        { error: 'Train number is required' },
        { status: 400 }
      );
    }

    // Fetch unified data
    const unifiedData = await getUnifiedTrainData(trainNumber);

    if (!unifiedData) {
      return NextResponse.json(
        { error: `Train ${trainNumber} not found` },
        { status: 404 }
      );
    }

    const response = NextResponse.json(unifiedData);

    // Set cache headers
    response.headers.set('Cache-Control', 'public, max-age=30');

    return response;
  } catch (error: any) {
    console.error('[API] /train-details error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch train details' },
      { status: 500 }
    );
  }
}
