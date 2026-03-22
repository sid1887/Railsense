'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { AlertTriangle, Clock3, Gauge, LocateFixed, Radar, ShieldCheck } from 'lucide-react';
import TrainMapViewer from './TrainMapViewer';
import RouteTimeline from './RouteTimeline';
import { TrainAnalytics, MovementState } from '@/types/analytics';

interface TrainDetailPageProps {
  trainNumber: string;
}

interface UnifiedTrainResponse {
  trainNumber: string;
  trainName: string;
  currentLocation: {
    station: string;
    stationCode: string;
    latitude: number;
    longitude: number;
    timestamp: number;
  };
  nextStation: {
    station: string;
    stationCode: string;
    estimatedArrival: string;
  };
  liveMetrics: {
    delay: number;
    speed: number;
    status: 'running' | 'halted' | 'delayed' | 'on-time';
  };
  route: {
    source: string;
    destination: string;
    currentStationIndex: number;
    allStations: Array<{
      name: string;
      code: string;
      scheduledArrival: string;
      estimatedArrival: string;
    }>;
  };
  networkIntelligence: {
    nearbyTrains: Array<{ trainNumber: string; distance: number }>;
    congestionLevel: 'low' | 'medium' | 'high' | 'severe';
    congestionScore: number;
  };
  dwellPrediction: {
    expectedDwellTime: number;
    dwellRisk: 'low' | 'medium' | 'high';
    reasons: string[];
  };
  crossingRisk: {
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    hasOpposingTrain: boolean;
    timeToConflict: number;
  };
  platformOccupancy: {
    platformLoad: number;
    waitingProbability: number;
    expectedWaitTime: number;
  };
  prediction: {
    eta: string;
    confidence: number;
    delayForecast: number;
  };
  dataQuality: {
    liveGPS: boolean;
    liveUnavailable: boolean;
    predictionStrength: string;
    sources: string[];
  };
  lastUpdated: number;
}

interface TimelineStation {
  name: string;
  code: string;
  scheduledTime: string;
  actualTime?: string;
  status: 'completed' | 'current' | 'upcoming';
  delayMinutes?: number;
}

const statusMap: Record<UnifiedTrainResponse['liveMetrics']['status'], MovementState> = {
  running: 'running',
  halted: 'halted',
  delayed: 'stopped',
  'on-time': 'running',
};

function getTimeline(stations: UnifiedTrainResponse['route']['allStations'], currentIndex: number, delay: number): TimelineStation[] {
  return (stations || []).map((station, index) => ({
    name: station.name,
    code: station.code,
    scheduledTime: station.scheduledArrival || '--:--',
    actualTime: station.estimatedArrival || station.scheduledArrival || '--:--',
    status: index < currentIndex ? 'completed' : index === currentIndex ? 'current' : 'upcoming',
    delayMinutes: delay > 0 ? delay : 0,
  }));
}

