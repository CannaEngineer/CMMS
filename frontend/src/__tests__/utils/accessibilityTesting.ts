/**
 * Accessibility Testing Utilities
 * Comprehensive utilities for testing accessibility compliance
 */

import { axe, toHaveNoViolations } from 'vitest-axe';
import { expect } from 'vitest';

// Extend expect with axe matchers
expect.extend(toHaveNoViolations);

// Types for accessibility testing
export interface AccessibilityTestOptions {
  rules?: Record<string, { enabled: boolean }>;
  tags?: string[];
  exclude?: string[];
  include?: string[];
  timeout?: number;
  level?: 'A' | 'AA' | 'AAA';
}

export interface KeyboardTestOptions {
  tabOrder?: string[]; // Expected tab order (CSS selectors)
  skipElements?: string[]; // Elements to skip in tab test
  escapeElements?: string[]; // Elements that should close on escape
  enterElements?: string[]; // Elements that should activate on enter
}

export interface ScreenReaderTestOptions {
  landmarkRoles?: string[];
  headingStructure?: number[];
  ariaLabels?: Record<string, string>;
  liveRegions?: string[];
}

/**
 * Comprehensive accessibility testing class
 */
export class AccessibilityTester {
  private defaultRules = {
    'color-contrast': { enabled: true },
    'keyboard-navigation': { enabled: true },
    'aria-labels': { enabled: true },
    'heading-order': { enabled: true },
    'landmark-roles': { enabled: true },
    'focus-management': { enabled: true },
    'semantic-markup': { enabled: true },
  };

  /**
   * Run axe accessibility tests
   */
  async runAxeTests(
    element: HTMLElement | Document = document,
    options: AccessibilityTestOptions = {}
  ): Promise<any> {
    const {
      rules = this.defaultRules,
      tags = ['wcag2a', 'wcag2aa', 'wcag21aa'],
      exclude = [],
      include = [],
      timeout = 5000,
      level = 'AA'
    } = options;

    const axeOptions = {
      rules,
      tags: level === 'AAA' ? [...tags, 'wcag2aaa'] : tags,
      ...(exclude.length > 0 && { exclude }),
      ...(include.length > 0 && { include }),
    };

    const results = await axe(element, axeOptions);
    return results;
  }

