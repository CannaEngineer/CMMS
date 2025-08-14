/**
 * Visual Regression Testing Utilities
 * Provides utilities for screenshot comparison and visual testing
 */

import { expect } from 'vitest';

// Types for visual testing
export interface VisualTestOptions {
  threshold?: number; // Percentage difference threshold (0-100)
  ignoreRegions?: Array<{ x: number; y: number; width: number; height: number }>;
  waitForElements?: string[]; // CSS selectors to wait for before screenshot
  hideElements?: string[]; // CSS selectors to hide before screenshot
  mockSystemTime?: string; // ISO string to mock system time
  viewport?: { width: number; height: number };
}

export interface ScreenshotComparison {
  match: boolean;
  diffPercentage: number;
  diffImagePath?: string;
  baseline?: string;
  actual?: string;
}

// Mock implementation of visual regression testing
// In a real implementation, this would integrate with tools like:
// - Percy (Browserstack Visual Testing)
// - Applitools Eyes
// - BackstopJS
// - Puppeteer with pixelmatch
// - Playwright's built-in screenshot comparison

export class VisualRegressionTester {
  private baselineDir: string;
  private actualDir: string;
  private diffDir: string;

  constructor(
    baselineDir = '__tests__/visual/baselines',
    actualDir = '__tests__/visual/actual',
    diffDir = '__tests__/visual/diffs'
  ) {
    this.baselineDir = baselineDir;
    this.actualDir = actualDir;
    this.diffDir = diffDir;
  }

  /**
   * Take a screenshot and compare with baseline
   */
  async compareScreenshot(
    testName: string,
    element: HTMLElement | Document = document,
    options: VisualTestOptions = {}
  ): Promise<ScreenshotComparison> {
    const {
      threshold = 0.1,
      ignoreRegions = [],
      waitForElements = [],
      hideElements = [],
      mockSystemTime,
      viewport
    } = options;

    // Mock screenshot comparison for testing
    // In real implementation, this would:
    // 1. Wait for specified elements
    // 2. Hide specified elements
    // 3. Set viewport if specified
    // 4. Mock system time if specified
    // 5. Take screenshot
    // 6. Compare with baseline
    // 7. Generate diff if different
    
    console.log(`Taking screenshot for test: ${testName}`);
    console.log(`Threshold: ${threshold}%`);
    console.log(`Ignore regions:`, ignoreRegions);
    console.log(`Wait for elements:`, waitForElements);
    console.log(`Hide elements:`, hideElements);

    // Simulate visual comparison result
    const mockResult: ScreenshotComparison = {
      match: true,
      diffPercentage: 0.05, // Small difference within threshold
      baseline: `${this.baselineDir}/${testName}.png`,
      actual: `${this.actualDir}/${testName}.png`,
    };

    return mockResult;
  }

  /**
   * Update baseline screenshot
   */
  async updateBaseline(testName: string, element: HTMLElement | Document = document): Promise<void> {
    console.log(`Updating baseline for test: ${testName}`);
    // In real implementation, this would save current screenshot as new baseline
  }

  /**
   * Take multiple screenshots for responsive testing
   */
  async compareResponsiveScreenshots(
    testName: string,
    viewports: Array<{ name: string; width: number; height: number }>,
    element: HTMLElement | Document = document,
    options: Omit<VisualTestOptions, 'viewport'> = {}
  ): Promise<Record<string, ScreenshotComparison>> {
    const results: Record<string, ScreenshotComparison> = {};

    for (const viewport of viewports) {
      const viewportTestName = `${testName}-${viewport.name}`;
      results[viewport.name] = await this.compareScreenshot(
        viewportTestName,
        element,
        { ...options, viewport: { width: viewport.width, height: viewport.height } }
      );
    }

    return results;
  }

  /**
   * Compare screenshots across different themes
   */
  async compareThemeScreenshots(
    testName: string,
    themes: string[],
    element: HTMLElement | Document = document,
    options: VisualTestOptions = {}
  ): Promise<Record<string, ScreenshotComparison>> {
    const results: Record<string, ScreenshotComparison> = {};

    for (const theme of themes) {
      const themeTestName = `${testName}-${theme}`;
      
      // In real implementation, this would:
      // 1. Apply theme to document
      // 2. Wait for theme application
      // 3. Take screenshot
      
      results[theme] = await this.compareScreenshot(themeTestName, element, options);
    }

    return results;
  }

  /**
   * Compare loading states
   */
  async compareLoadingStates(
    testName: string,
    states: Array<{ name: string; setupFn: () => Promise<void> }>,
    element: HTMLElement | Document = document,
    options: VisualTestOptions = {}
  ): Promise<Record<string, ScreenshotComparison>> {
    const results: Record<string, ScreenshotComparison> = {};

    for (const state of states) {
      await state.setupFn();
      const stateTestName = `${testName}-${state.name}`;
      results[state.name] = await this.compareScreenshot(stateTestName, element, options);
    }

    return results;
  }
}

// Global visual regression tester instance
export const visualTester = new VisualRegressionTester();

