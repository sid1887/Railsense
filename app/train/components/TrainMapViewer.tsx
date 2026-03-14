'use client';

import React, { useEffect, useState, useRef } from 'react';
import { TrainAnalytics } from '@/types/analytics';
import dynamic from 'next/dynamic';

/**
 * Train Map Viewer Component
 * Displays train position on interactive map with track segments and overlays
 * Uses dynamic loading for Leaflet to avoid SSR issues
 */

interface TrainMapViewerProps {
  analytics: TrainAnalytics;
}

// Dynamic import of Leaflet-based map with no SSR
const MapContent = dynamic(() => import('./MapContent'), {
  ssr: false,
  loading: () => (
    <div style={{
      width: '100%',
      height: '500px',
      background: '#f0f0f0',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#666',
    }}>
      Loading map...
    </div>
  ),
});

export default function TrainMapViewer({ analytics }: TrainMapViewerProps) {
  const [mapReady, setMapReady] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Verify Leaflet is available
    if (typeof window !== 'undefined' && window.L) {
      setMapReady(true);
    } else {
      // Fallback: show map placeholder with map data
      const handleMapLibraryLoad = () => {
        setMapReady(true);
      };

      // Small delay to allow dynamic import to complete
      setTimeout(handleMapLibraryLoad, 500);
    }
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* Fallback if Leaflet not available */}
      {!mapReady && (
        <div
          style={{
            width: '100%',
            height: '500px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            padding: '20px',
            textAlign: 'center',
            boxSizing: 'border-box',
          }}
        >
          <p style={{ fontSize: '1.2em', fontWeight: '600', marginBottom: '12px' }}>
            Train Position & Track Map
          </p>
          <p style={{ opacity: 0.9, marginBottom: '20px' }}>
            {analytics.currentLocation.stationName}
          </p>
          <div
            style={{
              background: 'rgba(255,255,255,0.2)',
              padding: '16px',
              borderRadius: '8px',
              fontSize: '0.95em',
            }}
          >
            <p style={{ margin: '8px 0' }}>
              📍 Coordinates: {analytics.currentLocation.latitude.toFixed(4)}°, {analytics.currentLocation.longitude.toFixed(4)}°
            </p>
            <p style={{ margin: '8px 0' }}>
              🚄 Speed: {analytics.speed} km/h
            </p>
            <p style={{ margin: '8px 0' }}>
              ⏱️ Status: {analytics.movementState.toUpperCase()}
            </p>
          </div>
        </div>
      )}

      {/* Map container for Leaflet */}
      <div ref={mapContainerRef} style={{ width: '100%', display: mapReady ? 'block' : 'none' }}>
        <MapContent analytics={analytics} />
      </div>
    </div>
  );
}
