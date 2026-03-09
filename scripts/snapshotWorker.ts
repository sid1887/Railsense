/**
 * Snapshot Worker Script
 * Periodically fetches tracked trains and logs snapshots for historical analysis
 * Provides data for: halt detection algorithms, ML model training, heatmap visualization
 *
 * Usage:
 *   node -r ts-node/register scripts/snapshotWorker.ts
 *
 * Environment variables:
 *   TRACKED_TRAINS - Comma-separated train numbers (default: 12702,17015,11039)
 *   INTERVAL_SECONDS - Polling interval in seconds (default: 30)
 *   DB_PATH - SQLite database path (default: data/history.db)
 */

import { getLiveTrainPosition } from '../services/railYatriService';
import { logger } from '../services/logger';

interface SnapshotConfig {
  trackedTrains: string[];
  intervalSeconds: number;
  minBetweenProviders: number; // Delay between provider calls in ms
}

// Configuration from environment
const config: SnapshotConfig = {
  trackedTrains: (process.env.TRACKED_TRAINS || '12702,17015,11039,12723,12724').split(',').map(t => t.trim()),
  intervalSeconds: parseInt(process.env.INTERVAL_SECONDS || '30'),
  minBetweenProviders: 300, // 300ms between calls to avoid hammering
};

let isRunning = true;
let snapshotCount = 0;
let errorCount = 0;

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Log a snapshot to the database (if available)
 */
async function logSnapshot(trainNumber: string, lat: number, lng: number, speed: number, delay: number, timestamp: number) {
  try {
    // In a real setup, this would log to SQLite
    // For now, just log to console
    logger.debug('Snapshot logged', {
      train: trainNumber,
      location: `${lat.toFixed(2)}, ${lng.toFixed(2)}`,
      speed: `${speed.toFixed(1)} km/h`,
      delay: `${delay.toFixed(1)} min`,
      timestamp: new Date(timestamp).toISOString(),
    });

    snapshotCount++;

    // Print progress every 10 snapshots
    if (snapshotCount % 10 === 0) {
      logger.success(`Snapshots collected: ${snapshotCount}`, {
        errors: errorCount,
        trains_tracked: config.trackedTrains.length,
      });
    }
  } catch (err) {
    logger.error('Failed to log snapshot:', err);
    errorCount++;
  }
}

/**
 * Fetch and process single train
 */
async function fetchTrainSnapshot(trainNumber: string): Promise<boolean> {
  try {
    const liveData = await getLiveTrainPosition(trainNumber);

    if (liveData) {
      await logSnapshot(
        trainNumber,
        liveData.lat,
        liveData.lng,
        liveData.speed || 0,
        liveData.delay || 0,
        (liveData.timestamp || Math.floor(Date.now() / 1000)) * 1000
      );
      return true;
    }

    return false;
  } catch (err) {
    logger.debug(`Failed to fetch train ${trainNumber}:`, err);
    return false;
  }
}

/**
 * Main worker loop
 */
async function runWorker() {
  logger.success('🚂 Snapshot Worker Started', {
    trains_count: config.trackedTrains.length,
    interval_seconds: config.intervalSeconds,
    trains: config.trackedTrains.join(', '),
  });

  let cycleCount = 0;

  while (isRunning) {
    try {
      cycleCount++;
      logger.info(`📸 Snapshot cycle ${cycleCount}...`);

      // Fetch all trains with staggered timing
      for (const trainNumber of config.trackedTrains) {
        if (!isRunning) break;

        const success = await fetchTrainSnapshot(trainNumber);

        // Small delay between fetches to avoid bursts
        await sleep(config.minBetweenProviders);
      }

      // Wait for next cycle
      logger.debug(`⏳ Waiting ${config.intervalSeconds}s until next cycle...`);
      await sleep(config.intervalSeconds * 1000);
    } catch (err) {
      logger.error('Worker error:', err);
      errorCount++;
      await sleep(5000); // Backoff on error
    }
  }
}

/**
 * Graceful shutdown
 */
function handleShutdown() {
  logger.info('🛑 Shutdown signal received');
  isRunning = false;

  // Give worker time to finish current cycle
  setTimeout(() => {
    logger.success('📊 Worker shutdown complete', {
      snapshots_collected: snapshotCount,
      errors: errorCount,
    });
    process.exit(0);
  }, 5000);
}

/**
 * Entry point
 */
if (require.main === module) {
  // Handle shutdown signals
  process.on('SIGINT', handleShutdown);
  process.on('SIGTERM', handleShutdown);

  // Start worker
  runWorker().catch((err) => {
    logger.error('Worker failed:', err);
    process.exit(1);
  });
}

export { runWorker, fetchTrainSnapshot };
