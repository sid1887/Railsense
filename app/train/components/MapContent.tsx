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

  // Major railway route definitions with accurate station coordinates (memoized to prevent effect dependencies from changing)
  const railwayRoutes = useMemo(
    () => [
      {
        name: 'Secunderabad-Bangalore Route',
        active: true,
        color: '#00E0FF',
        coordinates: [
          [17.3850, 78.4867], // Secunderabad
          [17.3645, 78.4735],
          [17.0030, 78.2170],
          [16.5062, 78.5781], // Hyderabad area
          [16.2158, 78.4711],
          [15.8267, 78.4240],
          [15.4909, 78.5489], // Kachiguda
          [15.2993, 78.6711],
          [14.8289, 78.6539],
          [14.3570, 78.5748],
          [13.8698, 78.6501], // Renigunta area
          [13.1939, 77.5941], // Bangalore
        ],
      },
      {
        name: 'Mumbai-Nagpur Route',
        active: false,
        color: '#FF6B6B',
        coordinates: [
          [18.9676, 72.8194], // Mumbai
          [19.2183, 73.9629],
          [20.1809, 75.8659],
          [21.1458, 79.0882], // Nagpur
        ],
      },
      {
        name: 'Delhi-Bangalore Route',
        active: false,
        color: '#FFB347',
        coordinates: [
          [28.7041, 77.1025], // Delhi
          [26.1445, 75.7117],
          [25.1772, 75.8571],
          [13.1939, 77.5941], // Bangalore
        ],
      },
      {
        name: 'Howrah-Guwahati Route',
        active: false,
        color: '#FFD93D',
        coordinates: [
          [22.5958, 88.2636], // Howrah
          [24.7555, 87.2960],
          [26.1912, 91.7362], // Guwahati
        ],
      },
    ],
    []
  );

  // Mock nearby trains for demonstration (memoized to prevent effect dependencies from changing)
  const nearbyTrainsData = useMemo(
    () => [
      { id: 12955, name: 'Somnath Express', lat: 17.3850, lng: 78.4867, status: 'halted', speed: 0 },
      { id: 12345, name: 'Express A', lat: 16.8062, lng: 78.3781, status: 'running', speed: 65 },
      { id: 12789, name: 'Express B', lat: 15.4909, lng: 78.5489, status: 'halted', speed: 0 },
    ],
    []
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

      // 7. Add nearby trains with color coding
      nearbyTrainsData.forEach((train, idx) => {
        if (String(train.id) === analytics.trainNumber) return; // Skip main train

        const statusMarker = L.divIcon({
          html: `
            <div style="
              width: 28px;
              height: 28px;
              background: ${train.status === 'running' ? '#4caf50' : train.status === 'delayed' ? '#ff9800' : '#d32f2f'};
              border: 2px solid white;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 14px;
              box-shadow: 0 0 8px rgba(0, 0, 0, 0.3);
              color: white;
              font-weight: 600;
            ">
              ${idx + 1}
            </div>
          `,
          iconSize: [28, 28],
          popupAnchor: [0, -14],
          className: 'nearby-train-marker',
        });

        const nearbyMarker = L.marker([train.lat, train.lng], {
          icon: statusMarker,
          zIndexOffset: 500,
        }).addTo(newMap);

        nearbyMarker.bindPopup(`
          <div style="min-width: 180px; font-family: sans-serif;">
            <h4 style="margin: 0 0 8px 0; color: #333;">${train.name}</h4>
            <p style="margin: 4px 0; font-size: 0.9em;">
              <strong>Train #:</strong> ${train.id}
            </p>
            <p style="margin: 4px 0; font-size: 0.9em;">
              <strong>Status:</strong> ${train.status.toUpperCase()}
            </p>
            <p style="margin: 4px 0; font-size: 0.9em;">
              <strong>Speed:</strong> ${train.speed} km/h
            </p>
          </div>
        `);
      });

      // 8. Add congestion heatmap using snapshot data
      // Create heatmap points from nearby trains as demo
      const heatmapPoints = nearbyTrainsData.map((train) => [
        train.lat,
        train.lng,
        train.speed > 0 ? 0.3 : 0.8, // intensity: slower = more congested
      ]);

      // Custom heatmap layer using circles
      const heatmapGroup = L.featureGroup();
      heatmapPoints.forEach((point) => {
        L.circleMarker([point[0], point[1]], {
          radius: 15,
          fillColor: point[2] > 0.5 ? '#d32f2f' : '#ff9800',
          color: 'transparent',
          weight: 0,
          opacity: 0,
          fillOpacity: point[2] * 0.15,
        }).addTo(heatmapGroup);
      });
      heatmapGroup.addTo(newMap);

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
