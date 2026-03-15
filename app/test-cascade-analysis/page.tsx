'use client';

import React, { useState, useEffect } from 'react';
import { TrendingDown, RotateCw } from 'lucide-react';
import { CascadeAnalysisCard } from '@/components/CascadeAnalysisCard';
import { CascadeAnalysis } from '@/services/cascadeService';

export default function CascadeAnalysisPage() {
  const [selectedTrain, setSelectedTrain] = useState('12723-RAJ');
  const [selectedSection, setSelectedSection] = useState('SEC-002');
  const [delay, setDelay] = useState(15);
  const [analysis, setAnalysis] = useState<CascadeAnalysis | null>(null);
  const [loading, setLoading] = useState(false);

  const trains = [
    { number: '12723-RAJ', name: 'Rajdhani Express' },
    { number: '12659-SHAB', name: 'Shatabdi Express' },
    { number: '12809-SF', name: 'Superfast Express' },
    { number: '12709-EXP', name: 'Express' },
    { number: '11010-PASS', name: 'Passenger' },
    { number: '12234-FRT', name: 'Freight' },
  ];

  const sections = [
    { id: 'SEC-001', name: 'Hyderabad → Secunderabad' },
    { id: 'SEC-002', name: 'Secunderabad → Kazipet' },
    { id: 'SEC-003', name: 'Kazipet → Warangal' },
    { id: 'SEC-004', name: 'Hyderabad → Vijayawada' },
    { id: 'SEC-005', name: 'Vijayawada → Visakhapatnam' },
    { id: 'SEC-006', name: 'Hyderabad → Bengaluru' },
  ];

  useEffect(() => {
    fetchAnalysis();
  }, [selectedTrain, selectedSection, delay]);

  const fetchAnalysis = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/cascade-analysis?action=analyze-cascade&train=${selectedTrain}&delay=${delay}&section=${selectedSection}`
      );
      const result = await response.json();
      if (result.success) {
        setAnalysis(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch cascade analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(230,25%,10%)] to-[hsl(240,20%,14%)] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-2 font-semibold tracking-tight">
            <TrendingDown className="w-10 h-10 text-red-500" />
            Delay Cascade & Priority Detection
          </h1>
          <p className="text-[hsl(220,20%,70%)]">
            Models ripple effects and identifies priority-based conflicts in the rail network
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Controls */}
          <div className="lg:col-span-1">
            <div className="bg-[hsl(230,20%,16%)] rounded-lg shadow-lg p-6 space-y-4 h-fit sticky top-6 border border-white/[0.06]" style={{boxShadow: '0 0 0 1px rgba(255,255,255,0.05), 0 4px 20px rgba(0,0,0,0.3)'}}>
              <h2 className="text-lg font-bold text-white font-semibold">Configuration</h2>

              <div>
                <label className="block text-sm font-semibold text-[hsl(220,15%,55%)] mb-2">Train</label>
                <select
                  value={selectedTrain}
                  onChange={(e) => setSelectedTrain(e.target.value)}
                  className="w-full px-3 py-2 bg-[hsl(230,20%,20%)] border border-white/[0.06] rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
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
                  value={selectedSection}
                  onChange={(e) => setSelectedSection(e.target.value)}
                  className="w-full px-3 py-2 bg-[hsl(230,20%,20%)] border border-white/[0.06] rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  {sections.map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.id} - {section.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[hsl(220,15%,55%)] mb-2">
                  Initial Delay: {delay} minutes
                </label>
                <input
                  type="range"
                  min="1"
                  max="60"
                  value={delay}
                  onChange={(e) => setDelay(parseInt(e.target.value, 10))}
                  className="w-full h-2 bg-[hsl(230,20%,25%)] rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <div className="flex justify-between text-xs text-[hsl(220,15%,55%)] mt-2">
                  <span>1 min</span>
                  <span>30 min</span>
                  <span>60 min</span>
                </div>
              </div>

              <button
                onClick={fetchAnalysis}
                disabled={loading}
                className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg disabled:opacity-50 transition"
              >
                {loading ? 'Analyzing...' : 'Analyze Cascade'}
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {loading && (
              <div className="flex items-center justify-center py-16 bg-[hsl(230,20%,16%)] rounded-lg border border-white/[0.06]">
                <RotateCw className="w-8 h-8 text-blue-500 animate-spin" />
              </div>
            )}

            {!loading && analysis && <CascadeAnalysisCard analysis={analysis} />}
          </div>
        </div>

        {/* Information Boxes */}
        <div className="mt-8 grid md:grid-cols-3 gap-4">
          <div className="bg-[hsl(230,20%,16%)] rounded-lg shadow-lg p-4 border border-white/[0.06]" style={{boxShadow: '0 0 0 1px rgba(255,255,255,0.05), 0 4px 20px rgba(0,0,0,0.3)'}}>
            <h3 className="font-bold text-white mb-2 font-semibold">Cascade Level</h3>
            <p className="text-sm text-[hsl(220,20%,70%)]">
              Measures the severity of delay propagation through the network based on section capacity and train density.
            </p>
          </div>
          <div className="bg-[hsl(230,20%,16%)] rounded-lg shadow-lg p-4 border border-white/[0.06]" style={{boxShadow: '0 0 0 1px rgba(255,255,255,0.05), 0 4px 20px rgba(0,0,0,0.3)'}}>
            <h3 className="font-bold text-white mb-2 font-semibold">Priority Conflicts</h3>
            <p className="text-sm text-[hsl(220,20%,70%)]">
              Detects situations where high-priority trains are delayed behind lower-priority ones, enabling corrective actions.
            </p>
          </div>
          <div className="bg-[hsl(230,20%,16%)] rounded-lg shadow-lg p-4 border border-white/[0.06]" style={{boxShadow: '0 0 0 1px rgba(255,255,255,0.05), 0 4px 20px rgba(0,0,0,0.3)'}}>
            <h3 className="font-bold text-white mb-2 font-semibold">Network Impact</h3>
            <p className="text-sm text-[hsl(220,20%,70%)]">
              Quantifies the overall network impact including passenger connections, crew scheduling, and platform utilization.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
