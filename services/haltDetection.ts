/**
 * Halt Detection Engine
 * Detects unexpected train halts and analyzes halt characteristics
 * Core logic for determining if a train has stopped unexpectedly
 */

import { TrainData, Station, HaltDetection } from '@/types/train';
import { calculateDistance } from '@/lib/utils';

/**
 * Threshold constants for halt detection
 * These can be tuned based on real-world requirements
 */
const HALT_THRESHOLDS = {
  SPEED_THRESHOLD: 1, // km/h - below this is considered halted
  MIN_HALT_DURATION: 2, // minutes - minimum duration to be considered significant
  STATION_RADIUS: 0.5, // km - radius around scheduled stations
};

/**
 * Check if a train is at or near a scheduled station
 */
function isAtScheduledStation(
  trainLocation: { latitude: number; longitude: number },
  stations: Station[],
  stationIndex: number
): boolean {
  if (stationIndex < 0 || stationIndex >= stations.length) {
    return false;
  }

  const station = stations[stationIndex];
  const distance = calculateDistance(
    trainLocation.latitude,
    trainLocation.longitude,
    station.latitude,
    station.longitude
  );

  return distance <= HALT_THRESHOLDS.STATION_RADIUS;
}

/**
 * Check if a train is at or near any upcoming scheduled station
 * Accounts for trains approaching next station
 */
function isNearUpcomingStation(
  trainLocation: { latitude: number; longitude: number },
  stations: Station[],
  currentIndex: number
): boolean {
  // Check current and next 2 stations
  for (let i = currentIndex; i <= Math.min(currentIndex + 2, stations.length - 1); i++) {
    const station = stations[i];
    const distance = calculateDistance(
      trainLocation.latitude,
      trainLocation.longitude,
      station.latitude,
      station.longitude
    );

    if (distance <= HALT_THRESHOLDS.STATION_RADIUS * 2) {
      return true;
    }
  }

  return false;
}

/**
 * Calculate halt duration in minutes
 */
function calculateHaltDuration(haltStartTime: number): number {
  return (Date.now() - haltStartTime) / (1000 * 60);
}

/**
 * Determine likely reason for halt based on context
 */
function determineHaltReason(
  train: TrainData,
  haltDuration: number,
  isNearStation: boolean
): string {
  // If near a scheduled station
  if (isNearStation) {
    const currentStation = train.scheduledStations[train.currentStationIndex];
    if (currentStation) {
      return `Halt at ${currentStation.name} (Scheduled stop)`;
    }
  }

  // If significant delay, likely traffic/regulation
  if (train.delay > 20) {
    return 'Traffic regulation or line congestion detected';
  }

  // If moderate duration, could be signal
  if (haltDuration > 5 && haltDuration < 15) {
    return 'Signal delay or maintenance work detected';
  }

  // Long halt, unusual circumstances
  if (haltDuration >= 15) {
    return 'Extended delay - possible track issue or accident';
  }

  return 'Speed regulation or minor delay';
}

/**
 * Main halt detection function
 * Returns detailed halt information if halt is detected
 *
 * Algorithm:
 * 1. Check if speed is below threshold
 * 2. Check if location is NOT at scheduled station
 * 3. Check if halt duration exceeds minimum threshold
 * 4. Return halt details if all conditions met
 */
export function detectUnexpectedHalt(trainData: TrainData): HaltDetection {
  const { currentLocation, speed, scheduledStations, currentStationIndex, delay } = trainData;

  // Check 1: Is train moving?
  const isMoving = speed > HALT_THRESHOLDS.SPEED_THRESHOLD;

  if (isMoving) {
    return {
      halted: false,
    };
  }

  // Check 2: Is this a scheduled station stop?
  const atCurrentStation = isAtScheduledStation(
    currentLocation,
    scheduledStations,
    currentStationIndex
  );

  const nearUncomingStation = isNearUpcomingStation(
    currentLocation,
    scheduledStations,
    currentStationIndex
  );

  // If at or near a scheduled station, it's expected
  if (atCurrentStation || nearUncomingStation) {
    return {
      halted: false,
    };
  }

  // Check 3: Has the halt lasted long enough?
  // For demo purposes, we'll generate a random halt start time within reasonable bounds
  const haltStartTime = Date.now() - (delay * 60 * 1000);
  const haltDuration = calculateHaltDuration(haltStartTime);

  if (haltDuration < HALT_THRESHOLDS.MIN_HALT_DURATION) {
    return {
      halted: false,
    };
  }

  // All conditions met: UNEXPECTED HALT DETECTED
  const reason = determineHaltReason(trainData, haltDuration, false);

  return {
    halted: true,
    haltDuration: parseFloat(haltDuration.toFixed(2)),
    haltStartTime: haltStartTime,
    detectedAt: currentLocation,
    reason: reason,
  };
}

/**
 * Get detailed halt analysis
 * Includes context about the halt section
 */
export function analyzeHalt(trainData: TrainData): HaltDetection & { context?: string } {
  const haltDetection = detectUnexpectedHalt(trainData);

  if (!haltDetection.halted) {
    return haltDetection;
  }

  // Find which section the train is halted in
  const { currentStationIndex, scheduledStations } = trainData;
  let context = '';

  if (currentStationIndex > 0 && currentStationIndex < scheduledStations.length) {
    const prevStation = scheduledStations[currentStationIndex - 1];
    const nextStation = scheduledStations[currentStationIndex];

    context = `Halted between ${prevStation.name} and ${nextStation.name}`;
  }

  return {
    ...haltDetection,
    context,
  };
}

/**
 * Check if halt is critical
 * Critical halts are extended unexpected stops
 */
export function isCriticalHalt(haltDetection: HaltDetection): boolean {
  if (!haltDetection.halted || !haltDetection.haltDuration) {
    return false;
  }

  // Halt is critical if duration exceeds 20 minutes
  return haltDetection.haltDuration > 20;
}

/**
 * Get halt severity level
 * LOW: < 5 minutes, MEDIUM: 5-15 minutes, HIGH: > 15 minutes
 */
export function getHaltSeverity(haltDetection: HaltDetection): 'LOW' | 'MEDIUM' | 'HIGH' | null {
  if (!haltDetection.halted || !haltDetection.haltDuration) {
    return null;
  }

  if (haltDetection.haltDuration < 5) return 'LOW';
  if (haltDetection.haltDuration < 15) return 'MEDIUM';
  return 'HIGH';
}
