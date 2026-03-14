'use client';

import { useEffect, useState } from 'react';
import { TrainAnalytics } from '@/types/analytics';
import { motion } from 'framer-motion';

// Import new design components
import TopNavigationBar from './TopNavigationBar';
import TrainDetailHeader from './TrainDetailHeader';
import TrainMapViewer from './TrainMapViewer';
import HaltAnalysisPanel from './HaltAnalysisPanel';
import WaitTimeCard from './WaitTimeCard';
import RecommendationBanner from './RecommendationBanner';
import NearbyRailwaySections from './NearbyRailwaySections';
import RouteTimeline from './RouteTimeline';
import StatusBar from './StatusBar';
import './design-system.css';

interface TrainDetailPageProps {
  trainNumber: string;
}

export default function TrainDetailPage({ trainNumber }: TrainDetailPageProps) {
  const [analytics, setAnalytics] = useState<TrainAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTrain, setSelectedTrain] = useState(trainNumber);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/train-analytics?trainNumber=${selectedTrain}`);
        if (!res.ok) throw new Error('Failed to fetch analytics');
        const data = await res.json();
        setAnalytics(data.data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setAnalytics(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 30000);
    return () => clearInterval(interval);
  }, [selectedTrain]);

  if (loading && !analytics) {
    return (
      <div
        style={{
          backgroundColor: 'hsl(220, 20%, 7%)',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div className="loadingSpinner">
          <div className="spinner"></div>
          <p>Loading train analytics...</p>
        </div>
      </div>
    );
  }

  if (error && !analytics) {
    return (
      <div style={{ backgroundColor: 'hsl(220, 20%, 7%)', minHeight: '100vh', padding: '16px' }}>
        <TopNavigationBar trainNumber={selectedTrain} />
        <div
          style={{
            maxWidth: '1600px',
            margin: '100px auto',
            backgroundColor: 'rgba(230, 57, 70, 0.1)',
            border: '1px solid rgba(230, 57, 70, 0.3)',
            borderLeft: '4px solid hsl(0, 72%, 55%)',
            borderRadius: '12px',
            padding: '24px',
            color: 'hsl(210, 20%, 92%)',
          }}
        >
          <h2 style={{ color: 'hsl(0, 72%, 55%)', margin: '0 0 12px 0' }}>Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div style={{ backgroundColor: 'hsl(220, 20%, 7%)', minHeight: '100vh', padding: '16px' }}>
        <TopNavigationBar trainNumber={selectedTrain} />
        <div
          style={{
            maxWidth: '1600px',
            margin: '100px auto',
            backgroundColor: 'rgba(230, 57, 70, 0.1)',
            border: '1px solid rgba(230, 57, 70, 0.3)',
            borderLeft: '4px solid hsl(0, 72%, 55%)',
            borderRadius: '12px',
            padding: '24px',
            color: 'hsl(210, 20%, 92%)',
          }}
        >
          <h2 style={{ color: 'hsl(0, 72%, 55%)', margin: '0 0 12px 0' }}>Train Not Found</h2>
          <p>No data available for train {selectedTrain}</p>
        </div>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div style={{ backgroundColor: 'hsl(220, 20%, 7%)', minHeight: '100vh' }}>
      {/* Top Navigation Bar */}
      <TopNavigationBar
        trainNumber={selectedTrain}
        trainName={analytics.trainName}
        showHeatmap={showHeatmap}
        showDemo={showDemo}
        onHeatmapToggle={setShowHeatmap}
        onDemoToggle={setShowDemo}
        onTrainSearch={(num) => setSelectedTrain(num)}
      />

      {/* Main Content */}
      <motion.div
        style={{
          maxWidth: '1600px',
          margin: '0 auto',
          padding: '32px 16px',
        }}
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        {/* Train Detail Header */}
        <motion.div variants={itemVariants}>
          <TrainDetailHeader analytics={analytics} />
        </motion.div>

        {/* Recommendation Banner */}
        {analytics.movementState === 'halted' && (
          <motion.div variants={itemVariants}>
            <RecommendationBanner text="Board from platform 3 when movement resumes. Check signaling status." />
          </motion.div>
        )}

        {/* Main Grid Layout */}
        <motion.div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '16px',
            marginBottom: '24px',
          }}
          variants={itemVariants}
        >
          {/* LEFT COLUMN */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Map Section */}
            <motion.div
              variants={itemVariants}
              style={{
                borderRadius: '16px',
                overflow: 'hidden',
                border: '1px solid hsl(220, 14%, 18%)',
                aspectRatio: '16/9',
              }}
            >
              <TrainMapViewer analytics={analytics} />
            </motion.div>

            {/* Halt Analysis (if halted) */}
            {analytics.movementState === 'halted' && (
              <motion.div variants={itemVariants}>
                <HaltAnalysisPanel analytics={analytics} />
              </motion.div>
            )}

            {/* Nearby Railway Sections */}
            <motion.div variants={itemVariants}>
              <NearbyRailwaySections />
            </motion.div>
          </div>

          {/* RIGHT COLUMN */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Wait Time Card */}
            <motion.div variants={itemVariants}>
              <WaitTimeCard analytics={analytics} />
            </motion.div>

            {/* Route Timeline */}
            <motion.div variants={itemVariants}>
              <RouteTimeline />
            </motion.div>
          </div>
        </motion.div>

        {/* Full-width sections below grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '100px' }}>
          {/* Data Visualizations Grid (optional additional section) */}
          <motion.div
            variants={itemVariants}
            style={{
              padding: '20px',
              backgroundColor: 'rgba(19, 24, 41, 0.8)',
              backdropFilter: 'blur(40px)',
              border: '1px solid hsl(220, 14%, 18%)',
              borderRadius: '16px',
              color: 'hsl(215, 12%, 50%)',
              textAlign: 'center',
            }}
          >
            <p style={{ fontSize: '12px', margin: 0 }}>
              📊 Additional data visualizations and analytics chart cards can be added here
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* Status Bar */}
      <StatusBar
        trackingCount={5}
        haltedCount={2}
        averageDelay={8}
        selectedTrain={selectedTrain}
        onTrainSelect={(num) => setSelectedTrain(num)}
      />

      {/* Last Updated Footer */}
      <footer
        style={{
          textAlign: 'center',
          padding: '20px',
          fontSize: '10px',
          fontFamily: 'var(--font-mono)',
          color: 'hsl(215, 12%, 50%)',
          borderTop: '1px solid hsl(220, 14%, 18%)',
        }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Last updated: {new Date().toLocaleTimeString()}
        </motion.div>
      </footer>
    </div>
  );
}
