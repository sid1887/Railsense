/**
 * API Route: /api/train-details
 * Returns complete train insight data
 * Used by train detail page to fetch all analysis
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCompleteTrainInsight } from '@/services/orchestrator';

export async function GET(request: NextRequest) {
  try {
    // Get train number from query params
    const trainNumber = request.nextUrl.searchParams.get('trainNumber');

    if (!trainNumber) {
      return NextResponse.json(
        { error: 'Train number is required' },
        { status: 400 }
      );
    }

    // Fetch complete insight
    const insightData = await getCompleteTrainInsight(trainNumber);

    // Set cache headers for 30 seconds (data updates frequently)
    const response = NextResponse.json(insightData);
    response.headers.set('Cache-Control', 'public, max-age=30');

    return response;
  } catch (error: any) {
    console.error('API Error - train-details:', error);

    return NextResponse.json(
      { error: error.message || 'Failed to fetch train details' },
      { status: 404 }
    );
  }
}
