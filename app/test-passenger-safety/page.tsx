'use client';

import React, { useState, useEffect } from 'react';
import { Users, RotateCw } from 'lucide-react';
import { PassengerSafetyCard } from '@/components/PassengerSafetyCard';
import { PassengerSafetyAssessment } from '@/services/passengerSafetyService';

export default function PassengerSafetyPage() {
  const [selectedTrain, setSelectedTrain] = useState('12723-RAJ');
  const [trainCategory, setTrainCategory] = useState('rajdhani');
  const [originStation, setOriginStation] = useState('HYD');
  const [destinationStation, setDestinationStation] = useState('VJA');
  const [assessment, setAssessment] = useState<PassengerSafetyAssessment | null>(null);
  const [loading, setLoading] = useState(false);

  const trains = [
    { number: '12723-RAJ', category: 'rajdhani', name: 'Rajdhani Express' },
    { number: '12659-SHAB', category: 'shatabdi', name: 'Shatabdi Express' },
    { number: '12809-SF', category: 'superfast', name: 'Superfast Express' },
    { number: '12709-EXP', category: 'express', name: 'Express' },
    { number: '11010-PASS', category: 'passenger', name: 'Passenger' },
  ];

  const stations = [
    { id: 'HYD', name: 'Hyderabad' },
    { id: 'SEC', name: 'Secunderabad' },
    { id: 'KZP', name: 'Kazipet' },
    { id: 'WGL', name: 'Warangal' },
    { id: 'VJA', name: 'Vijayawada' },
    { id: 'VSP', name: 'Visakhapatnam' },
  ];

  useEffect(() => {
    fetchAssessment();
  }, [selectedTrain, trainCategory, originStation, destinationStation]);

  const fetchAssessment = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/passenger-safety?action=assess-safety&train=${selectedTrain}&origin=${originStation}&destination=${destinationStation}&category=${trainCategory}`
      );
      const result = await response.json();
      if (result.success) {
        setAssessment(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch safety assessment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTrainChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = trains.find((t) => t.number === e.target.value);
    if (selected) {
      setSelectedTrain(selected.number);
      setTrainCategory(selected.category);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(230,25%,10%)] to-[hsl(240,20%,14%)] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-2 font-semibold tracking-tight">
            <Users className="w-10 h-10 text-blue-500" />
            Passenger Safety & Dwell Analysis
          </h1>
          <p className="text-[hsl(220,20%,70%)]">
            Comprehensive passenger protection through connection window analysis and dwell anomaly detection
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
                  onChange={handleTrainChange}
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
                <label className="block text-sm font-semibold text-[hsl(220,15%,55%)] mb-2">Origin</label>
                <select
                  value={originStation}
                  onChange={(e) => setOriginStation(e.target.value)}
                  className="w-full px-3 py-2 bg-[hsl(230,20%,20%)] border border-white/[0.06] rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  {stations.map((station) => (
                    <option key={station.id} value={station.id}>
                      {station.name} ({station.id})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[hsl(220,15%,55%)] mb-2">Destination</label>
                <select
                  value={destinationStation}
                  onChange={(e) => setDestinationStation(e.target.value)}
                  className="w-full px-3 py-2 bg-[hsl(230,20%,20%)] border border-white/[0.06] rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  {stations.map((station) => (
                    <option key={station.id} value={station.id}>
                      {station.name} ({station.id})
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={fetchAssessment}
                disabled={loading}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg disabled:opacity-50 transition"
              >
                {loading ? 'Analyzing...' : 'Analyze Safety'}
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

            {!loading && assessment && <PassengerSafetyCard assessment={assessment} />}
          </div>
        </div>

        {/* Information Boxes */}
        <div className="mt-8 grid md:grid-cols-3 gap-4">
          <div className="bg-[hsl(230,20%,16%)] rounded-lg shadow-lg p-4 border border-white/[0.06]" style={{boxShadow: '0 0 0 1px rgba(255,255,255,0.05), 0 4px 20px rgba(0,0,0,0.3)'}}>
            <h3 className="font-bold text-white mb-2 font-semibold">Connection Safety Windows</h3>
            <p className="text-sm text-[hsl(220,20%,70%)]">
              Analysis of safe time windows for passenger connections between trains with margin calculations.
            </p>
          </div>
          <div className="bg-[hsl(230,20%,16%)] rounded-lg shadow-lg p-4 border border-white/[0.06]" style={{boxShadow: '0 0 0 1px rgba(255,255,255,0.05), 0 4px 20px rgba(0,0,0,0.3)'}}>
            <h3 className="font-bold text-white mb-2 font-semibold">Dwell Anomaly Detection</h3>
            <p className="text-sm text-[hsl(220,20%,70%)]">
              Identifies unusual station halt patterns that may impact passenger transfers and cascading delays.
            </p>
          </div>
          <div className="bg-[hsl(230,20%,16%)] rounded-lg shadow-lg p-4 border border-white/[0.06]" style={{boxShadow: '0 0 0 1px rgba(255,255,255,0.05), 0 4px 20px rgba(0,0,0,0.3)'}}>
            <h3 className="font-bold text-white mb-2 font-semibold">Cascade Risk Assessment</h3>
            <p className="text-sm text-[hsl(220,20%,70%)]">
              Quantifies how dwell anomalies may ripple through the network affecting downstream connections.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
