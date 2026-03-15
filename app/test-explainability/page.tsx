'use client';

import React, { useState, useEffect } from 'react';
import { Brain, RotateCw } from 'lucide-react';
import { ExplainabilityCard } from '@/components/ExplainabilityCard';
import { ExplainedPrediction } from '@/services/explainabilityEngine';

export default function ExplainabilityPage() {
  const [predictionType, setPredictionType] = useState<'delay' | 'halt'>('delay');
  const [selectedTrain, setSelectedTrain] = useState('12723-RAJ');
  const [selectedTarget, setSelectedTarget] = useState('SEC-002');
  const [value, setValue] = useState(15);
  const [showNarrative, setShowNarrative] = useState(false);
  const [explanation, setExplanation] = useState<ExplainedPrediction | null>(null);
  const [narrative, setNarrative] = useState('');
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
    fetchExplanation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [predictionType, selectedTrain, selectedTarget, value]);

  const fetchExplanation = async () => {
    setLoading(true);
    try {
      const action = predictionType === 'delay' ? 'explain-delay' : 'explain-halt';
      const params =
        predictionType === 'delay'
          ? `action=${action}&train=${selectedTrain}&section=${selectedTarget}&delay=${value}`
          : `action=${action}&train=${selectedTrain}&location=${selectedTarget}&duration=${value}`;

      const response = await fetch(`/api/explainability?${params}`);
      const result = await response.json();

      if (result.success) {
        setExplanation(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch explanation:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchNarrative = async () => {
    try {
      const response = await fetch(
        `/api/explainability?action=narrative&type=${predictionType}&train=${selectedTrain}&target=${selectedTarget}&value=${value}`
      );
      const result = await response.json();

      if (result.success) {
        setNarrative(result.data.narrative);
        setShowNarrative(true);
      }
    } catch (error) {
      console.error('Failed to fetch narrative:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(230,25%,10%)] to-[hsl(240,20%,14%)] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-2 font-semibold tracking-tight">
            <Brain className="w-10 h-10 text-blue-500" />
            Explainability Engine
          </h1>
          <p className="text-[hsl(220,20%,70%)]">Transparent reasoning for all predictions with evidence-based explanations</p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Control Panel */}
          <div className="lg:col-span-1">
            <div className="bg-[hsl(230,20%,16%)] rounded-lg shadow-lg p-6 space-y-4 h-fit sticky top-6 border border-white/[0.06]" style={{boxShadow: '0 0 0 1px rgba(255,255,255,0.05), 0 4px 20px rgba(0,0,0,0.3)'}}>
              <h2 className="text-lg font-bold text-white font-semibold">Configuration</h2>

              <div>
                <label className="block text-sm font-semibold text-[hsl(220,15%,55%)] mb-2">Prediction Type</label>
                <select
                  value={predictionType}
                  onChange={(e) => setPredictionType(e.target.value as 'delay' | 'halt')}
                  className="w-full px-3 py-2 bg-[hsl(230,20%,20%)] border border-white/[0.06] rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="delay">Delay Prediction</option>
                  <option value="halt">Halt Prediction</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[hsl(220,15%,55%)] mb-2">Train</label>
                <select
                  value={selectedTrain}
                  onChange={(e) => setSelectedTrain(e.target.value)}
                  className="w-full px-3 py-2 bg-[hsl(230,20%,20%)] border border-white/[0.06] rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  {trains.map((train) => (
                    <option key={train.number} value={train.number}>
                      {train.number}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[hsl(220,15%,55%)] mb-2">
                  {predictionType === 'delay' ? 'Section' : 'Location'}
                </label>
                <select
                  value={selectedTarget}
                  onChange={(e) => setSelectedTarget(e.target.value)}
                  className="w-full px-3 py-2 bg-[hsl(230,20%,20%)] border border-white/[0.06] rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  {sections.map((section) => (
                    <option key={section.id} value={section.id}>
                      {section.id}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[hsl(220,15%,55%)] mb-2">
                  {predictionType === 'delay' ? 'Delay' : 'Duration'}: {value} min
                </label>
                <input
                  type="range"
                  min="1"
                  max="60"
                  value={value}
                  onChange={(e) => setValue(parseInt(e.target.value, 10))}
                  className="w-full h-2 bg-[hsl(230,20%,25%)] rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              <button
                onClick={fetchNarrative}
                disabled={loading}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg disabled:opacity-50 transition"
              >
                {loading ? 'Generating...' : 'View as Narrative'}
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {loading && (
              <div className="flex items-center justify-center py-16">
                <RotateCw className="w-8 h-8 text-blue-500 animate-spin" />
              </div>
            )}

            {!loading && explanation && (
              <ExplainabilityCard
                prediction={explanation}
                showNarrative={showNarrative}
                narrative={narrative}
              />
            )}
          </div>
        </div>

        {/* Information Box */}
        <div className="mt-8 bg-[hsl(230,20%,16%)] rounded-lg shadow-lg p-6 grid md:grid-cols-3 gap-6 border border-white/[0.06]" style={{boxShadow: '0 0 0 1px rgba(255,255,255,0.05), 0 4px 20px rgba(0,0,0,0.3)'}}>
          <div>
            <h3 className="font-bold text-white mb-2 font-semibold">Evidence-Based</h3>
            <p className="text-sm text-[hsl(220,20%,70%)]">
              Every prediction includes a detailed breakdown of the factors that led to the conclusion.
            </p>
          </div>
          <div>
            <h3 className="font-bold text-white mb-2 font-semibold">Confidence Metrics</h3>
            <p className="text-sm text-[hsl(220,20%,70%)]">Understand how confident we are in each prediction and quantify uncertainty.</p>
          </div>
          <div>
            <h3 className="font-bold text-white mb-2 font-semibold">Alternative Scenarios</h3>
            <p className="text-sm text-[hsl(220,20%,70%)]">See how different factors could lead to different outcomes.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
