/**
 * Daily reset for technician `completedToday` counters.
 *
 * - Runs immediately on import (handles servers that start after midnight).
 * - Schedules a setTimeout to the next midnight, then setInterval every 24h.
 * - Uses the server's local timezone (matching the ISP's operating region).
 */

import { getPrisma } from './prisma.js';

async function resetCompletedToday() {
  try {
    const prisma = getPrisma();
    const result = await prisma.technician.updateMany({
      data: { completedToday: 0 },
    });
    console.log(`[daily-reset] Reset completedToday for ${result.count} technicians`);
  } catch (err) {
    console.error('[daily-reset] Failed to reset completedToday:', err);
  }
}

/** Returns ms until the next local midnight. */
function msUntilMidnight(): number {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(0, 0, 0, 0);
  midnight.setDate(midnight.getDate() + 1);
  return midnight.getTime() - now.getTime();
}

export function startDailyResetSchedule() {
  // Run once on startup if it's already past midnight (handles overnight restarts)
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  // If server started after midnight today and before noon, reset is needed
  // (it was missed while the server was down)
  if (now.getTime() - startOfDay.getTime() > 0) {
    // Check if technicians already have a non-zero counter from yesterday
    resetCompletedToday();
  }

  // Schedule next midnight reset, then every 24h
  function scheduleNext() {
    const delay = msUntilMidnight();
    setTimeout(async () => {
      await resetCompletedToday();
      // Now schedule every 24h
      setInterval(resetCompletedToday, 24 * 60 * 60 * 1000);
    }, delay);
  }

  scheduleNext();
  console.log(`[daily-reset] Scheduled next reset in ${Math.round(msUntilMidnight() / 1000 / 60)} minutes`);
}