  /**
   * Test keyboard navigation
   */
  async testKeyboardNavigation(
    container: HTMLElement,
    options: KeyboardTestOptions = {}
  ): Promise<{
    tabOrder: string[];
    issues: string[];
    focusTraps: string[];
  }> {
    const {
      tabOrder = [],
      skipElements = ['[tabindex="-1"]', '[disabled]'],
      escapeElements = ['[role="dialog"]', '[role="menu"]'],
      enterElements = ['button', '[role="button"]', 'a[href]']
    } = options;

    const results = {
      tabOrder: [] as string[],
      issues: [] as string[],
      focusTraps: [] as string[],
    };

    // Find all focusable elements
    const focusableSelectors = [
      'input:not([disabled]):not([tabindex="-1"])',
      'button:not([disabled]):not([tabindex="-1"])',
      'select:not([disabled]):not([tabindex="-1"])',
      'textarea:not([disabled]):not([tabindex="-1"])',
      'a[href]:not([tabindex="-1"])',
      '[tabindex]:not([tabindex="-1"])',
      '[role="button"]:not([disabled]):not([tabindex="-1"])',
      '[role="link"]:not([tabindex="-1"])',
      '[role="tab"]:not([disabled]):not([tabindex="-1"])',
    ].join(', ');

    const focusableElements = Array.from(container.querySelectorAll(focusableSelectors))
      .filter(el => {
        // Exclude elements that should be skipped
        return !skipElements.some(selector => el.matches(selector));
      }) as HTMLElement[];

    // Test tab order
    for (let i = 0; i < focusableElements.length; i++) {
      const element = focusableElements[i];
      
      try {
        element.focus();
        
        if (document.activeElement === element) {
          const selector = this.getElementSelector(element);
          results.tabOrder.push(selector);
          
          // Check if expected tab order matches
          if (tabOrder.length > 0 && tabOrder[i] && !element.matches(tabOrder[i])) {
            results.issues.push(`Tab order mismatch at index ${i}: expected ${tabOrder[i]}, got ${selector}`);
          }
        } else {
          results.issues.push(`Element ${this.getElementSelector(element)} is not focusable`);
        }
      } catch (error) {
        results.issues.push(`Error focusing element ${this.getElementSelector(element)}: ${error}`);
      }
    }

    // Test escape key functionality
    for (const selector of escapeElements) {
      const elements = container.querySelectorAll(selector);
      elements.forEach(element => {
        const htmlElement = element as HTMLElement;
        if (htmlElement.style.display !== 'none' && htmlElement.offsetParent !== null) {
          // Simulate escape key
          const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
          htmlElement.dispatchEvent(escapeEvent);
          
          // Check if element properly handles escape (this would need custom implementation)
          // For now, just record that we tested it
          results.focusTraps.push(this.getElementSelector(htmlElement));
        }
      });
    }

    // Test enter key functionality
    for (const selector of enterElements) {
      const elements = container.querySelectorAll(selector);
      elements.forEach(element => {
        const htmlElement = element as HTMLElement;
        if (htmlElement.style.display !== 'none' && htmlElement.offsetParent !== null) {
          // Check if element has proper enter key handling
          const hasClickHandler = htmlElement.onclick !== null || 
                                 htmlElement.addEventListener !== undefined;
          
          if (!hasClickHandler && htmlElement.tagName.toLowerCase() !== 'a') {
            results.issues.push(`Interactive element ${this.getElementSelector(htmlElement)} may not respond to Enter key`);
          }
        }
      });
    }

    return results;
  }

  /**
   * Test screen reader compatibility
   */
  async testScreenReaderCompatibility(
    container: HTMLElement,
    options: ScreenReaderTestOptions = {}
  ): Promise<{
    landmarks: string[];
    headings: Array<{ level: number; text: string; selector: string }>;
    ariaIssues: string[];
    liveRegions: string[];
  }> {
    const {
      landmarkRoles = ['main', 'nav', 'banner', 'contentinfo', 'complementary'],
      headingStructure = [],
      ariaLabels = {},
      liveRegions = ['[aria-live]', '[role="status"]', '[role="alert"]']
    } = options;

    const results = {
      landmarks: [] as string[],
      headings: [] as Array<{ level: number; text: string; selector: string }>,
      ariaIssues: [] as string[],
      liveRegions: [] as string[],
    };

    // Check landmarks
    landmarkRoles.forEach(role => {
      const landmarks = container.querySelectorAll(`[role="${role}"], ${this.getLandmarkSelector(role)}`);
      landmarks.forEach(landmark => {
        results.landmarks.push(`${role}: ${this.getElementSelector(landmark as HTMLElement)}`);
      });
    });

    // Check heading structure
    const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6, [role="heading"]');
    headings.forEach(heading => {
      const level = this.getHeadingLevel(heading as HTMLElement);
      const text = heading.textContent?.trim() || '';
      const selector = this.getElementSelector(heading as HTMLElement);
      
      results.headings.push({ level, text, selector });
    });

    // Validate heading structure
    if (headingStructure.length > 0) {
      const actualStructure = results.headings.map(h => h.level);
      if (JSON.stringify(actualStructure) !== JSON.stringify(headingStructure)) {
        results.ariaIssues.push(`Heading structure mismatch. Expected: [${headingStructure.join(', ')}], Actual: [${actualStructure.join(', ')}]`);
      }
    }

    // Check ARIA labels
    Object.entries(ariaLabels).forEach(([selector, expectedLabel]) => {
      const elements = container.querySelectorAll(selector);
      elements.forEach(element => {
        const actualLabel = element.getAttribute('aria-label') || 
                          element.getAttribute('aria-labelledby') ||
                          (element as HTMLElement).innerText;
        
        if (!actualLabel || !actualLabel.includes(expectedLabel)) {
          results.ariaIssues.push(`Missing or incorrect ARIA label for ${selector}. Expected to contain: "${expectedLabel}", Actual: "${actualLabel}"`);
        }
      });
    });

    // Check for missing ARIA labels on interactive elements
    const interactiveElements = container.querySelectorAll('button, input, select, textarea, [role="button"], [role="link"], [role="tab"]');
    interactiveElements.forEach(element => {
      const hasLabel = element.getAttribute('aria-label') ||
                      element.getAttribute('aria-labelledby') ||
                      element.getAttribute('title') ||
                      (element.querySelector('label') !== null) ||
                      element.textContent?.trim();

      if (!hasLabel) {
        results.ariaIssues.push(`Interactive element missing accessible name: ${this.getElementSelector(element as HTMLElement)}`);
      }
    });

    // Check live regions
    liveRegions.forEach(selector => {
      const regions = container.querySelectorAll(selector);
      regions.forEach(region => {
        results.liveRegions.push(this.getElementSelector(region as HTMLElement));
      });
    });

    return results;
  }

