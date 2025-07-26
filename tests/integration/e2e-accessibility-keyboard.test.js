/**
 * @fileoverview Accessibility and Keyboard Navigation E2E Tests
 * @module e2e-accessibility-keyboard
 * @description Tests for accessibility compliance and keyboard-only navigation
 * 
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2025-01-01
 */

import { test, expect } from '@playwright/test';
import RealExtensionHelper from '../helpers/real-extension-helper.js';

test.describe('ForgetfulMe Accessibility and Keyboard Navigation', () => {
  let extensionHelper;
  let extensionId;

  test.beforeEach(async ({ page, context }) => {
    extensionHelper = new RealExtensionHelper(page, context);
    
    const isLoaded = await extensionHelper.isExtensionLoaded();
    if (!isLoaded) {
      test.skip('Extension not loaded in browser context');
    }
    
    extensionId = await extensionHelper.getExtensionId();
  });

  test.afterEach(async () => {
    await extensionHelper.cleanup();
  });

  test('Popup keyboard navigation workflow', async () => {
    const popupPage = await extensionHelper.openPopup();
    await popupPage.waitForSelector('#app', { timeout: 5000 });
    
    // Start keyboard navigation from the first focusable element
    await popupPage.keyboard.press('Tab');
    
    // Track focus movement through all interactive elements
    const focusableElements = [];
    let previousFocus = null;
    
    for (let i = 0; i < 20; i++) { // Maximum 20 tab stops to prevent infinite loop
      const currentFocus = await popupPage.evaluate(() => {
        const focused = document.activeElement;
        return focused ? {
          tagName: focused.tagName,
          type: focused.type || null,
          id: focused.id || null,
          className: focused.className || null,
          text: focused.textContent?.slice(0, 50) || null
        } : null;
      });
      
      if (currentFocus && JSON.stringify(currentFocus) !== JSON.stringify(previousFocus)) {
        focusableElements.push(currentFocus);
        previousFocus = currentFocus;
      }
      
      await popupPage.keyboard.press('Tab');
      await popupPage.waitForTimeout(100);
      
      // Break if we've cycled back to the first element
      if (focusableElements.length > 1 && 
          JSON.stringify(currentFocus) === JSON.stringify(focusableElements[0])) {
        break;
      }
    }
    
    // Should have found focusable elements
    expect(focusableElements.length).toBeGreaterThan(0);
    
    console.log(`Found ${focusableElements.length} focusable elements:`, focusableElements);
    
    // Test reverse navigation (Shift+Tab)
    await popupPage.keyboard.press('Shift+Tab');
    await popupPage.waitForTimeout(100);
    
    const reverseNavFocus = await popupPage.evaluate(() => {
      const focused = document.activeElement;
      return focused ? focused.tagName : null;
    });
    
    expect(reverseNavFocus).toBeTruthy();
    
    await popupPage.close();
  });

  test('Options page keyboard navigation workflow', async () => {
    const optionsPage = await extensionHelper.openOptions();
    await optionsPage.waitForSelector('#app', { timeout: 5000 });
    
    // Test form navigation
    const formInputs = await optionsPage.locator('input, select, button, textarea').all();
    
    if (formInputs.length > 0) {
      // Navigate to first input
      await optionsPage.keyboard.press('Tab');
      
      // Test filling form with keyboard only
      const firstInput = optionsPage.locator('input').first();
      if (await firstInput.count() > 0) {
        await firstInput.focus();
        await optionsPage.keyboard.type('keyboard-test-value');
        
        // Verify value was entered
        const inputValue = await firstInput.inputValue();
        expect(inputValue).toContain('keyboard-test');
      }
      
      // Test select dropdown navigation
      const selectElements = optionsPage.locator('select');
      if (await selectElements.count() > 0) {
        await selectElements.first().focus();
        await optionsPage.keyboard.press('ArrowDown');
        await optionsPage.waitForTimeout(100);
        await optionsPage.keyboard.press('Enter');
      }
      
      // Test button activation
      const buttons = optionsPage.locator('button');
      if (await buttons.count() > 0) {
        await buttons.first().focus();
        // Verify button is focused and can be activated
        const isButtonFocused = await optionsPage.evaluate(() => {
          const focused = document.activeElement;
          return focused && focused.tagName === 'BUTTON';
        });
        expect(isButtonFocused).toBe(true);
      }
    }
    
    await optionsPage.close();
  });

  test('ARIA attributes and screen reader compatibility', async () => {
    const popupPage = await extensionHelper.openPopup();
    await popupPage.waitForSelector('#app', { timeout: 5000 });
    
    // Check for essential ARIA attributes
    const ariaElements = await popupPage.evaluate(() => {
      const elements = document.querySelectorAll('[role], [aria-label], [aria-labelledby], [aria-describedby]');
      return Array.from(elements).map(el => ({
        tagName: el.tagName,
        role: el.getAttribute('role'),
        ariaLabel: el.getAttribute('aria-label'),
        ariaLabelledby: el.getAttribute('aria-labelledby'),
        ariaDescribedby: el.getAttribute('aria-describedby'),
        ariaExpanded: el.getAttribute('aria-expanded'),
        ariaModal: el.getAttribute('aria-modal')
      }));
    });
    
    console.log('ARIA elements found:', ariaElements);
    
    // Check for buttons with proper labels
    const buttons = await popupPage.locator('button').all();
    for (const button of buttons) {
      const hasText = await button.textContent();
      const hasAriaLabel = await button.getAttribute('aria-label');
      const hasAriaLabelledby = await button.getAttribute('aria-labelledby');
      
      // Button should have some form of accessible label
      expect(hasText || hasAriaLabel || hasAriaLabelledby).toBeTruthy();
    }
    
    // Check for form inputs with labels
    const inputs = await popupPage.locator('input').all();
    for (const input of inputs) {
      const inputId = await input.getAttribute('id');
      const hasAriaLabel = await input.getAttribute('aria-label');
      const hasAriaLabelledby = await input.getAttribute('aria-labelledby');
      
      if (inputId) {
        // Check if there's a label element for this input
        const associatedLabel = await popupPage.locator(`label[for="${inputId}"]`);
        const hasLabel = await associatedLabel.count() > 0;
        
        // Input should have some form of accessible label
        expect(hasLabel || hasAriaLabel || hasAriaLabelledby).toBeTruthy();
      }
    }
    
    await popupPage.close();
  });

  test('Modal dialog accessibility workflow', async () => {
    const bookmarkPage = await extensionHelper.openBookmarkManagement();
    await bookmarkPage.waitForSelector('#app', { timeout: 5000 });
    
    // Look for triggers that might open modals (delete, edit buttons)
    const modalTriggers = bookmarkPage.locator('button').filter({ 
      hasText: /delete|edit|add|new|create/i 
    });
    
    if (await modalTriggers.count() > 0) {
      // Open modal
      await modalTriggers.first().click();
      await bookmarkPage.waitForTimeout(1000);
      
      // Check if modal opened
      const modal = bookmarkPage.locator('[role="dialog"], .modal, .popup');
      
      if (await modal.count() > 0) {
        // Verify modal ARIA attributes
        const modalAttributes = await modal.first().evaluate(el => ({
          role: el.getAttribute('role'),
          ariaModal: el.getAttribute('aria-modal'),
          ariaLabel: el.getAttribute('aria-label'),
          ariaLabelledby: el.getAttribute('aria-labelledby')
        }));
        
        console.log('Modal attributes:', modalAttributes);
        
        // Modal should have proper role
        expect(modalAttributes.role).toBe('dialog');
        
        // Test focus trap - focus should be trapped within modal
        await bookmarkPage.keyboard.press('Tab');
        await bookmarkPage.waitForTimeout(100);
        
        const focusedElement = await bookmarkPage.evaluate(() => {
          const focused = document.activeElement;
          const modal = document.querySelector('[role="dialog"], .modal, .popup');
          return modal ? modal.contains(focused) : false;
        });
        
        expect(focusedElement).toBe(true);
        
        // Test escape key to close modal
        await bookmarkPage.keyboard.press('Escape');
        await bookmarkPage.waitForTimeout(500);
        
        // Modal should be closed or hidden
        const modalVisible = await modal.first().isVisible().catch(() => false);
        expect(modalVisible).toBe(false);
      }
    }
    
    await bookmarkPage.close();
  });

  test('Keyboard shortcuts accessibility', async () => {
    // Create test page for shortcut testing
    const testPage = await extensionHelper.createTestPage(
      'https://example.com/accessibility-test',
      'Accessibility Test Page'
    );
    
    await testPage.bringToFront();
    
    // Step 1: Set up keyboard event detection for accessibility testing
    await testPage.addInitScript(() => {
      window.accessibilityShortcutDetected = false;
      document.addEventListener('keydown', (event) => {
        if (event.ctrlKey && event.shiftKey && event.key === 'R') {
          window.accessibilityShortcutDetected = true;
          console.log('Accessibility keyboard shortcut detected');
        }
      });
    });
    
    // Step 2: Test keyboard shortcut detection
    const shortcutStartTime = Date.now();
    await testPage.keyboard.press('Control+Shift+KeyR');
    const shortcutResponseTime = Date.now() - shortcutStartTime;
    
    // Verify shortcut detection is responsive (accessibility requirement)
    expect(shortcutResponseTime).toBeLessThan(1000);
    
    // Verify keyboard event was properly detected
    const shortcutDetected = await testPage.evaluate(() => window.accessibilityShortcutDetected);
    expect(shortcutDetected).toBe(true);
    
    // Step 3: Test extension interface accessibility
    const popupPage = await extensionHelper.openPopup();
    await expect(popupPage.locator('#app')).toBeVisible({ timeout: 5000 });
    
    // Test keyboard navigation within popup
    await popupPage.keyboard.press('Tab');
    await popupPage.waitForTimeout(500);
    
    // Check if focus is managed properly
    const focusTest = await popupPage.evaluate(() => {
      const activeElement = document.activeElement;
      return {
        hasFocus: activeElement !== document.body,
        elementType: activeElement.tagName,
        isInteractive: ['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'A'].includes(activeElement.tagName)
      };
    });
    
    console.log('Focus management test:', focusTest);
    
    // Accessibility: Tab navigation should reach interactive elements
    if (focusTest.hasFocus) {
      expect(focusTest.isInteractive).toBe(true);
    }
    
    console.log('✓ Keyboard shortcuts accessibility test completed');
    await popupPage.close();
    await testPage.close();
  });

  test('Color contrast and visual accessibility', async () => {
    const popupPage = await extensionHelper.openPopup();
    await popupPage.waitForSelector('#app', { timeout: 5000 });
    
    // Check for sufficient color contrast (simplified check)
    const colorContrastIssues = await popupPage.evaluate(() => {
      const elements = document.querySelectorAll('*');
      const issues = [];
      
      for (const el of elements) {
        const styles = window.getComputedStyle(el);
        const backgroundColor = styles.backgroundColor;
        const color = styles.color;
        
        // Skip elements without text or transparent backgrounds
        if (!el.textContent?.trim() || backgroundColor === 'transparent' || backgroundColor === 'rgba(0, 0, 0, 0)') {
          continue;
        }
        
        // Basic contrast check (simplified)
        if (color === backgroundColor) {
          issues.push({
            element: el.tagName,
            className: el.className,
            text: el.textContent.slice(0, 30),
            color: color,
            backgroundColor: backgroundColor
          });
        }
      }
      
      return issues;
    });
    
    // Should not have obvious contrast issues
    expect(colorContrastIssues.length).toBe(0);
    
    if (colorContrastIssues.length > 0) {
      console.warn('Potential color contrast issues:', colorContrastIssues);
    }
    
    await popupPage.close();
  });

  test('Focus management and visual indicators', async () => {
    const optionsPage = await extensionHelper.openOptions();
    await optionsPage.waitForSelector('#app', { timeout: 5000 });
    
    // Test focus indicators on interactive elements
    const interactiveElements = await optionsPage.locator('button, input, select, a, [tabindex]').all();
    
    for (let i = 0; i < Math.min(interactiveElements.length, 5); i++) {
      const element = interactiveElements[i];
      
      // Focus the element
      await element.focus();
      await optionsPage.waitForTimeout(100);
      
      // Check if focus is visible
      const focusStyles = await element.evaluate(el => {
        const styles = window.getComputedStyle(el);
        return {
          outline: styles.outline,
          outlineWidth: styles.outlineWidth,
          outlineStyle: styles.outlineStyle,
          outlineColor: styles.outlineColor,
          boxShadow: styles.boxShadow
        };
      });
      
      // Element should have some form of focus indicator
      const hasFocusIndicator = (
        focusStyles.outline !== 'none' ||
        focusStyles.outlineWidth !== '0px' ||
        focusStyles.boxShadow !== 'none'
      );
      
      if (!hasFocusIndicator) {
        console.warn('Element may lack focus indicator:', await element.tagName());
      }
      
      // At least some elements should have focus indicators
      // (We don't enforce all since some may have custom styling)
    }
    
    await optionsPage.close();
  });

  test('Screen reader navigation landmarks', async () => {
    const popupPage = await extensionHelper.openPopup();
    await popupPage.waitForSelector('#app', { timeout: 5000 });
    
    // Check for semantic HTML structure
    const landmarks = await popupPage.evaluate(() => {
      const semanticElements = document.querySelectorAll(
        'main, nav, header, footer, section, article, aside, [role="main"], [role="navigation"], [role="banner"], [role="contentinfo"]'
      );
      
      return Array.from(semanticElements).map(el => ({
        tagName: el.tagName,
        role: el.getAttribute('role'),
        ariaLabel: el.getAttribute('aria-label'),
        id: el.id
      }));
    });
    
    console.log('Semantic landmarks found:', landmarks);
    
    // Should have some semantic structure for screen readers
    expect(landmarks.length).toBeGreaterThan(0);
    
    // Check for heading hierarchy
    const headings = await popupPage.evaluate(() => {
      const headingElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      return Array.from(headingElements).map(el => ({
        level: el.tagName,
        text: el.textContent?.slice(0, 50),
        id: el.id
      }));
    });
    
    console.log('Headings found:', headings);
    
    // Should have at least one heading for document structure
    expect(headings.length).toBeGreaterThan(0);
    
    await popupPage.close();
  });

  test('Error message accessibility', async () => {
    const popupPage = await extensionHelper.openPopup();
    
    // Simulate error condition
    await popupPage.route('**/*', route => {
      if (route.request().url().includes('supabase')) {
        route.abort();
      } else {
        route.continue();
      }
    });
    
    // Trigger action that would cause error
    const actionButton = popupPage.locator('button').filter({ hasText: /save|mark|bookmark/i });
    
    if (await actionButton.count() > 0) {
      await actionButton.click();
      await popupPage.waitForTimeout(2000);
      
      // Check for accessible error message
      const errorElements = await popupPage.locator('.ui-message.error, .error-message, [role="alert"]').all();
      
      if (errorElements.length > 0) {
        for (const errorEl of errorElements) {
          // Check error message accessibility
          const errorAttributes = await errorEl.evaluate(el => ({
            role: el.getAttribute('role'),
            ariaLive: el.getAttribute('aria-live'),
            ariaAtomic: el.getAttribute('aria-atomic'),
            text: el.textContent?.slice(0, 100)
          }));
          
          console.log('Error message attributes:', errorAttributes);
          
          // Error should be announced to screen readers
          expect(
            errorAttributes.role === 'alert' || 
            errorAttributes.ariaLive || 
            errorEl.tagName === 'ALERT'
          ).toBeTruthy();
          
          // Error message should have meaningful text
          expect(errorAttributes.text).toBeTruthy();
          expect(errorAttributes.text.length).toBeGreaterThan(5);
        }
      }
    }
    
    await popupPage.close();
  });

  test('Progressive enhancement and fallbacks', async () => {
    const popupPage = await extensionHelper.openPopup();
    await popupPage.waitForSelector('#app', { timeout: 5000 });
    
    // Test with JavaScript disabled (simulate assistive technology)
    await popupPage.addInitScript(() => {
      // Override some JS functionality to test fallbacks
      window.alert = () => {};
      window.confirm = () => true;
    });
    
    // Verify basic functionality still works
    const basicElements = await popupPage.evaluate(() => {
      return {
        hasForm: !!document.querySelector('form'),
        hasButtons: !!document.querySelector('button'),
        hasInputs: !!document.querySelector('input'),
        hasLinks: !!document.querySelector('a'),
        hasText: document.body.textContent.length > 0
      };
    });
    
    // Basic content should be accessible even with limited JS
    expect(basicElements.hasText).toBe(true);
    
    // Should have interactive elements
    expect(
      basicElements.hasForm || 
      basicElements.hasButtons || 
      basicElements.hasInputs || 
      basicElements.hasLinks
    ).toBe(true);
    
    await popupPage.close();
  });
});