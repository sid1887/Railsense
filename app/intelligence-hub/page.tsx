'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Train,
  AlertTriangle,
  TrendingUp,
  Clock,
  MapPin,
  Activity,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { useTrainContext } from '@/contexts/TrainContext';

interface DisplayTrain {
  number: string;
  name: string;
  status: 'moving' | 'halted' | 'delayed';
  currentStation: string;
  delayMinutes: number;
  confidence: number;
  speedKmph: number;
}

interface HubStats {
  activeTrains: number;
  haltedTrains: number;
  avgDelay: number;
  criticalHalts: number;
  networkDensity: number;
}

export default function RailwayIntelligenceHub() {
  const { trackedTrains, refreshTrackedTrains, selectTrain, trainData, isLoading } = useTrainContext();
  const [loading, setLoading] = useState(false);
  const [selectedTrainNumber, setSelectedTrainNumber] = useState<string | null>(null);
  const [stats, setStats] = useState<HubStats>({
    activeTrains: 0,
    haltedTrains: 0,
    avgDelay: 0,
    criticalHalts: 0,
    networkDensity: 0,
  });

  // Convert tracked trains to display format
  const displayTrains: DisplayTrain[] = trackedTrains.map((train) => ({
    number: train.number,
    name: train.name,
    status: train.status as 'moving' | 'halted' | 'delayed',
    currentStation: train.currentStation,
    delayMinutes: train.delayMinutes,
    confidence: Math.round(train.confidence * 100),
    speedKmph: train.speedKmph,
  }));

  // Calculate stats from real data
  useEffect(() => {
    if (trackedTrains.length > 0) {
      const halted = trackedTrains.filter((t) => t.status === 'halted').length;
      const delayed = trackedTrains.filter((t) => t.status === 'delayed').length;
      const avgDelay =
        trackedTrains.length > 0
          ? Math.round(trackedTrains.reduce((sum, t) => sum + t.delayMinutes, 0) / trackedTrains.length)
          : 0;

      setStats({
        activeTrains: trackedTrains.length,
        haltedTrains: halted,
        avgDelay: avgDelay,
        criticalHalts: halted > 0 ? Math.max(1, Math.floor(halted / 2)) : 0,
        networkDensity: Math.min(100, trackedTrains.length * 10 + 30),
      });
    }
  }, [trackedTrains]);

  // Handle refresh
  const handleRefresh = async () => {
    setLoading(true);
    try {
      await refreshTrackedTrains();
      if (selectedTrainNumber) {
        await selectTrain(selectedTrainNumber);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle train selection
  const handleSelectTrain = async (trainNumber: string) => {
    setSelectedTrainNumber(trainNumber);
    await selectTrain(trainNumber);
  };

  const selectedTrain = displayTrains.find((t) => t.number === selectedTrainNumber);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/20 rounded-lg border border-blue-500/50">
              <Zap className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Railway Intelligence Hub</h1>
              <p className="text-slate-400 text-sm">
                {trackedTrains.length > 0 ? `Tracking ${trackedTrains.length} live trains` : 'Real-time network tracking & analysis'}
              </p>
            </div>
          </div>

          <motion.button
            onClick={handleRefresh}
            disabled={loading || isLoading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading || isLoading ? 'animate-spin' : ''}`} />
            {loading || isLoading ? 'Refreshing...' : 'Refresh'}
          </motion.button>
        </div>

        {/* Key Stats - Now from Real Data */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard
            label="Active Trains"
            value={stats.activeTrains}
            icon={<Activity className="w-5 h-5" />}
            color="text-green-400"
          />
          <StatCard
            label="Halted"
            value={stats.haltedTrains}
            icon={<AlertTriangle className="w-5 h-5" />}
            color="text-red-400"
          />
          <StatCard
            label="Avg Delay"
            value={`${stats.avgDelay}m`}
            icon={<Clock className="w-5 h-5" />}
            color="text-yellow-400"
          />
          <StatCard
            label="Critical"
            value={stats.criticalHalts}
            icon={<AlertTriangle className="w-5 h-5" />}
            color="text-red-500"
          />
          <StatCard
            label="Network Density"
            value={`${stats.networkDensity}%`}
            icon={<TrendingUp className="w-5 h-5" />}
            color="text-purple-400"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tracked Trains List */}
        <div className="lg:col-span-2">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 backdrop-blur">
            <h2 className="text-xl font-bold text-white mb-4">
              Tracked Trains ({displayTrains.length})
            </h2>

            {displayTrains.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <p>No tracked trains available</p>
              </div>
            ) : (
              <div className="space-y-3">
                {displayTrains.map((train) => (
                  <motion.div
                    key={train.number}
                    onClick={() => handleSelectTrain(train.number)}
                    whileHover={{ x: 4 }}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedTrainNumber === train.number
                        ? 'bg-blue-600/30 border-blue-500'
                        : 'bg-slate-700/30 border-slate-600 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-semibold text-white">
                          {train.number} • {train.name}
                        </div>
                        <div className="text-sm text-slate-400 flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" />
                          {train.currentStation}
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className={`text-sm font-semibold text-white px-2 py-1 rounded ${
                            train.status === 'moving'
                              ? 'bg-green-500/20 text-green-400'
                              : train.status === 'halted'
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-yellow-500/20 text-yellow-400'
                          }`}
                        >
                          {train.status.charAt(0).toUpperCase() + train.status.slice(1)}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mt-3">
                      <div>
                        <div className="text-xs text-slate-500">Delay</div>
                        <div className="text-sm font-semibold text-white">{train.delayMinutes}m</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500">Confidence</div>
                        <div className="text-sm font-semibold text-blue-400">{train.confidence}%</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500">Speed</div>
                        <div className="text-sm font-semibold text-purple-400">{train.speedKmph} km/h</div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Selected Train Details - Now using real data from trainData */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 backdrop-blur">
          <h2 className="text-xl font-bold text-white mb-4">Details</h2>

          {selectedTrain && trainData ? (
            <div className="space-y-4">
              <div className="bg-slate-700/30 rounded-lg p-4 space-y-3">
                <div>
                  <div className="text-xs text-slate-500 uppercase">Train Number</div>
                  <div className="text-lg font-bold text-white">{trainData.trainNumber}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 uppercase">Train Name</div>
                  <div className="text-lg font-bold text-white">{trainData.trainName}</div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <div className="text-xs text-slate-500 uppercase">From</div>
                    <div className="text-sm font-semibold text-white">{trainData.source}</div>
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-slate-500 uppercase">To</div>
                    <div className="text-sm font-semibold text-white">{trainData.destination}</div>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 uppercase">Current Station</div>
                  <div className="text-sm font-semibold text-blue-400">{trainData.currentStationName}</div>
                </div>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <div className="text-xs text-slate-500 uppercase">Delay</div>
                    <div className="text-sm font-bold text-yellow-400">{trainData.delayMinutes}m</div>
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-slate-500 uppercase">Speed</div>
                    <div className="text-sm font-bold text-green-400">{trainData.speedKmph} km/h</div>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 uppercase">Data Quality</div>
                  <div className="w-full bg-slate-600 rounded-full h-1.5 mt-1">
                    <div
                      className="bg-blue-500 h-1.5 rounded-full"
                      style={{ width: `${trainData.dataQuality * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              <motion.a
                href={`/train/${trainData.trainNumber}`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="block w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-center rounded-lg transition-colors font-semibold"
              >
                View Full Analysis
              </motion.a>
            </div>
          ) : selectedTrain ? (
            <div className="h-48 flex items-center justify-center text-center">
              <div className="text-slate-500">
                <p className="text-sm">Loading train details...</p>
              </div>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-center">
              <div className="text-slate-500">
                <p className="text-sm">Select a train to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

function StatCard({ label, value, icon, color }: StatCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 backdrop-blur"
    >
      <div className="flex items-start justify-between mb-2">
        <div className={`p-2 bg-slate-700 rounded-lg ${color}`}>{icon}</div>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-xs text-slate-500 mt-1">{label}</div>
    </motion.div>
  );
}
