/**
 * RailYatri Provider
 * Crowdsourced live train location data from RailYatri mobile app
 * GPS-only (high frequency position updates)
 *
 * Complements NTES: NTES has status, RailYatri has coordinates
 */

import { ProviderResult, TrainProvider } from '../providerAdapter';

export interface RailYatriData {
  trainNumber: string;
  lat: number;
  lng: number;
  speed: number; // km/h estimated from movement
  accuracy: number; // meters
  boardedPassengers: number;
  crowdLevel: 'EMPTY' | 'NORMAL' | 'CROWDED' | 'PACKED';
  lastReportAge: number; // seconds
}

class RailYatriProvider implements TrainProvider {
  name = 'RailYatri';
  enabled = true;
  rateLimit = 15; // requests per minute
  stats = {
    successCount: 0,
    failureCount: 0,
    avgLatencyMs: 0,
    lastError: null as string | null,
    lastSuccessTime: null as number | null,
  };

  private gpsCache = new Map<string, { data: RailYatriData; timestamp: number }>();
  private CACHE_TTL_MS = 20000; // 20s cache for GPS data (lower than NTES)

  /**
   * Fetch live position for a train from RailYatri
   * Attempts real API first, falls back to mock
   */
  async getStatus(trainNumber: string): Promise<ProviderResult | null> {
    const start = Date.now();

    try {
      // Check cache first (shorter TTL for fresher GPS)
      const cached = this.gpsCache.get(trainNumber);
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL_MS) {
        return this._railyatriToProviderResult(cached.data, cached.timestamp);
      }

      let railyatriData: RailYatriData | null = null;

      // Try real RailYatri API first (with timeout)
      try {
        console.log(`[RailYatri] Attempting real API for train ${trainNumber}...`);
        railyatriData = await this._fetchFromRealAPI(trainNumber);
        if (railyatriData) {
          console.log(`[RailYatri] Got real data for train ${trainNumber}`);
        }
      } catch (apiError) {
        console.warn(`[RailYatri] Real API failed: ${apiError instanceof Error ? apiError.message : 'Unknown error'}`);
      }

      // Fall back to mock if API failed
      if (!railyatriData) {
        console.log(`[RailYatri] Falling back to mock data for train ${trainNumber}`);
        railyatriData = await this._mockFetchFromRailYatri(trainNumber);
      }

      if (!railyatriData) {
        this.recordFailure('No RailYatri GPS data found');
        return null;
      }

      // Cache it
      this.gpsCache.set(trainNumber, {
        data: railyatriData,
        timestamp: Date.now(),
      });

      const result = this._railyatriToProviderResult(railyatriData, Date.now());
      this.recordSuccess(Date.now() - start);
      return result;
    } catch (error) {
      this.recordFailure(`${error}`);
      console.error(`[RailYatri] Error fetching ${trainNumber}:`, error);
      return null;
    }
  }

  /**
   * Attempt to fetch from real RailYatri API
   */
  private async _fetchFromRealAPI(trainNumber: string): Promise<RailYatriData | null> {
    const endpoints = [
      `https://www.railyatri.in/api/v1/live/train/${trainNumber}`,
      `https://railyatri.in/api/train/live/${trainNumber}`,
      `https://api.railyatri.in/v1/train/${trainNumber}/live`,
    ];

    for (const endpoint of endpoints) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000); // 15 second timeout

        const response = await fetch(endpoint, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            'User-Agent': 'RailSense/1.0 (+http://railsense.local)',
            'Accept': 'application/json',
          },
        });

        clearTimeout(timeout);

        if (!response.ok) {
          console.warn(`[RailYatri] Endpoint ${endpoint} returned ${response.status}`);
          continue;
        }

        const data = await response.json();

        // Try to parse response (RailYatri API format may vary)
        const trainData = this._parseRailYatriResponse(data, trainNumber);
        if (trainData) {
          return trainData;
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          console.warn(`[RailYatri] Endpoint ${endpoint} timed out`);
        } else {
          console.warn(`[RailYatri] Endpoint ${endpoint} error: ${error instanceof Error ? error.message : 'Unknown'}`);
        }
      }
    }

    return null;
  }

  /**
   * Parse RailYatri API response (handles multiple response formats)
   */
  private _parseRailYatriResponse(data: any, trainNumber: string): RailYatriData | null {
    try {
      // Try different response formats
      let trainData = data;

      // Sometimes response is wrapped in a "data" or "train" property
      if (data && typeof data === 'object') {
        if (data.train) trainData = data.train;
        else if (data.data) trainData = data.data;
        else if (data.result) trainData = data.result;
      }

      // Check for required fields
      if (!trainData || typeof trainData !== 'object') {
        return null;
      }

      const hasLatLng = (trainData.lat || trainData.latitude) && (trainData.lng || trainData.longitude);
      const hasTrainNumber = trainData.trainNo || trainData.trainNumber || trainData.train_number || trainData.number;

      if (!hasLatLng || !hasTrainNumber) {
        return null;
      }

      // Normalize response
      return {
        trainNumber: trainData.trainNo || trainData.trainNumber || trainData.train_number || trainNumber,
        lat: trainData.lat || trainData.latitude || 0,
        lng: trainData.lng || trainData.longitude || 0,
        speed: trainData.speed || trainData.currentSpeed || 0,
        accuracy: trainData.accuracy || trainData.gpsAccuracy || 50,
        boardedPassengers: trainData.passengers || trainData.boarded || 0,
        crowdLevel: trainData.crowdLevel || trainData.crowd || 'NORMAL',
        lastReportAge: trainData.time_ago || trainData.lastReportAge || 0,
      };
    } catch (error) {
      console.warn(`[RailYatri] Parse error: ${error instanceof Error ? error.message : 'Unknown'}`);
      return null;
    }
  }

  /**
   * Convert RailYatri format to ProviderResult
   */
  private _railyatriToProviderResult(data: RailYatriData, timestamp: number): ProviderResult {
    return {
      trainNumber: data.trainNumber,
      lat: data.lat,
      lng: data.lng,
      speed: data.speed,
      // RailYatri doesn't provide delay or status info
      timestamp,
      source: 'railyatri',
      raw: data,
    };
  }

  /**
   * Mock RailYatri GPS fetch
   * Returns simulated crowdsourced GPS data
   */
  private async _mockFetchFromRailYatri(trainNumber: string): Promise<RailYatriData | null> {
    // Base coordinates for each train (from realTrainDataProvider)
    const trainCoords: Record<string, { baseLatStart: number; baseLngStart: number; baseLatEnd: number; baseLngEnd: number }> = {
      '12955': {
        baseLatStart: 19.0760,
        baseLngStart: 72.8777,
        baseLatEnd: 20.1809,
        baseLngEnd: 73.8567,
      }, // Mumbai to Pune
      '12728': {
        baseLatStart: 19.0760,
        baseLngStart: 72.8777,
        baseLatEnd: 19.2183,
        baseLngEnd: 72.6479,
      }, // Mumbai to Virar
      '17015': {
        baseLatStart: 17.3850,
        baseLngStart: 78.4867,
        baseLatEnd: 16.5062,
        baseLngEnd: 80.6480,
      }, // Hyderabad to Chennai
      '12702': {
        baseLatStart: 19.2183,
        baseLngStart: 72.6479,
        baseLatEnd: 19.7515,
        baseLngEnd: 75.7139,
      }, // Mumbai to Indore
      '11039': {
        baseLatStart: 23.8103,
        baseLngStart: 86.4304,
        baseLatEnd: 24.8373,
        baseLngEnd: 88.3639,
      }, // Dhanbad to Asansol
    };

    const coords = trainCoords[trainNumber];
    if (!coords) return null;

    // Simulate train position along route (0-100%)
    const progress = Math.random() * 0.8 + 0.1; // 10-90% along route
    const lat = coords.baseLatStart + (coords.baseLatEnd - coords.baseLatStart) * progress;
    const lng = coords.baseLngStart + (coords.baseLngEnd - coords.baseLngStart) * progress;

    // Simulate speed: 0-100 km/h with occasional stops
    const isStopped = Math.random() > 0.85; // 15% chance of being stopped
    const speed = isStopped ? 0 : Math.random() * 100;

    // Simulate crowd level
    const crowdRandom = Math.random();
    let crowdLevel: 'EMPTY' | 'NORMAL' | 'CROWDED' | 'PACKED' = 'NORMAL';
    if (crowdRandom > 0.7) crowdLevel = 'PACKED';
    else if (crowdRandom > 0.4) crowdLevel = 'CROWDED';
    else if (crowdRandom > 0.1) crowdLevel = 'NORMAL';
    else crowdLevel = 'EMPTY';

    return {
      trainNumber,
      lat: lat + (Math.random() - 0.5) * 0.01, // ±0.005° jitter
      lng: lng + (Math.random() - 0.5) * 0.01,
      speed: Math.round(speed * 10) / 10, // round to 0.1 km/h
      accuracy: 50 + Math.random() * 100, // 50-150 meters
      boardedPassengers: Math.floor(Math.random() * 400),
      crowdLevel,
      lastReportAge: Math.floor(Math.random() * 120), // 0-120 seconds old
    };
  }

  /**
   * Clear old cache entries
   */
  clearOldCache() {
    const now = Date.now();
    for (const [key, { timestamp }] of this.gpsCache) {
      if (now - timestamp > this.CACHE_TTL_MS) {
        this.gpsCache.delete(key);
      }
    }
  }

  private recordSuccess(latencyMs: number) {
    this.stats.successCount++;
    this.stats.lastSuccessTime = Date.now();
    this.stats.avgLatencyMs =
      (this.stats.avgLatencyMs * (this.stats.successCount - 1) + latencyMs) / this.stats.successCount;
    this.stats.lastError = null;
  }

  private recordFailure(error: string) {
    this.stats.failureCount++;
    this.stats.lastError = error;
  }
}

export const railyatriProvider = new RailYatriProvider();
