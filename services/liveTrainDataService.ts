/**
 * Live Train Data Service
 * Fetches real-time train position and delay data from multiple sources
 * Sources: NTES, RailYatri APIs
 */

import { getLiveTrainDataMerged } from './providerAdapter';
import { getEnrichedTrain } from './knowledgeBaseService';

export interface LiveTrainData {
  trainNumber: string;
  speed: number;
  delayMinutes: number;
  latitude: number;
  longitude: number;
  timestamp: string;
  source: 'ntes' | 'railyatri' | 'estimated';
  confidence: number;
}

export interface LiveDataDiagnostics {
  attemptedProviders: Array<'ntes' | 'railyatri'>;
  successfulProviders: Array<'ntes' | 'railyatri'>;
  failedProviders: Array<'ntes' | 'railyatri'>;
  selectedSource: 'ntes' | 'railyatri' | 'estimated' | 'none';
  liveCoordinatesAvailable: boolean;
  reason:
    | 'live_coordinates_available'
    | 'fallback_estimated_from_schedule'
    | 'status_only_no_coordinates'
    | 'all_live_providers_unavailable';
}

export interface LiveDataResult {
  data: LiveTrainData | null;
  diagnostics: LiveDataDiagnostics;
}

export interface NTESResponse {
  position: {
    latitude: number;
    longitude: number;
  };
  speed: number;
  delay: number;
}

export interface RailYatriResponse {
  train: {
    number: string;
  };
  position: {
    lat: number;
    lon: number;
  };
  speed: number;
  delay: number;
}

const ENABLE_MOCK_LIVE_DATA = process.env.ENABLE_MOCK_LIVE_DATA === 'true';

/**
 * Fetch live data from NTES (via caching proxy)
 */
async function fetchFromNTES(trainNumber: string): Promise<LiveTrainData | null> {
  try {
    const merged = await getLiveTrainDataMerged(trainNumber);
    if (
      merged &&
      (merged.source === 'ntes' || merged.source === 'merged') &&
      typeof merged.delay === 'number' &&
      typeof merged.lat === 'number' &&
      typeof merged.lng === 'number' &&
      Number.isFinite(merged.lat) &&
      Number.isFinite(merged.lng) &&
      merged.lat !== 0 &&
      merged.lng !== 0
    ) {
      return {
        trainNumber,
        speed: merged.speed ?? 0,
        delayMinutes: merged.delay ?? 0,
        latitude: merged.lat ?? 0,
        longitude: merged.lng ?? 0,
        timestamp: new Date(merged.timestamp ?? Date.now()).toISOString(),
        source: 'ntes',
        confidence: merged.source === 'merged' ? 0.85 : 0.75,
      };
    }

    if (ENABLE_MOCK_LIVE_DATA) {
      return simulateLiveData(trainNumber, 'ntes');
    }

    return null;
  } catch (error) {
    console.error('Error fetching from NTES:', error);
    return null;
  }
}

/**
 * Fetch live data from RailYatri API
 */
async function fetchFromRailYatri(trainNumber: string): Promise<LiveTrainData | null> {
  try {
    const merged = await getLiveTrainDataMerged(trainNumber);
    if (
      merged &&
      typeof merged.lat === 'number' &&
      typeof merged.lng === 'number' &&
      Number.isFinite(merged.lat) &&
      Number.isFinite(merged.lng) &&
      merged.lat !== 0 &&
      merged.lng !== 0 &&
      (merged.source === 'railyatri' || merged.source === 'merged')
    ) {
      return {
        trainNumber,
        speed: merged.speed ?? 0,
        delayMinutes: merged.delay ?? 0,
        latitude: merged.lat,
        longitude: merged.lng,
        timestamp: new Date(merged.timestamp ?? Date.now()).toISOString(),
        source: 'railyatri',
        confidence: merged.source === 'merged' ? 0.9 : 0.8,
      };
    }

    if (ENABLE_MOCK_LIVE_DATA) {
      return simulateLiveData(trainNumber, 'railyatri');
    }

    return null;
  } catch (error) {
    console.error('Error fetching from RailYatri:', error);
    return null;
  }
}