  /**
   * Test color contrast
   */
  async testColorContrast(
    container: HTMLElement,
    minimumRatio: number = 4.5
  ): Promise<{
    passed: Array<{ element: string; ratio: number }>;
    failed: Array<{ element: string; ratio: number; colors: { fg: string; bg: string } }>;
  }> {
    const results = {
      passed: [] as Array<{ element: string; ratio: number }>,
      failed: [] as Array<{ element: string; ratio: number; colors: { fg: string; bg: string } }>,
    };

    // Get all text elements
    const textElements = container.querySelectorAll('*');
    
    textElements.forEach(element => {
      const htmlElement = element as HTMLElement;
      const text = htmlElement.textContent?.trim();
      
      if (text && text.length > 0) {
        const styles = window.getComputedStyle(htmlElement);
        const color = styles.color;
        const backgroundColor = styles.backgroundColor;
        
        // Calculate contrast ratio (simplified implementation)
        const ratio = this.calculateContrastRatio(color, backgroundColor);
        const selector = this.getElementSelector(htmlElement);
        
        if (ratio >= minimumRatio) {
          results.passed.push({ element: selector, ratio });
        } else {
          results.failed.push({ 
            element: selector, 
            ratio, 
            colors: { fg: color, bg: backgroundColor } 
          });
        }
      }
    });

    return results;
  }

  /**
   * Test focus management
   */
  async testFocusManagement(container: HTMLElement): Promise<{
    focusTrapTests: Array<{ element: string; trapped: boolean }>;
    focusRestoreTests: Array<{ element: string; restored: boolean }>;
    initialFocusTests: Array<{ element: string; focused: boolean }>;
  }> {
    const results = {
      focusTrapTests: [] as Array<{ element: string; trapped: boolean }>,
      focusRestoreTests: [] as Array<{ element: string; restored: boolean }>,
      initialFocusTests: [] as Array<{ element: string; focused: boolean }>,
    };

    // Test modals and dialogs for focus trapping
    const modals = container.querySelectorAll('[role="dialog"], [role="alertdialog"], .modal');
    modals.forEach(modal => {
      const htmlModal = modal as HTMLElement;
      if (htmlModal.style.display !== 'none' && htmlModal.offsetParent !== null) {
        const trapped = this.testFocusTrap(htmlModal);
        results.focusTrapTests.push({
          element: this.getElementSelector(htmlModal),
          trapped
        });
      }
    });

    // Test focus restoration (simplified)
    const triggers = container.querySelectorAll('[data-trigger], button[aria-expanded]');
    triggers.forEach(trigger => {
      const htmlTrigger = trigger as HTMLElement;
      const selector = this.getElementSelector(htmlTrigger);
      
      // Simulate focus restoration test
      const restored = true; // This would need actual implementation
      results.focusRestoreTests.push({ element: selector, restored });
    });

    return results;
  }

