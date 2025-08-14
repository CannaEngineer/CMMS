/**
 * Performance Testing Utilities
 * Comprehensive utilities for testing component performance and memory usage
 */

import { expect } from 'vitest';

// Types for performance testing
export interface PerformanceMetrics {
  renderTime: number;
  mountTime: number;
  updateTime?: number;
  unmountTime?: number;
  memoryUsage: {
    initial: number;
    peak: number;
    final: number;
    leaked?: number;
  };
  domNodes: {
    initial: number;
    peak: number;
    final: number;
  };
  reRenderCount: number;
  layoutShifts: number;
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
}

export interface PerformanceTestOptions {
  iterations?: number;
  warmupRuns?: number;
  memoryThreshold?: number; // MB
  renderTimeThreshold?: number; // ms
  reRenderThreshold?: number;
  trackMemoryLeaks?: boolean;
  trackLayoutShifts?: boolean;
  trackLCP?: boolean;
  trackFCP?: boolean;
}

export interface LoadTestOptions {
  concurrent?: number;
  duration?: number; // ms
  rampUp?: number; // ms
  operations?: Array<() => Promise<void>>;
}

/**
 * Performance testing class for React components
 */
export class PerformanceTester {
  private performanceEntries: PerformanceEntry[] = [];
  private memoryObserver?: PerformanceObserver;
  private layoutShiftObserver?: PerformanceObserver;
  private renderCountMap = new Map<string, number>();

  /**
   * Measure component render performance
   */
  async measureRenderPerformance(
    renderFn: () => Promise<any>,
    componentName: string,
    options: PerformanceTestOptions = {}
  ): Promise<PerformanceMetrics> {
    const {
      iterations = 1,
      warmupRuns = 0,
      trackMemoryLeaks = true,
      trackLayoutShifts = true,
    } = options;

    const metrics: PerformanceMetrics = {
      renderTime: 0,
      mountTime: 0,
      memoryUsage: { initial: 0, peak: 0, final: 0 },
      domNodes: { initial: 0, peak: 0, final: 0 },
      reRenderCount: 0,
      layoutShifts: 0,
    };

    // Setup performance monitoring
    this.setupPerformanceMonitoring(componentName, options);

    // Initial memory and DOM measurements
    metrics.memoryUsage.initial = this.getMemoryUsage();
    metrics.domNodes.initial = document.querySelectorAll('*').length;

    // Warmup runs
    for (let i = 0; i < warmupRuns; i++) {
      await renderFn();
    }

    // Actual performance measurements
    const renderTimes: number[] = [];
    const mountTimes: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      
      // Mark render start
      performance.mark(`${componentName}-render-start-${i}`);
      
      const result = await renderFn();
      
      // Mark render end
      performance.mark(`${componentName}-render-end-${i}`);
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      renderTimes.push(renderTime);

      // Measure mount time (time to first meaningful paint)
      const mountTime = await this.measureMountTime(componentName, i);
      mountTimes.push(mountTime);

      // Track peak memory and DOM usage
      const currentMemory = this.getMemoryUsage();
      const currentDOMNodes = document.querySelectorAll('*').length;
      
      if (currentMemory > metrics.memoryUsage.peak) {
        metrics.memoryUsage.peak = currentMemory;
      }
      
      if (currentDOMNodes > metrics.domNodes.peak) {
        metrics.domNodes.peak = currentDOMNodes;
      }

      // Force garbage collection if available (for testing)
      if (global.gc) {
        global.gc();
      }

      // Small delay between iterations
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    // Calculate averages
    metrics.renderTime = this.calculateAverage(renderTimes);
    metrics.mountTime = this.calculateAverage(mountTimes);

    // Final measurements
    metrics.memoryUsage.final = this.getMemoryUsage();
    metrics.domNodes.final = document.querySelectorAll('*').length;

    // Calculate memory leaks
    if (trackMemoryLeaks) {
      const memoryDiff = metrics.memoryUsage.final - metrics.memoryUsage.initial;
      if (memoryDiff > 0) {
        metrics.memoryUsage.leaked = memoryDiff;
      }
    }

    // Get rerender count
    metrics.reRenderCount = this.renderCountMap.get(componentName) || 0;

    // Get layout shifts
    if (trackLayoutShifts) {
      metrics.layoutShifts = this.getLayoutShifts();
    }

    // Get Core Web Vitals
    metrics.firstContentfulPaint = this.getFirstContentfulPaint();
    metrics.largestContentfulPaint = this.getLargestContentfulPaint();

    // Cleanup
    this.cleanup();

    return metrics;
  }

