/**
 * API Route: /api/predict
 * ML-based halt duration prediction for trains
 * Query params: region, hour, latitude, longitude, month (optional)
 */

import { NextRequest, NextResponse } from 'next/server';
import { predictHaltDuration, getModelStatus } from '@/services/mlPredictor';
import { logger } from '@/services/logger';

export async function GET(request: NextRequest) {
  try {
    const region = request.nextUrl.searchParams.get('region') || 'Centre';
    const hourStr = request.nextUrl.searchParams.get('hour');
    const latStr = request.nextUrl.searchParams.get('latitude');
    const lngStr = request.nextUrl.searchParams.get('longitude');
    const monthStr = request.nextUrl.searchParams.get('month');

    // Validate input
    if (!hourStr || !latStr || !lngStr) {
      return NextResponse.json(
        { error: 'Missing required params: hour, latitude, longitude' },
        { status: 400 }
      );
    }

    const hour = parseInt(hourStr);
    const latitude = parseFloat(latStr);
    const longitude = parseFloat(lngStr);
    const month = monthStr ? parseInt(monthStr) : undefined;

    // Validate ranges
    if (isNaN(hour) || hour < 0 || hour > 23) {
      return NextResponse.json(
        { error: 'hour must be 0-23' },
        { status: 400 }
      );
    }

    if (isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json(
        { error: 'latitude and longitude must be numbers' },
        { status: 400 }
      );
    }

    logger.debug('[API] Prediction request:', {
      region,
      hour,
      latitude,
      longitude,
      month,
    });

    // Make prediction
    const result = await predictHaltDuration({
      region,
      hour,
      latitude,
      longitude,
      month,
    });

    const response = NextResponse.json({
      ...result,
      model_status: getModelStatus(),
      query: { region, hour, latitude, longitude, month },
    });

    // Cache for 10 minutes
    response.headers.set('Cache-Control', 'public, max-age=600');
    return response;
  } catch (error: any) {
    logger.error('[API] Prediction error:', { error: String(error) });

    return NextResponse.json(
      {
        error: error.message || 'Prediction failed',
        predicted_duration_min: null,
        confidence: 0,
        method: 'error',
      },
      { status: 200 } // Return 200 to not break UI
    );
  }
}
