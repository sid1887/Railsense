'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { MapPin } from 'lucide-react';

interface NetworkIntelligenceData {
  train: {
    number: string;
    name: string;
    source: string;
    destination: string;
  };
  networkPosition: {
    currentStation: string;
    route: {
      totalStations: number;
      completedStations: number;
      upcomingStations: number;
    };
  };
  nearbyTrains: {
    onSameRoute: number;
    onIntersectingRoutes: number;
    nearbyInNetwork: number;
  };
  congestionAnalysis: {
    currentSection: string;
    aheadSection: string;
    behindSection: string;
    upstreamCongestion: boolean;
  };
  interconnections: {
    connectingTrains: any[];
    platforms: any[];
    stations: string[];
  };
  networkMetrics: {
    loadFactor: string;
    delayPropagation: string;
    routeReliability: number;
  };
}

function NetworkIntelligenceContent() {
  const searchParams = useSearchParams();
  const trainNumber = searchParams.get('trainNumber') || '01211';

  const [data, setData] = useState<NetworkIntelligenceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/system/network-intelligence?trainNumber=${trainNumber}`);
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        const result = await response.json();
        setData(result);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch network intelligence');
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [trainNumber]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(230,25%,10%)] to-[hsl(240,20%,14%)] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <MapPin className="w-8 h-8 text-blue-400" />
            <h1 className="text-4xl font-bold text-white">Network Intelligence</h1>
          </div>
          <p className="text-[hsl(220,20%,70%)]">Train: {trainNumber}</p>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 mb-6">
            <p className="text-red-400">Error: {error}</p>
          </div>
        )}

        {data && !loading && (
          <div className="space-y-6">
            {/* Train Overview */}
            <div className="bg-[hsl(230,20%,16%)] rounded-lg p-6 border border-white/[0.06]">
              <h2 className="text-xl font-bold text-white mb-4">Train Overview</h2>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <p className="text-[hsl(220,15%,55%)] text-sm mb-1">Train Number</p>
                  <p className="text-2xl font-bold text-blue-400">{data.train.number}</p>
                </div>
                <div>
                  <p className="text-[hsl(220,15%,55%)] text-sm mb-1">Route Start</p>
                  <p className="text-white font-semibold">{data.train.source}</p>
                </div>
                <div>
                  <p className="text-[hsl(220,15%,55%)] text-sm mb-1">Route End</p>
                  <p className="text-white font-semibold">{data.train.destination}</p>
                </div>
                <div>
                  <p className="text-[hsl(220,15%,55%)] text-sm mb-1">Train Name</p>
                  <p className="text-white font-semibold">{data.train.name}</p>
                </div>
              </div>
            </div>

            {/* Network Position */}
            <div className="bg-[hsl(230,20%,16%)] rounded-lg p-6 border border-white/[0.06]">
              <h2 className="text-xl font-bold text-white mb-4">Network Position</h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-[hsl(230,20%,25%)] rounded">
                  <p className="text-[hsl(220,15%,55%)] text-sm mb-2">Current Station</p>
                  <p className="text-xl font-bold text-blue-400">{data.networkPosition.currentStation}</p>
                </div>
                <div className="p-4 bg-[hsl(230,20%,25%)] rounded">
                  <p className="text-[hsl(220,15%,55%)] text-sm mb-2">Route Progress</p>
                  <p className="text-lg font-bold text-white">
                    {data.networkPosition.route.completedStations} / {data.networkPosition.route.totalStations} stations
                  </p>
                  <div className="w-full bg-[hsl(230,20%,30%)] rounded-full h-2 mt-2">
                    <div
                      className="h-2 rounded-full bg-blue-500"
                      style={{
                        width: `${(data.networkPosition.route.completedStations / data.networkPosition.route.totalStations) * 100}%`
                      }}
                    />
                  </div>
                </div>
                <div className="p-4 bg-[hsl(230,20%,25%)] rounded">
                  <p className="text-[hsl(220,15%,55%)] text-sm mb-2">Upcoming Stations</p>
                  <p className="text-lg font-bold text-green-400">{data.networkPosition.route.upcomingStations} remaining</p>
                </div>
              </div>
            </div>

            {/* Congestion Analysis */}
            <div className="bg-[hsl(230,20%,16%)] rounded-lg p-6 border border-white/[0.06]">
              <h2 className="text-xl font-bold text-white mb-4">Congestion Analysis</h2>
              <div className="grid grid-cols-4 gap-4">
                <div className="p-4 bg-[hsl(230,20%,25%)] rounded">
                  <p className="text-[hsl(220,15%,55%)] text-sm mb-2">Current Section</p>
                  <p className={`text-lg font-bold ${
                    data.congestionAnalysis.currentSection === 'Clear' ? 'text-green-400' :
                    data.congestionAnalysis.currentSection === 'Moderate' ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {data.congestionAnalysis.currentSection}
                  </p>
                </div>
                <div className="p-4 bg-[hsl(230,20%,25%)] rounded">
                  <p className="text-[hsl(220,15%,55%)] text-sm mb-2">Ahead Section</p>
                  <p className={`text-lg font-bold ${
                    data.congestionAnalysis.aheadSection === 'Clear' ? 'text-green-400' :
                    data.congestionAnalysis.aheadSection === 'Moderate' ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {data.congestionAnalysis.aheadSection}
                  </p>
                </div>
                <div className="p-4 bg-[hsl(230,20%,25%)] rounded">
                  <p className="text-[hsl(220,15%,55%)] text-sm mb-2">Behind Section</p>
                  <p className={`text-lg font-bold ${
                    data.congestionAnalysis.behindSection === 'Clear' ? 'text-green-400' :
                    data.congestionAnalysis.behindSection === 'Moderate' ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {data.congestionAnalysis.behindSection}
                  </p>
                </div>
                <div className="p-4 bg-[hsl(230,20%,25%)] rounded">
                  <p className="text-[hsl(220,15%,55%)] text-sm mb-2">Upstream Risk</p>
                  <p className={`text-lg font-bold ${
                    data.congestionAnalysis.upstreamCongestion ? 'text-red-400' : 'text-green-400'
                  }`}>
                    {data.congestionAnalysis.upstreamCongestion ? 'High' : 'Low'}
                  </p>
                </div>
              </div>
            </div>

            {/* Nearby Trains Summary */}
            <div className="bg-[hsl(230,20%,16%)] rounded-lg p-6 border border-white/[0.06]">
              <h2 className="text-xl font-bold text-white mb-4">Nearby Trains</h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-[hsl(230,20%,25%)] rounded">
                  <p className="text-[hsl(220,15%,55%)] text-sm mb-2">Same Route</p>
                  <p className="text-3xl font-bold text-blue-400">{data.nearbyTrains.onSameRoute}</p>
                  <p className="text-xs text-[hsl(220,15%,55%)] mt-1">trains ahead/behind</p>
                </div>
                <div className="p-4 bg-[hsl(230,20%,25%)] rounded">
                  <p className="text-[hsl(220,15%,55%)] text-sm mb-2">Intersecting Routes</p>
                  <p className="text-3xl font-bold text-purple-400">{data.nearbyTrains.onIntersectingRoutes}</p>
                  <p className="text-xs text-[hsl(220,15%,55%)] mt-1">crossing points</p>
                </div>
                <div className="p-4 bg-[hsl(230,20%,25%)] rounded">
                  <p className="text-[hsl(220,15%,55%)] text-sm mb-2">Network Proximity</p>
                  <p className="text-3xl font-bold text-cyan-400">{data.nearbyTrains.nearbyInNetwork}</p>
                  <p className="text-xs text-[hsl(220,15%,55%)] mt-1">in vicinity</p>
                </div>
              </div>
            </div>

            {/* Network Metrics */}
            <div className="bg-[hsl(230,20%,16%)] rounded-lg p-6 border border-white/[0.06]">
              <h2 className="text-xl font-bold text-white mb-4">Network Metrics</h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-[hsl(230,20%,25%)] rounded">
                  <p className="text-[hsl(220,15%,55%)] text-sm mb-2">Load Factor</p>
                  <p className="text-2xl font-bold text-white">{data.networkMetrics.loadFactor}</p>
                  <div className="text-xs text-[hsl(220,15%,55%)] mt-1">overall network</div>
                </div>
                <div className="p-4 bg-[hsl(230,20%,25%)] rounded">
                  <p className="text-[hsl(220,15%,55%)] text-sm mb-2">Delay Propagation</p>
                  <p className={`text-2xl font-bold ${
                    data.networkMetrics.delayPropagation === 'Low' ? 'text-green-400' :
                    data.networkMetrics.delayPropagation === 'Medium' ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {data.networkMetrics.delayPropagation}
                  </p>
                </div>
                <div className="p-4 bg-[hsl(230,20%,25%)] rounded">
                  <p className="text-[hsl(220,15%,55%)] text-sm mb-2">Route Reliability</p>
                  <p className="text-2xl font-bold text-blue-400">{(data.networkMetrics.routeReliability * 100).toFixed(0)}%</p>
                </div>
              </div>
            </div>

            {/* Connected Stations */}
            {data.interconnections.stations.length > 0 && (
              <div className="bg-[hsl(230,20%,16%)] rounded-lg p-6 border border-white/[0.06]">
                <h2 className="text-xl font-bold text-white mb-4">Upcoming Stations</h2>
                <div className="space-y-2">
                  {data.interconnections.stations.map((station, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-[hsl(230,20%,25%)] rounded">
                      <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold text-white">
                        {idx + 1}
                      </div>
                      <p className="text-white font-semibold">{station}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function NetworkIntelligencePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div></div>}>
      <NetworkIntelligenceContent />
    </Suspense>
  );
}
