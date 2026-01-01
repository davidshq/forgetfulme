/**
 * @fileoverview Setup interface utility
 * @module utils/setup-interface
 * @description Provides common setup interface UI for app pages
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import UIComponents from './ui-components.js';

/**
 * Show setup interface when Supabase is not configured
 * @param {HTMLElement} appContainer - Container element to render the interface
 * @param {Function} onOpenSettings - Callback function to open settings
 *
 * @example
 * showSetupInterface(this.appContainer, () => this.openSettings());
 */
export function showSetupInterface(appContainer, onOpenSettings) {
  // Create main container
  const container = UIComponents.createContainer(
    'Welcome to ForgetfulMe!',
    'This extension helps you mark websites as read for research purposes.',
    'setup-container',
  );

  // Create setup section
  const setupSection = UIComponents.createSection('🔧 Setup Required', 'setup-section');
  setupSection.innerHTML = `
    <p>To use this extension, you need to configure your Supabase backend:</p>
    
    <ol>
      <li>Create a Supabase project at <a href="https://supabase.com" target="_blank">supabase.com</a></li>
      <li>Get your Project URL and anon public key</li>
      <li>Open the extension settings to configure</li>
    </ol>
  `;

  const settingsBtn = UIComponents.createButton('Open Settings', onOpenSettings, 'primary');
  setupSection.appendChild(settingsBtn);
  container.appendChild(setupSection);

  // Create how it works section
  const howItWorksSection = UIComponents.createSection('📚 How it works', 'setup-section');
  howItWorksSection.innerHTML = `
    <ul>
      <li>Click the extension icon to mark the current page</li>
      <li>Choose a status (Read, Good Reference, etc.)</li>
      <li>Add tags to organize your entries</li>
      <li>View your recent entries in the popup</li>
    </ul>
  `;
  container.appendChild(howItWorksSection);

  appContainer.innerHTML = '';
  appContainer.appendChild(container);
}
