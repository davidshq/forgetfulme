import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { showSetupInterface } from '../../utils/setup-interface.js';

/**
 * @fileoverview Unit tests for setup-interface utility
 * @module setup-interface.test
 * @description Tests for setup interface UI rendering
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

// Mock dependencies
vi.mock('../../utils/ui-components.js', () => ({
  default: {
    createContainer: vi.fn(),
    createSection: vi.fn(),
    createButton: vi.fn(),
  },
}));

import UIComponents from '../../utils/ui-components.js';

describe('setup-interface', () => {
  let mockAppContainer;
  let mockOnOpenSettings;
  let mockContainer;
  let mockSetupSection;
  let mockHowItWorksSection;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create mock DOM elements
    mockAppContainer = document.createElement('div');
    mockContainer = document.createElement('div');
    mockSetupSection = document.createElement('section');
    mockHowItWorksSection = document.createElement('section');

    // Mock appendChild methods
    mockSetupSection.appendChild = vi.fn();
    mockContainer.appendChild = vi.fn();
    mockAppContainer.appendChild = vi.fn();

    mockOnOpenSettings = vi.fn();

    // Setup UIComponents mocks
    UIComponents.createContainer.mockReturnValue(mockContainer);
    UIComponents.createSection.mockImplementation((title, className) => {
      const section = document.createElement('section');
      section.className = className;
      if (title === '🔧 Setup Required') {
        return mockSetupSection;
      }
      if (title === '📚 How it works') {
        return mockHowItWorksSection;
      }
      return section;
    });
    UIComponents.createButton.mockImplementation((text, onClick) => {
      const button = document.createElement('button');
      button.textContent = text;
      if (onClick) {
        button.addEventListener('click', onClick);
      }
      return button;
    });
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('showSetupInterface', () => {
    it('should create container with correct title and description', () => {
      showSetupInterface(mockAppContainer, mockOnOpenSettings);

      expect(UIComponents.createContainer).toHaveBeenCalledWith(
        'Welcome to ForgetfulMe!',
        'This extension helps you mark websites as read for research purposes.',
        'setup-container'
      );
    });

    it('should create setup section with correct title', () => {
      showSetupInterface(mockAppContainer, mockOnOpenSettings);

      expect(UIComponents.createSection).toHaveBeenCalledWith(
        '🔧 Setup Required',
        'setup-section'
      );
    });

    it('should create how it works section with correct title', () => {
      showSetupInterface(mockAppContainer, mockOnOpenSettings);

      expect(UIComponents.createSection).toHaveBeenCalledWith(
        '📚 How it works',
        'setup-section'
      );
    });

    it('should create settings button with correct text and callback', () => {
      showSetupInterface(mockAppContainer, mockOnOpenSettings);

      expect(UIComponents.createButton).toHaveBeenCalledWith(
        'Open Settings',
        mockOnOpenSettings,
        'primary'
      );
    });

    it('should append settings button to setup section', () => {
      showSetupInterface(mockAppContainer, mockOnOpenSettings);

      // Get the actual button that was created
      const createdButton =
        UIComponents.createButton.mock.results[
          UIComponents.createButton.mock.results.length - 1
        ].value;

      expect(mockSetupSection.appendChild).toHaveBeenCalledWith(createdButton);
    });

    it('should append setup section to container', () => {
      showSetupInterface(mockAppContainer, mockOnOpenSettings);

      expect(mockContainer.appendChild).toHaveBeenCalledWith(mockSetupSection);
    });

    it('should append how it works section to container', () => {
      showSetupInterface(mockAppContainer, mockOnOpenSettings);

      expect(mockContainer.appendChild).toHaveBeenCalledWith(
        mockHowItWorksSection
      );
    });

    it('should clear appContainer innerHTML', () => {
      mockAppContainer.innerHTML = '<div>Existing content</div>';

      showSetupInterface(mockAppContainer, mockOnOpenSettings);

      expect(mockAppContainer.innerHTML).toBe('');
    });

    it('should append container to appContainer', () => {
      showSetupInterface(mockAppContainer, mockOnOpenSettings);

      expect(mockAppContainer.appendChild).toHaveBeenCalledWith(mockContainer);
    });

    it('should set setup section innerHTML with instructions', () => {
      showSetupInterface(mockAppContainer, mockOnOpenSettings);

      expect(mockSetupSection.innerHTML).toContain('To use this extension');
      expect(mockSetupSection.innerHTML).toContain('Supabase backend');
      expect(mockSetupSection.innerHTML).toContain('supabase.com');
      expect(mockSetupSection.innerHTML).toContain('Project URL');
      expect(mockSetupSection.innerHTML).toContain('anon public key');
      expect(mockSetupSection.innerHTML).toContain('extension settings');
    });

    it('should set how it works section innerHTML with instructions', () => {
      showSetupInterface(mockAppContainer, mockOnOpenSettings);

      expect(mockHowItWorksSection.innerHTML).toContain('extension icon');
      expect(mockHowItWorksSection.innerHTML).toContain(
        'mark the current page'
      );
      expect(mockHowItWorksSection.innerHTML).toContain('status');
      expect(mockHowItWorksSection.innerHTML).toContain('tags');
      expect(mockHowItWorksSection.innerHTML).toContain('recent entries');
    });

    it('should include ordered list in setup section', () => {
      showSetupInterface(mockAppContainer, mockOnOpenSettings);

      expect(mockSetupSection.innerHTML).toContain('<ol>');
      expect(mockSetupSection.innerHTML).toContain('</ol>');
      expect(mockSetupSection.innerHTML).toContain('<li>');
    });

    it('should include unordered list in how it works section', () => {
      showSetupInterface(mockAppContainer, mockOnOpenSettings);

      expect(mockHowItWorksSection.innerHTML).toContain('<ul>');
      expect(mockHowItWorksSection.innerHTML).toContain('</ul>');
      expect(mockHowItWorksSection.innerHTML).toContain('<li>');
    });

    it('should include link to supabase.com in setup section', () => {
      showSetupInterface(mockAppContainer, mockOnOpenSettings);

      expect(mockSetupSection.innerHTML).toContain(
        'href="https://supabase.com"'
      );
      expect(mockSetupSection.innerHTML).toContain('target="_blank"');
    });

    it('should call onOpenSettings when settings button is clicked', () => {
      showSetupInterface(mockAppContainer, mockOnOpenSettings);

      // Get the actual button that was created
      const createdButton =
        UIComponents.createButton.mock.results[
          UIComponents.createButton.mock.results.length - 1
        ].value;

      // Simulate button click
      createdButton.click();

      expect(mockOnOpenSettings).toHaveBeenCalled();
    });

    it('should handle multiple calls by clearing previous content', () => {
      showSetupInterface(mockAppContainer, mockOnOpenSettings);

      showSetupInterface(mockAppContainer, mockOnOpenSettings);

      expect(mockAppContainer.innerHTML).toBe('');
      expect(UIComponents.createContainer).toHaveBeenCalledTimes(2);
    });

    it('should work with different callback functions', () => {
      const customCallback = vi.fn();

      showSetupInterface(mockAppContainer, customCallback);

      expect(UIComponents.createButton).toHaveBeenCalledWith(
        'Open Settings',
        customCallback,
        'primary'
      );

      // Get the actual button that was created
      const createdButton =
        UIComponents.createButton.mock.results[
          UIComponents.createButton.mock.results.length - 1
        ].value;

      createdButton.click();
      expect(customCallback).toHaveBeenCalled();
    });
  });
});
