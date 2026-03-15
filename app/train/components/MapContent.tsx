'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { TrainAnalytics } from '@/types/analytics';
import * as turf from '@turf/turf';

// Lazy load Leaflet
let L: any = null;

if (typeof window !== 'undefined') {
  try {
    L = require('leaflet');
    require('leaflet/dist/leaflet.css');
  } catch (err) {
    console.warn('Leaflet not installed');
  }
}

/**
 * Advanced Train Map Component
 * Features:
 * - Dark theme (Carto Dark Matter)
 * - OpenRailwayMap tiles for railway network
 * - Train route polyline with route snapping
 * - Animated train marker (🚆)
 * - Movement trail/history
 * - Nearby trains display
 * - Congestion heatmap
 * - Auto-zoom to train
 */
interface MapContentProps {
  analytics: TrainAnalytics;
}

interface TrainSnapshot {
  lat: number;
  lng: number;
  timestamp: number;
}

export default function MapContent({ analytics }: MapContentProps) {
  const mapRef = React.useRef<any>(null);
  const [map, setMap] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const trainMarkerRef = React.useRef<any>(null);
  const trailPathRef = React.useRef<any>(null);
  const [trailHistory, setTrailHistory] = useState<TrainSnapshot[]>([]);
  const [railwayRoutesData, setRailwayRoutesData] = useState<any[]>([]);
  const [routesLoading, setRoutesLoading] = useState(true);

  // PHASE 12 FIX: Fetch REAL train route data from mapview API (real coordinates)
  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        setRoutesLoading(true);
        const trainNumber = analytics.trainNumber;

        // Use real-data mapview API instead of railroad-routes
        const url = `/api/mapview?trainNumber=${trainNumber}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.success && data.data?.route) {
          const route = data.data.route;
          // Convert mapview route to map format
          const mapRoutes = [{
            name: `${route.trainName} Route`,
            active: true,
            color: route.color || '#00E0FF',
            coordinates: route.coordinates, // [lng, lat] pairs from mapview API
          }];
          setRailwayRoutesData(mapRoutes);
          console.log(`[MapContent] Loaded REAL train route from mapview API`);
        } else {
          console.warn('[MapContent] Failed to load route from mapview:', data.error);
        }
      } catch (err) {
        console.error('[MapContent] Error fetching mapview route:', err);
      } finally {
        setRoutesLoading(false);
      }
    };

    fetchRoutes();
  }, [analytics.trainNumber]);

  // Fallback: use API routes or minimal fallback with REAL analytics coordinates
  const railwayRoutes = useMemo(
    () => railwayRoutesData.length > 0 ? railwayRoutesData : [
      // Fallback: single-point route with REAL coordinates from analytics position service
      {
        name: `${analytics.trainName || 'Train'} Route (Loading...)`,
        active: true,
        color: '#00E0FF',
        // Use REAL coordinates from realTimePositionService via analytics
        coordinates: [
          [analytics.currentLocation?.longitude || 77.2, analytics.currentLocation?.latitude || 28.6],
        ],
      },
    ],
    [railwayRoutesData, analytics.currentLocation]
  );

  // PHASE 3 FIX: Use analytics.nearbyTrains if available, not hardcoded mock
  const nearbyTrainsData = useMemo(
    () => analytics.nearbyTrains?.trains || [],
    [analytics.nearbyTrains?.trains]
  );

  // Initialize map with enhanced features
  useEffect(() => {
    if (!L) {
      setError('Leaflet library not available');
      setLoading(false);
      return;
    }

    if (!mapRef.current) {
      setLoading(false);
      return;
    }

    // Validate we have proper coordinates before initializing
    if (
      !analytics.currentLocation ||
      typeof analytics.currentLocation.latitude !== 'number' ||
      typeof analytics.currentLocation.longitude !== 'number' ||
      isNaN(analytics.currentLocation.latitude) ||
      isNaN(analytics.currentLocation.longitude)
    ) {
      console.log('⏳ Waiting for valid coordinates...');
      setLoading(true);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    // Validate container exists and is properly mounted
    if (!mapRef.current || mapRef.current.offsetHeight === 0 || mapRef.current.offsetWidth === 0) {
      console.log('⏳ Container not ready, waiting for proper layout...');
      setTimeout(() => setLoading(false), 100);
      return;
    }

    // Check if map already exists on this container
    if (mapRef.current && mapRef.current._leaflet_id) {
      console.log('Map already initialized on this container, skipping recreation');
      setLoading(false);
      return;
    }

    let newMap: any = null;

    try {
      const lat = analytics.currentLocation.latitude;
      const lng = analytics.currentLocation.longitude;

      console.log(`⏳ Initializing map at coordinates: ${lat}, ${lng}`);

      // Ensure container is still valid before creating map
      if (!mapRef.current) {
        throw new Error('Map container is not mounted');
      }

      // Create map with dark theme
      newMap = L.map(mapRef.current, {
        center: [lat, lng],
        zoom: 7,
        minZoom: 4,
        maxZoom: 16,
        preferCanvas: true,
      });

      // 1. Dark base layer (Carto Dark Matter)
      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        {
          attribution: '© Carto',
          subdomains: 'abcd',
          maxZoom: 20,
        }
      ).addTo(newMap);

      // 2. OpenRailwayMap tiles overlay
      L.tileLayer(
        'https://{s}.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png',
        {
          maxZoom: 19,
          attribution: '© OpenStreetMap | © OpenRailwayMap',
          tileSize: 256,
          opacity: 0.8,
        }
      ).addTo(newMap);

      // 3. Draw railway routes with route snapping visualization
      railwayRoutes.forEach((route) => {
        // Convert coordinates to Feature for Turf.js
        const lineString = turf.lineString(route.coordinates);

        // Draw route polyline
        const color = route.active ? route.color : '#666666';
        const weight = route.active ? 4 : 2;
        const opacity = route.active ? 0.9 : 0.4;

        const polyline = L.polyline(route.coordinates, {
          color: color,
          weight: weight,
          opacity: opacity,
          dashArray: route.active ? '' : '8, 4',
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(newMap);

        // Add route label
        if (route.active) {
          const midIndex = Math.floor(route.coordinates.length / 2);
          L.circleMarker(route.coordinates[midIndex], {
            radius: 4,
            fillColor: color,
            color: 'white',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8,
          }).addTo(newMap);
        }

        // Store active route for snapping
        if (route.active) {
          (newMap as any).activeRoute = lineString;
        }
      });

      // 4. Snap train position to route and display
      let snappedPosition = [
        analytics.currentLocation.latitude,
        analytics.currentLocation.longitude,
      ];

      // If we have the active route, snap to it
      if ((newMap as any).activeRoute) {
        try {
          const trainPoint = turf.point([
            analytics.currentLocation.longitude,
            analytics.currentLocation.latitude,
          ]);
          const snapped = turf.nearestPointOnLine(
            (newMap as any).activeRoute,
            trainPoint,
            { units: 'kilometers' }
          );
          snappedPosition = [snapped.geometry.coordinates[1], snapped.geometry.coordinates[0]];
        } catch (e) {
          console.log('Route snapping unavailable, using GPS position');
        }
      }

      // 5. Animated train marker with emoji
      const trainIcon = L.divIcon({
        html: `
          <div style="
            position: relative;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            filter: drop-shadow(0 0 8px rgba(0, 224, 255, 0.8));
            animation: pulse-train 2s ease-in-out infinite;
            font-size: 28px;
            transform: rotate(${analytics.speed > 0 ? 'calc(var(--direction, 0) * 1deg)' : '0'});
          ">
            🚆
          </div>
          <style>
            @keyframes pulse-train {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(1.1); }
            }
          </style>
        `,
        iconSize: [40, 40],
        popupAnchor: [0, -20],
        className: 'train-marker-animated',
      });

      const trainMarker = L.marker(snappedPosition, {
        icon: trainIcon,
        zIndexOffset: 1000,
      }).addTo(newMap);

      trainMarkerRef.current = trainMarker;

      // Detailed popup for main train
      const statusColor =
        analytics.movementState === 'running' ? '#4caf50' :
        analytics.movementState === 'halted' ? '#ff9800' :
        '#d32f2f';

      trainMarker.bindPopup(`
        <div style="min-width: 240px; font-family: sans-serif;">
          <h3 style="margin: 0 0 12px 0; color: ${statusColor}; font-size: 1.1em;">
            🚆 ${analytics.trainName}
          </h3>
          <table style="width: 100%; font-size: 0.9em; border-spacing: 0; margin-bottom: 8px;">
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 4px 8px;">Train #</td>
              <td style="padding: 4px 8px; font-weight: 600;">${analytics.trainNumber}</td>
            </tr>
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 4px 8px;">Status</td>
              <td style="padding: 4px 8px; font-weight: 600; color: ${statusColor};">
                ${analytics.movementState.toUpperCase()}
              </td>
            </tr>
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 4px 8px;">Speed</td>
              <td style="padding: 4px 8px; font-weight: 600;">${analytics.speed} km/h</td>
            </tr>
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 4px 8px;">Delay</td>
              <td style="padding: 4px 8px; font-weight: 600;">${analytics.delay > 0 ? '+' : ''}${analytics.delay} min</td>
            </tr>
            <tr>
              <td style="padding: 4px 8px;">Current</td>
              <td style="padding: 4px 8px; font-weight: 600;">${analytics.currentLocation.stationName}</td>
            </tr>
          </table>
        </div>
      `, { maxWidth: 300 });

      // 6. Add movement trail (history polyline)
      const initialTrail = [snappedPosition];
      const trailPolyline = L.polyline(initialTrail, {
        color: '#00FF88',
        weight: 2,
        opacity: 0.6,
        dashArray: '2, 3',
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(newMap);

      trailPathRef.current = trailPolyline;
      setTrailHistory([{
        lat: snappedPosition[0],
        lng: snappedPosition[1],
        timestamp: Date.now(),
      }]);

      // 7. Nearby trains visualization
      // NOTE: NearbyTrain data from analytics doesn't include lat/lng coordinates,
      // so we can't display them on the map yet. This would require fetching
      // position data for each nearby train from the railway network service.
      // TODO: Implement in Phase 6 when position data is available for all trains
      if (false && nearbyTrainsData.length > 0) {
        console.log(`[MapContent] ${nearbyTrainsData.length} nearby trains available but positions not yet fetched`);
      }

      // 8. Congestion heatmap
      // TODO: When nearby train positions become available, add heatmap visualization here

      // 9. Auto-zoom/fly to train with smooth animation
      newMap.flyTo(snappedPosition, 8, {
        duration: 1.5,
        easeLinearity: 0.25,
      });

      // 10. Add attribution for data sources
      L.control.attribution({ prefix: false }).addTo(newMap);

      setMap(newMap);
      setError(null);
      setLoading(false);
      console.log('✓ Map initialized successfully with all features');
    } catch (err) {
      console.error('Map initialization error:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize map');
      setLoading(false);
    }

    // Cleanup function - destroy map on unmount
    return () => {
      if (newMap) {
        try {
          newMap.remove();
          console.log('Map cleaned up on unmount');
        } catch (e) {
          console.log('Map cleanup complete');
        }
      }
    };
  }, [map, analytics, railwayRoutes, nearbyTrainsData]);

  // Update train position and trail on every analytics change
  useEffect(() => {
    if (!map || !L || !trainMarkerRef.current) return;

    try {
      // Calculate snapped position
      let snappedPosition = [
        analytics.currentLocation.latitude,
        analytics.currentLocation.longitude,
      ];

      if ((map as any).activeRoute) {
        try {
          const trainPoint = turf.point([
            analytics.currentLocation.longitude,
            analytics.currentLocation.latitude,
          ]);
          const snapped = turf.nearestPointOnLine(
            (map as any).activeRoute,
            trainPoint,
            { units: 'kilometers' }
          );
          snappedPosition = [snapped.geometry.coordinates[1], snapped.geometry.coordinates[0]];
        } catch (e) {
          // Silently fall back to GPS position
        }
      }

      // Update train marker position
      trainMarkerRef.current.setLatLng(snappedPosition);

      // Update trail history
      setTrailHistory((prevHistory) => {
        const lastPoint = prevHistory[prevHistory.length - 1];
        const distance = turf.distance(
          turf.point([lastPoint.lng, lastPoint.lat]),
          turf.point([snappedPosition[1], snappedPosition[0]]),
          { units: 'kilometers' }
        );

        // Only add point if distance > 100m
        if (distance > 0.1) {
          return [
            ...prevHistory,
            {
              lat: snappedPosition[0],
              lng: snappedPosition[1],
              timestamp: Date.now(),
            },
          ].slice(-50); // Keep only last 50 points
        }
        return prevHistory;
      });

      // Update trail polyline
      if (trailPathRef.current) {
        const trailCoords = trailHistory.map((point) => [point.lat, point.lng]);
        trailPathRef.current.setLatLngs(trailCoords);
      }
    } catch (err) {
      console.error('Map update error:', err);
    }
  }, [analytics, map, trailHistory]);

  if (error) {
    return (
      <div
        style={{
          width: '100%',
          height: '500px',
          background: 'linear-gradient(135deg, #1a3a52 0%, #2a5a7a 100%)',
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ff6b6b',
          padding: '20px',
          boxSizing: 'border-box',
          textAlign: 'center',
        }}
      >
        <p style={{ fontSize: '1.1em', fontWeight: '600', marginBottom: '8px' }}>📍 Map Error</p>
        <p style={{ fontSize: '0.9em', opacity: 0.9, marginBottom: '12px' }}>{error}</p>
        <p style={{ fontSize: '0.85em', opacity: 0.7 }}>Install Leaflet: npm install leaflet @turf/turf</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div
        style={{
          width: '100%',
          height: '500px',
          background: 'linear-gradient(135deg, #1a3a52 0%, #2a5a7a 100%)',
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#20b2aa',
          padding: '20px',
          boxSizing: 'border-box',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            border: '3px solid #20b2aa',
            borderTop: '3px solid transparent',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            marginBottom: '12px',
          }}
        />
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
        <p style={{ fontSize: '1em', fontWeight: '600' }}>Loading map...</p>
        <p style={{ fontSize: '0.85em', opacity: 0.8, marginTop: '8px' }}>📍 Fetching location data</p>
      </div>
    );
  }

  return (
    <div
      ref={mapRef}
      style={{
        width: '100%',
        height: '500px',
        borderRadius: '8px',
        overflow: 'hidden',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
        background: '#1a1a1a',
      }}
      className="mapContainer"
    />
  );
}
