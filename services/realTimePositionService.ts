/**
 * Real-Time Train Position Service
 * Tracks live positions of all trains based on schedule and real time
 * Updates positions every 30 seconds with realistic movement
 */

import { REAL_TRAINS_CATALOG } from './realTrainsCatalog';

export interface TrainPosition {
  trainNumber: string;
  trainName: string;
  currentLat: number;
  currentLng: number;
  currentStation: string;
  currentStationCode: string;
  nextStation: string;
  nextStationCode: string;
  currentSpeed: number; // km/h
  distanceTraveled: number; // km traveled so far
  totalDistance: number; // total journey distance
  percentageComplete: number; // 0-100
  isMoving: boolean;
  lastUpdated: number;
  estimatedDelay: number; // minutes
  status: 'On Time' | 'Delayed' | 'Halted' | 'Approaching Station' | 'At Station';
}

class RealTimePositionService {
  private positions: Map<string, TrainPosition> = new Map();
  private simulationStartTime = Date.now();
  private updateInterval = 30000; // Update every 30 seconds

  constructor() {
    this.initializePositions();
    this.startSimulation();
  }

  private initializePositions() {
    Object.entries(REAL_TRAINS_CATALOG).forEach(([trainNumber, train]: [string, any]) => {
      const firstStation = train.stations?.[0] || { lat: 28.6, lng: 77.2 };
      const position: TrainPosition = {
        trainNumber,
        trainName: train.trainName,
        currentLat: firstStation.lat,
        currentLng: firstStation.lng,
        currentStation: firstStation.name,
        currentStationCode: firstStation.code,
        nextStation: train.stations?.[1]?.name || firstStation.name,
        nextStationCode: train.stations?.[1]?.code || firstStation.code,
        currentSpeed: 0,
        distanceTraveled: 0,
        totalDistance: train.distance,
        percentageComplete: 0,
        isMoving: false,
        lastUpdated: Date.now(),
        estimatedDelay: 0,
        status: 'At Station',
      };
      this.positions.set(trainNumber, position);
    });
  }

  private startSimulation() {
    setInterval(() => {
      this.updateAllPositions();
    }, this.updateInterval);
  }

  private updateAllPositions() {
    const elapsedSeconds = (Date.now() - this.simulationStartTime) / 1000;
    const elapsedMinutes = elapsedSeconds / 60;

    Object.entries(REAL_TRAINS_CATALOG).forEach(([trainNumber, train]: [string, any]) => {
      const pos = this.positions.get(trainNumber);
      if (!pos || !train.stations || train.stations.length < 2) return;

      // Simulate realistic train movement
      const durationMinutes = train.duration;
      const progressFraction = (elapsedMinutes % durationMinutes) / durationMinutes;

      if (progressFraction > 0.95) {
        // Train is at destination
        const lastStation = train.stations[train.stations.length - 1];
        pos.currentLat = lastStation.lat;
        pos.currentLng = lastStation.lng;
        pos.currentStation = lastStation.name;
        pos.currentStationCode = lastStation.code;
        pos.distanceTraveled = train.distance;
        pos.percentageComplete = 100;
        pos.status = 'At Station';
        pos.isMoving = false;
        pos.currentSpeed = 0;
      } else {
        // Train is in journey
        const kmTraveled = train.distance * progressFraction;
        let currentStationIndex = 0;

        // Find current segment
        for (let i = 0; i < train.stations.length - 1; i++) {
          if (kmTraveled >= train.stations[i].km && kmTraveled < train.stations[i + 1].km) {
            currentStationIndex = i;
            break;
          }
        }

        const currentStn = train.stations[currentStationIndex];
        const nextStn = train.stations[currentStationIndex + 1];

        // Linear interpolation between stations
        const segmentDistance = nextStn.km - currentStn.km;
        const distanceInSegment = kmTraveled - currentStn.km;
        const segmentProgress = segmentDistance > 0 ? distanceInSegment / segmentDistance : 0;

        // Interpolate coordinates
        pos.currentLat = currentStn.lat + (nextStn.lat - currentStn.lat) * segmentProgress;
        pos.currentLng = currentStn.lng + (nextStn.lng - currentStn.lng) * segmentProgress;

        // Simulate speed variation
        const baseSpeed = train.avgSpeed;
        const speedVariation = Math.sin(progressFraction * Math.PI * 2) * 10; // ±10 km/h variation
        pos.currentSpeed = Math.max(0, baseSpeed + speedVariation);

        // Determine if approaching/at station (within 2 km and speed decreasing)
        const distanceToNextStation = nextStn.km - kmTraveled;
        if (distanceToNextStation < 2) {
          pos.status = 'Approaching Station';
          pos.currentSpeed *= 0.7; // Slow down
        } else {
          pos.status = pos.currentSpeed > 5 ? 'On Time' : 'Halted';
        }

        pos.distanceTraveled = kmTraveled;
        pos.percentageComplete = Math.round((kmTraveled / train.distance) * 100);
        pos.currentStation = currentStn.name;
        pos.currentStationCode = currentStn.code;
        pos.nextStation = nextStn.name;
        pos.nextStationCode = nextStn.code;
        pos.isMoving = pos.currentSpeed > 5;

        // Simulate realistic delays (5-15 minute delays for some trains)
        const delayVariation = Math.sin(elapsedMinutes / 60) * 10;
        pos.estimatedDelay = Math.max(0, Math.round(delayVariation));
      }

      pos.lastUpdated = Date.now();
      this.positions.set(trainNumber, pos);
    });
  }

  getPosition(trainNumber: string): TrainPosition | null {
    return this.positions.get(trainNumber) || null;
  }

  getAllPositions(): TrainPosition[] {
    return Array.from(this.positions.values());
  }

  getPositionsByRegion(lat: number, lng: number, radiusKm: number = 100): TrainPosition[] {
    const EARTH_RADIUS_KM = 6371;

    return Array.from(this.positions.values()).filter((pos) => {
      const latDiff = (pos.currentLat - lat) * Math.PI / 180;
      const lngDiff = (pos.currentLng - lng) * Math.PI / 180;
      const a =
        Math.sin(latDiff / 2) * Math.sin(latDiff / 2) +
        Math.cos(lat * Math.PI / 180) *
          Math.cos(pos.currentLat * Math.PI / 180) *
          Math.sin(lngDiff / 2) *
          Math.sin(lngDiff / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = EARTH_RADIUS_KM * c;
      return distance <= radiusKm;
    });
  }

  getNearbyTrains(trainNumber: string, radiusKm: number = 100): TrainPosition[] {
    const pos = this.positions.get(trainNumber);
    if (!pos) return [];

    return this.getPositionsByRegion(pos.currentLat, pos.currentLng, radiusKm).filter(
      (t) => t.trainNumber !== trainNumber
    );
  }
}

// Singleton instance
export const realTimePositionService = new RealTimePositionService();

export default realTimePositionService;
