'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { TrendingDown } from 'lucide-react';
import SubsidiaryServiceNavBar from '@/app/components/SubsidiaryServiceNavBar';

interface CascadeAnalysisData {
  train: {
    number: string;
    name: string;
  };
  currentDelay: number;
  cascadeAnalysis: {
    delayOrigin: string;
    estimatedPropagation: Array<{ station: string; estimatedDelay: number; impactedTrains: number }>;
    affectedRoutes: any[];
    totalAffectedTrains: number;
  };
  delayProgression: {
    trend: string;
    velocityOfChange: string;
    projectedDelay: number;
  };
  networkRiskFactors: {
    upstreamCongestion: boolean;
    downstreamCongestion: boolean;
    platformAvailability: boolean;
    junctionSpacing: string;
  };
  recoveryPotential: {
    estimatedRecovery: string;
    fastTrackSections: any[];
    recoveryProbability: number;
  };
  recommendations: string[];
}

function CascadeAnalysisContent() {
  const searchParams = useSearchParams();
  const trainNumber = searchParams.get('trainNumber') || '01211';

  const [analysis, setAnalysis] = useState<CascadeAnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalysis = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/system/cascade-analysis?trainNumber=${trainNumber}`);
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        const data = await response.json();
        setAnalysis(data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch cascade analysis');
        setAnalysis(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [trainNumber]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(230,25%,10%)] to-[hsl(240,20%,14%)] p-6">
      <SubsidiaryServiceNavBar trainNumber={trainNumber} currentService="Cascade Analysis" />
      <div className="max-w-6xl mx-auto" style={{ marginTop: '70px' }}>
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <TrendingDown className="w-8 h-8 text-red-400" />
            <h1 className="text-4xl font-bold text-white">Cascade Analysis</h1>
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

        {analysis && !loading && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Analysis */}
            <div className="lg:col-span-2 space-y-6">
              {/* Current Status */}
              <div className="bg-[hsl(230,20%,16%)] rounded-lg p-6 border border-white/[0.06]">
                <h2 className="text-xl font-bold text-white mb-4">Current Delay</h2>
                <p className="text-5xl font-bold text-red-400">{analysis.currentDelay} min</p>
              </div>

              {/* Delay Progression */}
              <div className="bg-[hsl(230,20%,16%)] rounded-lg p-6 border border-white/[0.06]">
                <h2 className="text-xl font-bold text-white mb-4">Delay Progression</h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-[hsl(220,15%,55%)] text-sm">Trend</p>
                    <p className={`font-semibold capitalize ${
                      analysis.delayProgression.trend === 'increasing' ? 'text-red-400' :
                      analysis.delayProgression.trend === 'decreasing' ? 'text-green-400' : 'text-yellow-400'
                    }`}>
                      {analysis.delayProgression.trend}
                    </p>
                  </div>
                  <div>
                    <p className="text-[hsl(220,15%,55%)] text-sm">Velocity of Change</p>
                    <p className="text-white font-semibold">{analysis.delayProgression.velocityOfChange}</p>
                  </div>
                  <div>
                    <p className="text-[hsl(220,15%,55%)] text-sm">Projected Delay</p>
                    <p className="text-red-400 font-semibold text-lg">{analysis.delayProgression.projectedDelay} min</p>
                  </div>
                </div>
              </div>

              {/* Cascade Propagation */}
              <div className="bg-[hsl(230,20%,16%)] rounded-lg p-6 border border-white/[0.06]">
                <h2 className="text-xl font-bold text-white mb-4">Estimated Propagation</h2>
                <div className="space-y-3">
                  {analysis.cascadeAnalysis.estimatedPropagation.map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-white">{item.station}</span>
                        <span className="text-red-400 text-sm">+{item.estimatedDelay} min</span>
                      </div>
                      <div className="w-full bg-[hsl(230,20%,25%)] rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-red-500"
                          style={{ width: `${Math.min(item.estimatedDelay * 5, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Risk Factors */}
              <div className="bg-[hsl(230,20%,16%)] rounded-lg p-6 border border-white/[0.06]">
                <h2 className="text-xl font-bold text-white mb-4">Network Risk Factors</h2>
                <div className="space-y-2">
                  <div className="flex justify-between items-center p-2 bg-[hsl(230,20%,12%)] rounded">
                    <span className="text-[hsl(220,20%,70%)] text-sm">Upstream Congestion</span>
                    <span className={`font-semibold ${analysis.networkRiskFactors.upstreamCongestion ? 'text-red-400' : 'text-green-400'}`}>
                      {analysis.networkRiskFactors.upstreamCongestion ? '⚠ Yes' : '✓ No'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-[hsl(230,20%,12%)] rounded">
                    <span className="text-[hsl(220,20%,70%)] text-sm">Downstream Congestion</span>
                    <span className={`font-semibold ${analysis.networkRiskFactors.downstreamCongestion ? 'text-red-400' : 'text-green-400'}`}>
                      {analysis.networkRiskFactors.downstreamCongestion ? '⚠ Yes' : '✓ No'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-[hsl(230,20%,12%)] rounded">
                    <span className="text-[hsl(220,20%,70%)] text-sm">Platform Availability</span>
                    <span className={`font-semibold ${!analysis.networkRiskFactors.platformAvailability ? 'text-red-400' : 'text-green-400'}`}>
                      {analysis.networkRiskFactors.platformAvailability ? '✓ Available' : '⚠ Limited'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-[hsl(230,20%,12%)] rounded">
                    <span className="text-[hsl(220,20%,70%)] text-sm">Junction Spacing</span>
                    <span className="text-[hsl(220,20%,70%)] font-semibold capitalize">{analysis.networkRiskFactors.junctionSpacing}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recovery Info */}
            <div className="bg-[hsl(230,20%,16%)] rounded-lg p-6 border border-white/[0.06] h-fit">
              <h3 className="text-lg font-bold text-white mb-4">Recovery Potential</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-[hsl(220,15%,55%)] text-sm">Recovery Probability</p>
                  <div className="flex items-end gap-2">
                    <p className="text-2xl font-bold text-green-400">{(analysis.recoveryPotential.recoveryProbability * 100).toFixed(0)}%</p>
                  </div>
                </div>
                <div>
                  <p className="text-[hsl(220,15%,55%)] text-sm">Estimated Recovery</p>
                  <p className="text-lg font-semibold text-green-400">{analysis.recoveryPotential.estimatedRecovery}</p>
                </div>
                <div className="pt-4 border-t border-white/[0.06]">
                  <p className="text-[hsl(220,15%,55%)] text-xs mb-2">RECOMMENDATIONS</p>
                  <ul className="space-y-2">
                    {analysis.recommendations.map((rec, idx) => (
                      <li key={idx} className="text-xs text-[hsl(220,20%,70%)] flex gap-2">
                        <span className="text-green-400 mt-0.5">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CascadeAnalysisPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div></div>}>
      <CascadeAnalysisContent />
    </Suspense>
  );
}
