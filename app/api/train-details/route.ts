/**
 * API Route: /api/train-details
 * Returns complete train insight data
 * Used by train detail page to fetch all analysis
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCompleteTrainInsight } from '@/services/orchestrator';

export async function GET(request: NextRequest) {
  // Get train number from query params - OUTSIDE try block for error handling
  const trainNumber = request.nextUrl.searchParams.get('trainNumber');

  try {
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

    // Provide helpful error messages
    let statusCode = 404;
    let errorMessage = error.message || 'Train not found';

    if (error.message && error.message.includes('not found')) {
      errorMessage = `Train ${trainNumber} not found. The train either doesn't exist in Indian Railways or is not currently trackable. Please verify the train number and try again.`;
    } else if (error.message && error.message.includes('required')) {
      statusCode = 400;
      errorMessage = 'Train number is required';
    }

    return NextResponse.json(
      {
        error: errorMessage,
        trainNumber: trainNumber,
        suggestion: 'Try valid Indian Railways train numbers like 12955, 12728, 17015, 12702, or 11039'
      },
      { status: statusCode }
    );
  }
}
