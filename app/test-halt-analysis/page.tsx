'use client';

import React, { useState, useEffect } from 'react';
import { Search, Clock, RotateCw } from 'lucide-react';
import { HaltAnalysisCard } from '@/components/HaltAnalysisCard';
import { HaltAnalysis } from '@/services/haltReasonService';

interface PlatformStatus {
  stationId: string;
  stationName: string;
  totalPlatforms: number;
  occupiedPlatforms: number;
  availablePlatforms: number;
  avgOccupancyTime: number;
}

export default function HaltAnalysisPage() {
  const [selectedTrain, setSelectedTrain] = useState('12723-RAJ');
  const [selectedLocation, setSelectedLocation] = useState('SEC-002');
  const [haltDuration, setHaltDuration] = useState(15);
  const [analysis, setAnalysis] = useState<HaltAnalysis | null>(null);
  const [platforms, setPlatforms] = useState<PlatformStatus[]>([]);
  const [loading, setLoading] = useState(false);

  const trains = [
    { number: '12723-RAJ', name: 'Rajdhani Express' },
    { number: '12659-SHAB', name: 'Shatabdi Express' },
    { number: '12809-SF', name: 'Superfast Express' },
    { number: '12709-EXP', name: 'Express' },
    { number: '11010-PASS', name: 'Passenger' },
    { number: '12234-FRT', name: 'Freight' },
  ];

  const locations = [
    { id: 'SEC-001', name: 'Hyderabad → Secunderabad' },
    { id: 'SEC-002', name: 'Secunderabad → Kazipet' },
    { id: 'SEC-003', name: 'Kazipet → Warangal' },
    { id: 'SEC-004', name: 'Hyderabad → Vijayawada' },
    { id: 'SEC-005', name: 'Vijayawada → Visakhapatnam' },
    { id: 'SEC-006', name: 'Hyderabad → Bengaluru' },
  ];

  // Fetch initial data
  useEffect(() => {
    fetchPlatformStatus();
    analyzeHalt();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Analyze halt on parameter change
  useEffect(() => {
    analyzeHalt();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTrain, selectedLocation, haltDuration]);

  const fetchPlatformStatus = async () => {
    try {
      const response = await fetch('/api/halt-analysis?action=platform-status');
      const result = await response.json();
      if (result.success) {
        setPlatforms(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch platform status:', error);
    }
  };

  const analyzeHalt = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/halt-analysis?action=analyze-halt&train=${selectedTrain}&location=${selectedLocation}&duration=${haltDuration}`
      );
      const result = await response.json();
      if (result.success) {
        setAnalysis(result.data);
      }
    } catch (error) {
      console.error('Failed to analyze halt:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(230,25%,10%)] to-[hsl(240,20%,14%)] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 font-semibold tracking-tight">Halt Reason Analysis</h1>
          <p className="text-[hsl(220,20%,70%)]">Intelligent analysis of train halts using multiple detection signals</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Control Panel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Train Selection */}
            <div className="bg-[hsl(230,20%,16%)] rounded-lg shadow-lg p-6 border border-white/[0.06]" style={{boxShadow: '0 0 0 1px rgba(255,255,255,0.05), 0 4px 20px rgba(0,0,0,0.3)'}}>
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2 font-semibold">
                <Search className="w-5 h-5" />
                Select Train & Section
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-[hsl(220,15%,55%)] mb-2">Train</label>
                  <select
                    value={selectedTrain}
                    onChange={(e) => setSelectedTrain(e.target.value)}
                    className="w-full px-3 py-2 bg-[hsl(230,20%,20%)] border border-white/[0.06] rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {trains.map((train) => (
                      <option key={train.number} value={train.number}>
                        {train.number} - {train.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[hsl(220,15%,55%)] mb-2">Section</label>
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full px-3 py-2 bg-[hsl(230,20%,20%)] border border-white/[0.06] rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.id} - {loc.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[hsl(220,15%,55%)] mb-2">
                    Halt Duration: {haltDuration} minutes
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="60"
                    value={haltDuration}
                    onChange={(e) => setHaltDuration(parseInt(e.target.value, 10))}
                    className="w-full h-2 bg-[hsl(230,20%,25%)] rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <div className="flex justify-between text-xs text-[hsl(220,15%,55%)] mt-2">
                    <span>1 min</span>
                    <span>30 min</span>
                    <span>60 min</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Clock className="w-4 h-4 text-[hsl(220,15%,55%)]" />
                  <span className="text-sm text-[hsl(220,20%,70%)]">
                    Analysis updates automatically as you change parameters
                  </span>
                </div>
              </div>
            </div>

            {/* Analysis Result */}
            {analysis && (
              <div>
                {loading && (
                  <div className="flex items-center justify-center py-8">
                    <RotateCw className="w-6 h-6 text-blue-500 animate-spin" />
                  </div>
                )}
                {!loading && <HaltAnalysisCard analysis={analysis} />}
              </div>
            )}
          </div>

          {/* Sidebar - Platform Status */}
          <div className="bg-[hsl(230,20%,16%)] rounded-lg shadow-lg p-6 h-fit border border-white/[0.06]" style={{boxShadow: '0 0 0 1px rgba(255,255,255,0.05), 0 4px 20px rgba(0,0,0,0.3)'}}>
            <h3 className="text-lg font-bold text-white mb-4 font-semibold">Station Platforms</h3>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {platforms.map((station) => {
                const occupancyRate = (station.occupiedPlatforms / station.totalPlatforms) * 100;
                const occupancyColor =
                  occupancyRate > 80 ? 'bg-red-500/20 border border-red-500/30' : occupancyRate > 60 ? 'bg-orange-500/20 border border-orange-500/30' : 'bg-green-500/20 border border-green-500/30';

                return (
                  <div key={station.stationId} className={`rounded-lg p-3 ${occupancyColor}`}>
                    <h4 className="font-semibold text-sm text-white">{station.stationName}</h4>

                    <div className="mt-2 space-y-1 text-xs text-[hsl(220,20%,70%)]">
                      <div className="flex justify-between">
                        <span>Occupied:</span>
                        <span className="font-bold text-white">
                          {station.occupiedPlatforms}/{station.totalPlatforms}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Available:</span>
                        <span className="font-bold text-green-400">{station.availablePlatforms}</span>
                      </div>

                      {/* Occupancy Bar */}
                      <div className="mt-2">
                        <div className="w-full bg-[hsl(230,20%,25%)] rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              occupancyRate > 80 ? 'bg-red-500' : occupancyRate > 60 ? 'bg-orange-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${occupancyRate}%` }}
                          />
                        </div>
                        <div className="text-right mt-1 font-semibold text-xs text-white">
                          {occupancyRate.toFixed(0)}%
                        </div>
                      </div>

                      <div className="text-[hsl(220,15%,55%)] text-xs">
                        Avg dwell: {station.avgOccupancyTime} min
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-6 pt-6 border-t border-white/[0.06]">
              <h4 className="text-sm font-semibold text-[hsl(220,15%,55%)] mb-3">Halt Reason Categories</h4>
              <div className="space-y-2 text-xs text-[hsl(220,20%,70%)]">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-600" />
                  <span>Infrastructure</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-600" />
                  <span>Traffic/Congestion</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-600" />
                  <span>Maintenance</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-purple-600" />
                  <span>Operational</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-600" />
                  <span>Safety</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
