/**
 * Prediction Engine
 * Calculates expected wait times based on multiple factors
 * Provides confidence levels for predictions
 */

import { TrainData, TrafficAnalysis, PredictionResult, WeatherData } from '@/types/train';
import { getTrafficWaitFactor } from './trafficAnalyzer';

/**
 * Base waiting times by section (in minutes)
 * Can be customized based on historical data
 */
const BASE_SECTION_WAITS: { [key: string]: number } = {
  // Default base wait (if section not specified)
  default: 8,
  // Specific high-traffic sections
  'Kazipet-Warangal': 12,
  'Hyderabad-Secunderabad': 10,
};

/**
 * Weather impact factors on train operations
 */
const WEATHER_FACTORS = {
  clear: 0,
  cloudy: 0.5,
  rainy: 2,
  stormy: 4,
  foggy: 1.5,
  extreme: 5,
};

/**
 * Get base wait time for a section
 * Falls back to default if specific section not configured
 */
function getBaseSectionWait(fromStationName: string, toStationName: string): number {
  const sectionKey = `${fromStationName}-${toStationName}`;

  return BASE_SECTION_WAITS[sectionKey] || BASE_SECTION_WAITS.default;
}

/**
 * Calculate weather factor (multiplier for wait time)
 * Returns 1.0 for no impact, >1.0 for negative weather impact
 */
function calculateWeatherFactor(weather?: WeatherData): number {
  if (!weather) {
    return 1.0;
  }

  const condition = weather.condition.toLowerCase();

  // Check for specific weather conditions
  if (condition.includes('storm')) return WEATHER_FACTORS.stormy;
  if (condition.includes('rain')) return WEATHER_FACTORS.rainy;
  if (condition.includes('fog')) return WEATHER_FACTORS.foggy;
  if (condition.includes('cloudy')) return WEATHER_FACTORS.cloudy;

  return WEATHER_FACTORS.clear;
}

/**
 * Calculate delay carryover factor
 * Existing delays can indicate ongoing issues
 */
function calculateDelayCarryoverFactor(delayMinutes: number): number {
  if (delayMinutes === 0) return 1.0;
  if (delayMinutes < 5) return 1.1; // 10% increase for small delay
  if (delayMinutes < 15) return 1.25; // 25% increase for moderate delay
  return 1.4; // 40% increase for significant delay
}

/**
 * Main prediction function
 * Calculates expected wait time range with confidence
 *
 * Formula:
 * min_wait = base_wait + (traffic_factor × trains_nearby) + (weather_factor × conditions)
 * max_wait = min_wait × 1.5 (for uncertainty margin)
 * confidence = based on variance of factors
 */
export function predictNextWaitTime(
  trainData: TrainData,
  traffic: TrafficAnalysis,
  weather?: WeatherData
): PredictionResult {
  const { currentStationIndex, scheduledStations, delay } = trainData;

  // Determine next section
  let baseWait = BASE_SECTION_WAITS.default;

  if (currentStationIndex < scheduledStations.length - 1) {
    const currentStation = scheduledStations[currentStationIndex];
    const nextStation = scheduledStations[currentStationIndex + 1];
    baseWait = getBaseSectionWait(currentStation.name, nextStation.name);
  }

  // Calculate factors
  const trafficFactor = getTrafficWaitFactor(traffic.congestionLevel);
  const weatherFactor = calculateWeatherFactor(weather);
  const delayFactor = calculateDelayCarryoverFactor(delay);

  // Calculate wait times
  const minWait = baseWait * trafficFactor * weatherFactor * delayFactor;

  // Max wait with uncertainty margin (1.5x the minimum)
  const maxWait = minWait * 1.5;

  // Calculate confidence based on number of factors
  // More trains detected = higher confidence
  // Weather = lower confidence (unpredictable)
  let confidence = 75; // Base confidence

  if (traffic.nearbyTrainsCount > 3) confidence += 10; // More data = more confident
  if (weather && weather.precipitation) confidence -= 15; // Weather reduces confidence
  if (delay > 20) confidence -= 10; // Large delays = less predictable

  // Clamp confidence between 40-95
  confidence = Math.max(40, Math.min(95, confidence));

  return {
    minWait: parseFloat(minWait.toFixed(1)),
    maxWait: parseFloat(maxWait.toFixed(1)),
    confidence: confidence,
    baseWait: parseFloat(baseWait.toFixed(1)),
    trafficFactor: parseFloat(trafficFactor.toFixed(2)),
    weatherFactor: parseFloat(weatherFactor.toFixed(2)),
  };
}

/**
 * Format prediction as human-readable string
 * Example: "Expected 8-12 minutes (75% confidence)"
 */
export function formatPrediction(prediction: PredictionResult): string {
  const minRound = Math.round(prediction.minWait);
  const maxRound = Math.round(prediction.maxWait);

  return `${minRound}-${maxRound} minutes (${prediction.confidence}% confidence)`;
}

/**
 * Get prediction confidence level
 */
export function getConfidenceLevel(prediction: PredictionResult): 'LOW' | 'MEDIUM' | 'HIGH' {
  if (prediction.confidence >= 80) return 'HIGH';
  if (prediction.confidence >= 60) return 'MEDIUM';
  return 'LOW';
}

/**
 * Break down prediction components for detailed explanation
 */
export function explainPrediction(prediction: PredictionResult): {
  baseWait: string;
  trafficImpact: string;
  weatherImpact: string;
  finalEstimate: string;
} {
  const trafficPercent = Math.round((prediction.trafficFactor - 1) * 100);
  const weatherPercent = Math.round((prediction.weatherFactor - 1) * 100);

  return {
    baseWait: `Base wait: ${prediction.baseWait} min`,
    trafficImpact:
      trafficPercent > 0 ? `+${trafficPercent}% due to traffic` : 'No traffic impact',
    weatherImpact: weatherPercent > 0 ? `+${weatherPercent}% due to weather` : 'Clear weather',
    finalEstimate: `${prediction.minWait}-${prediction.maxWait} min expected`,
  };
}

/**
 * Determine if wait is unusually long
 */
export function isUnusuallyLongWait(prediction: PredictionResult): boolean {
  // Unusual if predicted wait exceeds 30 minutes
  return prediction.maxWait > 30;
}

/**
 * Get worst-case scenario wait time
 * Adds additional buffer for extreme uncertainty
 */
export function getWorstCaseWait(prediction: PredictionResult): number {
  // If confidence is low, provide higher worst-case
  if (prediction.confidence < 60) {
    return prediction.maxWait * 1.25;
  }

  return prediction.maxWait;
}

/**
 * Compare two predictions to see if situation is improving
 */
export function comparePredictions(
  current: PredictionResult,
  previous: PredictionResult
): 'improving' | 'stable' | 'worsening' {
  const difference = current.maxWait - previous.maxWait;

  if (difference > 2) return 'worsening'; // More than 2 min increase
  if (difference < -2) return 'improving'; // More than 2 min decrease
  return 'stable';
}
