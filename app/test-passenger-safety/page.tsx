'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Shield, Thermometer, Users } from 'lucide-react';
import SubsidiaryServiceNavBar from '@/app/components/SubsidiaryServiceNavBar';
import RailLoader from '@/components/RailLoader';

interface PassengerSafetyData {
  train: { number: string; name: string };
  safetyMetrics: { overallScore: number; trackCondition: string; weatherRisk: string; derailmentRisk: string; collisionRisk: string };
  passengerWelfare: { estimatedCrowding: string; ventilationStatus: string; temperatureControl: string; facilities: { toilets: string; water: string; medical: string } };
  delayImpact: { passengerStress: string; emergencyDelay: number; estimatedCompensation: string };
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
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        setData(await response.json());
      } catch (err: any) {
        setError(err?.message || 'Failed to fetch passenger safety data');
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [trainNumber]);

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-slate-950"><RailLoader size="lg" /></div>;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_10%_0%,#1f322e_0%,#121f20_40%,#090d1f_100%)] px-4 pb-14 pt-6 md:px-7">
      <SubsidiaryServiceNavBar trainNumber={trainNumber} currentService="Passenger Safety" />
      <div className="mx-auto mt-16 max-w-6xl space-y-5">
        <header className="surface-glass rounded-2xl p-5">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-300">Passenger Safety</p>
          <h1 className="text-3xl font-black text-white">Safety and Welfare Monitoring</h1>
          <p className="mt-2 text-sm text-slate-300">Train: {trainNumber}</p>
          {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
        </header>

        {data && (
          <>
            <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <Card label="Safety Score" value={`${data.safetyMetrics.overallScore}%`} icon={<Shield className="h-4 w-4" />} />
              <Card label="Crowding" value={data.passengerWelfare.estimatedCrowding} icon={<Users className="h-4 w-4" />} />
              <Card label="Weather Risk" value={data.safetyMetrics.weatherRisk} icon={<Thermometer className="h-4 w-4" />} />
              <Card label="Emergency Delay" value={`${data.delayImpact.emergencyDelay} min`} icon={<Shield className="h-4 w-4" />} />
            </section>

            <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="surface-glass rounded-2xl p-5">
                <h2 className="mb-4 text-lg font-bold text-white">Core Risk Indicators</h2>
                <ul className="space-y-2 text-sm text-slate-200">
                  <li className="rounded-lg border border-slate-700 bg-slate-900/45 px-3 py-2">Track condition: {data.safetyMetrics.trackCondition}</li>
                  <li className="rounded-lg border border-slate-700 bg-slate-900/45 px-3 py-2">Derailment risk: {data.safetyMetrics.derailmentRisk}</li>
                  <li className="rounded-lg border border-slate-700 bg-slate-900/45 px-3 py-2">Collision risk: {data.safetyMetrics.collisionRisk}</li>
                  <li className="rounded-lg border border-slate-700 bg-slate-900/45 px-3 py-2">Passenger stress: {data.delayImpact.passengerStress}</li>
                </ul>
              </div>

              <div className="surface-glass rounded-2xl p-5">
                <h2 className="mb-4 text-lg font-bold text-white">Onboard Welfare</h2>
                <ul className="space-y-2 text-sm text-slate-200">
                  <li className="rounded-lg border border-slate-700 bg-slate-900/45 px-3 py-2">Ventilation: {data.passengerWelfare.ventilationStatus}</li>
                  <li className="rounded-lg border border-slate-700 bg-slate-900/45 px-3 py-2">Temperature: {data.passengerWelfare.temperatureControl}</li>
                  <li className="rounded-lg border border-slate-700 bg-slate-900/45 px-3 py-2">Toilets: {data.passengerWelfare.facilities.toilets}</li>
                  <li className="rounded-lg border border-slate-700 bg-slate-900/45 px-3 py-2">Water: {data.passengerWelfare.facilities.water}</li>
                  <li className="rounded-lg border border-slate-700 bg-slate-900/45 px-3 py-2">Medical: {data.passengerWelfare.facilities.medical}</li>
                </ul>
              </div>
            </section>

            <section className="surface-glass rounded-2xl p-5">
              <h2 className="mb-4 text-lg font-bold text-white">Active Alerts</h2>
              {data.alerts.length === 0 ? (
                <p className="text-sm text-slate-300">No active alerts.</p>
              ) : (
                <div className="space-y-2">
                  {data.alerts.map((alert, idx) => (
                    <div key={`${alert.type}-${idx}`} className="rounded-lg border border-slate-700 bg-slate-900/45 px-3 py-2 text-sm text-slate-200">
                      <span className="mr-2 font-semibold text-emerald-200">[{alert.severity}]</span>
                      <span>{alert.type}: {alert.message}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="surface-glass rounded-2xl p-5">
              <h2 className="mb-4 text-lg font-bold text-white">Recommendations</h2>
              <ul className="space-y-2 text-sm text-slate-200">
                {data.recommendations.map((rec, idx) => (
                  <li key={`${rec}-${idx}`} className="rounded-lg border border-slate-700 bg-slate-900/45 px-3 py-2">{rec}</li>
                ))}
              </ul>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function Card({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return <article className="surface-glass rounded-xl px-4 py-3"><p className="mb-1 flex items-center gap-1 text-[11px] uppercase tracking-[0.12em] text-slate-400">{icon}{label}</p><p className="text-sm font-bold text-emerald-100">{value}</p></article>;
}

export default function PassengerSafetyPage() {
  return <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-slate-950"><RailLoader size="lg" /></div>}><PassengerSafetyContent /></Suspense>;
}