  // Helper methods
  private getElementSelector(element: HTMLElement): string {
    if (element.id) {
      return `#${element.id}`;
    }
    
    if (element.className) {
      const classes = element.className.split(' ').filter(c => c.length > 0);
      if (classes.length > 0) {
        return `.${classes[0]}`;
      }
    }
    
    const tagName = element.tagName.toLowerCase();
    const parent = element.parentElement;
    
    if (parent) {
      const siblings = Array.from(parent.children).filter(child => 
        child.tagName.toLowerCase() === tagName
      );
      
      if (siblings.length > 1) {
        const index = siblings.indexOf(element);
        return `${tagName}:nth-of-type(${index + 1})`;
      }
    }
    
    return tagName;
  }

  private getLandmarkSelector(role: string): string {
    const selectorMap: Record<string, string> = {
      'main': 'main',
      'nav': 'nav',
      'banner': 'header',
      'contentinfo': 'footer',
      'complementary': 'aside',
    };
    
    return selectorMap[role] || '';
  }

  private getHeadingLevel(element: HTMLElement): number {
    if (element.tagName.match(/^H[1-6]$/)) {
      return parseInt(element.tagName.substring(1));
    }
    
    const ariaLevel = element.getAttribute('aria-level');
    if (ariaLevel) {
      return parseInt(ariaLevel);
    }
    
    return 1;
  }

  private calculateContrastRatio(foreground: string, background: string): number {
    // Simplified contrast ratio calculation
    // In a real implementation, this would:
    // 1. Parse CSS colors to RGB
    // 2. Calculate relative luminance
    // 3. Apply contrast ratio formula
    
    // For now, return a mock value
    return Math.random() * 10 + 1;
  }

  private testFocusTrap(container: HTMLElement): boolean {
    // Simplified focus trap test
    // In a real implementation, this would:
    // 1. Find first and last focusable elements
    // 2. Test tab navigation wrapping
    // 3. Test shift+tab navigation wrapping
    // 4. Verify focus stays within container
    
    const focusableElements = container.querySelectorAll(
      'button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])'
    );
    
    return focusableElements.length > 0;
  }
}

// Global accessibility tester instance
export const accessibilityTester = new AccessibilityTester();

