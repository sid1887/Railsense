'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  AlertCircle,
  HelpCircle,
  TrendingDown,
  Database,
  Clock,
  MapPin,
  Target,
} from 'lucide-react';

interface DataSourceInfo {
  name: string;
  type: 'official' | 'crowdsourced' | 'estimated' | 'computed';
  quality: number; // 0-100
  lastUpdated: string;
  description: string;
  enabled: boolean;
}

interface DataQualityScore {
  trainNumber: string;
  overall: number;
  sources: DataSourceInfo[];
  trustLevel: 'high' | 'medium' | 'low';
  warnings: string[];
  recommendations: string[];
}

const MOCK_QUALITY_DATA: DataQualityScore = {
  trainNumber: '12955',
  overall: 82,
  trustLevel: 'high',
  sources: [
    {
      name: 'NTES (Official Status)',
      type: 'official',
      quality: 95,
      lastUpdated: '2 minutes ago',
      description: 'Delay and halt status from Indian Railways official system',
      enabled: true,
    },
    {
      name: 'RailYatri GPS',
      type: 'crowdsourced',
      quality: 88,
      lastUpdated: '45 seconds ago',
      description: 'Live GPS coordinates from crowdsourced mobile app data',
      enabled: true,
    },
    {
      name: 'Railway Schedule',
      type: 'estimated',
      quality: 65,
      lastUpdated: '25 hours ago',
      description: 'Position estimated from scheduled route and elapsed time',
      enabled: false,
    },
    {
      name: 'Traffic Analysis',
      type: 'computed',
      quality: 72,
      lastUpdated: 'Real-time',
      description: 'Nearby trains and congestion calculated from active train positions',
      enabled: true,
    },
  ],
  warnings: [
    'RailYatri GPS last update was 45 seconds ago - location may be slightly stale',
    'Nearby trains count is based on available tracked trains only',
  ],
  recommendations: [
    'For real-time tracking, rely on RailYatri GPS (most recent)',
    'For official status, use NTES data (most authoritative)',
    'Schedule estimates should only be used as fallback when live data unavailable',
  ],
};

export default function DataQualityDashboard() {
  const [qualityData, setQualityData] = useState<DataQualityScore>(MOCK_QUALITY_DATA);
  const [selectedTrain, setSelectedTrain] = useState('12955');
  const [loading, setLoading] = useState(false);

  const handleTrainSelect = async (trainNumber: string) => {
    setSelectedTrain(trainNumber);
    setLoading(true);

    try {
      // In production: const response = await fetch(`/api/data-quality?trainNumber=${trainNumber}`);
      // const data = await response.json();
      // setQualityData(data);

      // Mock: Simulate API call
      await new Promise((r) => setTimeout(r, 600));
      setQualityData({ ...MOCK_QUALITY_DATA, trainNumber });
    } finally {
      setLoading(false);
    }
  };

  const getTrustColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'text-green-400';
      case 'medium':
        return 'text-yellow-400';
      case 'low':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'official':
        return <CheckCircle className="w-5 h-5 text-blue-400" />;
      case 'crowdsourced':
        return <Database className="w-5 h-5 text-purple-400" />;
      case 'estimated':
        return <HelpCircle className="w-5 h-5 text-yellow-400" />;
      case 'computed':
        return <Target className="w-5 h-5 text-orange-400" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="flex items-center gap-3 mb-6">
          <Database className="w-8 h-8 text-blue-400" />
          <div>
            <h1 className="text-3xl font-bold text-white">Data Quality Dashboard</h1>
            <p className="text-slate-400 text-sm">See exactly where your data comes from and how trustworthy it is</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel: Train Selector */}
        <div className="lg:col-span-1">
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 backdrop-blur">
            <h2 className="text-lg font-bold text-white mb-4">Select Train</h2>
            <div className="space-y-2">
              {['12955', '12728', '17015', '12702', '11039'].map((trainNum) => (
                <motion.button
                  key={trainNum}
                  onClick={() => handleTrainSelect(trainNum)}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full px-4 py-3 rounded-lg text-left transition-all ${
                    selectedTrain === trainNum
                      ? 'bg-blue-600 text-white border border-blue-500'
                      : 'bg-slate-700/50 text-slate-300 border border-slate-600 hover:border-slate-500'
                  }`}
                >
                  <div className="font-semibold">{trainNum}</div>
                  <div className="text-xs opacity-75">Train number</div>
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel: Quality Metrics */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overall Quality Score */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 backdrop-blur"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-white">Overall Data Quality</h2>
                <p className="text-slate-400 text-sm">Combined score from all sources</p>
              </div>
              <div className={`text-4xl font-bold ${getTrustColor(qualityData.trustLevel)}`}>
                {qualityData.overall}%
              </div>
            </div>

            {/* Quality Bar */}
            <div className="w-full bg-slate-700 rounded-full h-3 mb-4 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${qualityData.overall}%` }}
                transition={{ duration: 0.8 }}
                className={`h-full ${
                  qualityData.overall >= 80
                    ? 'bg-green-500'
                    : qualityData.overall >= 60
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
              />
            </div>

            {/* Trust Badge */}
            <div
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${
                qualityData.trustLevel === 'high'
                  ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                  : qualityData.trustLevel === 'medium'
                  ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/50'
                  : 'bg-red-500/20 text-red-400 border border-red-500/50'
              }`}
            >
              {qualityData.trustLevel === 'high' ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
              {qualityData.trustLevel.charAt(0).toUpperCase() + qualityData.trustLevel.slice(1)} Trust
            </div>
          </motion.div>

          {/* Data Sources */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 backdrop-blur">
            <h2 className="text-lg font-bold text-white mb-4">Data Sources</h2>
            <div className="space-y-3">
              {qualityData.sources.map((source, index) => (
                <motion.div
                  key={source.name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 rounded-lg border ${
                    source.enabled
                      ? 'bg-slate-700/30 border-slate-600'
                      : 'bg-slate-800/30 border-slate-700 opacity-60'
                  }`}
                >
                  <div className="flex items-start gap-3 mb-2">
                    <div className="mt-1">{getSourceIcon(source.type)}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="font-semibold text-white">{source.name}</div>
                        {!source.enabled && <div className="text-xs bg-slate-700 text-slate-400 px-2 py-1 rounded">Disabled</div>}
                      </div>
                      <p className="text-sm text-slate-400">{source.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                        <div>Quality: <span className="text-slate-300 font-semibold">{source.quality}%</span></div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {source.lastUpdated}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quality Bar */}
                  <div className="w-full bg-slate-600 rounded-full h-2 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${source.quality}%` }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                      className="h-full bg-blue-500"
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Warnings */}
          {qualityData.warnings.length > 0 && (
            <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-xl p-4">
              <div className="flex gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-yellow-300 mb-2">Data Warnings</h3>
                  <ul className="space-y-1">
                    {qualityData.warnings.map((warning, i) => (
                      <li key={i} className="text-sm text-yellow-200">
                        • {warning}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Recommendations */}
          {qualityData.recommendations.length > 0 && (
            <div className="bg-blue-500/10 border border-blue-500/50 rounded-xl p-4">
              <div className="flex gap-3">
                <HelpCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-300 mb-2">Recommendations</h3>
                  <ul className="space-y-1">
                    {qualityData.recommendations.map((rec, i) => (
                      <li key={i} className="text-sm text-blue-200">
                        • {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