/**
 * Get live train data from multiple sources with fallback
 */
export async function getLiveTrainData(
  trainNumber: string
): Promise<LiveTrainData | null> {
  const merged = await getLiveTrainDataMerged(trainNumber);

  // Try coordinate-capable provider path first
  const railyatriData = await fetchFromRailYatri(trainNumber);
  if (railyatriData && (railyatriData.source === 'estimated' ? railyatriData.confidence > 0.5 : railyatriData.confidence > 0.7)) {
    return railyatriData;
  }

  // Fallback to merged/NTES if coordinates are present
  const ntesData = await fetchFromNTES(trainNumber);
  if (ntesData && ntesData.confidence > 0.7) {
    return ntesData;
  }

  // Hard fallback: return schedule-derived geospatial estimate when external providers fail.
  if (
    merged &&
    merged.source === 'schedule' &&
    typeof merged.lat === 'number' &&
    typeof merged.lng === 'number' &&
    Number.isFinite(merged.lat) &&
    Number.isFinite(merged.lng) &&
    merged.lat !== 0 &&
    merged.lng !== 0
  ) {
    return {
      trainNumber,
      speed: merged.speed ?? 0,
      delayMinutes: merged.delay ?? 0,
      latitude: merged.lat,
      longitude: merged.lng,
      timestamp: new Date(merged.timestamp ?? Date.now()).toISOString(),
      source: 'estimated',
      confidence: 0.55,
    };
  }

  const kbEstimated = await estimateLiveDataFromKnowledgeBase(trainNumber);
  if (kbEstimated) {
    return kbEstimated;
  }

  // Production behavior: explicit unavailable when providers fail
  return null;
}

export async function getLiveTrainDataWithDiagnostics(
  trainNumber: string
): Promise<LiveDataResult> {
  const attemptedProviders: Array<'ntes' | 'railyatri'> = ['ntes', 'railyatri'];
  const successfulProviders: Array<'ntes' | 'railyatri'> = [];

  const merged = await getLiveTrainDataMerged(trainNumber);
  const hasCoords = Boolean(
    merged &&
      typeof merged.lat === 'number' &&
      typeof merged.lng === 'number' &&
      Number.isFinite(merged.lat) &&
      Number.isFinite(merged.lng) &&
      merged.lat !== 0 &&
      merged.lng !== 0
  );

  if (merged) {
    if (merged.source === 'merged') {
      successfulProviders.push('ntes', 'railyatri');
    } else if (merged.source === 'ntes') {
      successfulProviders.push('ntes');
    } else if (merged.source === 'railyatri') {
      successfulProviders.push('railyatri');
    }
  }

  const data = await getLiveTrainData(trainNumber);
  if (data && (data.source === 'ntes' || data.source === 'railyatri')) {
    const providerSource: 'ntes' | 'railyatri' = data.source;
    if (!successfulProviders.includes(providerSource)) {
      successfulProviders.push(providerSource);
    }
  }

  const failedProviders = attemptedProviders.filter(
    provider => !successfulProviders.includes(provider)
  );

  const selectedSource: 'ntes' | 'railyatri' | 'estimated' | 'none' = data
    ? data.source
    : 'none';

  let reason: LiveDataDiagnostics['reason'] = 'all_live_providers_unavailable';
  if (data) {
    reason = data.source === 'estimated' ? 'fallback_estimated_from_schedule' : 'live_coordinates_available';
  } else if (merged && !hasCoords) {
    reason = 'status_only_no_coordinates';
  }

  return {
    data,
    diagnostics: {
      attemptedProviders,
      successfulProviders,
      failedProviders,
      selectedSource,
      liveCoordinatesAvailable: Boolean(data),
      reason,
    },
  };
}