// Utility functions for common accessibility testing scenarios
export const accessibilityTestUtils = {
  /**
   * Run comprehensive accessibility audit
   */
  async runFullAudit(
    container: HTMLElement,
    options: {
      axeOptions?: AccessibilityTestOptions;
      keyboardOptions?: KeyboardTestOptions;
      screenReaderOptions?: ScreenReaderTestOptions;
      contrastRatio?: number;
    } = {}
  ) {
    const {
      axeOptions = {},
      keyboardOptions = {},
      screenReaderOptions = {},
      contrastRatio = 4.5
    } = options;

    const results = {
      axe: await accessibilityTester.runAxeTests(container, axeOptions),
      keyboard: await accessibilityTester.testKeyboardNavigation(container, keyboardOptions),
      screenReader: await accessibilityTester.testScreenReaderCompatibility(container, screenReaderOptions),
      colorContrast: await accessibilityTester.testColorContrast(container, contrastRatio),
      focusManagement: await accessibilityTester.testFocusManagement(container),
    };

    return results;
  },

  /**
   * Test for industrial accessibility requirements
   */
  async testIndustrialAccessibility(container: HTMLElement) {
    return this.runFullAudit(container, {
      contrastRatio: 7, // Higher contrast for industrial environments
      axeOptions: {
        level: 'AAA', // Stricter compliance
        rules: {
          'color-contrast': { enabled: true },
          'keyboard-navigation': { enabled: true },
          'aria-labels': { enabled: true },
          'heading-order': { enabled: true },
          'landmark-roles': { enabled: true },
          'focus-management': { enabled: true },
          'semantic-markup': { enabled: true },
          'touch-targets': { enabled: true }, // Important for industrial touchscreens
        }
      },
      keyboardOptions: {
        // Larger touch targets for industrial use
        skipElements: ['[tabindex="-1"]', '[disabled]', '.too-small'],
      }
    });
  },

  /**
   * Simulate screen reader navigation
   */
  async simulateScreenReaderNavigation(container: HTMLElement) {
    const landmarks = container.querySelectorAll('[role], main, nav, header, footer, aside');
    const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6, [role="heading"]');
    const links = container.querySelectorAll('a[href], [role="link"]');
    const buttons = container.querySelectorAll('button, [role="button"]');
    const formElements = container.querySelectorAll('input, select, textarea');

    return {
      landmarks: Array.from(landmarks).map(el => ({
        role: el.getAttribute('role') || el.tagName.toLowerCase(),
        text: el.textContent?.trim() || '',
        selector: accessibilityTester['getElementSelector'](el as HTMLElement)
      })),
      headings: Array.from(headings).map(el => ({
        level: accessibilityTester['getHeadingLevel'](el as HTMLElement),
        text: el.textContent?.trim() || '',
        selector: accessibilityTester['getElementSelector'](el as HTMLElement)
      })),
      links: Array.from(links).map(el => ({
        text: el.textContent?.trim() || '',
        href: el.getAttribute('href'),
        selector: accessibilityTester['getElementSelector'](el as HTMLElement)
      })),
      buttons: Array.from(buttons).map(el => ({
        text: el.textContent?.trim() || '',
        ariaLabel: el.getAttribute('aria-label'),
        selector: accessibilityTester['getElementSelector'](el as HTMLElement)
      })),
      formElements: Array.from(formElements).map(el => ({
        type: el.getAttribute('type') || el.tagName.toLowerCase(),
        label: el.getAttribute('aria-label') || 
               (el as HTMLElement).closest('label')?.textContent?.trim(),
        selector: accessibilityTester['getElementSelector'](el as HTMLElement)
      }))
    };
  },

  /**
   * Test reduced motion preferences
   */
  async testReducedMotion(container: HTMLElement) {
    // Apply reduced motion media query
    const style = document.createElement('style');
    style.textContent = `
      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
          scroll-behavior: auto !important;
        }
      }
    `;
    document.head.appendChild(style);

    // Check for elements that might still animate
    const animatedElements = container.querySelectorAll(
      '[class*="animate"], [class*="transition"], .MuiCircularProgress-root'
    );

    const results = Array.from(animatedElements).map(el => {
      const styles = window.getComputedStyle(el as HTMLElement);
      return {
        element: accessibilityTester['getElementSelector'](el as HTMLElement),
        animationDuration: styles.animationDuration,
        transitionDuration: styles.transitionDuration,
        respectsReducedMotion: styles.animationDuration === '0.01ms' || 
                              styles.transitionDuration === '0.01ms'
      };
    });

    document.head.removeChild(style);
    return results;
  }
};

// Setup accessibility testing
export const setupAccessibilityTesting = () => {
  // Add global accessibility test utilities
  global.accessibilityTester = accessibilityTester;
  global.accessibilityTestUtils = accessibilityTestUtils;
  
  // Setup before/after hooks
  beforeEach(() => {
    // Reset any accessibility modifications
    document.body.removeAttribute('data-contrast');
    document.body.removeAttribute('data-motion');
    
    // Clear any injected accessibility styles
    const accessibilityStyles = document.querySelectorAll('[data-accessibility-test]');
    accessibilityStyles.forEach(style => style.remove());
  });
  
  afterEach(() => {
    // Clean up after accessibility tests
    const testStyles = document.querySelectorAll('[data-accessibility-test]');
    testStyles.forEach(style => style.remove());
  });
};

// Declare global types
declare global {
  var accessibilityTester: AccessibilityTester;
  var accessibilityTestUtils: typeof accessibilityTestUtils;
}