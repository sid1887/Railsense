'use client';

import React from 'react';
import SubsidiaryServicesDropdown from '@/app/train/components/SubsidiaryServicesDropdown';

interface SubsidiaryServiceNavBarProps {
  trainNumber: string;
  currentService: string;
}

export default function SubsidiaryServiceNavBar({
  trainNumber,
  currentService,
}: SubsidiaryServiceNavBarProps) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '56px',
        zIndex: 999,
        backgroundColor: 'rgba(19, 24, 41, 0.95)',
        backdropFilter: 'blur(40px)',
        WebkitBackdropFilter: 'blur(40px)',
        borderBottom: '1px solid hsl(220, 14%, 18%)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        gap: '24px',
      }}
    >
      {/* Logo */}
      <div style={{ fontSize: '16px', fontWeight: '700', color: 'hsl(262, 83%, 58%)' }}>
        RailSense
      </div>

      {/* Current Service & Train Info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
        <span style={{ fontSize: '13px', color: 'hsl(210, 20%, 70%)' }}>
          {currentService}
        </span>
        <span style={{ color: 'hsl(220, 14%, 25%)' }}>•</span>
        <span style={{ fontSize: '13px', color: 'hsl(210, 20%, 70%)' }}>
          Train: <strong>{trainNumber}</strong>
        </span>
      </div>

      {/* Services Dropdown */}
      <SubsidiaryServicesDropdown trainNumber={trainNumber} displayLabel="⚡ Intelligence" />
    </div>
  );
}
