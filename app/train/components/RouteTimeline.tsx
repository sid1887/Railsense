'use client';

import React from 'react';
import { Train } from 'lucide-react';
import { motion } from 'framer-motion';
import './design-system.css';

interface RouteStation {
  name: string;
  code: string;
  scheduledTime: string;
  actualTime?: string;
  status: 'completed' | 'current' | 'upcoming';
  delayMinutes?: number;
}

interface RouteTimelineProps {
  stations?: RouteStation[];
}

const defaultStations: RouteStation[] = [
  { name: 'Mumbai Central', code: 'MMCT', scheduledTime: '06:00', actualTime: '06:05', status: 'completed', delayMinutes: 5 },
  { name: 'Pune Junction', code: 'PJN', scheduledTime: '10:30', actualTime: '10:45', status: 'completed', delayMinutes: 15 },
  { name: 'Parli Vaijnath', code: 'PVN', scheduledTime: '13:15', actualTime: '13:31', status: 'completed', delayMinutes: 16 },
  { name: 'Paranda Junction', code: 'PRD', scheduledTime: '15:00', actualTime: '15:18', status: 'current', delayMinutes: 18 },
  { name: 'Nagpur Junction', code: 'NG', scheduledTime: '17:45', status: 'upcoming' },
  { name: 'Wardha', code: 'WR', scheduledTime: '19:30', status: 'upcoming' },
];

export default function RouteTimeline({ stations = defaultStations }: RouteTimelineProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 },
  };

  return (
    <motion.div
      className="card"
      style={{
        padding: '20px',
        marginBottom: '16px',
      }}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Header */}
      <motion.div
        variants={itemVariants}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '16px',
        }}
      >
        <Train size={16} style={{ color: 'hsl(160, 84%, 44%)' }} />
        <h2
          className="heading-md"
          style={{
            color: 'hsl(210, 20%, 92%)',
            margin: 0,
          }}
        >
          Route Timeline
        </h2>
      </motion.div>

      {/* Timeline */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '0',
          position: 'relative',
        }}
      >
        {stations.map((station, index) => {
          const dotColor =
            station.status === 'completed'
              ? 'hsl(160, 84%, 44%)'
              : station.status === 'current'
                ? 'hsl(0, 72%, 55%)'
                : 'hsl(220, 14%, 18%)';

          const dotSize = station.status === 'current' ? '12px' : '10px';
          const textColor =
            station.status === 'completed'
              ? 'hsl(210, 20%, 92%)'
              : station.status === 'current'
                ? 'hsl(0, 72%, 55%)'
                : 'hsl(215, 12%, 50%)';

          const lineColor =
            station.status === 'completed'
              ? 'rgba(29, 209, 176, 0.3)'
              : 'hsl(220, 14%, 18%)';

          const isLast = index === stations.length - 1;
          const isCurrent = station.status === 'current';

          return (
            <motion.div
              key={station.code}
              variants={itemVariants}
              style={{
                display: 'flex',
                gap: '12px',
                paddingBottom: '16px',
              }}
            >
              {/* Left Column - Time */}
              <div style={{ minWidth: '80px', textAlign: 'right' }}>
                <div
                  style={{
                    fontSize: '13px',
                    fontFamily: 'var(--font-mono)',
                    color: 'hsl(215, 12%, 50%)',
                    fontWeight: '500',
                  }}
                >
                  {station.scheduledTime}
                </div>
                {station.actualTime && station.actualTime !== station.scheduledTime && (
                  <div
                    style={{
                      fontSize: '12px',
                      fontFamily: 'var(--font-mono)',
                      color: 'hsl(38, 92%, 55%)',
                      fontWeight: '600',
                    }}
                  >
                    → {station.actualTime}
                  </div>
                )}
              </div>

              {/* Center Column - Dot & Line */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0',
                }}
              >
                {/* Dot */}
                <div
                  style={{
                    width: dotSize,
                    height: dotSize,
                    borderRadius: '50%',
                    backgroundColor: dotColor,
                    border: '2px solid ' + dotColor,
                    position: 'relative',
                    zIndex: 1,
                  }}
                >
                  {isCurrent && (
                    <motion.div
                      style={{
                        position: 'absolute',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        border: '2px solid hsl(0, 72%, 55%)',
                        left: '-7px',
                        top: '-7px',
                      }}
                      animate={{ scale: [1, 1.2, 1], opacity: [1, 0.6, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                </div>

                {/* Connecting Line */}
                {!isLast && (
                  <div
                    style={{
                      width: '2px',
                      height: '44px',
                      backgroundColor: lineColor,
                      marginTop: '4px',
                    }}
                  />
                )}
              </div>

              {/* Right Column - Station Info */}
              <div style={{ flex: 1, paddingTop: '2px' }}>
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: isCurrent ? '600' : '500',
                    color: textColor,
                    lineHeight: '1.3',
                  }}
                >
                  {station.name}
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    color: 'hsl(215, 12%, 50%)',
                  }}
                >
                  {station.code}
                </div>
                {station.delayMinutes && station.delayMinutes > 0 && (
                  <div
                    style={{
                      fontSize: '11px',
                      color: 'hsl(38, 92%, 55%)',
                      fontWeight: '600',
                      marginTop: '2px',
                    }}
                  >
                    +{station.delayMinutes}m delay
                  </div>
                )}
              </div>

              {/* Highlight for current station */}
              {isCurrent && (
                <motion.div
                  style={{
                    position: 'absolute',
                    left: '-20px',
                    right: '-20px',
                    top: '-8px',
                    height: '56px',
                    backgroundColor: 'rgba(230, 57, 70, 0.05)',
                    borderRadius: '8px',
                    border: '1px solid rgba(230, 57, 70, 0.1)',
                    zIndex: 0,
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                />
              )}
            </motion.div>
          );
        })}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .timeline-scroll {
            max-height: 300px;
            overflow-y: auto;
          }
        }
      `}</style>
    </motion.div>
  );
}
