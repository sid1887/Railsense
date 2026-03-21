/**
 * Train Orchestrator Service - CORE BRAIN
 * Unified service that orchestrates all train data sources into ONE response
 * Replaces all mock data and scattered services
 *
 * Flow:
 * 1. Fetch route (static DB)
 * 2. Fetch live GPS (NTES → RailYatri → fallback)
 * 3. Map GPS → current station
 * 4. Fetch nearby trains
 * 5. Compute dwell prediction
 * 6. Compute congestion score
 * 7. Compute crossing risk
 * 8. Compute prediction ETA
 * 9. Return unified object
 */

import { getTrainData } from './trainDataService';
import { getLiveTrainData } from './liveTrainDataService';
import { getNearbyTrainsData } from './trainDataService';
import { dwellPredictionService } from './dwellPredictionService';
import { networkIntelligenceService } from './networkIntelligenceService';
import { crossingDetectionService } from './crossingDetectionService';
import { platformOccupancyService } from './platformOccupancyService';
import { predictionEngineV2 } from './predictionEngineV2';

/**
 * UNIFIED RESPONSE SCHEMA - NON-NEGOTIABLE
 * Every API endpoint returns this exact structure
 */
export interface UnifiedTrainResponse {
  // Core train info
  trainNumber: string;
  trainName: string;

  /**
   * Current location data
   */
  currentLocation: {
    station: string;
    stationCode: string;
    latitude: number;
    longitude: number;
    timestamp: number;
  };

  /**
   * Next station prediction
   */
  nextStation: {
    station: string;
    stationCode: string;
    scheduledArrival: string;
    estimatedArrival: string;
    latitude: number;
    longitude: number;
  };

  /**
   * Real-time metrics
   */
  liveMetrics: {
    delay: number; // minutes
    speed: number; // km/h
    status: 'running' | 'halted' | 'delayed' | 'on-time';
  };

  /**
   * Route information
   */
  route: {
    source: string;
    destination: string;
    totalStations: number;
    currentStationIndex: number;
    allStations: Array<{
      name: string;
      code: string;
      scheduledArrival: string;
      estimatedArrival: string;
      scheduledDeparture: string;
      estimatedDeparture: string;
      latitude: number;
      longitude: number;
    }>;
  };

  /**
   * Network intelligence - trains nearby
   */
  networkIntelligence: {
    nearbyTrains: Array<{
      trainNumber: string;
      trainName: string;
      distance: number; // km
      direction: 'same' | 'opposite' | 'crossing';
      sameTrack: boolean;
      relativeSpeed: number; // km/h
      collisionRisk: 'low' | 'medium' | 'high';
    }>;
    congestionLevel: 'low' | 'medium' | 'high' | 'severe';
    congestionScore: number; // 0-100
  };

  /**
   * Dwell behavior prediction
   */
  dwellPrediction: {
    expectedDwellTime: number; // minutes
    dwellRisk: 'low' | 'medium' | 'high';
    reasons: string[];
  };

  /**
   * Crossing risk analysis
   */
  crossingRisk: {
    hasOpposingTrain: boolean;
    distance: number; // km
    timeToConflict: number; // minutes
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
  };

  /**
   * Platform occupancy at next station
   */
  platformOccupancy: {
    platformLoad: number; // 0-100%
    waitingProbability: number; // 0-1.0
    expectedWaitTime: number; // minutes
  };

  /**
   * Advanced ETA prediction
   */
  prediction: {
    eta: string; // ISO timestamp
    delayForecast: number; // minutes
    confidence: number; // 0-1.0
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    factors: {
      delayPropagation: number;
      dwellRisk: number;
      congestionPenalty: number;
      crossingDelay: number;
      platformWait: number;
    };
  };

  /**
   * Data quality metrics
   */
  dataQuality: {
    liveGPS: boolean; // do we have real GPS?
    stationMapping: boolean; // snapped to track network?
    networkAwareness: boolean; // multi-train analysis done?
    predictionStrength: 'low' | 'medium' | 'high' | 'very-high';
    liveUnavailable: boolean; // no live data at all?
    sources: string[]; // which data sources were used
  };

  /**
   * Metadata
   */
  lastUpdated: number; // unix timestamp
  cacheExpiry: number; // unix timestamp
}

/**
 * MAIN ORCHESTRATION FUNCTION
 * Called by ALL train endpoints
 */
