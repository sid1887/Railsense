'use client';

import React, { useState } from 'react';
import { Search, Eye, Zap } from 'lucide-react';
import './design-system.css';

interface TopNavigationBarProps {
  trainNumber?: string;
  trainName?: string;
  showHeatmap?: boolean;
  showDemo?: boolean;
  onHeatmapToggle?: (enabled: boolean) => void;
  onDemoToggle?: (enabled: boolean) => void;
  onTrainSearch?: (trainNumber: string) => void;
}

export default function TopNavigationBar({
  trainNumber = '14645',
  trainName = 'Hussain Sagar Express',
  showHeatmap = false,
  showDemo = false,
  onHeatmapToggle,
  onDemoToggle,
  onTrainSearch,
}: TopNavigationBarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      {/* Fixed Top Navigation Bar */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '56px',
          zIndex: 1000,
          backgroundColor: 'rgba(19, 24, 41, 0.8)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          borderBottom: '1px solid hsl(220, 14%, 18%)',
          display: 'flex',
          alignItems: 'center',
          paddingLeft: '16px',
          paddingRight: '16px',
          gap: '24px',
        }}
      >
        {/* LEFT SECTION — Logo & Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', minWidth: '280px' }}>
          {/* Logo */}
          <div
            style={{
              fontSize: '18px',
              fontWeight: '700',
              fontFamily: 'Inter, sans-serif',
              color: 'hsl(160, 84%, 44%)',
              whiteSpace: 'nowrap',
            }}
          >
            RailSense
          </div>

          {/* Breadcrumb */}
          <div
            style={{
              fontSize: '12px',
              color: 'hsl(215, 12%, 50%)',
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
            }}
            className="hide-mobile"
          >
            <span>Home</span>
            <span>/</span>
            <span>Train {trainNumber}</span>
            <span>/</span>
            <span style={{ color: 'hsl(210, 20%, 92%)' }}>Status</span>
          </div>
        </div>

        {/* CENTER SECTION — Search */}
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }} className="hide-mobile">
          <div
            style={{
              position: 'relative',
              width: '320px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                height: '36px',
                backgroundColor: 'hsl(220, 16%, 14%)',
                border: '1px solid hsl(220, 14%, 18%)',
                borderRadius: '8px',
                paddingLeft: '12px',
                paddingRight: '12px',
                gap: '8px',
              }}
            >
              <Search size={16} style={{ color: 'hsl(215, 12%, 50%)' }} />
              <input
                type="text"
                placeholder="Search train number or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchOpen(true)}
                style={{
                  flex: 1,
                  background: 'none',
                  border: 'none',
                  color: 'hsl(210, 20%, 92%)',
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
            </div>

            {/* Search Dropdown */}
            {searchOpen && searchQuery && (
              <div
                style={{
                  position: 'absolute',
                  top: '40px',
                  left: 0,
                  right: 0,
                  backgroundColor: 'rgba(19, 24, 41, 0.95)',
                  backdropFilter: 'blur(40px)',
                  border: '1px solid hsl(220, 14%, 18%)',
                  borderRadius: '8px',
                  marginTop: '4px',
                  overflow: 'hidden',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
                }}
              >
                {/* Mock Search Results */}
                {['12955', '14645', '15432'].map((num) => (
                  <div
                    key={num}
                    onClick={() => {
                      onTrainSearch?.(num);
                      setSearchQuery('');
                      setSearchOpen(false);
                    }}
                    style={{
                      padding: '10px 12px',
                      borderBottom: '1px solid hsl(220, 14%, 18%)',
                      cursor: 'pointer',
                      fontSize: '13px',
                      transition: 'background-color 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(29, 209, 176, 0.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <div style={{ fontWeight: '600', fontSize: '13px' }}>Train {num}</div>
                    <div style={{ fontSize: '11px', color: 'hsl(215, 12%, 50%)' }}>
                      Express Service
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT SECTION — Toggles */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            marginLeft: 'auto',
          }}
        >
          {/* Heatmap Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label
              style={{
                fontSize: '11px',
                fontWeight: '600',
                textTransform: 'uppercase',
                color: 'hsl(215, 12%, 50%)',
                letterSpacing: '0.05em',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <input
                type="checkbox"
                checked={showHeatmap}
                onChange={(e) => onHeatmapToggle?.(e.target.checked)}
                style={{
                  width: '20px',
                  height: '20px',
                  marginRight: '8px',
                  cursor: 'pointer',
                  accentColor: 'hsl(160, 84%, 44%)',
                }}
              />
              Heatmap
            </label>
          </div>

          {/* Demo Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label
              style={{
                fontSize: '11px',
                fontWeight: '600',
                textTransform: 'uppercase',
                color: 'hsl(215, 12%, 50%)',
                letterSpacing: '0.05em',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <input
                type="checkbox"
                checked={showDemo}
                onChange={(e) => onDemoToggle?.(e.target.checked)}
                style={{
                  width: '20px',
                  height: '20px',
                  marginRight: '8px',
                  cursor: 'pointer',
                  accentColor: 'hsl(160, 84%, 44%)',
                }}
              />
              Demo
            </label>
          </div>
        </div>
      </div>

      {/* Spacer for fixed nav */}
      <div style={{ height: '56px' }} />
    </>
  );
}
