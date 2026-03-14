/**
 * Enhanced Train Analytics API Endpoint
 * Returns comprehensive multi-factor train analysis:
 * - Halt reason detection with confidence scoring
 * - Railway section intelligence & network heatmap
 * - Wait time breakdown by component (traffic, weather, scheduled, etc)
 * - Nearby train awareness
 * - Movement state classification
 * - Integrated explanation with recommendations
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTrainData } from '@/services/trainDataService';
import trainAnalyticsEngine from '@/services/trainAnalytics';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get train number from query parameter
    const trainNumber = request.nextUrl.searchParams.get('trainNumber');

    if (!trainNumber) {
      return NextResponse.json(
        {
          error: 'Missing parameter',
          message: 'Query parameter "trainNumber" is required',
          example: '/api/train-analytics?trainNumber=12955',
        },
        { status: 400 }
      );
    }

    // Get train data from database
    const trainData = await getTrainData(trainNumber);

    if (!trainData) {
      return NextResponse.json(
        {
          error: 'Train not found',
          trainNumber,
          message: `No real Indian Railways train matches number "${trainNumber}". Verify train number against actual IR schedules.`,
          validTrains: ['12955', '13345', '14645', '15906'],
        },
        { status: 404 }
      );
    }

    // In production, these would be fetched from real services:
    const nearbyTrains: any[] = []; // Would fetch from spatial DB query
    const weatherData: any = null; // Would fetch from weather API
    const signals: any[] | undefined = undefined; // Would fetch from OpenRailwayMap API

    // Perform comprehensive multi-factor analysis
    const analytics = await trainAnalyticsEngine.performCompleteAnalysis(
      trainData,
      nearbyTrains,
      new Date(),
      weatherData,
      signals
    );

    // Return with appropriate cache headers for real-time data
    const response = NextResponse.json(
      {
        status: 'success',
        data: analytics,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );

    // Cache for 30 seconds (real-time updates)
    response.headers.set('Cache-Control', 'public, max-age=30, s-maxage=30');
    response.headers.set('Content-Type', 'application/json');

    return response;
  } catch (error: any) {
    console.error('[train-analytics] Calculation error:', error);

    return NextResponse.json(
      {
        error: 'Analytics calculation failed',
        message: error.message || 'Unknown error during analysis',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