export async function getUnifiedTrainData(
  trainNumber: string
): Promise<UnifiedTrainResponse | null> {
  try {
    console.log(`[Orchestrator] Starting unified data fetch for train ${trainNumber}`);

    // Step 1: Get base train data (schedule + position)
    const baseData = await getTrainData(trainNumber);
    if (!baseData) {
      console.log(`[Orchestrator] Train not found: ${trainNumber}`);
      return null;
    }

    // Step 2: Get live GPS data
    const liveData = await getLiveTrainData(trainNumber);

    // Step 3: Get nearby trains (within 50km radius)
    const nearbyTrainsData = await getNearbyTrainsData(
      baseData.currentLocation.latitude,
      baseData.currentLocation.longitude,
      50
    );

    // Step 4: Network intelligence
    const networkData = await networkIntelligenceService.analyzeNearbyTrains(
      trainNumber,
      baseData.currentLocation,
      baseData.scheduledStations,
      nearbyTrainsData
    );

    // Step 5: Dwell prediction
    const dwellData = await dwellPredictionService.predictDwell(
      trainNumber,
      baseData,
      networkData,
      (baseData.delay ?? 0) + (liveData?.delayMinutes ?? 0)
    );

    // Step 6: Crossing detection
    const crossingData = await crossingDetectionService.detectCrossing(
      trainNumber,
      baseData.currentLocation,
      networkData.nearbyTrains
    );

    // Step 7: Platform occupancy
    const stationCode = baseData.scheduledStations[baseData.currentStationIndex]?.code || 'UNKNOWN';
    const platformData = await platformOccupancyService.analyzeOccupancy(
      stationCode,
      baseData.currentStationIndex,
      baseData.scheduledStations,
      nearbyTrainsData
    );

    // Step 8: Advanced prediction
    const predictionData = await predictionEngineV2.predictArrival(
      trainNumber,
      baseData,
      liveData,
      dwellData,
      crossingData,
      platformData,
      networkData
    );

    // Build unified response
    const currentStationIndex = baseData.currentStationIndex || 0;
    const nextStationIndex = Math.min(currentStationIndex + 1, (baseData.scheduledStations?.length || 1) - 1);
    const nextStation = baseData.scheduledStations?.[nextStationIndex];

    const response: UnifiedTrainResponse = {
      trainNumber: baseData.trainNumber,
      trainName: baseData.trainName,

      currentLocation: {
        station: baseData.scheduledStations?.[currentStationIndex]?.name || 'Unknown',
        stationCode: baseData.currentStationCode || '',
        latitude: liveData?.latitude ?? baseData.currentLocation.latitude,
        longitude: liveData?.longitude ?? baseData.currentLocation.longitude,
        timestamp: Date.now(),
      },

      nextStation: {
        station: nextStation?.name || 'Unknown',
        stationCode: nextStation?.code || '',
        scheduledArrival: nextStation?.scheduledArrival || '00:00',
        estimatedArrival: nextStation?.estimatedArrival || '00:00',
        latitude: nextStation?.latitude || 0,
        longitude: nextStation?.longitude || 0,
      },

      liveMetrics: {
        delay: (liveData?.delayMinutes ?? 0) + (baseData.delay ?? 0),
        speed: liveData?.speed ?? baseData.speed ?? 0,
        status: baseData.status as 'running' | 'halted' | 'delayed' | 'on-time',
      },

      route: {
        source: baseData.source || 'Unknown',
        destination: baseData.destination || 'Unknown',
        totalStations: baseData.scheduledStations?.length || 0,
        currentStationIndex,
        allStations: (baseData.scheduledStations || []).map((s) => ({
          name: s.name,
          code: s.code || 'UNKNOWN',
          scheduledArrival: s.scheduledArrival,
          estimatedArrival: s.estimatedArrival || s.scheduledArrival,
          scheduledDeparture: s.scheduledDeparture,
          estimatedDeparture: s.estimatedDeparture || s.scheduledDeparture,
          latitude: s.latitude,
          longitude: s.longitude,
        })),
      },

      networkIntelligence: networkData,

      dwellPrediction: dwellData,

      crossingRisk: crossingData,

      platformOccupancy: platformData,

      prediction: predictionData,

      dataQuality: {
        liveGPS: !!liveData?.latitude,
        stationMapping: baseData.dataQuality > 0.7,
        networkAwareness: nearbyTrainsData.length > 0,
        predictionStrength: predictionData.confidence > 0.85 ? 'very-high' : predictionData.confidence > 0.7 ? 'high' : predictionData.confidence > 0.5 ? 'medium' : 'low',
        liveUnavailable: !liveData,
        sources: [baseData.source || 'schedule', ...(liveData ? ['live-gps'] : [])],
      },

      lastUpdated: Date.now(),
      cacheExpiry: Date.now() + 30000, // 30 second cache
    };

    console.log(`[Orchestrator] Unified data ready for ${trainNumber}`);
    return response;
  } catch (error) {
    console.error(`[Orchestrator] Error:`, error);
    return null;
  }
}

/**
 * Batch fetch for multiple trains
 */
export async function getUnifiedTrainDataBatch(
  trainNumbers: string[]
): Promise<Record<string, UnifiedTrainResponse | null>> {
  const results: Record<string, UnifiedTrainResponse | null> = {};

  await Promise.all(
    trainNumbers.map(async (tn) => {
      results[tn] = await getUnifiedTrainData(tn);
    })
  );

  return results;
}
