/**
 * Train Data Service
 * Handles fetching train data from APIs or mock data
 * Provides fallback mechanism for demo mode
 */

import axios from 'axios';
import { TrainData } from '@/types/train';
import mockData from '@/public/mockTrainData.json';
import { getLiveTrainPosition } from './railYatriService';
import { verifyTrainOnTrack } from './railwayMapService';
import { logger } from './logger';

/**
 * Simulates real train movement by slightly modifying mock data
 * Increments location and updates delay for realistic demo
 */
function simulateTrainMovement(train: TrainData): TrainData {
  // Simulate slight movement on map
  const latVariation = (Math.random() - 0.5) * 0.01;
  const lonVariation = (Math.random() - 0.5) * 0.01;

  // Simulate speed changes
  let speedVariation = Math.random() * 10 - 5;
  let newSpeed = Math.max(0, train.speed + speedVariation);
  if (newSpeed > 0 && Math.random() > 0.8) newSpeed = 0; // Random stop

  // Simulate delay changes
  const delayVariation = Math.random() * 3 - 1.5;
  const newDelay = Math.max(0, train.delay + delayVariation);

  return {
    ...train,
    currentLocation: {
      ...train.currentLocation,
      latitude: train.currentLocation.latitude + latVariation,
      longitude: train.currentLocation.longitude + lonVariation,
      timestamp: Date.now(),
    },
    speed: parseFloat(newSpeed.toFixed(2)),
    delay: parseFloat(newDelay.toFixed(2)),
  };
}

/**
 * Fetch train data from mock JSON
 * Used as fallback when API is unavailable
 */
async function fetchMockTrainData(trainNumber: string): Promise<TrainData | null> {
  try {
    const mockTrain = (mockData as any).trains.find(
      (train: TrainData) =>
        train.trainNumber.toLowerCase() === trainNumber.toLowerCase() ||
        train.trainName.toLowerCase().includes(trainNumber.toLowerCase())
    );

    if (!mockTrain) return null;

    // Simulate live movement
    return simulateTrainMovement(mockTrain);
  } catch (err) {
    console.error('Error fetching mock data:', err);
    return null;
  }
}

/**
 * Fetch train data from external API
 * Returns null if API fails (fallback to mock)
 */
async function fetchFromAPI(trainNumber: string): Promise<TrainData | null> {
  try {
    // Skip API calls in demo/development - use mock data instead
    if (typeof window === 'undefined') {
      // Server-side: skip external API calls
      return null;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api';
    const response = await axios.get(`${apiUrl}/train?trainNumber=${trainNumber}`, {
      timeout: 5000,
    });
    return response.data;
  } catch (err) {
    console.warn('API fetch failed, falling back to mock data:', err);
    return null;
  }
}

/**
 * Fetch live train data from RailYatri
 * Converts RailYatri format to our TrainData format
 */
async function fetchFromRailYatri(trainNumber: string): Promise<TrainData | null> {
  try {
    const liveData = await getLiveTrainPosition(trainNumber);
    if (!liveData) return null;

    // Get base mock train for schedule/stations
    const mockTrain = (mockData as any).trains.find(
      (train: TrainData) =>
        train.trainNumber.toLowerCase() === trainNumber.toLowerCase() ||
        train.trainName.toLowerCase().includes(trainNumber.toLowerCase())
    );

    if (!mockTrain) return null;

    // Verify train is on actual track using OpenRailwayMap
    const onTrack = await verifyTrainOnTrack(liveData.lat, liveData.lng);
    if (!onTrack) {
      console.warn(`[RailYatri] Train ${trainNumber} off-track (data anomaly)`);
      return null;
    }

    // Merge live position with mock schedule data
    const trainData: TrainData = {
      ...mockTrain,
      currentLocation: {
        latitude: liveData.lat,
        longitude: liveData.lng,
        timestamp: liveData.timestamp * 1000, // Convert to ms
      },
      speed: liveData.speed || 0,
      delay: liveData.delay || 0,
    };

    console.log(`[RailYatri] Using live data for train ${trainNumber}`);
    return trainData;
  } catch (err) {
    console.warn(`[RailYatri] Failed to fetch live data for ${trainNumber}`);
    return null;
  }
}

/**
 * Main function to get train data
 * Tries: RailYatri → API → Mock data
 */
export async function getTrainData(trainNumber: string): Promise<TrainData | null> {
  // Normalize input
  const normalized = trainNumber.toUpperCase().trim();

  if (!normalized) {
    throw new Error('Train number is required');
  }

  try {
    // Try RailYatri live data first (real-time GPS)
    const railYatriData = await fetchFromRailYatri(normalized);
    if (railYatriData) return railYatriData;

    // Try custom API second
    if (process.env.NEXT_PUBLIC_DEMO_MODE !== 'true') {
      const apiData = await fetchFromAPI(normalized);
      if (apiData) return apiData;
    }

    // Fall back to mock data
    const mockDataResult = await fetchMockTrainData(normalized);
    if (mockDataResult) {
      console.log(`[Demo Mode] Using simulated data for train ${normalized}`);
      return mockDataResult;
    }

    // Not found
    console.warn(`Train ${normalized} not found in any data source`);
    return null;
  } catch (err) {
    console.error('Error in getTrainData:', err);
    throw err;
  }
}

/**
 * Get multiple trains data (for traffic analysis)
 * Useful for finding nearby trains
 */
export async function getNearbyTrainsData(): Promise<TrainData[]> {
  try {
    return (mockData as any).trains.map((train: TrainData) => simulateTrainMovement(train));
  } catch (err) {
    console.error('Error fetching nearby trains:', err);
    return [];
  }
}

/**
 * Get mock configuration data
 * Contains thresholds and factors for analysis
 */
export async function getMockConfig() {
  try {
    return {
      congestionFactors: (mockData as any).congestionFactors,
      defaultWeather: (mockData as any).defaultWeather,
    };
  } catch (err) {
    console.error('Error fetching config:', err);
    return {
      congestionFactors: {
        lowTrafficWait: 5,
        mediumTrafficWait: 12,
        highTrafficWait: 20,
        weatherFactor: 2,
      },
      defaultWeather: {
        temperature: 28,
        condition: 'Partly Cloudy',
        visibility: 10,
        windSpeed: 15,
        precipitation: false,
        code: '02d',
      },
    };
  }
}

/**
 * Search trains by name or number
 * Returns array of matching trains
 */
export async function searchTrains(query: string): Promise<TrainData[]> {
  try {
    const normalized = query.toLowerCase();

    return (mockData as any).trains.filter(
      (train: TrainData) =>
        train.trainNumber.toLowerCase().includes(normalized) ||
        train.trainName.toLowerCase().includes(normalized) ||
        train.source.toLowerCase().includes(normalized) ||
        train.destination.toLowerCase().includes(normalized)
    );
  } catch (err) {
    console.error('Error searching trains:', err);
    return [];
  }
}
