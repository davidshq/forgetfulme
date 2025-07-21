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
   * @description Sets up the authentication UI with configuration and callbacks
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

  showLoginForm(container) {
    // Create container with header
    const containerEl = UIComponents.createContainer(
      'Sign in to ForgetfulMe',
      'Access your bookmarks across all devices',
      'auth-container'
    );

    // Create login form
    const loginForm = UIComponents.createForm(
      'loginForm',
      (e, form) => this.handleLogin(document),
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
      }
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

  showSignupForm(container) {
    // Create container with header
    const containerEl = UIComponents.createContainer(
      'Create Account',
      'Start organizing your bookmarks with ForgetfulMe',
      'auth-container'
    );

    // Create signup form
    const signupForm = UIComponents.createForm(
      'signupForm',
      (e, form) => this.handleSignup(document),
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
      }
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

  bindAuthEvents(container) {
    const showSignupLink = UIComponents.DOM.querySelector(
      '#showSignup',
      container
    );
    const showLoginLink = UIComponents.DOM.querySelector(
      '#showLogin',
      container
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

  async handleLogin(container) {
    const messageContainer = UIComponents.DOM.querySelector('#authMessage', container);
    const email = UIComponents.DOM.getValue('loginEmail', container);
    const password = UIComponents.DOM.getValue('loginPassword', container);

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

  async handleSignup(container) {
    const messageContainer = UIComponents.DOM.querySelector('#authMessage', container);
    const email = UIComponents.DOM.getValue('signupEmail', container);
    const password = UIComponents.DOM.getValue('signupPassword', container);
    const confirmPassword = UIComponents.DOM.getValue(
      'confirmPassword',
      container
    );

    if (!email || !password || !confirmPassword) {
      UIMessages.error('Please fill in all fields', messageContainer);
      return;
    }

    if (password !== confirmPassword) {
      UIMessages.error('Passwords do not match', messageContainer);
      return;
    }

    if (password.length < 6) {
      UIMessages.error('Password must be at least 6 characters', messageContainer);
      return;
    }

    try {
      UIMessages.loading('Creating account...', messageContainer);

      const result = await this.config.signUp(email, password);

      // Check if user was created successfully
      if (result.data && result.data.user) {
        // For browser extensions, we'll try to sign in immediately
        // since email verification links don't work well with extensions
        try {
          await this.config.signIn(email, password);
          UIMessages.success(
            'Account created and signed in successfully!',
            messageContainer
          );

          // Call the success callback
          if (this.onAuthSuccess) {
            setTimeout(() => {
              this.onAuthSuccess();
            }, 1000);
          }
        } catch (signInError) {
          // If auto-signin fails, show the email verification message
          UIMessages.success(
            'Account created! Please check your email to verify your account, then sign in.',
            messageContainer
          );

          // Switch to login form after successful signup
          setTimeout(() => {
            this.showLoginForm(container);
          }, 3000);
        }
      } else {
        UIMessages.success(
          'Account created! Please check your email to verify your account.',
          messageContainer
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

  async handleSignOut() {
    try {
      // Sign out from Supabase
      await this.config.signOut();

      // Clear auth state if auth state manager is available
      if (this.authStateManager) {
        await this.authStateManager.clearAuthState();
      }

      console.log('Successfully signed out');

      // Refresh the page or show login form
      location.reload();
    } catch (error) {
      const errorResult = ErrorHandler.handle(error, 'auth-ui.handleSignOut', {
        silent: true,
      });
      console.error('Error during sign out:', errorResult);
      // Don't show user for sign out errors as they're not critical
    }
  }

  showAuthMessage(container, message, type) {
    // Use the centralized UIMessages system
    const messageContainer = UIComponents.DOM.querySelector('#authMessage', container);
    UIMessages.show(message, type, messageContainer);
  }

  getErrorMessage(error) {
    if (error.message.includes('Invalid login credentials')) {
      return 'Invalid email or password';
    } else if (error.message.includes('User already registered')) {
      return 'An account with this email already exists';
    } else if (error.message.includes('Password should be at least')) {
      return 'Password must be at least 6 characters';
    } else if (error.message.includes('Unable to validate email address')) {
      return 'Please enter a valid email address';
    } else if (error.message.includes('Email not confirmed')) {
      return 'Please check your email and click the verification link before signing in';
    } else if (error.message.includes('Invalid token')) {
      return 'Email verification failed. Please try signing up again or contact support';
    } else {
      return error.message || 'An error occurred. Please try again.';
    }
  }

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
