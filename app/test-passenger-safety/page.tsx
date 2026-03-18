'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Users } from 'lucide-react';
import SubsidiaryServiceNavBar from '@/app/components/SubsidiaryServiceNavBar';

interface PassengerSafetyData {
  train: {
    number: string;
    name: string;
  };
  safetyMetrics: {
    overallScore: number;
    trackCondition: string;
    weatherRisk: string;
    derailmentRisk: string;
    collisionRisk: string;
  };
  passengerWelfare: {
    estimatedCrowding: string;
    ventilationStatus: string;
    temperatureControl: string;
    facilities: {
      toilets: string;
      water: string;
      medical: string;
    };
  };
  delayImpact: {
    passengerStress: string;
    emergencyDelay: number;
    estimatedCompensation: string;
  };
  alerts: Array<{ type: string; severity: string; message: string }>;
  recommendations: string[];
}

function PassengerSafetyContent() {
  const searchParams = useSearchParams();
  const trainNumber = searchParams.get('trainNumber') || '01211';

  const [data, setData] = useState<PassengerSafetyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/system/passenger-safety?trainNumber=${trainNumber}`);
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        const result = await response.json();
        setData(result);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch passenger safety data');
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [trainNumber]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(230,25%,10%)] to-[hsl(240,20%,14%)] p-6">
      <SubsidiaryServiceNavBar trainNumber={trainNumber} currentService="Passenger Safety" />
      <div className="max-w-6xl mx-auto" style={{ marginTop: '70px' }}>
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-8 h-8 text-blue-400" />
            <h1 className="text-4xl font-bold text-white">Passenger Safety</h1>
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
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Safety Metrics */}
              <div className="bg-[hsl(230,20%,16%)] rounded-lg p-6 border border-white/[0.06]">
                <h2 className="text-xl font-bold text-white mb-4">Safety Metrics</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[hsl(220,15%,55%)] text-sm">Overall Score</p>
                    <p className={`text-3xl font-bold ${
                      data.safetyMetrics.overallScore >= 80 ? 'text-green-400' :
                      data.safetyMetrics.overallScore >= 60 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {data.safetyMetrics.overallScore}%
                    </p>
                  </div>
                  <div>
                    <p className="text-[hsl(220,15%,55%)] text-sm">Track Condition</p>
                    <p className={`text-lg font-bold ${
                      data.safetyMetrics.trackCondition === 'Good' ? 'text-green-400' :
                      data.safetyMetrics.trackCondition === 'Fair' ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {data.safetyMetrics.trackCondition}
                    </p>
                  </div>
                  <div>
                    <p className="text-[hsl(220,15%,55%)] text-sm">Weather Risk</p>
                    <p className={`font-bold ${
                      data.safetyMetrics.weatherRisk === 'Low' ? 'text-green-400' :
                      data.safetyMetrics.weatherRisk === 'Medium' ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {data.safetyMetrics.weatherRisk}
                    </p>
                  </div>
                  <div>
                    <p className="text-[hsl(220,15%,55%)] text-sm">Derailment Risk</p>
                    <p className={`font-bold ${
                      data.safetyMetrics.derailmentRisk === 'Low' ? 'text-green-400' :
                      data.safetyMetrics.derailmentRisk === 'Medium' ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {data.safetyMetrics.derailmentRisk}
                    </p>
                  </div>
                  <div>
                    <p className="text-[hsl(220,15%,55%)] text-sm">Collision Risk</p>
                    <p className={`font-bold ${
                      data.safetyMetrics.collisionRisk === 'Low' ? 'text-green-400' :
                      data.safetyMetrics.collisionRisk === 'Medium' ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {data.safetyMetrics.collisionRisk}
                    </p>
                  </div>
                </div>
              </div>

              {/* Passenger Welfare */}
              <div className="bg-[hsl(230,20%,16%)] rounded-lg p-6 border border-white/[0.06]">
                <h2 className="text-xl font-bold text-white mb-4">Passenger Welfare</h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-[hsl(220,15%,55%)] text-sm">Estimated Crowding</p>
                    <p className={`text-lg font-semibold ${
                      data.passengerWelfare.estimatedCrowding === 'Low' ? 'text-green-400' :
                      data.passengerWelfare.estimatedCrowding === 'Moderate' ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {data.passengerWelfare.estimatedCrowding}
                    </p>
                  </div>
                  <div>
                    <p className="text-[hsl(220,15%,55%)] text-sm">Ventilation Status</p>
                    <p className="text-white font-semibold">{data.passengerWelfare.ventilationStatus}</p>
                  </div>
                  <div>
                    <p className="text-[hsl(220,15%,55%)] text-sm">Temperature Control</p>
                    <p className="text-white font-semibold">{data.passengerWelfare.temperatureControl}</p>
                  </div>
                  <div>
                    <p className="text-[hsl(220,15%,55%)] text-sm mb-2">Available Facilities</p>
                    <div className="space-y-1">
                      {data.passengerWelfare.facilities.toilets && (
                        <p className="text-[hsl(220,20%,70%)] text-sm">• Toilets: {data.passengerWelfare.facilities.toilets}</p>
                      )}
                      {data.passengerWelfare.facilities.water && (
                        <p className="text-[hsl(220,20%,70%)] text-sm">• Water: {data.passengerWelfare.facilities.water}</p>
                      )}
                      {data.passengerWelfare.facilities.medical && (
                        <p className="text-[hsl(220,20%,70%)] text-sm">• Medical: {data.passengerWelfare.facilities.medical}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Delay Impact */}
              <div className="bg-[hsl(230,20%,16%)] rounded-lg p-6 border border-white/[0.06]">
                <h2 className="text-xl font-bold text-white mb-4">Delay Impact</h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-[hsl(220,15%,55%)] text-sm">Emergency Delay</p>
                    <p className="text-2xl font-bold text-red-400">+{data.delayImpact.emergencyDelay} min</p>
                  </div>
                  <div>
                    <p className="text-[hsl(220,15%,55%)] text-sm">Passenger Stress</p>
                    <p className={`font-semibold ${
                      data.delayImpact.passengerStress === 'Low' ? 'text-green-400' :
                      data.delayImpact.passengerStress === 'Medium' ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {data.delayImpact.passengerStress}
                    </p>
                  </div>
                  <div>
                    <p className="text-[hsl(220,15%,55%)] text-sm">Estimated Compensation</p>
                    <p className="text-white font-semibold">{data.delayImpact.estimatedCompensation}</p>
                  </div>
                </div>
              </div>

              {/* Alerts */}
              {data.alerts.length > 0 && (
                <div className="bg-[hsl(230,20%,16%)] rounded-lg p-6 border border-white/[0.06]">
                  <h2 className="text-xl font-bold text-white mb-4">Active Alerts</h2>
                  <div className="space-y-2">
                    {data.alerts.map((alert, idx) => (
                      <div key={idx} className={`p-3 rounded border-l-4 ${
                        alert.severity === 'Critical' ? 'bg-red-500/10 border-red-500/30' :
                        alert.severity === 'Warning' ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-blue-500/10 border-blue-500/30'
                      }`}>
                        <p className={`font-semibold text-sm ${
                          alert.severity === 'Critical' ? 'text-red-400' :
                          alert.severity === 'Warning' ? 'text-yellow-400' : 'text-blue-400'
                        }`}>
                          {alert.type}
                        </p>
                        <p className="text-[hsl(220,20%,70%)] text-sm mt-1">{alert.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {data.recommendations.length > 0 && (
                <div className="bg-[hsl(230,20%,16%)] rounded-lg p-6 border border-white/[0.06]">
                  <h2 className="text-xl font-bold text-white mb-4">Recommendations</h2>
                  <ul className="space-y-2">
                    {data.recommendations.map((rec, idx) => (
                      <li key={idx} className="text-[hsl(220,20%,70%)] text-sm flex items-start gap-2">
                        <span className="text-green-400 mt-0.5">✓</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Sidebar - Train Info */}
            <div className="bg-[hsl(230,20%,16%)] rounded-lg p-6 border border-white/[0.06] h-fit">
              <h3 className="text-lg font-bold text-white mb-4">Train Info</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-[hsl(220,15%,55%)]">Train Number</p>
                  <p className="text-white font-semibold">{data.train.number}</p>
                </div>
                <div>
                  <p className="text-[hsl(220,15%,55%)]">Train Name</p>
                  <p className="text-white font-semibold">{data.train.name}</p>
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

export default function PassengerSafetyPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div></div>}>
      <PassengerSafetyContent />
    </Suspense>
  );
}
