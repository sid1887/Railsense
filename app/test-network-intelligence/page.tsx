'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Zap, TrendingUp, AlertCircle } from 'lucide-react';

export default function NetworkIntelligencePage() {
  const [networkData, setNetworkData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNetworkData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/network-intelligence', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'analyze-network',
            includeHotspots: true,
            includePriorities: true,
          }),
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        setNetworkData(data);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch network intelligence data');
        setNetworkData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchNetworkData();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <MapPin className="w-10 h-10 text-blue-400" />
            <h1 className="text-4xl font-bold text-white">Railway Network Intelligence</h1>
          </div>
          <p className="text-blue-200">
            Real-time analysis of network topology, train flow, hotspot detection, and priority conflicts
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg p-6 text-white shadow-lg">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-blue-200 text-sm font-semibold">Network Sections</p>
                <h3 className="text-4xl font-bold mt-1">6</h3>
              </div>
              <MapPin className="w-8 h-8 text-blue-200" />
            </div>
            <p className="text-xs text-blue-100">Real Indian Railway routes analyzed</p>
          </div>

          <div className="bg-gradient-to-br from-cyan-600 to-cyan-800 rounded-lg p-6 text-white shadow-lg">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-cyan-200 text-sm font-semibold">Active Trains</p>
                <h3 className="text-4xl font-bold mt-1">8</h3>
              </div>
              <Zap className="w-8 h-8 text-cyan-200" />
            </div>
            <p className="text-xs text-cyan-100">Currently being monitored</p>
          </div>

          <div className="bg-gradient-to-br from-yellow-600 to-yellow-800 rounded-lg p-6 text-white shadow-lg">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-yellow-200 text-sm font-semibold">Hotspots</p>
                <h3 className="text-4xl font-bold mt-1">2</h3>
              </div>
              <AlertCircle className="w-8 h-8 text-yellow-200" />
            </div>
            <p className="text-xs text-yellow-100">High congestion areas detected</p>
          </div>

          <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-lg p-6 text-white shadow-lg">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-green-200 text-sm font-semibold">Flow Efficiency</p>
                <h3 className="text-4xl font-bold mt-1">68%</h3>
              </div>
              <TrendingUp className="w-8 h-8 text-green-200" />
            </div>
            <p className="text-xs text-green-100">Network health score</p>
          </div>
        </div>

        {/* Main Content */}
        {loading ? (
          <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-lg p-12 text-center">
            <div className="inline-flex items-center gap-3">
              <div className="w-8 h-8 border-4 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
              <p className="text-slate-300 font-semibold">Loading network intelligence...</p>
            </div>
          </div>
        ) : error ? (
          <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-6">
            <h3 className="text-red-300 font-bold mb-2">Error Loading Data</h3>
            <p className="text-red-200 text-sm">{error}</p>
            <p className="text-slate-400 text-xs mt-3">
              Make sure the API server is running and accessible at /api/network-intelligence
            </p>
          </div>
        ) : networkData ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Network Overview */}
            <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-lg p-6">
              <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-400" />
                Network Overview
              </h2>
              <div className="space-y-3">
                <div className="p-3 bg-slate-700 rounded">
                  <p className="text-slate-400 text-xs">Total Trains</p>
                  <p className="text-white font-bold text-lg">{networkData.totalTrains || 'N/A'}</p>
                </div>
                <div className="p-3 bg-slate-700 rounded">
                  <p className="text-slate-400 text-xs">Average Density</p>
                  <p className="text-white font-bold text-lg">{networkData.avgDensity || 'N/A'} trains/hour</p>
                </div>
                <div className="p-3 bg-slate-700 rounded">
                  <p className="text-slate-400 text-xs">Congestion Score</p>
                  <p className="text-white font-bold text-lg">{networkData.congestionScore || 'N/A'}/100</p>
                </div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-lg p-6">
              <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                Performance Metrics
              </h2>
              <div className="space-y-3">
                <div className="p-3 bg-slate-700 rounded">
                  <p className="text-slate-400 text-xs">Flow Efficiency</p>
                  <p className="text-white font-bold text-lg">{networkData.flowEfficiency || 'N/A'}%</p>
                </div>
                <div className="p-3 bg-slate-700 rounded">
                  <p className="text-slate-400 text-xs">Network Status</p>
                  <p className="text-green-400 font-bold text-lg">Operational</p>
                </div>
                <div className="p-3 bg-slate-700 rounded">
                  <p className="text-slate-400 text-xs">Critical Sections</p>
                  <p className="text-orange-400 font-bold text-lg">{networkData.criticalSections || 0}</p>
                </div>
              </div>
            </div>

            {/* Hotspots Detection */}
            <div className="lg:col-span-2 bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-lg p-6">
              <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-400" />
                Detected Hotspots
              </h2>
              {networkData.hotspots && networkData.hotspots.length > 0 ? (
                <div className="space-y-2">
                  {networkData.hotspots.map((hotspot: any, idx: number) => (
                    <div key={idx} className="p-3 bg-yellow-900/30 border border-yellow-700/50 rounded">
                      <p className="text-yellow-300 font-semibold text-sm">{hotspot.section}</p>
                      <p className="text-yellow-200 text-xs mt-1">Congestion Level: {hotspot.congestion || 'High'}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 text-sm">No critical hotspots detected at this time</p>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-slate-800/50 backdrop-blur-lg border border-slate-700 rounded-lg p-8 text-center">
            <p className="text-slate-400">No data available</p>
          </div>
        )}

        {/* Info Section */}
        <div className="mt-8 bg-blue-900/30 border border-blue-700/50 rounded-lg p-6">
          <h3 className="text-blue-300 font-bold mb-2">About Network Intelligence</h3>
          <p className="text-blue-200 text-sm">
            Real-time analysis of Indian Railway network topology to detect congestion, identify hotspots, predict
            flow patterns, and detect priority train conflicts. Integrates with 6 major railway sections and monitors
            8+ trains simultaneously for optimal network performance.
          </p>
        </div>
      </div>
    </div>
  );
}