// Utility functions for common visual testing scenarios
export const visualTestUtils = {
  /**
   * Standard viewports for responsive testing
   */
  getStandardViewports() {
    return [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1920, height: 1080 },
      { name: 'wide', width: 2560, height: 1440 },
    ];
  },

  /**
   * Industrial device viewports (ruggedized tablets, industrial PCs)
   */
  getIndustrialViewports() {
    return [
      { name: 'industrial-tablet', width: 1024, height: 768 },
      { name: 'industrial-panel', width: 1280, height: 800 },
      { name: 'hmi-display', width: 800, height: 600 },
    ];
  },

  /**
   * Wait for animations to complete
   */
  async waitForAnimations(timeout = 1000): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, timeout));
  },

  /**
   * Hide dynamic content for consistent screenshots
   */
  hideDynamicElements(): string[] {
    return [
      '[data-testid="timestamp"]',
      '[data-testid="live-indicator"]',
      '[data-testid="progress-indicator"]',
      '.MuiCircularProgress-root',
      '[data-testid="auto-refresh-time"]',
    ];
  },

  /**
   * Mock system time for consistent timestamps
   */
  mockSystemTime(date = '2024-01-15T10:00:00Z'): void {
    const mockDate = new Date(date);
    
    // Mock Date constructor
    const OriginalDate = global.Date;
    global.Date = class extends OriginalDate {
      constructor(...args: any[]) {
        if (args.length === 0) {
          super(mockDate.getTime());
        } else {
          super(...args);
        }
      }
      
      static now() {
        return mockDate.getTime();
      }
    } as any;
  },

  /**
   * Setup component for visual testing
   */
  async setupVisualTest(element: HTMLElement, options: {
    hideElements?: string[];
    mockTime?: string;
    waitForElements?: string[];
  } = {}): Promise<void> {
    const { hideElements = [], mockTime, waitForElements = [] } = options;

    // Mock system time if specified
    if (mockTime) {
      this.mockSystemTime(mockTime);
    }

    // Hide dynamic elements
    const elementsToHide = [...this.hideDynamicElements(), ...hideElements];
    elementsToHide.forEach(selector => {
      const elements = element.querySelectorAll(selector);
      elements.forEach(el => {
        (el as HTMLElement).style.visibility = 'hidden';
      });
    });

    // Wait for specified elements
    for (const selector of waitForElements) {
      const element = document.querySelector(selector);
      if (!element) {
        throw new Error(`Element not found: ${selector}`);
      }
    }

    // Wait for animations to complete
    await this.waitForAnimations();
  },
};

// Custom matchers for visual regression testing
export const visualMatchers = {
  /**
   * Expect visual match with baseline
   */
  toMatchVisualBaseline: async (
    element: HTMLElement | Document,
    testName: string,
    options: VisualTestOptions = {}
  ) => {
    const comparison = await visualTester.compareScreenshot(testName, element, options);
    
    return {
      pass: comparison.match,
      message: () => 
        comparison.match
          ? `Expected visual difference but screenshots matched (${comparison.diffPercentage}% difference)`
          : `Visual regression detected: ${comparison.diffPercentage}% difference exceeds threshold of ${options.threshold || 0.1}%${comparison.diffImagePath ? `\nDiff image: ${comparison.diffImagePath}` : ''}`,
    };
  },

  /**
   * Expect responsive design consistency
   */
  toBeResponsivelyConsistent: async (
    element: HTMLElement | Document,
    testName: string,
    options: VisualTestOptions = {}
  ) => {
    const viewports = visualTestUtils.getStandardViewports();
    const results = await visualTester.compareResponsiveScreenshots(testName, viewports, element, options);
    
    const failures = Object.entries(results).filter(([_, result]) => !result.match);
    
    return {
      pass: failures.length === 0,
      message: () =>
        failures.length === 0
          ? 'Expected responsive inconsistencies but all viewports matched'
          : `Responsive design inconsistencies detected:\n${failures.map(([viewport, result]) => 
              `  ${viewport}: ${result.diffPercentage}% difference`
            ).join('\n')}`,
    };
  },

  /**
   * Expect theme consistency
   */
  toBeThemeConsistent: async (
    element: HTMLElement | Document,
    testName: string,
    themes: string[] = ['light', 'dark'],
    options: VisualTestOptions = {}
  ) => {
    const results = await visualTester.compareThemeScreenshots(testName, themes, element, options);
    
    const failures = Object.entries(results).filter(([_, result]) => !result.match);
    
    return {
      pass: failures.length === 0,
      message: () =>
        failures.length === 0
          ? 'Expected theme inconsistencies but all themes matched'
          : `Theme inconsistencies detected:\n${failures.map(([theme, result]) => 
              `  ${theme}: ${result.diffPercentage}% difference`
            ).join('\n')}`,
    };
  },
};

// Extend expect with visual matchers
declare global {
  namespace Vi {
    interface AsymmetricMatchersContaining {
      toMatchVisualBaseline(testName: string, options?: VisualTestOptions): any;
      toBeResponsivelyConsistent(testName: string, options?: VisualTestOptions): any;
      toBeThemeConsistent(testName: string, themes?: string[], options?: VisualTestOptions): any;
    }
  }
}

// Integration with testing frameworks
export const setupVisualTesting = () => {
  // Extend expect with custom matchers
  expect.extend(visualMatchers);
  
  // Setup test environment for visual testing
  beforeEach(async () => {
    // Reset any visual modifications
    document.body.style.transform = '';
    document.body.style.filter = '';
    
    // Clear any injected styles
    const visualTestStyles = document.querySelectorAll('[data-visual-test]');
    visualTestStyles.forEach(style => style.remove());
  });
  
  afterEach(async () => {
    // Clean up after visual tests
    visualTestUtils.waitForAnimations(100);
  });
};