import React from 'react';
import TrainSearch from '@/components/TrainSearch';

/**
 * Home Page
 * Landing page with train search functionality
 * Allows users to search for trains by number or name
 */
export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-dark-bg to-dark-card flex flex-col items-center justify-center px-4 py-8">
      {/* Header Section */}
      <div className="text-center mb-12 animate-fade-in">
        <h1 className="text-5xl md:text-6xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-accent-blue to-accent-blue-dark">
          RailSense
        </h1>
        <p className="text-xl text-text-secondary mb-2">Intelligent Train Halt Insight System</p>
        <p className="text-text-secondary max-w-2xl mx-auto">
          Real-time train tracking and contextual insights for unexpected halts. Know when your train will move again.
        </p>
      </div>

      {/* Feature Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 w-full max-w-4xl">
        <div className="card p-6 text-center hover:glow-blue transition-all duration-300">
          <div className="text-3xl mb-3 flex-center">📍</div>
          <h3 className="font-semibold text-accent-blue mb-2">Live Position</h3>
          <p className="text-sm text-text-secondary">Real-time train location tracking on interactive map</p>
        </div>

        <div className="card p-6 text-center hover:glow-blue transition-all duration-300">
          <div className="text-3xl mb-3 flex-center">⏱️</div>
          <h3 className="font-semibold text-accent-blue mb-2">Halt Detection</h3>
          <p className="text-sm text-text-secondary">Identifies unexpected stops and duration tracking</p>
        </div>

        <div className="card p-6 text-center hover:glow-blue transition-all duration-300">
          <div className="text-3xl mb-3 flex-center">🎯</div>
          <h3 className="font-semibold text-accent-blue mb-2">Smart Insights</h3>
          <p className="text-sm text-text-secondary">AI-powered context for delays and wait times</p>
        </div>
      </div>

      {/* Search Component */}
      <div className="w-full max-w-2xl">
        <TrainSearch />
      </div>

      {/* Demo Info */}
      <div className="mt-12 text-center text-text-secondary text-sm max-w-2xl">
        <p>Try searching for trains like <span className="text-accent-blue font-semibold">12702</span> or <span className="text-accent-blue font-semibold">17015</span></p>
        <p className="mt-2">Demo mode uses simulated data for testing and presentation</p>
      </div>
    </div>
  );
}
