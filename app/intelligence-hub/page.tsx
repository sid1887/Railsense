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
} from 'lucide-react';

interface TrackedTrain {
  trainNumber: string;
  trainName: string;
  status: 'moving' | 'halted' | 'delayed';
  location: { lat: number; lng: number };
  position: string;
  delay: number;
  confidence: number;
  nearbyTrains: number;
  lastUpdated: number;
}

interface HubStats {
  activeTrains: number;
  haltedTrains: number;
  avgDelay: number;
  criticalHalts: number;
  networkDensity: number;
}

const MOCK_TRACKED_TRAINS: TrackedTrain[] = [
  {
    trainNumber: '12955',
    trainName: 'Rajendra Express',
    status: 'moving',
    location: { lat: 19.0760, lng: 72.8777 },
    position: 'Mumbai Central',
    delay: 12,
    confidence: 88,
    nearbyTrains: 3,
    lastUpdated: Date.now() - 60000,
  },
  {
    trainNumber: '12728',
    trainName: 'South Western Express',
    status: 'halted',
    location: { lat: 19.3000, lng: 72.7500 },
    position: 'Virar Station',
    delay: 45,
    confidence: 82,
    nearbyTrains: 5,
    lastUpdated: Date.now() - 120000,
  },
  {
    trainNumber: '17015',
    trainName: 'Hyderabad Express',
    status: 'delayed',
    location: { lat: 17.3850, lng: 78.4867 },
    position: 'Secunderabad Junction',
    delay: 28,
    confidence: 85,
    nearbyTrains: 2,
    lastUpdated: Date.now() - 45000,
  },
];

export default function RailwayIntelligenceHub() {
  const [trackedTrains, setTrackedTrains] = useState<TrackedTrain[]>(MOCK_TRACKED_TRAINS);
  const [stats, setStats] = useState<HubStats>({
    activeTrains: 47,
    haltedTrains: 3,
    avgDelay: 18,
    criticalHalts: 1,
    networkDensity: 72,
  });
  const [loading, setLoading] = useState(false);
  const [selectedTrain, setSelectedTrain] = useState<string | null>(null);

  // Refresh tracked trains
  const handleRefresh = async () => {
    setLoading(true);
    // In production: fetch from /api/railway-hub?action=get-tracked-trains
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/20 rounded-lg border border-blue-500/50">
              <Train className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Railway Intelligence Hub</h1>
              <p className="text-slate-400 text-sm">Real-time network tracking & analysis</p>
            </div>
          </div>

          <motion.button
            onClick={handleRefresh}
            disabled={loading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Refreshing...' : 'Refresh'}
          </motion.button>
        </div>

        {/* Key Stats */}
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
            <h2 className="text-xl font-bold text-white mb-4">Tracked Trains</h2>

            <div className="space-y-3">
              {trackedTrains.map((train) => (
                <motion.div
                  key={train.trainNumber}
                  onClick={() => setSelectedTrain(train.trainNumber)}
                  whileHover={{ x: 4 }}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedTrain === train.trainNumber
                      ? 'bg-blue-600/30 border-blue-500'
                      : 'bg-slate-700/30 border-slate-600 hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-semibold text-white">
                        {train.trainNumber} • {train.trainName}
                      </div>
                      <div className="text-sm text-slate-400 flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3" />
                        {train.position}
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
                      <div className="text-sm font-semibold text-white">{train.delay}m</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Confidence</div>
                      <div className="text-sm font-semibold text-blue-400">{train.confidence}%</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-500">Nearby</div>
                      <div className="text-sm font-semibold text-purple-400">{train.nearbyTrains}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Selected Train Details */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 backdrop-blur">
          <h2 className="text-xl font-bold text-white mb-4">Details</h2>

          {selectedTrain ? (
            <div className="space-y-4">
              {trackedTrains
                .filter((t) => t.trainNumber === selectedTrain)
                .map((train) => (
                  <div key={train.trainNumber}>
                    <div className="bg-slate-700/30 rounded-lg p-4 space-y-3">
                      <div>
                        <div className="text-xs text-slate-500 uppercase">Train Number</div>
                        <div className="text-lg font-bold text-white">{train.trainNumber}</div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 uppercase">Train Name</div>
                        <div className="text-lg font-bold text-white">{train.trainName}</div>
                      </div>
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <div className="text-xs text-slate-500 uppercase">Latitude</div>
                          <div className="text-sm font-mono text-white">{train.location.lat.toFixed(4)}</div>
                        </div>
                        <div className="flex-1">
                          <div className="text-xs text-slate-500 uppercase">Longitude</div>
                          <div className="text-sm font-mono text-white">{train.location.lng.toFixed(4)}</div>
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 uppercase">Last Updated</div>
                        <div className="text-sm text-white">
                          {new Date(train.lastUpdated).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>

                    <motion.a
                      href={`/train/${train.trainNumber}`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="block mt-4 w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-center rounded-lg transition-colors font-semibold"
                    >
                      View Full Analysis
                    </motion.a>
                  </div>
                ))}
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
