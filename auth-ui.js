/**
 * @fileoverview Authentication UI component for ForgetfulMe extension
 * @module auth-ui
 * @description Handles authentication user interface including login, signup, and user profile
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import UIComponents from './utils/ui-components.js';
import ErrorHandler from './utils/error-handler.js';
import UIMessages from './utils/ui-messages.js';

/**
 * Authentication UI component for ForgetfulMe extension
 * @class AuthUI
 * @description Handles authentication user interface including login, signup, and user profile
 *
 * @example
 * const authUI = new AuthUI(supabaseConfig, onAuthSuccess, authStateManager);
 * authUI.showLoginForm(container);
 * authUI.showSignupForm(container);
 */
class AuthUI {
  /**
   * Initialize the authentication UI component
   * @constructor
   * @param {Object} supabaseConfig - Supabase configuration instance
   * @param {Function} onAuthSuccess - Callback function called on successful authentication
   * @param {AuthStateManager} [authStateManager=null] - Authentication state manager
   */
  constructor(supabaseConfig, onAuthSuccess, authStateManager = null) {
    /** @type {Object} Supabase configuration instance */
    this.config = supabaseConfig;
    /** @type {Function} Callback function called on successful authentication */
    this.onAuthSuccess = onAuthSuccess;
    /** @type {AuthStateManager|null} Authentication state manager */
    this.authStateManager = authStateManager;
    /** @type {string} Current view state ('login' or 'signup') */
    this.currentView = 'login'; // 'login' or 'signup'
  }

  /**
   * Resolve the dedicated message container within a page container
   * @param {HTMLElement} container - Page container element
   * @returns {HTMLElement} Message container element
   * @private
   */
  _getMessageContainer(container) {
    return (
      UIComponents.DOM.querySelector('#authMessage', container) || container
    );
  }

  /**
   * Read an input value from a form field within a container
   * @param {string} selector - CSS selector for the input
   * @param {HTMLElement} container - Page container element
   * @returns {string}
   * @private
   */
  _getInputValue(selector, container) {
    const input = UIComponents.DOM.querySelector(selector, container);
    return input?.value?.trim() ?? '';
  }

  /**
   * Display login form in the specified container
   * @param {HTMLElement} container - Container element to render the form
   */
  showLoginForm(container) {
    // Create container with header
    const containerEl = UIComponents.createContainer(
      'Sign in to ForgetfulMe',
      'Access your bookmarks across all devices',
      'auth-container',
    );

    // Create login form
    const loginForm = UIComponents.createForm(
      'loginForm',
      (_e, _form) => this.handleLogin(container),
      [
        {
          type: 'email',
          id: 'loginEmail',
          label: 'Email',
          options: {
            placeholder: 'Enter your email',
            required: true,
          },
        },
        {
          type: 'password',
          id: 'loginPassword',
          label: 'Password',
          options: {
            placeholder: 'Enter your password',
            required: true,
          },
        },
      ],
      {
        submitText: 'Sign In',
        className: 'auth-form',
      },
    );

    containerEl.appendChild(loginForm);

    // Create footer
    const footer = document.createElement('div');
    footer.className = 'auth-footer';
    footer.innerHTML =
      '<p>Don\'t have an account? <a href="#" id="showSignup">Sign up</a></p>';
    containerEl.appendChild(footer);

    // Create message container
    const messageContainer = document.createElement('div');
    messageContainer.id = 'authMessage';
    messageContainer.className = 'auth-message';
    containerEl.appendChild(messageContainer);

    container.innerHTML = '';
    container.appendChild(containerEl);
    this.bindAuthEvents(container);
  }

  /**
   * Display signup form in the specified container
   * @param {HTMLElement} container - Container element to render the form
   */
  showSignupForm(container) {
    // Create container with header
    const containerEl = UIComponents.createContainer(
      'Create Account',
      'Start organizing your bookmarks with ForgetfulMe',
      'auth-container',
    );

    // Create signup form
    const signupForm = UIComponents.createForm(
      'signupForm',
      (_e, _form) => this.handleSignup(container),
      [
        {
          type: 'email',
          id: 'signupEmail',
          label: 'Email',
          options: {
            placeholder: 'Enter your email',
            required: true,
          },
        },
        {
          type: 'password',
          id: 'signupPassword',
          label: 'Password',
          options: {
            placeholder: 'Create a password',
            required: true,
            helpText: 'Password must be at least 6 characters',
          },
        },
        {
          type: 'password',
          id: 'confirmPassword',
          label: 'Confirm Password',
          options: {
            placeholder: 'Confirm your password',
            required: true,
          },
        },
      ],
      {
        submitText: 'Create Account',
        className: 'auth-form',
      },
    );

    containerEl.appendChild(signupForm);

    // Create footer
    const footer = document.createElement('div');
    footer.className = 'auth-footer';
    footer.innerHTML =
      '<p>Already have an account? <a href="#" id="showLogin">Sign in</a></p>';
    containerEl.appendChild(footer);

    // Create message container
    const messageContainer = document.createElement('div');
    messageContainer.id = 'authMessage';
    messageContainer.className = 'auth-message';
    containerEl.appendChild(messageContainer);

    container.innerHTML = '';
    container.appendChild(containerEl);
    this.bindAuthEvents(container);
  }

