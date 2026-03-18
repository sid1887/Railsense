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
import ETAForecastCard from '@/components/ETAForecastCard';
import JourneyAlertsPanel from '@/components/JourneyAlertsPanel';
import './design-system.css';

interface TrainDetailPageProps {
  trainNumber: string;
}

interface ApiRouteStop {
  station: string;
  code?: string;
  arrivalTime?: string;
  departureTime?: string;
}

interface TimelineStation {
  name: string;
  code: string;
  scheduledTime: string;
  actualTime?: string;
  status: 'completed' | 'current' | 'upcoming';
  delayMinutes?: number;
}

interface OperationalContext {
  nearbyTrainsCount: number;
  congestionLevel: 'low' | 'medium' | 'high';
  sectionRiskScore: number;
  haltRiskScore: number;
  delayRiskScore: number;
  radiusKm: number;
  activeSignals: string[];
}

export default function TrainDetailPage({ trainNumber }: TrainDetailPageProps) {
  const [analytics, setAnalytics] = useState<TrainAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTrain, setSelectedTrain] = useState(trainNumber);
  const [timelineStations, setTimelineStations] = useState<TimelineStation[]>([]);
  const [operationalSignals, setOperationalSignals] = useState<string[]>([]);
  const [operationalContext, setOperationalContext] = useState<OperationalContext | null>(null);

  // Update selectedTrain when trainNumber prop changes
  useEffect(() => {
    setSelectedTrain(trainNumber);
  }, [trainNumber]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        console.log(`[TrainDetail] Fetching data for train: ${selectedTrain}`);

        // Use the new unified train search endpoint
        const res = await fetch(`/api/train/${selectedTrain}`);
        console.log(`[TrainDetail] API response status: ${res.status}`);

        if (!res.ok) {
          throw new Error(`Failed to fetch train data (${res.status})`);
        }

        const data = await res.json();
        console.log(`[TrainDetail] Received data:`, data);

        // Build timeline stations directly from API route data.
        const routeStops: ApiRouteStop[] = Array.isArray(data.route) ? data.route : [];
        const currentCode = (data.currentStationCode || '').toUpperCase();
        const currentIndex = routeStops.findIndex(
          stop => (stop.code || '').toUpperCase() === currentCode
        );

        const mappedTimeline: TimelineStation[] = routeStops.map((stop, index) => {
          const stationCode = stop.code || `ST${index + 1}`;
          let status: 'completed' | 'current' | 'upcoming' = 'upcoming';

          if (currentIndex >= 0) {
            if (index < currentIndex) status = 'completed';
            if (index === currentIndex) status = 'current';
          } else if (index === 0) {
            status = 'current';
          }

          return {
            name: stop.station || `Stop ${index + 1}`,
            code: stationCode,
            scheduledTime:
              stop.arrivalTime && stop.arrivalTime !== 'Source'
                ? stop.arrivalTime
                : stop.departureTime || '--:--',
            actualTime: stop.arrivalTime || stop.departureTime || '--:--',
            status,
            delayMinutes: typeof data.delayMinutes === 'number' ? data.delayMinutes : 0,
          };
        });

        console.log(`[TrainDetail] Timeline stops count: ${mappedTimeline.length}`);

        // If nearby trains are missing from core response, fetch by geographic radius.
        let nearbyContext = data.nearbyTrains;
        if (
          (!nearbyContext || !Array.isArray(nearbyContext.trains) || nearbyContext.trains.length === 0) &&
          data.location?.lat &&
          data.location?.lng
        ) {
          try {
            const nearbyRes = await fetch(
              `/api/mapview?lat=${data.location.lat}&lng=${data.location.lng}&radius=80`,
              { cache: 'no-store' }
            );
            if (nearbyRes.ok) {
              const nearbyData = await nearbyRes.json();
              const nearbyFeatures = Array.isArray(nearbyData?.data?.trains)
                ? nearbyData.data.trains
                : [];

              nearbyContext = {
                count: nearbyFeatures.length,
                trains: nearbyFeatures.slice(0, 8).map((feature: any, idx: number) => {
                  const props = feature?.properties || {};
                  return {
                    trainNumber: props.trainNumber || props.train_no || `N${idx + 1}`,
                    trainName: props.trainName || props.train_name || 'Nearby Train',
                    distance: Number(props.distanceKm || props.distance || idx + 1),
                    movementState: 'running',
                  };
                }),
                congestion_level:
                  nearbyFeatures.length > 10
                    ? 'HIGH'
                    : nearbyFeatures.length > 4
                      ? 'MEDIUM'
                      : 'LOW',
              };
            }
          } catch (nearbyError) {
            console.warn('[TrainDetail] Nearby radius fetch failed:', nearbyError);
          }
        }

        // Map API status to valid MovementState type ('running' | 'halted' | 'stopped' | 'stalled')
        const statusMap: Record<string, 'running' | 'halted' | 'stopped' | 'stalled'> = {
          'at-station': 'stopped',
          'departed': 'running',
          'running': 'running',
          'halted': 'halted',
          'stopped': 'stopped',
          'stalled': 'stalled',
        };

        // Transform unified response to analytics format for compatibility
        const analyticsData: TrainAnalytics = {
          trainNumber: data.trainNumber || '',
          trainName: data.trainName || '',
          movementState: (statusMap[data.status] || 'stopped') as 'running' | 'halted' | 'stopped' | 'stalled',
          speed: data.currentSpeed || 0,
          delay: data.delayMinutes || 0,
          confidence: typeof data.predictionConfidence === 'number' ? data.predictionConfidence : 0.5,
          haltConfidence: 0.7,
          destinationStation: data.destinationCode || data.destination || '',
          currentLocation: {
            stationName: data.currentStation || '',
            stationCode: data.currentStationCode || data.sourceCode || '',
            latitude: data.location?.lat || 0,
            longitude: data.location?.lng || 0,
          },
          nextMajorStop: data.eta ? {
            stationName: data.eta.nextStation || data.nextStation || '',
            stationCode: 'NEXT',
            distance: 0,
            estimatedArrival: data.eta.estimatedArrival || '',
          } : undefined,
          haltAnalysis: data.haltAnalysis || { isHalted: false },
          waitTimePrediction: data.waitTimePrediction || {
            breakdown: {
              baseStopDuration: 0,
              trafficDelay: 0,
              weatherDelay: 0,
              delayCarryover: 0,
              operationalDelay: 0,
              totalWaitTime: 0,
              confidence: 0,
            },
            range: { min: 0, max: 0 },
            isUnusual: false,
          },
          nearbyTrains: nearbyContext || {
            count: 0,
            trains: [],
            congestion_level: 'LOW',
          },
          sectionAnalytics: data.sectionAnalytics || { networkHeatmap: {} },
          recommendedAction: data.recommendedAction || 'Monitor train progress',
          lastUpdated: data.lastUpdated || new Date().toISOString(),
        };

        const signals: string[] = [];
        if (data.liveUnavailable) {
          signals.push('Live GPS is currently unavailable, operating on static route intelligence.');
        }
        if ((data.delayMinutes || 0) >= 15) {
          signals.push(`Sustained delay detected (${data.delayMinutes} min). Higher halt probability on the next 2 stations.`);
        }
        if ((nearbyContext?.count || 0) >= 6) {
          signals.push(`High surrounding traffic in radius: ${nearbyContext.count} trains nearby.`);
        }
        if ((data.currentSpeed || 0) <= 5 && (data.delayMinutes || 0) > 5) {
          signals.push('Low speed with existing delay suggests section-level slowdown or signal hold.');
        }
        if (data.operationalContext?.activeSignals?.length) {
          for (const backendSignal of data.operationalContext.activeSignals) {
            if (!signals.includes(backendSignal)) {
              signals.push(backendSignal);
            }
          }
        }

        setAnalytics(analyticsData as any);
  setTimelineStations(mappedTimeline);
        setOperationalSignals(signals);
        setOperationalContext((data.operationalContext || null) as OperationalContext | null);
        setError(null);
        console.log(`[TrainDetail] Successfully loaded train data`);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        console.error(`[TrainDetail] Error fetching data:`, errorMsg);
        setError(errorMsg);
        setAnalytics(null);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 30000);
    return () => clearInterval(interval);
  }, [selectedTrain]);

  // Handle loading state
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
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          .loading-container {
            text-align: center;
          }
          .loading-spinner {
            width: 50px;
            height: 50px;
            margin: 0 auto 20px;
            border: 3px solid rgba(79, 172, 254, 0.2);
            border-top-color: hsl(210, 100%, 50%);
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          .loading-text {
            color: hsl(210, 20%, 92%);
            font-size: 16px;
            margin-bottom: 12px;
          }
          .loading-subtext {
            color: hsl(210, 20%, 70%);
            font-size: 14px;
            animation: pulse 2s ease-in-out infinite;
          }
        `}</style>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <div className="loading-text">Loading train data...</div>
          <div className="loading-subtext">Please wait</div>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error && !analytics) {
    const handleRetry = () => {
      setError(null);
      setLoading(true);
    };

    return (
      <div style={{ backgroundColor: 'hsl(220, 20%, 7%)', minHeight: '100vh', padding: '16px' }}>
        <TopNavigationBar
          trainNumber={selectedTrain}
          onTrainSearch={setSelectedTrain}
        />
        <div
          style={{
            maxWidth: '600px',
            margin: '80px auto',
            backgroundColor: 'rgba(230, 57, 70, 0.1)',
            border: '1px solid rgba(230, 57, 70, 0.3)',
            borderLeft: '4px solid hsl(0, 72%, 55%)',
            borderRadius: '12px',
            padding: '32px',
            color: 'hsl(210, 20%, 92%)',
          }}
        >
          <h2 style={{ color: 'hsl(0, 72%, 55%)', margin: '0 0 12px 0', fontSize: '20px' }}>
            Error Loading Train Data
          </h2>
          <p style={{ margin: '0 0 24px 0', color: 'hsl(210, 20%, 80%)', lineHeight: '1.5' }}>
            {error}
          </p>
          <button
            onClick={handleRetry}
            style={{
              backgroundColor: 'hsl(0, 72%, 55%)',
              color: 'white',
              border: 'none',
              padding: '10px 24px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'hsl(0, 72%, 45%)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'hsl(0, 72%, 55%)')}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Handle no data state
  if (!analytics) {
    return (
      <div style={{ backgroundColor: 'hsl(220, 20%, 7%)', minHeight: '100vh', padding: '16px' }}>
        <TopNavigationBar
          trainNumber={selectedTrain}
          onTrainSearch={setSelectedTrain}
        />
        <div
          style={{
            maxWidth: '600px',
            margin: '80px auto',
            backgroundColor: 'rgba(230, 57, 70, 0.1)',
            border: '1px solid rgba(230, 57, 70, 0.3)',
            borderLeft: '4px solid hsl(0, 72%, 55%)',
            borderRadius: '12px',
            padding: '32px',
            color: 'hsl(210, 20%, 92%)',
          }}
        >
          <h2 style={{ color: 'hsl(0, 72%, 55%)', margin: '0 0 12px 0', fontSize: '20px' }}>
            Train Not Found
          </h2>
          <p style={{ margin: '0', color: 'hsl(210, 20%, 80%)', lineHeight: '1.5' }}>
            No data available for train <strong>{selectedTrain}</strong>. Please check the train number and try again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: 'hsl(220, 20%, 7%)', minHeight: '100vh', color: 'white' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px' }}>
        {/* TOP NAV */}
        <div style={{ marginBottom: '24px' }}>
          <TopNavigationBar
            trainNumber={selectedTrain}
            onTrainSearch={setSelectedTrain}
          />
        </div>

        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.08,
                delayChildren: 0.1,
              },
            },
          }}
        >
          {/* HEADER - Train Details */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
            style={{ marginBottom: '16px' }}
          >
            <TrainDetailHeader analytics={analytics} />
          </motion.div>

          {/* JOURNEY ALERTS - High Priority */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
            style={{ marginBottom: '20px' }}
          >
            <JourneyAlertsPanel
              trainNumber={selectedTrain}
              boardingStation={analytics.currentLocation.stationName || 'Unknown'}
              alightingStation={analytics.destinationStation || 'Unknown'}
            />
          </motion.div>

          {/* TWO COLUMN LAYOUT - Main Content */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
            {/* LEFT COLUMN - Map & Sections */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* MAP */}
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
                style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid hsl(220, 14%, 18%)', minHeight: '400px' }}
              >
                <TrainMapViewer analytics={analytics} />
              </motion.div>

              {/* NEARBY RAILWAY SECTIONS */}
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                <NearbyRailwaySections
                  sections={
                    analytics.nearbyTrains?.trains && analytics.nearbyTrains.trains.length > 0
                      ? analytics.nearbyTrains.trains.map((train, idx) => ({
                          code: `SEC${idx + 1}`,
                          name: `${train.trainName} - ${train.distance}km away`,
                          congestion: Math.min(100, (analytics.nearbyTrains.count || 0) * 20),
                        }))
                      : [
                          { code: 'SEC1', name: 'No nearby trains', congestion: 0 },
                        ]
                  }
                />
              </motion.div>

              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
                style={{
                  borderRadius: '12px',
                  border: '1px solid hsl(220, 14%, 18%)',
                  background: 'rgba(19, 24, 41, 0.8)',
                  padding: '16px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: 'hsl(0, 0%, 98%)' }}>
                    Signals & Issues
                  </h3>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      borderRadius: '999px',
                      padding: '4px 10px',
                      background: 'rgba(139, 92, 246, 0.16)',
                      border: '1px solid rgba(139, 92, 246, 0.42)',
                      color: 'hsl(0, 0%, 98%)',
                    }}
                  >
                    {operationalSignals.length || 1} active
                  </span>
                </div>

                {analytics?.nearbyTrains && (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, minmax(0,1fr))',
                      gap: '8px',
                      marginBottom: '10px',
                    }}
                  >
                    <div style={{ padding: '8px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', fontSize: '12px' }}>
                      <div style={{ color: 'hsl(240, 4%, 66%)' }}>Nearby trains</div>
                      <div style={{ color: 'hsl(0,0%,98%)', fontWeight: 600 }}>{operationalContext?.nearbyTrainsCount ?? analytics.nearbyTrains.count}</div>
                    </div>
                    <div style={{ padding: '8px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', fontSize: '12px' }}>
                      <div style={{ color: 'hsl(240, 4%, 66%)' }}>Halt risk</div>
                      <div style={{ color: 'hsl(0,0%,98%)', fontWeight: 600 }}>{operationalContext?.haltRiskScore ?? 0}%</div>
                    </div>
                    <div style={{ padding: '8px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', fontSize: '12px' }}>
                      <div style={{ color: 'hsl(240, 4%, 66%)' }}>Delay risk</div>
                      <div style={{ color: 'hsl(0,0%,98%)', fontWeight: 600 }}>{operationalContext?.delayRiskScore ?? 0}%</div>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(operationalSignals.length > 0
                    ? operationalSignals
                    : ['No active section issues detected. Predictive model is monitoring for delay cascades.']
                  ).map((signal, index) => (
                    <div
                      key={`${signal}-${index}`}
                      style={{
                        borderRadius: '8px',
                        padding: '10px 12px',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        fontSize: '13px',
                        lineHeight: 1.45,
                        color: 'hsl(210, 20%, 90%)',
                      }}
                    >
                      {signal}
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* RIGHT COLUMN - Analytics Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* WAIT TIME CARD */}
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                <WaitTimeCard analytics={analytics} />
              </motion.div>

              {/* ETA FORECAST CARD */}
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                <ETAForecastCard trainNumber={selectedTrain} />
              </motion.div>

              {/* HALT ANALYSIS (if halted) */}
              {analytics.movementState === 'halted' && (
                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0 },
                  }}
                >
                  <HaltAnalysisPanel analytics={analytics} />
                </motion.div>
              )}

              {/* RECOMMENDATION BANNER */}
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                <RecommendationBanner text={analytics.recommendedAction} />
              </motion.div>
            </div>
          </div>

          {/* ROUTE TIMELINE - Full Width */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0 },
            }}
            style={{ marginBottom: '24px' }}
          >
            <RouteTimeline stations={timelineStations} />
          </motion.div>
        </motion.div>

        {/* SUBSIDIARY SERVICES - Links to detailed analysis pages */}
        <motion.div
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
          }}
          style={{ marginBottom: '24px' }}
        >
          <div
            style={{
              borderRadius: '12px',
              border: '1px solid hsl(220, 14%, 18%)',
              background: 'rgba(19, 24, 41, 0.8)',
              padding: '24px',
            }}
          >
            <h2 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 600, color: 'hsl(0, 0%, 98%)' }}>
              Detailed Analysis Services
            </h2>
            <p style={{ margin: '0 0 16px 0', fontSize: '14px', color: 'hsl(210, 20%, 70%)', lineHeight: '1.5' }}>
              Explore comprehensive analysis for train <strong>{selectedTrain}</strong> across different service modules.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              <a
                href={`/test-halt-analysis?trainNumber=${selectedTrain}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  backgroundColor: 'rgba(252, 163, 17, 0.1)',
                  border: '1px solid rgba(252, 163, 17, 0.3)',
                  borderRadius: '8px',
                  color: 'hsl(38, 92%, 55%)',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(252, 163, 17, 0.2)';
                  e.currentTarget.style.borderColor = 'rgba(252, 163, 17, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(252, 163, 17, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(252, 163, 17, 0.3)';
                }}
              >
                <span>⏸️</span> Halt Analysis
              </a>
              <a
                href={`/test-cascade-analysis?trainNumber=${selectedTrain}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  backgroundColor: 'rgba(220, 38, 38, 0.1)',
                  border: '1px solid rgba(220, 38, 38, 0.3)',
                  borderRadius: '8px',
                  color: 'hsl(0, 82%, 56%)',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(220, 38, 38, 0.2)';
                  e.currentTarget.style.borderColor = 'rgba(220, 38, 38, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(220, 38, 38, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(220, 38, 38, 0.3)';
                }}
              >
                <span>📈</span> Cascade Analysis
              </a>
              <a
                href={`/test-network-intelligence?trainNumber=${selectedTrain}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  backgroundColor: 'rgba(59, 130, 246, 0.1)',
                  border: '1px solid rgba(59, 130, 246, 0.3)',
                  borderRadius: '8px',
                  color: 'hsl(217, 91%, 60%)',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
                  e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
                }}
              >
                <span>🌐</span> Network Intelligence
              </a>
              <a
                href={`/test-passenger-safety?trainNumber=${selectedTrain}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  backgroundColor: 'rgba(34, 197, 94, 0.1)',
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                  borderRadius: '8px',
                  color: 'hsl(142, 71%, 45%)',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(34, 197, 94, 0.2)';
                  e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(34, 197, 94, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(34, 197, 94, 0.3)';
                }}
              >
                <span>👥</span> Passenger Safety
              </a>
              <a
                href={`/test-explainability?trainNumber=${selectedTrain}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  backgroundColor: 'rgba(168, 85, 247, 0.1)',
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                  borderRadius: '8px',
                  color: 'hsl(259, 84%, 60%)',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(168, 85, 247, 0.2)';
                  e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(168, 85, 247, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(168, 85, 247, 0.3)';
                }}
              >
                <span>🧠</span> Explainability
              </a>
              <a
                href={`/data-quality?trainNumber=${selectedTrain}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  backgroundColor: 'rgba(6, 182, 212, 0.1)',
                  border: '1px solid rgba(6, 182, 212, 0.3)',
                  borderRadius: '8px',
                  color: 'hsl(188, 94%, 46%)',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(6, 182, 212, 0.2)';
                  e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(6, 182, 212, 0.1)';
                  e.currentTarget.style.borderColor = 'rgba(6, 182, 212, 0.3)';
                }}
              >
                <span>📊</span> Data Quality
              </a>
            </div>
          </div>
        </motion.div>

        {/* FOOTER */}
        <footer
          style={{
            textAlign: 'center',
            padding: '20px',
            fontSize: '11px',
            color: 'hsl(215, 12%, 50%)',
            borderTop: '1px solid hsl(220, 14%, 18%)',
            marginTop: '40px',
          }}
        >
          Last updated: {new Date(analytics.lastUpdated).toLocaleTimeString()}
        </footer>
      </div>


    </div>
  );
}