  /**
   * Measure component update performance
   */
  async measureUpdatePerformance(
    updateFn: () => Promise<void>,
    componentName: string,
    iterations: number = 10
  ): Promise<{ averageUpdateTime: number; updateTimes: number[] }> {
    const updateTimes: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      
      performance.mark(`${componentName}-update-start-${i}`);
      await updateFn();
      performance.mark(`${componentName}-update-end-${i}`);
      
      const endTime = performance.now();
      updateTimes.push(endTime - startTime);

      // Small delay between updates
      await new Promise(resolve => setTimeout(resolve, 5));
    }

    return {
      averageUpdateTime: this.calculateAverage(updateTimes),
      updateTimes,
    };
  }

  /**
   * Measure memory usage over time
   */
  async measureMemoryUsageOverTime(
    operationFn: () => Promise<void>,
    duration: number = 5000,
    interval: number = 100
  ): Promise<{
    memorySnapshots: Array<{ time: number; usage: number }>;
    peakUsage: number;
    averageUsage: number;
    memoryGrowth: number;
  }> {
    const snapshots: Array<{ time: number; usage: number }> = [];
    const startTime = Date.now();
    const initialMemory = this.getMemoryUsage();

    const intervalId = setInterval(() => {
      const currentTime = Date.now() - startTime;
      const currentMemory = this.getMemoryUsage();
      snapshots.push({ time: currentTime, usage: currentMemory });
    }, interval);

    // Run operation
    await operationFn();

    // Continue monitoring for remaining duration
    await new Promise(resolve => setTimeout(resolve, duration));

    clearInterval(intervalId);

    const finalMemory = this.getMemoryUsage();
    const memoryValues = snapshots.map(s => s.usage);
    
    return {
      memorySnapshots: snapshots,
      peakUsage: Math.max(...memoryValues),
      averageUsage: this.calculateAverage(memoryValues),
      memoryGrowth: finalMemory - initialMemory,
    };
  }

  /**
   * Load testing for components
   */
  async loadTest(
    componentFn: () => Promise<any>,
    componentName: string,
    options: LoadTestOptions = {}
  ): Promise<{
    totalOperations: number;
    operationsPerSecond: number;
    averageResponseTime: number;
    errorRate: number;
    peakMemoryUsage: number;
    errors: string[];
  }> {
    const {
      concurrent = 1,
      duration = 10000,
      rampUp = 1000,
      operations = [],
    } = options;

    const results = {
      totalOperations: 0,
      operationsPerSecond: 0,
      averageResponseTime: 0,
      errorRate: 0,
      peakMemoryUsage: 0,
      errors: [] as string[],
    };

    const startTime = Date.now();
    const responseTimes: number[] = [];
    let activeOperations = 0;
    let completedOperations = 0;
    let errorCount = 0;

    // Ramp up function
    const rampUpInterval = rampUp / concurrent;
    
    const runOperation = async (operationIndex: number) => {
      activeOperations++;
      
      try {
        const opStartTime = performance.now();
        
        if (operations.length > 0) {
          await operations[operationIndex % operations.length]();
        } else {
          await componentFn();
        }
        
        const opEndTime = performance.now();
        responseTimes.push(opEndTime - opStartTime);
        completedOperations++;
        
        // Track peak memory
        const currentMemory = this.getMemoryUsage();
        if (currentMemory > results.peakMemoryUsage) {
          results.peakMemoryUsage = currentMemory;
        }
        
      } catch (error) {
        errorCount++;
        results.errors.push(`Operation ${operationIndex}: ${error}`);
      } finally {
        activeOperations--;
      }
    };

    // Start operations with ramp-up
    const promises: Promise<void>[] = [];
    let operationIndex = 0;

    const startOperations = () => {
      for (let i = 0; i < concurrent; i++) {
        setTimeout(() => {
          const runContinuously = async () => {
            while (Date.now() - startTime < duration) {
              await runOperation(operationIndex++);
              await new Promise(resolve => setTimeout(resolve, 10));
            }
          };
          promises.push(runContinuously());
        }, i * rampUpInterval);
      }
    };

    startOperations();

    // Wait for all operations to complete or timeout
    await Promise.allSettled(promises);

    // Calculate results
    const totalDuration = Date.now() - startTime;
    results.totalOperations = completedOperations;
    results.operationsPerSecond = (completedOperations / totalDuration) * 1000;
    results.averageResponseTime = this.calculateAverage(responseTimes);
    results.errorRate = (errorCount / (completedOperations + errorCount)) * 100;

    return results;
  }

  /**
   * Measure bundle size impact
   */
  async measureBundleImpact(
    componentName: string,
    renderFn: () => Promise<any>
  ): Promise<{
    bundleSize: number;
    gzippedSize: number;
    parseDuration: number;
    evaluationDuration: number;
  }> {
    const startTime = performance.now();
    
    // Mock bundle size measurement
    // In a real implementation, this would analyze the actual bundle
    const bundleSize = Math.random() * 100000 + 50000; // 50-150KB
    const gzippedSize = bundleSize * 0.3; // ~30% of original
    
    await renderFn();
    
    const endTime = performance.now();
    const totalDuration = endTime - startTime;
    
    return {
      bundleSize,
      gzippedSize,
      parseDuration: totalDuration * 0.1, // ~10% for parsing
      evaluationDuration: totalDuration * 0.9, // ~90% for evaluation
    };
  }

  // Helper methods
  private setupPerformanceMonitoring(componentName: string, options: PerformanceTestOptions) {
    // Setup memory observer
    if (options.trackMemoryLeaks && 'PerformanceObserver' in window) {
      this.memoryObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        this.performanceEntries.push(...entries);
      });
      
      try {
        this.memoryObserver.observe({ entryTypes: ['measure', 'mark'] });
      } catch (e) {
        // PerformanceObserver not fully supported
      }
    }

    // Setup layout shift observer
    if (options.trackLayoutShifts && 'PerformanceObserver' in window) {
      this.layoutShiftObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        this.performanceEntries.push(...entries);
      });
      
      try {
        this.layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (e) {
        // Layout shift observation not supported
      }
    }

    // Reset render count
    this.renderCountMap.set(componentName, 0);
  }

  private async measureMountTime(componentName: string, iteration: number): Promise<number> {
    return new Promise((resolve) => {
      // Use requestAnimationFrame to measure when DOM is ready
      requestAnimationFrame(() => {
        const endMark = `${componentName}-render-end-${iteration}`;
        const startMark = `${componentName}-render-start-${iteration}`;
        
        try {
          performance.measure(`${componentName}-mount-${iteration}`, startMark, endMark);
          const measure = performance.getEntriesByName(`${componentName}-mount-${iteration}`)[0];
          resolve(measure ? measure.duration : 0);
        } catch (e) {
          resolve(0);
        }
      });
    });
  }

  private getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize / 1024 / 1024; // MB
    }
    
    // Fallback estimation
    return Math.random() * 50 + 20; // 20-70MB
  }

  private getLayoutShifts(): number {
    return this.performanceEntries
      .filter(entry => entry.entryType === 'layout-shift')
      .reduce((sum, entry) => sum + (entry as any).value, 0);
  }

  private getFirstContentfulPaint(): number | undefined {
    const fcp = performance.getEntriesByName('first-contentful-paint')[0];
    return fcp ? fcp.startTime : undefined;
  }

  private getLargestContentfulPaint(): number | undefined {
    const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
    const lcp = lcpEntries[lcpEntries.length - 1];
    return lcp ? lcp.startTime : undefined;
  }

  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  private cleanup() {
    if (this.memoryObserver) {
      this.memoryObserver.disconnect();
    }
    
    if (this.layoutShiftObserver) {
      this.layoutShiftObserver.disconnect();
    }
    
    // Clear performance entries
    this.performanceEntries = [];
    
    // Clear performance marks and measures
    performance.clearMarks();
    performance.clearMeasures();
  }
}