/**
 * Simulate live data based on train schedule
 * Used for demonstration when actual APIs are not available
 */
export function simulateLiveData(
  trainNumber: string,
  source: 'ntes' | 'railyatri' = 'railyatri'
): LiveTrainData {
  // Seed randomness with train number for consistency
  const seed = parseInt(trainNumber) * 12345;
  const random = ((Math.sin(seed) + 1) / 2) * 100;

  // Simulate train somewhere on its route (0-100% progress)
  const progress = (random % 100) / 100;

  // Base coordinates (start at Mumbai)
  const baseLat = 18.9676;
  const baseLon = 72.8194;

  // Simulate movement (rough approximation)
  const deltaLat = progress * 3; // Rough north movement
  const deltaLon = progress * 6; // Rough east movement

  return {
    trainNumber,
    speed: 60 + Math.floor(random % 50), // 60-110 km/h
    delayMinutes: Math.floor((random % 30) - 15), // -15 to +15 minutes
    latitude: baseLat + deltaLat,
    longitude: baseLon + deltaLon,
    timestamp: new Date().toISOString(),
    source,
    confidence: 0.6 + (random % 40) / 100, // 0.6-1.0 confidence
  };
}

function parseTimeToMinutes(value?: string): number | null {
  if (!value) return null;
  if (value.toLowerCase() === 'source' || value.toLowerCase() === 'destination') return null;

  const match = value.match(/(\d{1,2}):(\d{2})/);
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;

  return hours * 60 + minutes;
}

async function estimateLiveDataFromKnowledgeBase(trainNumber: string): Promise<LiveTrainData | null> {
  try {
    const enriched = await getEnrichedTrain(trainNumber);
    const route = enriched?.enrichedRoute || [];

    if (!route.length) {
      return null;
    }

    const validStops = route.filter(
      stop => typeof stop.latitude === 'number' && typeof stop.longitude === 'number'
    );
    if (!validStops.length) {
      return null;
    }

    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    let selected = validStops[0];
    let smallestDiff = Number.POSITIVE_INFINITY;

    for (const stop of validStops) {
      const minuteCandidates = [parseTimeToMinutes(stop.arrives), parseTimeToMinutes(stop.departs)].filter(
        (v): v is number => typeof v === 'number'
      );

      if (!minuteCandidates.length) {
        continue;
      }

      for (const candidate of minuteCandidates) {
        const diff = Math.abs(candidate - nowMinutes);
        if (diff < smallestDiff) {
          smallestDiff = diff;
          selected = stop;
        }
      }
    }

    return {
      trainNumber,
      speed: 32,
      delayMinutes: 0,
      latitude: selected.latitude as number,
      longitude: selected.longitude as number,
      timestamp: new Date().toISOString(),
      source: 'estimated',
      confidence: 0.58,
    };
  } catch (error) {
    console.warn('[LiveData] Knowledge-base estimation failed:', error);
    return null;
  }
}

/**
 * Normalize data from different sources to common format
 */
export function normalizeLiveData(
  rawData: any,
  source: 'ntes' | 'railyatri'
): LiveTrainData | null {
  try {
    if (source === 'ntes') {
      return {
        trainNumber: rawData.trainNumber,
        speed: rawData.position?.speed || 0,
        delayMinutes: rawData.delay || 0,
        latitude: rawData.position?.latitude || 0,
        longitude: rawData.position?.longitude || 0,
        timestamp: new Date().toISOString(),
        source: 'ntes',
        confidence: 0.85,
      };
    } else if (source === 'railyatri') {
      return {
        trainNumber: rawData.train?.number || '',
        speed: rawData.speed || 0,
        delayMinutes: rawData.delay || 0,
        latitude: rawData.position?.lat || 0,
        longitude: rawData.position?.lon || 0,
        timestamp: new Date().toISOString(),
        source: 'railyatri',
        confidence: 0.8,
      };
    }
  } catch (error) {
    console.error('Error normalizing live data:', error);
  }

  return null;
}
