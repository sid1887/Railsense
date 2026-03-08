'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useTrainData } from '@/hooks/useTrainData';
import LiveTrainMap from '@/components/LiveTrainMap';
import RouteTimeline from '@/components/RouteTimeline';
import HaltStatusCard from '@/components/HaltStatusCard';
import UncertaintyGauge from '@/components/UncertaintyGauge';
import TrafficIndicator from '@/components/TrafficIndicator';
import PredictionCard from '@/components/PredictionCard';
import InsightPanel from '@/components/InsightPanel';
import CongestionHeatmap from '@/components/CongestionHeatmap';

/**
 * Train Detail Page
 * Shows comprehensive information about a specific train
 * Integrates all insight services through custom hooks
 * Auto-polls for live updates every 5 seconds
 */
export default function TrainDetailPage() {
  const params = useParams();
  const trainNumber = params.trainNumber as string;

  // Use custom hook for train data with 5-second polling
  const { data: insightData, loading: isLoading, error: hookError, refetch } = useTrainData(
    trainNumber,
    {
      pollInterval: 5000, // Update every 5 seconds
      onError: (err) => console.error('Train data fetch error:', err),
    }
  );

  const error = hookError ? 'Unable to load train information. Please try again.' : '';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-accent-blue border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-text-secondary">Loading train information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-dark-bg flex flex-col items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold mb-2 text-alert-red">{error}</h2>
          <p className="text-text-secondary mb-6">Train {trainNumber} not found or service unavailable</p>
          <Link href="/" className="btn-primary inline-block">
            Back to Search
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-dark-bg p-4 md:p-6"
    >
      {/* Header with Back Button */}
      <div className="max-w-7xl mx-auto mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-accent-blue hover:text-accent-blue-dark transition-colors mb-6"
        >
          <ArrowLeft size={20} />
          Back to Search
        </Link>

        {insightData ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-2">
              {insightData.trainData.trainName}
            </h1>
            <p className="text-xl text-text-secondary">
              Train #{insightData.trainData.trainNumber} • {insightData.trainData.source} → {insightData.trainData.destination}
            </p>
          </motion.div>
        ) : null}
      </div>

      {/* Main Content - Full Components Integration */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Map & Timeline Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Live Train Map */}
            {insightData && <LiveTrainMap trainData={insightData.trainData} />}

            {/* Route Timeline */}
            {insightData && (
              <RouteTimeline
                stations={insightData.trainData.scheduledStations}
                currentStationIndex={insightData.trainData.currentStationIndex}
                trainName={insightData.trainData.trainName}
              />
            )}

            {/* Congestion Heatmap */}
            {insightData && <CongestionHeatmap traffic={insightData.trafficAnalysis} />}
          </div>

          {/* Right: Insights Dashboard */}
          <div className="space-y-4">
            {/* Halt Status Card */}
            {insightData && (
              <HaltStatusCard
                haltDetection={insightData.haltDetection}
                trainDelay={insightData.trainData.delay}
              />
            )}

            {/* Uncertainty Gauge */}
            {insightData && <UncertaintyGauge uncertainty={insightData.uncertainty} />}

            {/* Traffic Indicator */}
            {insightData && <TrafficIndicator traffic={insightData.trafficAnalysis} />}

            {/* Prediction Card */}
            {insightData && <PredictionCard prediction={insightData.prediction} />}

            {/* Passenger Insight Panel */}
            {insightData && <InsightPanel insight={insightData.insight} />}
          </div>
        </div>
      </div>

      {/* Refresh Button */}
      {isLoading && (
        <div className="fixed bottom-6 right-6">
          <motion.button
            onClick={refetch}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="btn-primary rounded-full w-14 h-14 flex items-center justify-center shadow-lg"
          >
            <div className="inline-block w-5 h-5 border-2 border-dark-bg border-t-accent-blue rounded-full animate-spin" />
          </motion.button>
        </div>
      )}
    </motion.div>
  );
}
