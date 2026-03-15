/**
 * API Route: /api/train-details
 * Returns complete train insight data
 * Used by train detail page to fetch all analysis
 * PHASE 4: Returns canonical response with confidence metadata
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCompleteTrainInsight } from '@/services/orchestrator';
import { buildApiResponse, SOURCE_QUALITY } from '@/services/apiResponseWrapper';

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

    // PHASE 4: Wrap response with confidence metadata
    const response = NextResponse.json(
      buildApiResponse(
        insightData,
        {
          overall: 82, // Combined confidence
          location: insightData.trainData?.currentLocation ? 85 : 60,
          delay: insightData.trainData?.delay !== undefined ? 80 : 60,
          halt: insightData.haltDetection?.halted !== undefined ? 85 : 70,
          crowdLevel: insightData.trafficAnalysis?.nearbyTrainsCount ? 75 : 50,
          sources: [
            {
              name: SOURCE_QUALITY.NTES.name,
              qualityScore: SOURCE_QUALITY.NTES.qualityScore,
              lastUpdated: Date.now(),
              isCached: false,
              cacheTTLSeconds: 30,
            },
            {
              name: SOURCE_QUALITY.RAILYATRI.name,
              qualityScore: SOURCE_QUALITY.RAILYATRI.qualityScore,
              lastUpdated: Date.now(),
              isCached: false,
              cacheTTLSeconds: 20,
            },
          ],
        },
        true
      )
    );

    // Set cache headers for 30 seconds (data updates frequently)
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
      buildApiResponse(
        null,
        {
          overall: 0,
          location: 0,
          delay: 0,
          halt: 0,
          crowdLevel: 0,
          sources: [],
        },
        false,
        errorMessage
      ),
      { status: statusCode }
    );
  }
}
