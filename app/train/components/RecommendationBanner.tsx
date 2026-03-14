'use client';

import React from 'react';
import { Lightbulb } from 'lucide-react';
import { motion } from 'framer-motion';

interface RecommendationBannerProps {
  text?: string;
}

export default function RecommendationBanner({
  text = 'Move to platform 3 to board the next available service',
}: RecommendationBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      style={{
        background: 'linear-gradient(90deg, rgba(29, 209, 176, 0.1) 0%, rgba(29, 209, 176, 0.05) 100%)',
        borderLeft: '3px solid hsl(160, 84%, 44%)',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
      }}
    >
      <Lightbulb
        size={16}
        style={{
          color: 'hsl(160, 84%, 44%)',
          marginTop: '2px',
          flexShrink: 0,
        }}
      />
      <div>
        <div
          style={{
            fontSize: '11px',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: 'hsl(160, 84%, 44%)',
            marginBottom: '4px',
          }}
        >
          Recommendation
        </div>
        <div
          style={{
            fontSize: '14px',
            color: 'hsl(210, 20%, 92%)',
            lineHeight: '1.5',
          }}
        >
          {text}
        </div>
      </div>
    </motion.div>
  );
}
