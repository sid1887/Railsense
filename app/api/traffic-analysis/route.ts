/**
 * Traffic Analysis API Endpoint
 * GET /api/traffic-analysis - Analyze traffic patterns and congestion
 */

import { NextRequest, NextResponse } from 'next/server';

let trafficAnalyzer: any = null;

// Load traffic analyzer on server-side
if (typeof window === 'undefined') {
  try {
    trafficAnalyzer = require('@/services/TrafficAnalyzerPro').default;
  } catch (e) {
    console.error('[Traffic API] Failed to load analyzer:', e);
  }
}

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const analysisType = searchParams.get('type') || 'summary'; // summary, section, nearby, forecast, bottlenecks
    const sectionCode = searchParams.get('section');
    const trainNumber = searchParams.get('train');
    const hoursAhead = parseInt(searchParams.get('hours') || '3');

    if (!trafficAnalyzer) {
      return NextResponse.json(
        { error: 'Traffic analyzer service not initialized' },
        { status: 503 }
      );
    }

    let response: any = {
      timestamp: new Date().toISOString(),
      analysisType,
    };

    switch (analysisType) {
      case 'summary':
        // Overall traffic summary
        response.summary = await trafficAnalyzer.getTrafficSummary();
        break;

      case 'section':
        // Detailed analysis for a specific section
        if (!sectionCode) {
          return NextResponse.json(
            { error: 'section parameter required for section analysis' },
            { status: 400 }
          );
        }
        response.sectionAnalysis = await trafficAnalyzer.analyzeSectionDensity(sectionCode);
        break;

      case 'nearby':
        // Nearby trains analysis for a train
        if (!trainNumber) {
          return NextResponse.json(
            { error: 'train parameter required for nearby analysis' },
            { status: 400 }
          );
        }
        response.nearbyTrains = await trafficAnalyzer.analyzeNearbyTrains(trainNumber);
        break;

      case 'forecast':
        // Congestion forecast
        if (!sectionCode) {
          return NextResponse.json(
            { error: 'section parameter required for forecast' },
            { status: 400 }
          );
        }
        response.forecast = await trafficAnalyzer.forecastCongestion(sectionCode, hoursAhead);
        break;

      case 'bottlenecks':
        // Identify bottlenecks
        response.bottlenecks = await trafficAnalyzer.identifyBottlenecks();
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid analysis type. Use: summary, section, nearby, forecast, bottlenecks' },
          { status: 400 }
        );
    }

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('[Traffic API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze traffic', details: String(error) },
      { status: 500 }
    );
  }
}
