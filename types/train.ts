/**
 * Core type definitions for RailSense
 * Defines all data structures used throughout the application
 */

export interface TrainLocation {
  latitude: number;
  longitude: number;
  timestamp: number;
  // Track snapping metadata (optional)
  snappingDistance?: number; // km from original position
  trackSegmentId?: string; // ID of snapped track segment
  trackSegmentName?: string; // Name of snapped track segment
}

export type TrainDataSource = 'ntes' | 'railyatri' | 'schedule' | 'synthetic' | 'merged';

export interface TrainData {
  trainNumber: string;
  trainName: string;
  source: TrainDataSource;
  dataQuality: number; // 0-100 score
  isSynthetic: boolean;
  destination: string;
  currentLocation: TrainLocation;
  speed: number; // km/h, 0 if halted
  scheduledStations: Station[];
  currentStationIndex: number;
  delay: number; // minutes
  status?: string; // 'Running', 'On Time', 'Delayed', etc. from NTES
  lastUpdated: number; // timestamp of last update
}

export interface Station {
  name: string;
  scheduledArrival: string;
  estimatedArrival?: string;
  scheduledDeparture: string;
  estimatedDeparture?: string;
  latitude: number;
  longitude: number;
  isHalted?: boolean;
}

export interface HaltDetection {
  halted: boolean;
  haltDuration?: number; // minutes
  haltStartTime?: number;
  detectedAt?: TrainLocation;
  reason?: string;
}

export interface TrafficAnalysis {
  congestionLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  nearbyTrainsCount: number;
  nearbyTrains: TrainInfo[];
  radiusKm: number;
}

export interface TrainInfo {
  trainNumber: string;
  trainName: string;
  distance: number; // km from reference train
  location: TrainLocation;
}

export interface PredictionResult {
  minWait: number; // minutes
  maxWait: number; // minutes
  confidence: number; // 0-100
  baseWait: number;
  trafficFactor: number;
  weatherFactor: number;
}

export type UncertaintyLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface UncertaintyIndex {
  level: UncertaintyLevel;
  score: number; // 0-100
  factors: {
    haltDuration: number;
    trafficDensity: number;
    weatherRisk: number;
  };
}

export interface PassengerInsight {
  headline: string;
  details: string;
  estimatedWait: string;
  uncertainty: UncertaintyLevel;
  recommendations: string[];
  timestamp: number;
}

export interface TrainInsightData {
  trainData: TrainData;
  haltDetection: HaltDetection;
  trafficAnalysis: TrafficAnalysis;
  prediction: PredictionResult;
  uncertainty: UncertaintyIndex;
  insight: PassengerInsight;
}

export interface WeatherData {
  temperature: number;
  condition: string;
  visibility: number;
  windSpeed: number;
  precipitation: boolean;
  code: string; // weather condition code
}

export interface RouteSection {
  startStation: Station;
  endStation: Station;
  typicalTravelTime: number; // minutes
  frequentHaltReasons: string[];
  congestionHistory: 'LOW' | 'MEDIUM' | 'HIGH';
}
