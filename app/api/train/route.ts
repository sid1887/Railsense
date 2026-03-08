/**
 * API Route: /api/train
 * Searches and returns train data
 * Used by search functionality
 */

import { NextRequest, NextResponse } from 'next/server';
import { getTrainData, searchTrains } from '@/services/trainDataService';

export async function GET(request: NextRequest) {
  try {
    const trainNumber = request.nextUrl.searchParams.get('trainNumber');
    const query = request.nextUrl.searchParams.get('q');

    // If specific train number provided
    if (trainNumber) {
      const trainData = await getTrainData(trainNumber);

      if (!trainData) {
        return NextResponse.json(
          { error: `Train ${trainNumber} not found` },
          { status: 404 }
        );
      }

      const response = NextResponse.json(trainData);
      response.headers.set('Cache-Control', 'public, max-age=60');
      return response;
    }

    // If search query provided
    if (query) {
      const results = await searchTrains(query);
      const response = NextResponse.json(results);
      response.headers.set('Cache-Control', 'public, max-age=60');
      return response;
    }

    return NextResponse.json(
      { error: 'Please provide trainNumber or search query' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('API Error - train:', error);

    return NextResponse.json(
      { error: error.message || 'Failed to fetch train data' },
      { status: 500 }
    );
  }
}
