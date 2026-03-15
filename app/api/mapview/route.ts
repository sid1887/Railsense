/**
 * MapView Data API Endpoint
 * Serves geographic data for map rendering
 *
 * Endpoints:
 * GET /api/mapview - All trains and routes
 * GET /api/mapview?trainNumber=12955 - Single train with route
 * GET /api/mapview?lat=28.6&lng=77.2&radius=100 - Regional query
 * GET /api/mapview?format=geojson - GeoJSON feature collection
 */

import { NextRequest, NextResponse } from 'next/server';
import { mapViewDataService } from '@/services/mapViewDataService';
import { realTimePositionService } from '@/services/realTimePositionService';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const trainNumber = searchParams.get('trainNumber');
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    const radius = searchParams.get('radius');
    const format = searchParams.get('format');

    // Case 1: Get single train with route
    if (trainNumber) {
      const feature = mapViewDataService.getTrainGeoFeature(trainNumber);
      const route = mapViewDataService.getTrainRoute(trainNumber);

      if (!feature) {
        return NextResponse.json(
          { error: 'Train not found', trainNumber },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          data: {
            train: feature,
            route: route,
            format: 'geojson-feature',
          },
          timestamp: new Date().toISOString(),
        },
        {
          headers: { 'Cache-Control': 'public, max-age=30, s-maxage=30' },
        }
      );
    }

    // Case 2: Get trains by region
    if (lat && lng) {
      const centerLat = parseFloat(lat);
      const centerLng = parseFloat(lng);
      const radiusKm = radius ? parseInt(radius) : 100;

      if (isNaN(centerLat) || isNaN(centerLng)) {
        return NextResponse.json(
          { error: 'Invalid coordinates', message: 'lat and lng must be numbers' },
          { status: 400 }
        );
      }

      const trains = mapViewDataService.getTrainsByRegion(centerLat, centerLng, radiusKm);

      return NextResponse.json(
        {
          success: true,
          data: {
            trains,
            center: { lat: centerLat, lng: centerLng },
            radiusKm,
            count: trains.length,
            format: 'geojson-feature-collection',
          },
          timestamp: new Date().toISOString(),
        },
        {
          headers: { 'Cache-Control': 'public, max-age=30, s-maxage=30' },
        }
      );
    }

    // Case 3: Get all trains and routes (default)
    const mapData = mapViewDataService.getMapViewData();

    // Return as GeoJSON if requested
    if (format === 'geojson') {
      const featureCollection = {
        type: 'FeatureCollection',
        features: mapData.trains,
      };

      return NextResponse.json(featureCollection, {
        headers: { 'Cache-Control': 'public, max-age=30, s-maxage=30' },
      });
    }

    // Return complete map view data
    return NextResponse.json(
      {
        success: true,
        data: {
          trains: mapData.trains,
          routes: mapData.routes,
          heatmap: mapData.heatmap,
          bounds: mapData.bounds,
          totalTrains: mapData.trains.length,
          format: 'complete-map-view',
        },
        timestamp: new Date().toISOString(),
      },
      {
        headers: { 'Cache-Control': 'public, max-age=30, s-maxage=30' },
      }
    );
  } catch (error: any) {
    console.error('[mapview API] Error:', error);

    return NextResponse.json(
      {
        error: 'MapView data service error',
        message: error.message || 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