function toAnalytics(data: UnifiedTrainResponse): TrainAnalytics {
  return {
    trainNumber: data.trainNumber,
    trainName: data.trainName,
    movementState: statusMap[data.liveMetrics.status] || 'running',
    speed: data.liveMetrics.speed,
    delay: data.liveMetrics.delay,
    confidence: data.prediction.confidence,
    haltConfidence: data.prediction.confidence,
    destinationStation: data.route.destination,
    currentLocation: {
      stationName: data.currentLocation.station,
      stationCode: data.currentLocation.stationCode,
      latitude: data.currentLocation.latitude,
      longitude: data.currentLocation.longitude,
    },
    nextMajorStop: {
      stationName: data.nextStation.station,
      stationCode: data.nextStation.stationCode,
      distance: 0,
      estimatedArrival: data.nextStation.estimatedArrival,
    },
    haltAnalysis: {
      isHalted: data.liveMetrics.status === 'halted',
    },
    waitTimePrediction: {
      breakdown: {
        baseStopDuration: 3,
        trafficDelay: data.networkIntelligence.congestionScore > 65 ? 4 : 1,
        weatherDelay: 0,
        delayCarryover: Math.max(0, data.liveMetrics.delay * 0.5),
        operationalDelay: data.platformOccupancy.expectedWaitTime,
        totalWaitTime: data.platformOccupancy.expectedWaitTime + data.dwellPrediction.expectedDwellTime,
        confidence: data.prediction.confidence,
      },
      range: {
        min: Math.max(0, data.platformOccupancy.expectedWaitTime - 2),
        max: data.platformOccupancy.expectedWaitTime + 3,
      },
      isUnusual: data.crossingRisk.riskLevel === 'high' || data.crossingRisk.riskLevel === 'critical',
    },
    nearbyTrains: {
      count: data.networkIntelligence.nearbyTrains.length,
      trains: data.networkIntelligence.nearbyTrains.map((t) => ({
        trainNumber: t.trainNumber,
        trainName: t.trainNumber,
        distance: t.distance,
        movementState: 'running',
      })),
      congestion_level:
        data.networkIntelligence.congestionLevel === 'severe'
          ? 'HIGH'
          : data.networkIntelligence.congestionLevel === 'high'
            ? 'HIGH'
            : data.networkIntelligence.congestionLevel === 'medium'
              ? 'MEDIUM'
              : 'LOW',
    },
    sectionAnalytics: {
      networkHeatmap: {
        congestionScore: data.networkIntelligence.congestionScore,
      },
    },
    recommendedAction:
      data.crossingRisk.riskLevel === 'critical'
        ? 'Critical crossing risk detected. Trigger high-priority operational review.'
        : data.liveMetrics.delay > 20
          ? 'Delay escalation likely. Pre-notify downstream stations.'
          : 'Monitor route and continue predictive updates.',
    lastUpdated: new Date(data.lastUpdated).toISOString(),
  };
}

