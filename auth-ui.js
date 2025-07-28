/**
 * @fileoverview Authentication UI component for ForgetfulMe extension
 * @module auth-ui
 * @description Handles authentication user interface including login, signup, and user profile
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

import ErrorHandler from './utils/error-handler.js';

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
   * Display login form in the specified container
   * @param {HTMLElement} container - Container element to render the form
   */
  showLoginForm(container) {
    // Show login container, hide others
    const loginContainer = container.querySelector('#login-container');
    const signupContainer = container.querySelector('#signup-container');
    const profileContainer = container.querySelector('#profile-container');

    if (loginContainer) loginContainer.hidden = false;
    if (signupContainer) signupContainer.hidden = true;
    if (profileContainer) profileContainer.hidden = true;

    // Clear any existing messages
    const messageContainer = container.querySelector('#authMessage');
    if (messageContainer) messageContainer.innerHTML = '';

    // Bind form submission
    const loginForm = container.querySelector('#loginForm');
    if (loginForm) {
      loginForm.onsubmit = e => {
        e.preventDefault();
        this.handleLogin(container);
      };
    }

    this.bindAuthEvents(container);
  }

  /**
   * Display signup form in the specified container
   * @param {HTMLElement} container - Container element to render the form
   */
  showSignupForm(container) {
    // Show signup container, hide others
    const loginContainer = container.querySelector('#login-container');
    const signupContainer = container.querySelector('#signup-container');
    const profileContainer = container.querySelector('#profile-container');

    if (loginContainer) loginContainer.hidden = true;
    if (signupContainer) signupContainer.hidden = false;
    if (profileContainer) profileContainer.hidden = true;

    // Clear any existing messages
    const messageContainer = container.querySelector('#authMessageSignup');
    if (messageContainer) messageContainer.innerHTML = '';

    // Bind form submission
    const signupForm = container.querySelector('#signupForm');
    if (signupForm) {
      signupForm.onsubmit = e => {
        e.preventDefault();
        this.handleSignup(container);
      };
    }

    this.bindAuthEvents(container);
  }

  /**
   * Bind authentication event listeners
   * @param {HTMLElement} container - Container element with auth forms
   */
  bindAuthEvents(container) {
    const showSignupLink = container.querySelector('#showSignup');
    const showLoginLink = container.querySelector('#showLogin');

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
    const emailInput = container.querySelector('#loginEmail');
    const passwordInput = container.querySelector('#loginPassword');
    const email = emailInput ? emailInput.value.trim() : '';
    const password = passwordInput ? passwordInput.value : '';

    if (!email || !password) {
      this.showAuthMessage(container, 'Please fill in all fields', 'error');
      return;
    }

    try {
      this.showAuthMessage(container, 'Signing in...', 'loading');

      await this.config.signIn(email, password);

      this.showAuthMessage(container, 'Successfully signed in!', 'success');

      // Call the success callback
      if (this.onAuthSuccess) {
        setTimeout(() => {
          this.onAuthSuccess();
        }, 1000);
      }
    } catch (error) {
      const errorResult = ErrorHandler.handle(error, 'auth-ui.handleLogin');
      this.showAuthMessage(container, errorResult.userMessage, 'error');
    }
  }

  /**
   * Handle user signup attempt
   * @param {HTMLElement} container - Container element for displaying messages
   */
  async handleSignup(container) {
    const emailInput = container.querySelector('#signupEmail');
    const passwordInput = container.querySelector('#signupPassword');
    const confirmPasswordInput = container.querySelector('#confirmPassword');
    const email = emailInput ? emailInput.value.trim() : '';
    const password = passwordInput ? passwordInput.value : '';
    const confirmPassword = confirmPasswordInput
      ? confirmPasswordInput.value
      : '';

    if (!email || !password || !confirmPassword) {
      this.showAuthMessage(
        container,
        'Please fill in all fields',
        'error',
        'signup'
      );
      return;
    }

    if (password !== confirmPassword) {
      this.showAuthMessage(
        container,
        'Passwords do not match',
        'error',
        'signup'
      );
      return;
    }

    if (password.length < 6) {
      this.showAuthMessage(
        container,
        'Password must be at least 6 characters',
        'error',
        'signup'
      );
      return;
    }

    try {
      this.showAuthMessage(
        container,
        'Creating account...',
        'loading',
        'signup'
      );

      const result = await this.config.signUp(email, password);

      // Check if user was created successfully
      if (result.data && result.data.user) {
        // For browser extensions, we'll try to sign in immediately
        // since email verification links don't work well with extensions
        try {
          await this.config.signIn(email, password);
          this.showAuthMessage(
            container,
            'Account created and signed in successfully!',
            'success',
            'signup'
          );

          // Call the success callback
          if (this.onAuthSuccess) {
            setTimeout(() => {
              this.onAuthSuccess();
            }, 1000);
          }
        } catch {
          // If auto-signin fails, show the email verification message
          this.showAuthMessage(
            container,
            'Account created! Please check your email to verify your account, then sign in.',
            'success',
            'signup'
          );

          // Switch to login form after successful signup
          setTimeout(() => {
            this.showLoginForm(container);
          }, 3000);
        }
      } else {
        this.showAuthMessage(
          container,
          'Account created! Please check your email to verify your account.',
          'success',
          'signup'
        );

        // Switch to login form after successful signup
        setTimeout(() => {
          this.showLoginForm(container);
        }, 3000);
      }
    } catch (error) {
      const { userMessage } = ErrorHandler.handle(
        error,
        'auth-ui.handleSignup'
      );
      this.showAuthMessage(container, userMessage, 'error', 'signup');
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
      if (typeof this.onSignOutComplete === 'function') {
        this.onSignOutComplete();
      } else {
        location.reload();
      }
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
   * @param {string} [form='login'] - Which form's message container to use ('login' or 'signup')
   */
  showAuthMessage(container, message, type, form = 'login') {
    const messageId = form === 'signup' ? '#authMessageSignup' : '#authMessage';
    const messageContainer = container.querySelector(messageId);

    if (messageContainer) {
      messageContainer.className = `auth-message ${type}`;
      messageContainer.innerHTML = message;
      messageContainer.setAttribute('aria-live', 'polite');
    }
  }

  /**
   * Convert error object to user-friendly message
   * @param {Error} error - Error object
   * @returns {string} User-friendly error message
   */
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

  /**
   * Display user profile information
   * @param {HTMLElement} container - Container element to render the profile
   * @param {Object} user - User object with profile information
   */
  showUserProfile(container, user) {
    // Show profile container, hide others
    const loginContainer = container.querySelector('#login-container');
    const signupContainer = container.querySelector('#signup-container');
    const profileContainer = container.querySelector('#profile-container');

    if (loginContainer) loginContainer.hidden = true;
    if (signupContainer) signupContainer.hidden = true;
    if (profileContainer) profileContainer.hidden = false;

    // Update user email in profile
    const userEmailElement = container.querySelector('#user-email');
    if (userEmailElement && user && user.email) {
      userEmailElement.textContent = `Signed in as ${user.email}`;
    }

    // Bind sign out button
    const signOutBtn = container.querySelector('#signOutBtn');
    if (signOutBtn) {
      signOutBtn.onclick = async () => {
        await this.handleSignOut();
      };
    }
  }
}

// Export for use in other files
export default AuthUI;
