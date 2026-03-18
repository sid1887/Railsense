'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Brain } from 'lucide-react';

interface ExplainabilityData {
  train: {
    number: string;
    name: string;
  };
  predictions: {
    delayForecast: {
      prediction: string;
      confidence: number;
      reasoning: string[];
      factors: Array<{ name: string; weight: number; value: string; impact: string }>;
    };
    stationArrival: {
      prediction: string;
      estimatedTime: string;
      confidence: number;
      reasoning: string[];
    };
  };
  dataQualityImpact: {
    statement: string;
    sources: Array<{ name: string; used: boolean; confidence: number }>;
  };
  modelCharacteristics: {
    type: string;
    updateFrequency: string;
    trainingData: string;
    accuracy: string;
  };
  disclaimers: string[];
  userGuidance: string[];
}

function ExplainabilityContent() {
  const searchParams = useSearchParams();
  const trainNumber = searchParams.get('trainNumber') || '01211';

  const [data, setData] = useState<ExplainabilityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/system/explainability?trainNumber=${trainNumber}`);
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        const result = await response.json();
        setData(result);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch explainability data');
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
            <Brain className="w-8 h-8 text-purple-400" />
            <h1 className="text-4xl font-bold text-white">Explainability</h1>
          </div>
          <p className="text-[hsl(220,20%,70%)]">Train: {trainNumber}</p>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 mb-6">
            <p className="text-red-400">Error: {error}</p>
          </div>
        )}

        {data && !loading && (
          <div className="space-y-6">
            {/* Delay Forecast */}
            <div className="bg-[hsl(230,20%,16%)] rounded-lg p-6 border border-white/[0.06]">
              <h2 className="text-xl font-bold text-white mb-4">Delay Forecast</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-[hsl(220,15%,55%)] text-sm mb-1">Predicted Delay</p>
                    <p className="text-4xl font-bold text-red-400">{data.predictions.delayForecast.prediction}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[hsl(220,15%,55%)] text-sm mb-1">Confidence</p>
                    <p className={`text-3xl font-bold ${
                      data.predictions.delayForecast.confidence >= 80 ? 'text-green-400' :
                      data.predictions.delayForecast.confidence >= 60 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {data.predictions.delayForecast.confidence}%
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-[hsl(220,15%,55%)] text-sm mb-2">Reasoning</p>
                  <ul className="space-y-1">
                    {data.predictions.delayForecast.reasoning.map((reason, idx) => (
                      <li key={idx} className="text-[hsl(220,20%,70%)] text-sm flex gap-2">
                        <span className="text-purple-400 mt-0.5">•</span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-[hsl(220,15%,55%)] text-sm mb-3">Contributing Factors</p>
                  <div className="space-y-2">
                    {data.predictions.delayForecast.factors.map((factor, idx) => (
                      <div key={idx} className="p-3 bg-[hsl(230,20%,25%)] rounded">
                        <div className="flex justify-between items-center mb-2">
                          <div>
                            <p className="text-white font-semibold">{factor.name}</p>
                            <p className="text-[hsl(220,15%,55%)] text-xs">Weight: {(factor.weight * 100).toFixed(0)}%</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[hsl(220,20%,70%)] font-mono">{factor.value}</p>
                            <p className={`text-xs font-semibold ${
                              factor.impact === 'High' ? 'text-red-400' :
                              factor.impact === 'Medium' ? 'text-yellow-400' : 'text-green-400'
                            }`}>
                              {factor.impact} Impact
                            </p>
                          </div>
                        </div>
                        <div className="w-full bg-[hsl(230,20%,30%)] rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full bg-purple-500"
                            style={{ width: `${factor.weight * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Station Arrival */}
            <div className="bg-[hsl(230,20%,16%)] rounded-lg p-6 border border-white/[0.06]">
              <h2 className="text-xl font-bold text-white mb-4">Next Station Arrival</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-[hsl(220,15%,55%)] text-sm mb-1">Station</p>
                    <p className="text-3xl font-bold text-blue-400">{data.predictions.stationArrival.prediction}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[hsl(220,15%,55%)] text-sm mb-1">ETA</p>
                    <p className="text-2xl font-bold text-white">{data.predictions.stationArrival.estimatedTime}</p>
                    <p className={`text-sm font-semibold ${
                      data.predictions.stationArrival.confidence >= 80 ? 'text-green-400' :
                      data.predictions.stationArrival.confidence >= 60 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {data.predictions.stationArrival.confidence}% confidence
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-[hsl(220,15%,55%)] text-sm mb-2">Estimation Logic</p>
                  <ul className="space-y-1">
                    {data.predictions.stationArrival.reasoning.map((reason, idx) => (
                      <li key={idx} className="text-[hsl(220,20%,70%)] text-sm flex gap-2">
                        <span className="text-blue-400 mt-0.5">•</span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Data Quality Impact */}
            <div className="bg-[hsl(230,20%,16%)] rounded-lg p-6 border border-white/[0.06]">
              <h2 className="text-xl font-bold text-white mb-4">Data Quality Impact</h2>
              <p className="text-[hsl(220,20%,70%)] mb-4">{data.dataQualityImpact.statement}</p>
              <div className="space-y-3">
                {data.dataQualityImpact.sources.map((source, idx) => (
                  <div key={idx} className="p-4 bg-[hsl(230,20%,25%)] rounded">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${source.used ? 'bg-green-400' : 'bg-red-500'}`}></div>
                        <p className="text-white font-semibold">{source.name}</p>
                        <span className="text-xs bg-[hsl(230,20%,30%)] px-2 py-1 rounded text-[hsl(220,15%,55%)]">
                          {source.used ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-[hsl(220,20%,70%)] font-mono">{(source.confidence * 100).toFixed(0)}%</p>
                    </div>
                    <div className="w-full bg-[hsl(230,20%,30%)] rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-blue-500"
                        style={{ width: `${source.confidence * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Model Characteristics */}
            <div className="bg-[hsl(230,20%,16%)] rounded-lg p-6 border border-white/[0.06]">
              <h2 className="text-xl font-bold text-white mb-4">Model Characteristics</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-[hsl(230,20%,25%)] rounded">
                  <p className="text-[hsl(220,15%,55%)] text-sm mb-1">Model Type</p>
                  <p className="text-white font-semibold">{data.modelCharacteristics.type}</p>
                </div>
                <div className="p-4 bg-[hsl(230,20%,25%)] rounded">
                  <p className="text-[hsl(220,15%,55%)] text-sm mb-1">Update Frequency</p>
                  <p className="text-white font-semibold">{data.modelCharacteristics.updateFrequency}</p>
                </div>
                <div className="p-4 bg-[hsl(230,20%,25%)] rounded">
                  <p className="text-[hsl(220,15%,55%)] text-sm mb-1">Training Data</p>
                  <p className="text-white font-semibold">{data.modelCharacteristics.trainingData}</p>
                </div>
                <div className="p-4 bg-[hsl(230,20%,25%)] rounded">
                  <p className="text-[hsl(220,15%,55%)] text-sm mb-1">Accuracy</p>
                  <p className="text-green-400 font-semibold">{data.modelCharacteristics.accuracy}</p>
                </div>
              </div>
            </div>

            {/* Disclaimers */}
            {data.disclaimers.length > 0 && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-6">
                <h3 className="text-yellow-300 font-bold text-lg mb-3">Disclaimers</h3>
                <ul className="space-y-2">
                  {data.disclaimers.map((disclaimer, idx) => (
                    <li key={idx} className="flex gap-3 text-[hsl(220,20%,70%)]">
                      <span className="text-yellow-400 font-bold">•</span>
                      <span>{disclaimer}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* User Guidance */}
            {data.userGuidance.length > 0 && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6">
                <h3 className="text-blue-300 font-bold text-lg mb-3">Usage Guidance</h3>
                <ul className="space-y-2">
                  {data.userGuidance.map((guidance, idx) => (
                    <li key={idx} className="flex gap-3 text-[hsl(220,20%,70%)]">
                      <span className="text-blue-400 font-bold">→</span>
                      <span>{guidance}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ExplainabilityPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div></div>}>
      <ExplainabilityContent />
    </Suspense>
  );
}