  /**
   * Bind authentication event listeners
   * @param {HTMLElement} container - Container element with auth forms
   */
  bindAuthEvents(container) {
    const showSignupLink = UIComponents.DOM.querySelector(
      '#showSignup',
      container,
    );
    const showLoginLink = UIComponents.DOM.querySelector(
      '#showLogin',
      container,
    );

    if (showSignupLink) {
      showSignupLink.addEventListener('click', e => {
        e.preventDefault();
        this.showSignupForm(container);
      });
    }

    if (showLoginLink) {
      showLoginLink.addEventListener('click', e => {
        e.preventDefault();
        this.showLoginForm(container);
      });
    }
  }

  /**
   * Handle user login attempt
   * @param {HTMLElement} container - Container element for displaying messages
   */
  async handleLogin(container) {
    const messageContainer = this._getMessageContainer(container);
    const email = this._getInputValue('#loginEmail', container);
    const password = this._getInputValue('#loginPassword', container);

    if (!email || !password) {
      UIMessages.error('Please fill in all fields', messageContainer);
      return;
    }

    try {
      UIMessages.loading('Signing in...', messageContainer);

      await this.config.signIn(email, password);

      UIMessages.success('Successfully signed in!', messageContainer);

      // Call the success callback
      if (this.onAuthSuccess) {
        setTimeout(() => {
          this.onAuthSuccess();
        }, 1000);
      }
    } catch (error) {
      const errorResult = ErrorHandler.handle(error, 'auth-ui.handleLogin');
      UIMessages.error(errorResult.userMessage, messageContainer);
    }
  }

  /**
   * Handle user signup attempt
   * @param {HTMLElement} container - Container element for displaying messages
   */
  async handleSignup(container) {
    const messageContainer = this._getMessageContainer(container);
    const email = this._getInputValue('#signupEmail', container);
    const password = this._getInputValue('#signupPassword', container);
    const confirmPassword = this._getInputValue('#confirmPassword', container);

    if (!email || !password || !confirmPassword) {
      UIMessages.error('Please fill in all fields', messageContainer);
      return;
    }

    if (password !== confirmPassword) {
      UIMessages.error('Passwords do not match', messageContainer);
      return;
    }

    if (password.length < 6) {
      UIMessages.error(
        'Password must be at least 6 characters',
        messageContainer,
      );
      return;
    }

    try {
      UIMessages.loading('Creating account...', messageContainer);

      const result = await this.config.signUp(email, password);

      // Check if user was created successfully (signUp returns Supabase data)
      if (result?.user) {
        // For browser extensions, we'll try to sign in immediately
        // since email verification links don't work well with extensions
        try {
          await this.config.signIn(email, password);
          UIMessages.success(
            'Account created and signed in successfully!',
            messageContainer,
          );

          // Call the success callback
          if (this.onAuthSuccess) {
            setTimeout(() => {
              this.onAuthSuccess();
            }, 1000);
          }
        } catch {
          // If auto-signin fails, show the email verification message
          UIMessages.success(
            'Account created! Please check your email to verify your account, then sign in.',
            messageContainer,
          );

          // Switch to login form after successful signup
          setTimeout(() => {
            this.showLoginForm(container);
          }, 3000);
        }
      } else {
        UIMessages.success(
          'Account created! Please check your email to verify your account.',
          messageContainer,
        );

        // Switch to login form after successful signup
        setTimeout(() => {
          this.showLoginForm(container);
        }, 3000);
      }
    } catch (error) {
      const errorResult = ErrorHandler.handle(error, 'auth-ui.handleSignup');
      UIMessages.error(errorResult.userMessage, messageContainer);
    }
  }

  /**
   * Handle user sign out
   */
  async handleSignOut() {
    try {
      // Sign out from Supabase
      await this.config.signOut();

      // Clear auth state if auth state manager is available
      if (this.authStateManager) {
        await this.authStateManager.clearAuthState();
      }

      // Successfully signed out

      // Refresh the page or show login form
      location.reload();
    } catch (error) {
      ErrorHandler.handle(error, 'auth-ui.handleSignOut', {
        silent: true,
      });
      // Error during sign out
      // Don't show user for sign out errors as they're not critical
    }
  }

  /**
   * Display authentication message to user
   * @param {HTMLElement} container - Container element for displaying messages
   * @param {string} message - Message to display
   * @param {string} type - Message type (success, error, loading)
   */
  showAuthMessage(container, message, type) {
    // Use the centralized UIMessages system
    UIMessages.show(message, type, container);
  }

  /**
   * Display user profile information
   * @param {HTMLElement} container - Container element to render the profile
   * @param {Object} user - User object with profile information
   */
  showUserProfile(container, user) {
    const profileHTML = `
      <div class="user-profile">
        <div class="profile-header">
          <h3>Welcome back!</h3>
          <p>Signed in as ${user.email}</p>
        </div>
        
        <div class="profile-actions">
          <button id="signOutBtn" class="auth-btn secondary">Sign Out</button>
        </div>
      </div>
    `;

    container.innerHTML = profileHTML;

    const signOutBtn = container.querySelector('#signOutBtn');
    if (signOutBtn) {
      signOutBtn.addEventListener('click', async () => {
        await this.handleSignOut();
      });
    }
  }
}

// Export for use in other files
export default AuthUI;
