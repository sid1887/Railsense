'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Clock, AlertTriangle } from 'lucide-react';
import SubsidiaryServiceNavBar from '@/app/components/SubsidiaryServiceNavBar';

interface HaltAnalysisData {
  trainNumber: string;
  trainName: string;
  currentStatus: {
    isHalted: boolean;
    haltReason?: string;
    haltDuration?: number;
  };
  haltAnalysis: {
    probableCauses: Array<{ cause: string; probability: number }>;
    signalStrength: number;
  };
  impactAnalysis: {
    delayAccumulation: number;
    cascadeRisk: string;
    affectedStations: number;
  };
  recommendations: string[];
}

function HaltAnalysisContent() {
  const searchParams = useSearchParams();
  const trainNumber = searchParams.get('trainNumber') || '01211';

  const [analysis, setAnalysis] = useState<HaltAnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalysis = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/system/halt-analysis?trainNumber=${trainNumber}`);
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        const data = await response.json();
        setAnalysis(data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch halt analysis');
        setAnalysis(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [trainNumber]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(230,25%,10%)] to-[hsl(240,20%,14%)] p-6">
      <SubsidiaryServiceNavBar trainNumber={trainNumber} currentService="Halt Analysis" />
      <div className="max-w-6xl mx-auto" style={{ marginTop: '70px' }}>
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-8 h-8 text-orange-400" />
            <h1 className="text-4xl font-bold text-white">Halt Analysis</h1>
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
              {/* Status Card */}
              <div className="bg-[hsl(230,20%,16%)] rounded-lg p-6 border border-white/[0.06]">
                <h2 className="text-xl font-bold text-white mb-4">Current Status</h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-[hsl(220,15%,55%)] text-sm">Halted</p>
                    <p className="text-2xl font-bold text-white">
                      {analysis.currentStatus.isHalted ? '🛑 Yes' : '✅ No'}
                    </p>
                  </div>
                  {analysis.currentStatus.isHalted && (
                    <>
                      <div>
                        <p className="text-[hsl(220,15%,55%)] text-sm">Halt Reason</p>
                        <p className="text-lg font-semibold text-white">{analysis.currentStatus.haltReason || 'Unknown'}</p>
                      </div>
                      {analysis.currentStatus.haltDuration && (
                        <div>
                          <p className="text-[hsl(220,15%,55%)] text-sm">Duration</p>
                          <p className="text-lg font-semibold text-white">{analysis.currentStatus.haltDuration} minutes</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Probable Causes */}
              <div className="bg-[hsl(230,20%,16%)] rounded-lg p-6 border border-white/[0.06]">
                <h2 className="text-xl font-bold text-white mb-4">Probable Causes</h2>
                <div className="space-y-3">
                  {analysis.haltAnalysis.probableCauses.map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-white">{item.cause}</span>
                        <span className="text-[hsl(220,20%,70%)] text-sm">{(item.probability * 100).toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-[hsl(230,20%,25%)] rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-blue-500"
                          style={{ width: `${item.probability * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[hsl(220,15%,55%)] text-sm mt-4">
                  Signal Strength: {(analysis.haltAnalysis.signalStrength * 100).toFixed(0)}%
                </p>
              </div>

              {/* Impact Analysis */}
              <div className="bg-[hsl(230,20%,16%)] rounded-lg p-6 border border-white/[0.06]">
                <h2 className="text-xl font-bold text-white mb-4">Impact Analysis</h2>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-[hsl(220,15%,55%)] text-sm">Delay Accumulation</p>
                    <p className="text-2xl font-bold text-red-400">+{analysis.impactAnalysis.delayAccumulation} min</p>
                  </div>
                  <div>
                    <p className="text-[hsl(220,15%,55%)] text-sm">Cascade Risk</p>
                    <p className={`text-2xl font-bold ${
                      analysis.impactAnalysis.cascadeRisk === 'High' ? 'text-red-400' :
                      analysis.impactAnalysis.cascadeRisk === 'Medium' ? 'text-orange-400' : 'text-green-400'
                    }`}>
                      {analysis.impactAnalysis.cascadeRisk}
                    </p>
                  </div>
                  <div>
                    <p className="text-[hsl(220,15%,55%)] text-sm">Affected Stations</p>
                    <p className="text-2xl font-bold text-white">{analysis.impactAnalysis.affectedStations}</p>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              {analysis.recommendations.length > 0 && (
                <div className="bg-[hsl(230,20%,16%)] rounded-lg p-6 border border-white/[0.06]">
                  <h2 className="text-xl font-bold text-white mb-4">Recommendations</h2>
                  <ul className="space-y-2">
                    {analysis.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex gap-3 text-[hsl(220,20%,70%)]">
                        <span className="text-green-400 font-bold">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Info Sidebar */}
            <div className="bg-[hsl(230,20%,16%)] rounded-lg p-6 border border-white/[0.06] h-fit">
              <h3 className="text-lg font-bold text-white mb-4">Train Info</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-[hsl(220,15%,55%)]">Train Number</p>
                  <p className="text-white font-semibold">{analysis.trainNumber}</p>
                </div>
                <div>
                  <p className="text-[hsl(220,15%,55%)]">Train Name</p>
                  <p className="text-white font-semibold">{analysis.trainName}</p>
                </div>
                <div className="pt-4 border-t border-white/[0.06]">
                  <p className="text-[hsl(220,15%,55%)] text-xs">Last Updated</p>
                  <p className="text-[hsl(220,20%,70%)] text-xs">{new Date().toLocaleTimeString()}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function HaltAnalysisPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div></div>}>
      <HaltAnalysisContent />
    </Suspense>
  );
}