export default function TrainDetailPage({ trainNumber }: TrainDetailPageProps) {
  const [data, setData] = useState<UnifiedTrainResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/train-details?trainNumber=${encodeURIComponent(trainNumber)}`, {
        cache: 'no-store',
      });

      if (!res.ok) {
        throw new Error(`Failed to load train ${trainNumber} (${res.status})`);
      }

      const payload = (await res.json()) as UnifiedTrainResponse;
      setData(payload);
    } catch (err: any) {
      setError(err?.message || 'Unable to load train details');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [trainNumber]);

  useEffect(() => {
    fetchData();
    const timer = window.setInterval(fetchData, 30000);
    return () => window.clearInterval(timer);
  }, [fetchData]);

  const analytics = useMemo(() => (data ? toAnalytics(data) : null), [data]);
  const timeline = useMemo(() => {
    if (!data) return [];
    return getTimeline(data.route.allStations, data.route.currentStationIndex, data.liveMetrics.delay);
  }, [data]);

  if (loading && !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-200">
        <div className="surface-glass rounded-2xl px-7 py-5 text-sm">Loading live train intelligence...</div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="mx-auto min-h-screen max-w-3xl px-4 pt-24">
        <div className="rounded-2xl border border-red-400/35 bg-red-500/10 p-6">
          <h2 className="mb-2 text-xl font-bold text-red-300">Unable to Load Train Data</h2>
          <p className="mb-4 text-sm text-red-100/90">{error}</p>
          <button
            onClick={fetchData}
            className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-400"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data || !analytics) {
    return null;
  }

  const riskTone =
    data.crossingRisk.riskLevel === 'critical'
      ? 'text-red-300 bg-red-500/15 border-red-400/30'
      : data.crossingRisk.riskLevel === 'high'
        ? 'text-orange-300 bg-orange-500/15 border-orange-400/30'
        : 'text-cyan-300 bg-cyan-500/15 border-cyan-400/30';

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_10%_0%,#17345e_0%,#0b132a_40%,#090d1f_100%)] px-4 pb-14 pt-7 md:px-7">
      <div className="mx-auto max-w-7xl space-y-6">
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          className="surface-glass rounded-3xl p-6"
        >
          <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-300">Live Train Command View</p>
              <h1 className="text-3xl font-black text-white md:text-4xl">{data.trainName}</h1>
              <p className="mt-1 text-sm text-slate-300">
                {data.trainNumber} • {data.route.source} → {data.route.destination}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs font-semibold">
              <span className="rounded-lg border border-cyan-400/30 bg-cyan-500/10 px-3 py-1 text-cyan-200">
                Last update: {new Date(data.lastUpdated).toLocaleTimeString()}
              </span>
              <span className={`rounded-lg border px-3 py-1 ${riskTone}`}>
                Crossing Risk: {data.crossingRisk.riskLevel.toUpperCase()}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
            <Metric title="Current Speed" value={`${data.liveMetrics.speed} km/h`} icon={<Gauge className="h-4 w-4" />} />
            <Metric title="Live Delay" value={`${data.liveMetrics.delay} min`} icon={<Clock3 className="h-4 w-4" />} />
            <Metric title="Congestion" value={`${data.networkIntelligence.congestionScore}%`} icon={<Radar className="h-4 w-4" />} />
            <Metric title="Dwell" value={`${data.dwellPrediction.expectedDwellTime} min`} icon={<LocateFixed className="h-4 w-4" />} />
            <Metric title="ETA Confidence" value={`${data.prediction.confidence}%`} icon={<ShieldCheck className="h-4 w-4" />} />
            <Metric title="Platform Load" value={`${data.platformOccupancy.platformLoad}%`} icon={<AlertTriangle className="h-4 w-4" />} />
          </div>
        </motion.section>

        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="surface-glass rounded-2xl p-4">
            <h2 className="mb-3 text-lg font-bold text-white">Route Map and Live Position</h2>
            <TrainMapViewer analytics={analytics} />
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="space-y-4">
            <div className="surface-glass rounded-2xl p-4">
              <h3 className="mb-2 text-sm font-bold uppercase tracking-[0.08em] text-cyan-200">Predictive Signals</h3>
              <ul className="space-y-2 text-sm text-slate-200">
                <li>Next station: {data.nextStation.station}</li>
                <li>Forecast delay: {data.prediction.delayForecast} min</li>
                <li>Waiting probability: {Math.round(data.platformOccupancy.waitingProbability * 100)}%</li>
                <li>Nearby trains: {data.networkIntelligence.nearbyTrains.length}</li>
              </ul>
            </div>

            <div className="surface-glass rounded-2xl p-4">
              <h3 className="mb-2 text-sm font-bold uppercase tracking-[0.08em] text-cyan-200">Data Quality</h3>
              <ul className="space-y-2 text-sm text-slate-200">
                <li>Live GPS: {data.dataQuality.liveGPS ? 'Available' : 'Unavailable'}</li>
                <li>Prediction strength: {data.dataQuality.predictionStrength}</li>
                <li>Source(s): {data.dataQuality.sources.join(', ') || 'N/A'}</li>
              </ul>
            </div>

            <div className="surface-glass rounded-2xl p-4">
              <h3 className="mb-2 text-sm font-bold uppercase tracking-[0.08em] text-cyan-200">Jump to Intelligence</h3>
              <div className="grid grid-cols-1 gap-2 text-sm">
                <Link href={`/test-network-intelligence?trainNumber=${data.trainNumber}`} className="rounded-lg border border-slate-700 bg-slate-900/45 px-3 py-2 hover:border-cyan-300/35">Network Intelligence</Link>
                <Link href={`/test-halt-analysis?trainNumber=${data.trainNumber}`} className="rounded-lg border border-slate-700 bg-slate-900/45 px-3 py-2 hover:border-cyan-300/35">Halt Analysis</Link>
                <Link href={`/test-passenger-safety?trainNumber=${data.trainNumber}`} className="rounded-lg border border-slate-700 bg-slate-900/45 px-3 py-2 hover:border-cyan-300/35">Passenger Safety</Link>
              </div>
            </div>
          </motion.div>
        </section>

        <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
          <RouteTimeline stations={timeline} />
        </motion.section>
      </div>
    </div>
  );
}

function Metric({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-slate-700/80 bg-slate-950/45 px-3 py-3">
      <p className="mb-1 flex items-center gap-1 text-[11px] uppercase tracking-[0.11em] text-slate-400">
        {icon}
        {title}
      </p>
      <p className="text-sm font-bold text-cyan-100">{value}</p>
    </div>
  );
}
