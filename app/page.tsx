'use client';

import React, { useState, useEffect } from 'react';
import { ParticleBackground } from '@/components/ParticleBackground';
import { EnhancedSearchComponent } from '@/components/EnhancedSearchComponent';
import { LiveStatsTicker } from '@/components/LiveStatsTicker';
import { Footer } from '@/components/Footer';
import { motion } from 'framer-motion';

/**
 * Enhanced Home Page
 * Landing page with animated hero, glassmorphism cards, and live stats
 */
export default function Home() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Text animation variant
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
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: (i: number) => ({
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        delay: 0.3 + i * 0.1,
        ease: 'easeOut',
      },
    }),
    hover: {
      scale: 1.05,
      transition: { duration: 0.3 },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-dark-bg via-dark-card to-darker-bg flex flex-col">
      {/* Animated particle background */}
      <ParticleBackground />

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-start px-4 py-12 lg:py-16">
        {/* Header Section */}
        <motion.div
          className="text-center mb-12 lg:mb-16 max-w-3xl"
          variants={containerVariants}
          initial="hidden"
          animate={isVisible ? 'visible' : 'hidden'}
        >
          {/* Main Title with Staggered Text */}
          <motion.div variants={itemVariants} className="mb-4">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-accent-blue via-accent-cyan to-accent-blue-dark">
              RailSense
            </h1>
            <div className="h-1 w-24 bg-gradient-to-r from-accent-blue to-accent-cyan mx-auto rounded-full" />
          </motion.div>

          <motion.p variants={itemVariants} className="text-xl md:text-2xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-accent-blue to-accent-cyan mb-4">
            Intelligent Train Halt Insight System
          </motion.p>

          <motion.p variants={itemVariants} className="text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
            Real-time train tracking with AI-powered insights. Get instant notifications about unexpected halts and precise wait time predictions powered by live data.
          </motion.p>
        </motion.div>

        {/* Live Stats Ticker */}
        <motion.div
          className="w-full max-w-4xl mb-12"
          variants={itemVariants}
          initial="hidden"
          animate={isVisible ? 'visible' : 'hidden'}
        >
          <LiveStatsTicker />
        </motion.div>

        {/* Feature Cards with Glassmorphism */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 w-full max-w-4xl"
          variants={containerVariants}
          initial="hidden"
          animate={isVisible ? 'visible' : 'hidden'}
        >
          {[
            {
              icon: '📍',
              title: 'Live Position Tracking',
              description: 'Real-time train location on interactive maps with precision GPS coordinates',
            },
            {
              icon: '⏱️',
              title: 'Halt Detection',
              description: 'Instant identification of unexpected stops with accurate duration tracking',
            },
            {
              icon: '🎯',
              title: 'Smart Predictions',
              description: 'AI-powered wait time predictions using historical data and patterns',
            },
          ].map((feature, i) => (
            <motion.div
              key={i}
              custom={i}
              variants={cardVariants}
              whileHover="hover"
              className="group relative"
            >
              {/* Glassmorphic Card Background */}
              <div className="absolute inset-0 bg-gradient-to-br from-accent-blue to-accent-cyan opacity-0 group-hover:opacity-20 rounded-2xl blur-xl transition-opacity duration-300" />

              {/* Card Content */}
              <div className="relative backdrop-blur-xl bg-dark-card bg-opacity-40 border border-accent-blue border-opacity-20 group-hover:border-opacity-50 rounded-2xl p-6 h-full transition-all duration-300 flex flex-col">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="font-semibold text-lg text-white mb-2 group-hover:text-accent-cyan transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm text-text-secondary group-hover:text-text-primary transition-colors flex-1">
                  {feature.description}
                </p>

                {/* Hover indicator */}
                <div className="mt-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-xs text-accent-blue">Learn more</span>
                  <svg className="w-4 h-4 text-accent-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* WEEK 3 INTELLIGENCE FEATURES SECTION */}
        <motion.div
          className="w-full max-w-5xl mb-16"
          variants={containerVariants}
          initial="hidden"
          animate={isVisible ? 'visible' : 'hidden'}
        >
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-accent-blue via-accent-cyan to-accent-blue mb-3">
              🧠 AI-Powered Intelligence Features
            </h2>
            <p className="text-text-secondary max-w-2xl mx-auto">
              Advanced machine learning and explainable AI for smarter train tracking
            </p>
          </div>

          {/* Intelligence Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {[
              {
                icon: '🌐',
                title: 'Network Intelligence',
                desc: 'Real-time railway network analysis with hotspot detection and flow prediction',
                href: '/test-network-intelligence',
                color: 'from-blue-600 to-cyan-600',
              },
              {
                icon: '⏱️',
                title: 'Halt Analysis',
                desc: 'Advanced detection of halt reasons with confidence scoring and platform tracking',
                href: '/test-halt-analysis',
                color: 'from-orange-600 to-red-600',
              },
              {
                icon: '💡',
                title: 'Explainability Engine',
                desc: 'Transparent AI reasoning with evidence chains and alternative scenarios',
                href: '/test-explainability',
                color: 'from-purple-600 to-pink-600',
              },
              {
                icon: '👥',
                title: 'Passenger Safety',
                desc: 'Connection window analysis and dwell anomaly detection for passenger welfare',
                href: '/test-passenger-safety',
                color: 'from-green-600 to-emerald-600',
              },
              {
                icon: '📉',
                title: 'Cascade Detection',
                desc: 'Delay propagation modeling with priority conflict and network impact analysis',
                href: '/test-cascade-analysis',
                color: 'from-yellow-600 to-orange-600',
              },
              {
                icon: '💾',
                title: 'Data Persistence',
                desc: 'Historical pattern storage with retention policies and data export capabilities',
                href: '/intelligence',
                color: 'from-indigo-600 to-purple-600',
              },
            ].map((feature, i) => (
              <motion.div
                key={i}
                custom={i}
                variants={cardVariants}
                whileHover="hover"
                className="group relative"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-20 rounded-xl blur-lg transition-opacity duration-300`} />
                <a
                  href={feature.href}
                  className="relative backdrop-blur-xl bg-dark-card bg-opacity-60 border border-accent-blue border-opacity-20 group-hover:border-opacity-50 rounded-xl p-5 h-full transition-all duration-300 flex flex-col cursor-pointer block"
                >
                  <div className="text-3xl mb-3">{feature.icon}</div>
                  <h3 className="font-semibold text-base text-white mb-2 group-hover:text-accent-cyan transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-text-secondary group-hover:text-text-primary transition-colors flex-1">
                    {feature.desc}
                  </p>
                  <div className="mt-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity text-accent-blue text-xs font-semibold">
                    <span>Explore</span>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                </a>
              </motion.div>
            ))}
          </div>

          {/* Intelligence Dashboard CTA */}
          <motion.div
            variants={itemVariants}
            className="bg-gradient-to-r from-accent-blue/10 via-accent-cyan/10 to-accent-blue/10 border border-accent-blue/30 rounded-xl p-6 text-center"
          >
            <h3 className="text-xl font-bold text-white mb-2">Unified Intelligence Dashboard</h3>
            <p className="text-text-secondary mb-4">
              View all AI features in one comprehensive control center with real-time metrics and analytics
            </p>
            <a
              href="/intelligence"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-accent-blue to-accent-cyan text-dark-bg font-bold rounded-lg hover:shadow-lg hover:shadow-accent-blue/50 transition-all"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              View Full Dashboard
            </a>
          </motion.div>
        </motion.div>

        {/* Search Component */}
        <motion.div
          className="w-full max-w-2xl mb-12"
          variants={itemVariants}
          initial="hidden"
          animate={isVisible ? 'visible' : 'hidden'}
        >
          <div className="mb-4 text-center">
            <h2 className="text-2xl font-bold text-white mb-2">Find Your Train</h2>
            <p className="text-text-secondary">Search by train number or name to get real-time updates</p>
          </div>
          <EnhancedSearchComponent />
        </motion.div>

        {/* Additional Info Section */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-4xl mb-12 text-center text-sm"
          variants={containerVariants}
          initial="hidden"
          animate={isVisible ? 'visible' : 'hidden'}
        >
          <motion.div variants={itemVariants} className="text-text-secondary">
            <span className="font-semibold text-accent-blue block mb-1">5+ Indian Railways</span>
            Tracked trains available
          </motion.div>
          <motion.div variants={itemVariants} className="text-text-secondary">
            <span className="font-semibold text-accent-blue block mb-1">Real-Time Updates</span>
            Every 30 seconds refresh
          </motion.div>
          <motion.div variants={itemVariants} className="text-text-secondary">
            <span className="font-semibold text-accent-blue block mb-1">99% Uptime</span>
            Reliable tracking system
          </motion.div>
        </motion.div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
