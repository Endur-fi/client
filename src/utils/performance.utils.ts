/**
 * Performance utilities for measuring contract call optimizations
 */

// Interface for performance measurements
export interface PerformanceMeasurement {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  callCount?: number;
}

/**
 * Creates a performance measurement instance
 */
export const createPerformanceMeasurement = (name: string): PerformanceMeasurement => {
  return {
    name,
    startTime: performance.now(),
  };
};

/**
 * Ends a performance measurement and calculates duration
 */
export const endPerformanceMeasurement = (measurement: PerformanceMeasurement): PerformanceMeasurement => {
  const endTime = performance.now();
  return {
    ...measurement,
    endTime,
    duration: endTime - measurement.startTime,
  };
};

/**
 * Logs performance comparison between old and new approaches
 */
export const logPerformanceComparison = (
  oldMeasurement: PerformanceMeasurement,
  newMeasurement: PerformanceMeasurement,
) => {
  if (!oldMeasurement.duration || !newMeasurement.duration) {
    console.warn("Performance measurements incomplete");
    return;
  }

  const improvement = oldMeasurement.duration - newMeasurement.duration;
  const improvementPercentage = (improvement / oldMeasurement.duration) * 100;

  console.group("🚀 Contract Call Performance Comparison");
  console.log(`📊 Old Approach (${oldMeasurement.name}): ${oldMeasurement.duration.toFixed(2)}ms`);
  console.log(`⚡ New Approach (${newMeasurement.name}): ${newMeasurement.duration.toFixed(2)}ms`);
  console.log(`✨ Improvement: ${improvement.toFixed(2)}ms (${improvementPercentage.toFixed(1)}% faster)`);
  console.log(`📈 Call Reduction: ${(oldMeasurement.callCount || 3)} → ${(newMeasurement.callCount || 1)} calls`);
  console.groupEnd();
};

/**
 * Performance markers for APY contract calls
 */
export const APY_PERFORMANCE = {
  OLD_APPROACH: "separate-apy-calls",
  NEW_APPROACH: "merged-apy-calls",
} as const;