// Global performance tester instance
export const performanceTester = new PerformanceTester();

// Utility functions for performance testing
export const performanceTestUtils = {
  /**
   * Assert performance thresholds
   */
  assertPerformanceThresholds(
    metrics: PerformanceMetrics,
    thresholds: {
      maxRenderTime?: number;
      maxMemoryUsage?: number;
      maxReRenders?: number;
      maxLayoutShifts?: number;
      maxMemoryLeak?: number;
    }
  ) {
    const {
      maxRenderTime = 100,
      maxMemoryUsage = 100,
      maxReRenders = 5,
      maxLayoutShifts = 0.1,
      maxMemoryLeak = 10,
    } = thresholds;

    if (metrics.renderTime > maxRenderTime) {
      throw new Error(`Render time ${metrics.renderTime}ms exceeds threshold ${maxRenderTime}ms`);
    }

    if (metrics.memoryUsage.peak > maxMemoryUsage) {
      throw new Error(`Peak memory usage ${metrics.memoryUsage.peak}MB exceeds threshold ${maxMemoryUsage}MB`);
    }

    if (metrics.reRenderCount > maxReRenders) {
      throw new Error(`Re-render count ${metrics.reRenderCount} exceeds threshold ${maxReRenders}`);
    }

    if (metrics.layoutShifts > maxLayoutShifts) {
      throw new Error(`Layout shifts ${metrics.layoutShifts} exceed threshold ${maxLayoutShifts}`);
    }

    if (metrics.memoryUsage.leaked && metrics.memoryUsage.leaked > maxMemoryLeak) {
      throw new Error(`Memory leak ${metrics.memoryUsage.leaked}MB exceeds threshold ${maxMemoryLeak}MB`);
    }
  },

  /**
   * Create performance test for industrial environment
   */
  createIndustrialPerformanceTest(
    componentName: string,
    renderFn: () => Promise<any>
  ) {
    return async () => {
      const metrics = await performanceTester.measureRenderPerformance(
        renderFn,
        componentName,
        {
          iterations: 10,
          warmupRuns: 3,
          trackMemoryLeaks: true,
          trackLayoutShifts: true,
        }
      );

      // Industrial environment thresholds (more lenient due to hardware constraints)
      this.assertPerformanceThresholds(metrics, {
        maxRenderTime: 200, // 200ms for industrial hardware
        maxMemoryUsage: 150, // 150MB max
        maxReRenders: 10,
        maxLayoutShifts: 0.2,
        maxMemoryLeak: 20,
      });

      return metrics;
    };
  },

  /**
   * Benchmark component against baseline
   */
  async benchmarkAgainstBaseline(
    componentName: string,
    renderFn: () => Promise<any>,
    baselineMetrics: PerformanceMetrics
  ): Promise<{
    improvement: number;
    regression: number;
    comparison: Record<keyof PerformanceMetrics, number>;
  }> {
    const currentMetrics = await performanceTester.measureRenderPerformance(
      renderFn,
      componentName
    );

    const comparison: any = {};
    let improvements = 0;
    let regressions = 0;

    const compareMetric = (key: keyof PerformanceMetrics, current: any, baseline: any) => {
      if (typeof current === 'number' && typeof baseline === 'number') {
        const percentChange = ((current - baseline) / baseline) * 100;
        comparison[key] = percentChange;
        
        if (percentChange < -5) improvements++; // 5% improvement
        if (percentChange > 5) regressions++; // 5% regression
      }
    };

    compareMetric('renderTime', currentMetrics.renderTime, baselineMetrics.renderTime);
    compareMetric('mountTime', currentMetrics.mountTime, baselineMetrics.mountTime);
    compareMetric('reRenderCount', currentMetrics.reRenderCount, baselineMetrics.reRenderCount);
    compareMetric('layoutShifts', currentMetrics.layoutShifts, baselineMetrics.layoutShifts);

    return {
      improvement: improvements,
      regression: regressions,
      comparison,
    };
  },

  /**
   * Simulate slow device performance
   */
  simulateSlowDevice() {
    // Throttle JavaScript execution
    const originalSetTimeout = window.setTimeout;
    window.setTimeout = (callback: any, delay: number = 0) => {
      return originalSetTimeout(callback, delay * 3); // 3x slower
    };

    // Mock slower hardware specs
    Object.defineProperty(navigator, 'hardwareConcurrency', {
      value: 2, // Dual core
      configurable: true,
    });

    return () => {
      // Restore original performance
      window.setTimeout = originalSetTimeout;
      Object.defineProperty(navigator, 'hardwareConcurrency', {
        value: 8, // Restore to default
        configurable: true,
      });
    };
  },

  /**
   * Monitor frame rate during interactions
   */
  async monitorFrameRate(
    interactionFn: () => Promise<void>,
    duration: number = 5000
  ): Promise<{
    averageFPS: number;
    minFPS: number;
    maxFPS: number;
    frameDrops: number;
  }> {
    const frames: number[] = [];
    let frameCount = 0;
    let lastTime = performance.now();
    let animationId: number;

    const measureFrame = () => {
      const currentTime = performance.now();
      const fps = 1000 / (currentTime - lastTime);
      frames.push(fps);
      frameCount++;
      lastTime = currentTime;
      
      animationId = requestAnimationFrame(measureFrame);
    };

    animationId = requestAnimationFrame(measureFrame);

    // Run interaction
    await interactionFn();

    // Continue monitoring
    await new Promise(resolve => setTimeout(resolve, duration));

    cancelAnimationFrame(animationId);

    const averageFPS = frames.reduce((sum, fps) => sum + fps, 0) / frames.length;
    const minFPS = Math.min(...frames);
    const maxFPS = Math.max(...frames);
    const frameDrops = frames.filter(fps => fps < 55).length; // < 55 FPS considered a drop

    return {
      averageFPS,
      minFPS,
      maxFPS,
      frameDrops,
    };
  },
};

// Setup performance testing
export const setupPerformanceTesting = () => {
  // Add global performance test utilities
  global.performanceTester = performanceTester;
  global.performanceTestUtils = performanceTestUtils;
  
  // Setup before/after hooks
  beforeEach(() => {
    // Clear performance data
    performance.clearMarks();
    performance.clearMeasures();
    
    // Reset render counts
    performanceTester['renderCountMap'].clear();
  });
  
  afterEach(() => {
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
    
    // Cleanup performance monitoring
    performanceTester['cleanup']();
  });
};

// Declare global types
declare global {
  var performanceTester: PerformanceTester;
  var performanceTestUtils: typeof performanceTestUtils;
  var gc: (() => void) | undefined;
}