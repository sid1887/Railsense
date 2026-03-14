/**
 * API Route: /api/predict
 * Multi-purpose prediction API for:
 * 1. Halt duration prediction (ML-based)
 * 2. Train delay/ETA prediction (heuristic + historical)
 *
 * Query params for halt: region, hour, latitude, longitude, month (optional)
 * Query params for train ETA: train (train number)
 */

import { NextRequest, NextResponse } from 'next/server';
import { predictHaltDuration, getModelStatus } from '@/services/mlPredictor';
import { predictFinalDelay, generateDelayActions } from '@/services/predictionEngine';
import { logger } from '@/services/logger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check if this is a train delay prediction or halt prediction
    const trainNumber = request.nextUrl.searchParams.get('train');

    if (trainNumber) {
      // Train ETA/Delay prediction endpoint
      return handleTrainPrediction(trainNumber, request);
    }

    // Otherwise, handle halt duration prediction
    return handleHaltPrediction(request);
  } catch (error: any) {
    logger.error('[API] Prediction error:', { error: String(error) });

    return NextResponse.json(
      {
        error: error.message || 'Prediction failed',
        predicted_delay_min: null,
        confidence: 0,
        method: 'error',
      },
      { status: 200 } // Return 200 to not break UI
    );
  }
}

/**
 * Handle train delay/ETA prediction
 */
async function handleTrainPrediction(trainNumber: string, request: NextRequest): Promise<NextResponse> {
  try {
    // Get current train data
    const { getTrainData } = require('@/services/trainDataService');
    const trainData = await getTrainData(trainNumber);

    if (!trainData) {
      return NextResponse.json(
        { error: `Train ${trainNumber} not found`, method: 'error' },
        { status: 404 }
      );
    }

    // Prepare prediction input
    const recentDelayTrend = [
      trainData.delay * 0.8,
      trainData.delay || 0,
    ].filter(d => typeof d === 'number' && !isNaN(d));

    const predictionInput = {
      trainNumber,
      currentDelay: trainData.delay || 0,
      currentSpeed: trainData.speed || 0,
      distanceToDestination: 500, // km (estimate - would come from route)
      stationsRemaining: Math.max(1, (trainData.scheduledStations?.length || 10) - (trainData.currentStationIndex || 0)),
      recentDelayTrend,
      haltIndicators: trainData.status === 'Halted' ? 1 : 0,
      nearbyTrainCount: 0, // Would come from traffic analyzer
      currentHour: new Date().getHours(),
      dayOfWeek: new Date().getDay(),
    };

    // Get prediction
    const prediction = predictFinalDelay(predictionInput);
    const recommendedActions = generateDelayActions(prediction);

    const response = NextResponse.json({
      timestamp: new Date().toISOString(),
      train: {
        number: trainNumber,
        name: trainData.trainName,
        destination: trainData.destination,
      },
      currentStatus: {
        delay: trainData.delay,
        speed: trainData.speed,
        status: trainData.status,
        location: trainData.currentLocation,
        lastUpdate: new Date(trainData.lastUpdated).toISOString(),
      },
      prediction: {
        forecastDelay: prediction.forecastDelay,
        confidence: `${(prediction.confidence * 100).toFixed(0)}%`,
        eta: prediction.eta,
        method: prediction.method,
        riskLevel: prediction.riskLevel,
      },
      analysis: {
        primaryFactors: prediction.factors.slice(0, 3).map(f => ({
          name: f.name,
          delayImpact: `${f.impact} min`
        })),
        alertLevel: prediction.riskLevel === 'critical' ? 'ALERT' :
                   prediction.riskLevel === 'high' ? 'WARNING' :
                   prediction.riskLevel === 'medium' ? 'CAUTION' : 'OK',
      },
      recommendations: recommendedActions,
    });

    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    return response;
  } catch (error) {
    logger.error('[API] Train prediction error:', { error: String(error), train: trainNumber });
    return NextResponse.json(
      { error: 'Failed to predict train delay', method: 'error', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * Handle halt duration prediction (original ML-based)
 */
async function handleHaltPrediction(request: NextRequest): Promise<NextResponse> {
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

  logger.debug('[API] Halt prediction request:', {
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
}
