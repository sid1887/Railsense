'use client';

import React, { useMemo } from 'react';
import {
  Zap,
  AlertTriangle,
  TrendingDown,
  Users,
  Brain,
  Database,
  MapPin,
  Clock,
  Activity,
  BarChart3,
} from 'lucide-react';

export default function IntelligenceDashboardPage() {
  // Mock data for demonstration
  const networkMetrics = useMemo(
    () => ({
      totalTrains: 47,
      avgDensity: 6.2,
      congestionScore: 72,
      flowEfficiency: 68,
      criticalSections: 2,
    }),
    []
  );

  const haltAnalysis = useMemo(
    () => ({
      activeSituations: 5,
      criticalHalts: 1,
      avgDuration: 12,
      platformIssues: 3,
    }),
    []
  );

  const cascadeStatus = useMemo(
    () => ({
      activeCascades: 2,
      maxLevel: 62,
      affectedTrains: 8,
      resolutionTime: 45,
    }),
    []
  );

  const safetyMetrics = useMemo(
    () => ({
      safetyScore: 76,
      riskTrains: 3,
      connectionIssues: 2,
      dwellAnomalies: 4,
    }),
    []
  );

  const dbMetrics = useMemo(
    () => ({
      snapshots: 892,
      patterns: 3421,
      storage: '1.8 MB',
    }),
    []
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Brain className="w-12 h-12 text-purple-400" />
            <h1 className="text-5xl font-bold text-white">Advanced Intelligence Dashboard</h1>
          </div>
          <p className="text-purple-200 text-lg">
            Unified view of all Week 3 intelligence systems - Network, Halt, Safety, Cascade, Explainability, and
            Persistence
          </p>
        </div>

        {/* Top Metrics Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Network Health */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-lg p-6 text-white shadow-lg">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-blue-200 text-sm font-semibold">Network Health</p>
                <h3 className="text-3xl font-bold mt-1">{networkMetrics.flowEfficiency}%</h3>
              </div>
              <MapPin className="w-8 h-8 text-blue-200" />
            </div>
            <div className="text-xs text-blue-100">
              {networkMetrics.totalTrains} trains • Congestion {networkMetrics.congestionScore}
            </div>
          </div>

          {/* Passenger Safety */}
          <div className="bg-gradient-to-br from-green-500 to-emerald-700 rounded-lg p-6 text-white shadow-lg">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-green-200 text-sm font-semibold">Passenger Safety</p>
                <h3 className="text-3xl font-bold mt-1">{safetyMetrics.safetyScore}%</h3>
              </div>
              <Users className="w-8 h-8 text-green-200" />
            </div>
            <div className="text-xs text-green-100">
              {safetyMetrics.connectionIssues} connection risks • {safetyMetrics.dwellAnomalies} dwell anomalies
            </div>
          </div>

          {/* Cascade Status */}
          <div className="bg-gradient-to-br from-orange-500 to-red-700 rounded-lg p-6 text-white shadow-lg">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-orange-200 text-sm font-semibold">Cascade Status</p>
                <h3 className="text-3xl font-bold mt-1">{cascadeStatus.maxLevel}</h3>
              </div>
              <TrendingDown className="w-8 h-8 text-orange-200" />
            </div>
            <div className="text-xs text-orange-100">
              {cascadeStatus.activeCascades} active • {cascadeStatus.affectedTrains} trains impacted
            </div>
          </div>

          {/* Database Status */}
          <div className="bg-gradient-to-br from-purple-500 to-indigo-700 rounded-lg p-6 text-white shadow-lg">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-purple-200 text-sm font-semibold">Data Storage</p>
                <h3 className="text-3xl font-bold mt-1">{dbMetrics.storage}</h3>
              </div>
              <Database className="w-8 h-8 text-purple-200" />
            </div>
            <div className="text-xs text-purple-100">
              {dbMetrics.snapshots} snapshots • {dbMetrics.patterns} patterns
            </div>
          </div>
        </div>

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Network Intelligence Section */}
          <div className="lg:col-span-1 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg border border-slate-700 p-6 shadow-lg">
            <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-400" />
              Network Intelligence
            </h2>

            <div className="space-y-3">
              <div className="bg-slate-700 rounded p-3">
                <p className="text-slate-400 text-xs mb-1">Active Sections</p>
                <p className="text-white font-bold text-xl">6</p>
              </div>

              <div className="bg-slate-700 rounded p-3">
                <p className="text-slate-400 text-xs mb-1">Hotspots Detected</p>
                <p className="text-yellow-400 font-bold text-xl">
                  {networkMetrics.criticalSections}
                </p>
              </div>

              <div className="bg-slate-700 rounded p-3">
                <p className="text-slate-400 text-xs mb-1">Avg. Train Density</p>
                <p className="text-blue-400 font-bold text-xl">{networkMetrics.avgDensity} trains/hr</p>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-600">
                <a
                  href="/test-network-intelligence"
                  className="text-blue-400 hover:text-blue-300 text-sm font-semibold"
                >
                  View Details →
                </a>
              </div>
            </div>
          </div>

          {/* Halt Analysis Section */}
          <div className="lg:col-span-1 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg border border-slate-700 p-6 shadow-lg">
            <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-red-400" />
              Halt Analysis
            </h2>

            <div className="space-y-3">
              <div className="bg-slate-700 rounded p-3">
                <p className="text-slate-400 text-xs mb-1">Active Halts</p>
                <p className="text-red-400 font-bold text-xl">{haltAnalysis.activeSituations}</p>
              </div>

              <div className="bg-slate-700 rounded p-3">
                <p className="text-slate-400 text-xs mb-1">Critical Situations</p>
                <p className="text-red-500 font-bold text-xl">{haltAnalysis.criticalHalts}</p>
              </div>

              <div className="bg-slate-700 rounded p-3">
                <p className="text-slate-400 text-xs mb-1">Avg. Duration</p>
                <p className="text-orange-400 font-bold text-xl">{haltAnalysis.avgDuration} min</p>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-600">
                <a
                  href="/test-halt-analysis"
                  className="text-blue-400 hover:text-blue-300 text-sm font-semibold"
                >
                  View Details →
                </a>
              </div>
            </div>
          </div>

          {/* Passenger Safety Section */}
          <div className="lg:col-span-1 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg border border-slate-700 p-6 shadow-lg">
            <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-green-400" />
              Passenger Safety
            </h2>

            <div className="space-y-3">
              <div className="bg-slate-700 rounded p-3">
                <p className="text-slate-400 text-xs mb-1">Safety Score</p>
                <p className="text-green-400 font-bold text-xl">{safetyMetrics.safetyScore}%</p>
              </div>

              <div className="bg-slate-700 rounded p-3">
                <p className="text-slate-400 text-xs mb-1">At-Risk Trains</p>
                <p className="text-yellow-400 font-bold text-xl">{safetyMetrics.riskTrains}</p>
              </div>

              <div className="bg-slate-700 rounded p-3">
                <p className="text-slate-400 text-xs mb-1">Dwell Anomalies</p>
                <p className="text-orange-400 font-bold text-xl">{safetyMetrics.dwellAnomalies}</p>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-600">
                <a
                  href="/test-passenger-safety"
                  className="text-blue-400 hover:text-blue-300 text-sm font-semibold"
                >
                  View Details →
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Intelligence Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {/* Cascade Detection */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg border border-slate-700 p-5 shadow-lg">
            <h3 className="text-white font-bold mb-3 flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-red-400" />
              Delay Cascade
            </h3>
            <p className="text-slate-400 text-sm mb-4">
              Ripple effect modeling with priority conflict detection
            </p>
            <div className="mb-4 p-3 bg-red-900 bg-opacity-30 rounded border border-red-500 border-opacity-50">
              <p className="text-red-300 text-sm">
                <strong>{cascadeStatus.activeCascades}</strong> active cascades
              </p>
              <p className="text-red-300 text-sm">Level: <strong>{cascadeStatus.maxLevel}</strong></p>
            </div>
            <a
              href="/test-cascade-analysis"
              className="text-blue-400 hover:text-blue-300 text-sm font-semibold"
            >
              Analyze →
            </a>
          </div>

          {/* Explainability Engine */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg border border-slate-700 p-5 shadow-lg">
            <h3 className="text-white font-bold mb-3 flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-400" />
              Explainability Engine
            </h3>
            <p className="text-slate-400 text-sm mb-4">
              Transparent reasoning with evidence chains for all predictions
            </p>
            <div className="mb-4 p-3 bg-purple-900 bg-opacity-30 rounded border border-purple-500 border-opacity-50">
              <p className="text-purple-300 text-sm">Reasoning model: Active</p>
              <p className="text-purple-300 text-sm">Evidence factors: 8+ tracked</p>
            </div>
            <a
              href="/test-explainability"
              className="text-blue-400 hover:text-blue-300 text-sm font-semibold"
            >
              Explore →
            </a>
          </div>

          {/* Database Persistence */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg border border-slate-700 p-5 shadow-lg">
            <h3 className="text-white font-bold mb-3 flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-400" />
              Data Persistence
            </h3>
            <p className="text-slate-400 text-sm mb-4">
              Historical patterns and network state storage
            </p>
            <div className="mb-4 p-3 bg-indigo-900 bg-opacity-30 rounded border border-indigo-500 border-opacity-50">
              <p className="text-indigo-300 text-sm">
                <strong>{dbMetrics.snapshots}</strong> network snapshots
              </p>
              <p className="text-indigo-300 text-sm">
                <strong>{dbMetrics.patterns}</strong> patterns recorded
              </p>
            </div>
            <button className="text-blue-400 hover:text-blue-300 text-sm font-semibold">
              Manage Storage →
            </button>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-lg border border-slate-700 p-6 shadow-lg">
          <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-green-400" />
            System Status
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-700 rounded-lg">
              <p className="text-slate-400 text-xs font-semibold uppercase mb-2">Services</p>
              <p className="text-green-400 font-bold text-lg">7/7 Online</p>
              <p className="text-slate-500 text-xs mt-1">All systems operational</p>
            </div>

            <div className="p-4 bg-slate-700 rounded-lg">
              <p className="text-slate-400 text-xs font-semibold uppercase mb-2">API Endpoints</p>
              <p className="text-blue-400 font-bold text-lg">28 Active</p>
              <p className="text-slate-500 text-xs mt-1">+8 from Week 3 additions</p>
            </div>

            <div className="p-4 bg-slate-700 rounded-lg">
              <p className="text-slate-400 text-xs font-semibold uppercase mb-2">Data Quality</p>
              <p className="text-purple-400 font-bold text-lg">94%</p>
              <p className="text-slate-500 text-xs mt-1">High confidence predictions</p>
            </div>

            <div className="p-4 bg-slate-700 rounded-lg">
              <p className="text-slate-400 text-xs font-semibold uppercase mb-2">Network Health</p>
              <p className="text-yellow-400 font-bold text-lg">Caution</p>
              <p className="text-slate-500 text-xs mt-1">72% congestion detected</p>
            </div>
          </div>
        </div>

        {/* Feature Matrix */}
        <div className="mt-6 bg-gradient-to-r from-slate-800 to-slate-900 rounded-lg border border-slate-700 p-6 shadow-lg">
          <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            Week 3 Intelligence Features
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-600">
                  <th className="text-left py-3 px-4 text-slate-300">Feature</th>
                  <th className="text-center py-3 px-4 text-slate-300">Service</th>
                  <th className="text-center py-3 px-4 text-slate-300">API</th>
                  <th className="text-center py-3 px-4 text-slate-300">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-700 hover:bg-slate-700 hover:bg-opacity-30">
                  <td className="py-3 px-4 text-white">Railway Network Intelligence</td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-1 bg-green-900 text-green-300 rounded text-xs">
                      ✓ Active
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center text-cyan-400">/api/network-intelligence</td>
                  <td className="py-3 px-4 text-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full inline-block"></span>
                  </td>
                </tr>

                <tr className="border-b border-slate-700 hover:bg-slate-700 hover:bg-opacity-30">
                  <td className="py-3 px-4 text-white">Halt Reason Analysis</td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-1 bg-green-900 text-green-300 rounded text-xs">
                      ✓ Active
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center text-cyan-400">/api/halt-analysis</td>
                  <td className="py-3 px-4 text-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full inline-block"></span>
                  </td>
                </tr>

                <tr className="border-b border-slate-700 hover:bg-slate-700 hover:bg-opacity-30">
                  <td className="py-3 px-4 text-white">Explainability Engine</td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-1 bg-green-900 text-green-300 rounded text-xs">
                      ✓ Active
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center text-cyan-400">/api/explainability</td>
                  <td className="py-3 px-4 text-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full inline-block"></span>
                  </td>
                </tr>

                <tr className="border-b border-slate-700 hover:bg-slate-700 hover:bg-opacity-30">
                  <td className="py-3 px-4 text-white">Passenger Safety & Dwell</td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-1 bg-green-900 text-green-300 rounded text-xs">
                      ✓ Active
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center text-cyan-400">/api/passenger-safety</td>
                  <td className="py-3 px-4 text-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full inline-block"></span>
                  </td>
                </tr>

                <tr className="border-b border-slate-700 hover:bg-slate-700 hover:bg-opacity-30">
                  <td className="py-3 px-4 text-white">Delay Cascade & Priority</td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-1 bg-green-900 text-green-300 rounded text-xs">
                      ✓ Active
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center text-cyan-400">/api/cascade-analysis</td>
                  <td className="py-3 px-4 text-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full inline-block"></span>
                  </td>
                </tr>

                <tr className="border-b border-slate-700 hover:bg-slate-700 hover:bg-opacity-30">
                  <td className="py-3 px-4 text-white">Database Persistence</td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-1 bg-green-900 text-green-300 rounded text-xs">
                      ✓ Active
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center text-cyan-400">/api/database</td>
                  <td className="py-3 px-4 text-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full inline-block"></span>
                  </td>
                </tr>

                <tr className="hover:bg-slate-700 hover:bg-opacity-30">
                  <td className="py-3 px-4 text-white">Advanced Intelligence Dashboard</td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-1 bg-green-900 text-green-300 rounded text-xs">
                      ✓ Active
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center text-cyan-400">/intelligence</td>
                  <td className="py-3 px-4 text-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full inline-block"></span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-slate-400">
          <p className="text-sm">
            Week 3 Complete: 7/7 Tasks • 7 Major Services • 28 API Endpoints • 15+ Intelligence Features
          </p>
          <p className="text-xs mt-2 text-slate-500">
            Advanced Railway Intelligence Platform • Explainable AI • Real-time Network Analysis
          </p>
        </div>
      </div>
    </div>
  );
}
