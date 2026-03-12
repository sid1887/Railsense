/**
 * API Route: /api/train/:trainNumber
 * Master composition endpoint
 * Returns complete train insight with: position, halt detection, nearby trains, wait prediction, data quality
 */

import { NextRequest, NextResponse } from 'next/server';
import { getLiveTrainDataMerged, getSourcePriority } from '@/services/providerAdapter';
import { detectHaltWithDB } from '@/services/haltDetectionV2';
import { queryNearbyTrains, analyzeTrafficAsHaltCause } from '@/services/nearbyTrainsService';
import { getWeatherAtLocation, assessWeatherImpact } from '@/services/weatherService';
import { fetchNewsForTrain } from '@/services/newsService';
import Database from 'better-sqlite3';
import path from 'path';

// Initialize database connection
const dbPath = path.join(process.cwd(), 'data', 'history.db');
let db: Database.Database | null = null;

function getDB(): Database.Database {
  if (!db) {
    db = new Database(dbPath);
  }
  return db;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { trainNumber: string } }
) {
  const trainNumber = params.trainNumber?.toUpperCase();

  if (!trainNumber) {
    return NextResponse.json({ error: 'trainNumber is required' }, { status: 400 });
  }

  try {
    console.log(`[API] Fetching complete data for train ${trainNumber}`);

    // 1. Get live position from provider chain (merges NTES + RailYatri)
    const liveData = await getLiveTrainDataMerged(trainNumber);

    if (!liveData || !liveData.lat || !liveData.lng) {
      console.warn(`[API] No position data for ${trainNumber}`);
      return NextResponse.json(
        { error: 'Train data not available', trainNumber },
        { status: 404 }
      );
    }

    const sources = getSourcePriority(liveData);

    // 2. Query halt detection from database
    let haltAnalysis = null;
    try {
      haltAnalysis = await detectHaltWithDB(getDB(), trainNumber, 8);
    } catch (e) {
      console.warn(`[API] Halt detection error:`, e);
    }

    // 3. Get nearby trains
    let nearby = { count: 0, trains: [], congestion_level: 'LOW' as const };
    try {
      nearby = await queryNearbyTrains(getDB(), trainNumber, liveData.lat, liveData.lng, 2, 10);
    } catch (e) {
      console.warn(`[API] Nearby trains error:`, e);
    }

    // 4. Enhance halt confidence with traffic context
    if (haltAnalysis && haltAnalysis.confidence < 0.7 && nearby.count > 0) {
      const trafficScore = analyzeTrafficAsHaltCause(nearby, liveData.speed || 0);
      if (trafficScore > 0.5) {
        haltAnalysis.confidence = Math.min(1, haltAnalysis.confidence + 0.1);
      }
    }

    // 5. Calculate wait time prediction
    const prediction = calculatePrediction(liveData.speed || 0, haltAnalysis);

    // 6. Determine data quality
    const dataQuality = determineDataQuality(sources, haltAnalysis);

    // 8. Fetch weather data for current location
    let weatherData = null;
    let weatherImpact = null;
    try {
      weatherData = await getWeatherAtLocation(liveData.lat, liveData.lng);
      if (weatherData) {
        weatherImpact = assessWeatherImpact(weatherData);
      }
    } catch (e) {
      console.warn(`[API] Weather fetch error:`, e);
    }

    // 9. Fetch relevant railway news for the region
    let newsArticles: any[] = [];
    try {
      const newsResponse = await fetchNewsForTrain(trainNumber, liveData.lat, liveData.lng);
      newsArticles = newsResponse.articles.slice(0, 3); // Top 3
      console.log(`[API] Fetched ${newsArticles.length} news articles for ${trainNumber}`);
    } catch (e) {
      console.warn(`[API] News fetch error:`, e);
    }

    // 10. Compose final response
    const response = {
      trainNumber,
      timestamp: Date.now(),

      position: {
        lat: liveData.lat,
        lng: liveData.lng,
        speed: liveData.speed || 0,
        accuracy_m: liveData.raw?.accuracy || 100,
        timestamp: liveData.timestamp || Date.now(),
      },

      section: {
        section_id: null,
        station_index: null,
        current_station: getStationName(trainNumber),
        next_station: getNextStationName(trainNumber),
        distance_to_next_m: Math.floor(50 + Math.random() * 200),
      },

      halt: haltAnalysis
        ? {
            detected: haltAnalysis.halted,
            duration_sec: haltAnalysis.halt_duration_sec || 0,
            is_scheduled: haltAnalysis.is_scheduled_stop,
            confidence: Math.round(haltAnalysis.confidence * 100) / 100,
            reason_candidates: (haltAnalysis.reason_candidates || []).slice(0, 3),
          }
        : {
            detected: false,
            duration_sec: 0,
            is_scheduled: false,
            confidence: 0,
            reason_candidates: [],
          },

      nearby: {
        count: nearby.count,
        trains: nearby.trains.slice(0, 5),
        congestion_level: nearby.congestion_level,
      },

      prediction: {
        wait_time_min: prediction.waitMin,
        confidence: Math.round(prediction.confidence * 100) / 100,
        method: prediction.method,
      },

      enrichment: {
        weather: weatherData
          ? {
              temperature: weatherData.temperature,
              condition: weatherData.condition,
              humidity: weatherData.humidity,
              wind_speed: weatherData.wind_speed,
              visibility_m: weatherData.visibility,
              precipitation_mm: weatherData.precipitation,
              impact: weatherImpact
                ? {
                    severity: weatherImpact.severity,
                    affects: weatherImpact.affects,
                    reason: weatherImpact.reason,
                  }
                : null,
            }
          : {
              condition: 'Unavailable',
              impact: null,
            },
        news: newsArticles.map(article => ({
          title: article.title,
          source: article.source,
          link: article.link,
          relevance: article.relevanceScore,
        })),
      },

      metadata: {
        source: sources,
        last_update_ago_sec: Math.floor((Date.now() - (liveData.timestamp || 0)) / 1000),
        data_quality: dataQuality,
        sample_count_1h: sampleCount1h,
      },
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error(`[API] Error processing ${trainNumber}:`, error);
    return NextResponse.json(
      { error: error.message || 'Internal server error', trainNumber },
      { status: 500 }
    );
  }
}

/**
 * Simple wait time prediction heuristic
 */
function calculatePrediction(
  speed: number,
  haltAnalysis: any
): { waitMin: { min: number; max: number }; confidence: number; method: string } {
  if (!haltAnalysis?.halted) {
    return { waitMin: { min: 0, max: 5 }, confidence: 0.85, method: 'moving-train' };
  }

  // Halted
  if (haltAnalysis.is_scheduled_stop) {
    return { waitMin: { min: 3, max: 10 }, confidence: 0.75, method: 'scheduled-stop' };
  }

  // Unscheduled halt
  const reason = haltAnalysis.reason_candidates?.[0]?.id || 'unknown';
  if (reason === 'traffic_regulation') {
    return { waitMin: { min: 8, max: 25 }, confidence: 0.65, method: 'traffic-regulation' };
  }

  return { waitMin: { min: 10, max: 30 }, confidence: 0.55, method: 'conservative-estimate' };
}

/**
 * Determine data quality: GOOD | FAIR | POOR
 */
function determineDataQuality(sources: string[], haltAnalysis: any): 'GOOD' | 'FAIR' | 'POOR' {
  // GOOD: multiple real sources + confident halt detection
  if (sources.length >= 2 && sources.some(s => s !== 'mock')) {
    if (!haltAnalysis || haltAnalysis.confidence > 0.6) return 'GOOD';
  }

  // FAIR: real schedule or multiple sources
  if (sources.includes('real-schedule') || sources.length >= 2) return 'FAIR';

  // POOR: only mock/simulated
  if (sources[0] === 'mock' || sources[0] === 'simulated') return 'POOR';

  return 'FAIR';
}

/**
 * Get snapshot count in past N minutes
 */
function getSampleCount(db: Database.Database, trainNumber: string, minutesBack: number): number {
  try {
    const sinceMs = Date.now() - minutesBack * 60 * 1000;
    const stmt = db.prepare(
      `SELECT COUNT(*) as cnt FROM train_snapshots WHERE train_number = ? AND timestamp >= ?`
    );
    const result = stmt.get(trainNumber, sinceMs) as { cnt?: number } | undefined;
    return result?.cnt || 0;
  } catch (e) {
    console.warn(`[API] Sample count query failed:`, e);
    return 0;
  }
}

/**
 * Mock: get current station (would use map-matching in production)
 */
function getStationName(trainNumber: string): string {
  const stations: Record<string, string> = {
    '12955': 'Mumbai Central',
    '12728': 'Virar',
    '17015': 'Hyderabad Deccan',
    '12702': 'Kalyan Junction',
    '11039': 'Dhanbad Junction',
  };
  return stations[trainNumber] || 'Unknown Station';
}

/**
 * Mock: get next station (would use schedule routing in production)
 */
function getNextStationName(trainNumber: string): string {
  const nextStations: Record<string, string> = {
    '12955': 'Pune Junction',
    '12728': 'Diva Junction',
    '17015': 'Tandur',
    '12702': 'Kasara',
    '11039': 'Asansol Junction',
  };
  return nextStations[trainNumber] || 'Next Station';
}
