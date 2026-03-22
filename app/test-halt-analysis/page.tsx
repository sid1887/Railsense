'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AlertTriangle, Clock3, Siren } from 'lucide-react';
import SubsidiaryServiceNavBar from '@/app/components/SubsidiaryServiceNavBar';
import RailLoader from '@/components/RailLoader';

interface HaltAnalysisData {
  trainNumber: string;
  trainName: string;
  currentStatus: { isHalted: boolean; haltReason?: string; haltDuration?: number };
  haltAnalysis: { probableCauses: Array<{ cause: string; probability: number }>; signalStrength: number };
  impactAnalysis: { delayAccumulation: number; cascadeRisk: string; affectedStations: number };
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
        if (!response.ok) throw new Error(`API error: ${response.status}`);
        setAnalysis(await response.json());
      } catch (err: any) {
        setError(err?.message || 'Failed to fetch halt analysis');
        setAnalysis(null);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalysis();
  }, [trainNumber]);

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-slate-950"><RailLoader size="lg" /></div>;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_10%_0%,#2b1f1f_0%,#141420_40%,#090d1f_100%)] px-4 pb-14 pt-6 md:px-7">
      <SubsidiaryServiceNavBar trainNumber={trainNumber} currentService="Halt Analysis" />
      <div className="mx-auto mt-16 max-w-6xl space-y-5">
        <header className="surface-glass rounded-2xl p-5">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-amber-300">Halt Analysis</p>
          <h1 className="text-3xl font-black text-white">Stop Cause and Impact Diagnosis</h1>
          <p className="mt-2 text-sm text-slate-300">Train: {trainNumber}</p>
          {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
        </header>

        {analysis && (
          <>
            <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <Metric label="Current State" value={analysis.currentStatus.isHalted ? 'HALTED' : 'MOVING'} icon={<Siren className="h-4 w-4" />} />
              <Metric label="Halt Duration" value={`${analysis.currentStatus.haltDuration || 0} min`} icon={<Clock3 className="h-4 w-4" />} />
              <Metric label="Signal Strength" value={`${Math.round(analysis.haltAnalysis.signalStrength * 100)}%`} icon={<AlertTriangle className="h-4 w-4" />} />
              <Metric label="Cascade Risk" value={analysis.impactAnalysis.cascadeRisk} icon={<AlertTriangle className="h-4 w-4" />} />
            </section>

            <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="surface-glass rounded-2xl p-5">
                <h2 className="mb-4 text-lg font-bold text-white">Probable Causes</h2>
                <div className="space-y-3">
                  {analysis.haltAnalysis.probableCauses.map((item, idx) => (
                    <div key={`${item.cause}-${idx}`}>
                      <div className="mb-1 flex items-center justify-between text-sm">
                        <span className="text-slate-200">{item.cause}</span>
                        <span className="text-amber-200">{Math.round(item.probability * 100)}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-800">
                        <div className="h-2 rounded-full bg-gradient-to-r from-amber-400 to-orange-500" style={{ width: `${item.probability * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="surface-glass rounded-2xl p-5">
                <h2 className="mb-4 text-lg font-bold text-white">Impact Snapshot</h2>
                <div className="grid grid-cols-1 gap-2 text-sm text-slate-200">
                  <div className="rounded-lg border border-slate-700 bg-slate-900/45 px-3 py-2">Delay accumulation: +{analysis.impactAnalysis.delayAccumulation} min</div>
                  <div className="rounded-lg border border-slate-700 bg-slate-900/45 px-3 py-2">Affected stations: {analysis.impactAnalysis.affectedStations}</div>
                  <div className="rounded-lg border border-slate-700 bg-slate-900/45 px-3 py-2">Primary reason: {analysis.currentStatus.haltReason || 'Under evaluation'}</div>
                </div>
              </div>
            </section>

            <section className="surface-glass rounded-2xl p-5">
              <h2 className="mb-4 text-lg font-bold text-white">Operational Recommendations</h2>
              <ul className="space-y-2 text-sm text-slate-200">
                {analysis.recommendations.map((rec, idx) => (
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

function Metric({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return <article className="surface-glass rounded-xl px-4 py-3"><p className="mb-1 flex items-center gap-1 text-[11px] uppercase tracking-[0.12em] text-slate-400">{icon}{label}</p><p className="text-sm font-bold text-amber-100">{value}</p></article>;
}

export default function HaltAnalysisPage() {
  return <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-slate-950"><RailLoader size="lg" /></div>}><HaltAnalysisContent /></Suspense>;
}
