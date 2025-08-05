/**
 * @fileoverview Reusable authentication modal component
 */

import { $, show, hide } from '../../utils/dom.js';

/**
 * Authentication modal component for sign in/sign up functionality
 */
export class AuthModalComponent {
  /**
   * @param {AuthService} authService - Authentication service
   * @param {ConfigService} configService - Configuration service
   * @param {ErrorService} errorService - Error handling service
   * @param {ValidationService} validationService - Validation service
   */
  constructor(authService, configService, errorService, validationService) {
    this.authService = authService;
    this.configService = configService;
    this.errorService = errorService;
    this.validationService = validationService;

    this.modal = null;
    this.isInitialized = false;
    this.onAuthSuccess = null;

    // Store bound event handlers for cleanup
    this.boundHandlers = {
      hide: () => this.hide(),
      switchToSignin: () => this.switchTab('signin'),
      switchToSignup: () => this.switchTab('signup'),
      handleSignIn: e => this.handleSignIn(e),
      handleSignUp: e => this.handleSignUp(e),
      handleForgotPassword: () => this.handleForgotPassword(),
      openOptions: () => {
        chrome.runtime.openOptionsPage();
        this.hide();
      },
      handleEscape: e => {
        if (e.key === 'Escape') {
          e.preventDefault();
          this.hide();
        }
      }
    };
  }

  /**
   * Initialize the auth modal component
   * @param {Function} onAuthSuccess - Callback function to execute after successful authentication
   * @returns {Promise<void>}
   */
  async initialize(onAuthSuccess = null) {
    if (this.isInitialized) return;

    try {
      this.onAuthSuccess = onAuthSuccess;
      this.modal = $('#auth-modal');

      if (!this.modal) {
        console.error('Auth modal element not found');
        return;
      }

      this.setupEventListeners();
      this.isInitialized = true;
    } catch (error) {
      console.error('Error during AuthModalComponent initialization:', error);
      // Clean up partial state on error
      this.modal = null;
      this.onAuthSuccess = null;
      this.elements = null;
      this.isInitialized = false;
      throw error; // Re-throw to let caller handle
    }
  }

  /**
   * Show the authentication modal
   * @param {string} defaultTab - Default tab to show ('signin' or 'signup')
   * @returns {Promise<void>}
   */
  async show(defaultTab = 'signin') {
    if (!this.modal) return;

    try {
      // Check if configuration exists
      const hasConfig = await this.configService.isSupabaseConfigured();

      if (!hasConfig) {
        this.showConfigRequired();
      } else {
        this.showAuthForms();
        this.switchTab(defaultTab);
      }

      this.modal.showModal();
    } catch (error) {
      console.error('Error showing auth modal:', error);
      // Fallback to showing config required if config check fails
      this.showConfigRequired();

      try {
        this.modal.showModal();
      } catch (showModalError) {
        console.error('Failed to show modal even in error recovery:', showModalError);
        // At this point we can't show the modal, so we silently fail
        // The calling code should handle this via fallback mechanisms
      }
    }
  }

  /**
   * Hide the authentication modal
   */
  hide() {
    if (!this.modal) return;
    this.modal.close();
    this.clearForms();
  }

  /**
   * Setup event listeners for the modal
   */
  setupEventListeners() {
    // Prevent double setup
    if (this.elements) {
      console.warn('Event listeners already set up');
      return;
    }

    // Store references to elements for cleanup
    this.elements = {
      closeBtn: $('#close-auth-modal'),
      signinTab: $('#signin-tab'),
      signupTab: $('#signup-tab'),
      signinForm: $('#signin-form'),
      signupForm: $('#signup-form'),
      forgotBtn: $('#forgot-password'),
      openOptionsBtn: $('#open-options-from-modal')
    };

    // Close button
    if (this.elements.closeBtn) {
      this.elements.closeBtn.addEventListener('click', this.boundHandlers.hide);
    }

    // Tab switching
    if (this.elements.signinTab) {
      this.elements.signinTab.addEventListener('click', this.boundHandlers.switchToSignin);
    }

    if (this.elements.signupTab) {
      this.elements.signupTab.addEventListener('click', this.boundHandlers.switchToSignup);
    }

    // Form submissions
    if (this.elements.signinForm) {
      this.elements.signinForm.addEventListener('submit', this.boundHandlers.handleSignIn);
    }

    if (this.elements.signupForm) {
      this.elements.signupForm.addEventListener('submit', this.boundHandlers.handleSignUp);
    }

    // Forgot password
    if (this.elements.forgotBtn) {
      this.elements.forgotBtn.addEventListener('click', this.boundHandlers.handleForgotPassword);
    }

    // Open options from config required
    if (this.elements.openOptionsBtn) {
      this.elements.openOptionsBtn.addEventListener('click', this.boundHandlers.openOptions);
    }

    // Close on ESC key
    if (this.modal) {
      this.modal.addEventListener('keydown', this.boundHandlers.handleEscape);
    }
  }

  /**
   * Switch between sign in and sign up tabs
   * @param {string} tab - Tab to switch to ('signin' or 'signup')
   */
  switchTab(tab) {
    const signinTab = $('#signin-tab');
    const signupTab = $('#signup-tab');
    const signinForm = $('#signin-form');
    const signupForm = $('#signup-form');

    if (tab === 'signin') {
      signinTab?.classList.remove('secondary');
      signupTab?.classList.add('secondary');
      show(signinForm);
      hide(signupForm);
    } else {
      signupTab?.classList.remove('secondary');
      signinTab?.classList.add('secondary');
      hide(signinForm);
      show(signupForm);
    }

    this.clearErrors();
  }

  /**
   * Show configuration required message
   */
  showConfigRequired() {
    hide($('#auth-tabs'));
    hide($('#signin-form'));
    hide($('#signup-form'));
    show($('#config-required'));
  }

  /**
   * Show authentication forms
   */
  showAuthForms() {
    show($('#auth-tabs'));
    hide($('#config-required'));
  }

  /**
   * Handle sign in form submission
   * @param {Event} event - Form submit event
   */
  async handleSignIn(event) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);
    const email = formData.get('email');
    const password = formData.get('password');

    this.clearErrors();

    // Validate inputs
    const validationErrors = {};

    if (!this.validationService.validateEmail(email)) {
      validationErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      validationErrors.password = 'Password is required';
    }

    if (Object.keys(validationErrors).length > 0) {
      this.showValidationErrors('signin', validationErrors);
      return;
    }

    try {
      // Show loading state
      const submitBtn = $('#signin-submit');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Signing in...';

      await this.authService.signIn(email, password);

      // Success - hide modal and call callback
      this.hide();
      if (this.onAuthSuccess) {
        await this.onAuthSuccess();
      }
    } catch (error) {
      console.error('Sign in error:', error);
      this.showFormError('signin', error.message || 'Failed to sign in. Please try again.');
    } finally {
      const submitBtn = $('#signin-submit');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Sign In';
    }
  }

  /**
   * Handle sign up form submission
   * @param {Event} event - Form submit event
   */
  async handleSignUp(event) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);
    const email = formData.get('email');
    const password = formData.get('password');
    const confirm = formData.get('confirm');

    this.clearErrors();

    // Validate inputs
    const validationErrors = {};

    if (!this.validationService.validateEmail(email)) {
      validationErrors.email = 'Please enter a valid email address';
    }

    if (!this.validationService.validatePassword(password)) {
      validationErrors.password = 'Password must be at least 8 characters long';
    }

    if (password !== confirm) {
      validationErrors.confirm = 'Passwords do not match';
    }

    if (Object.keys(validationErrors).length > 0) {
      this.showValidationErrors('signup', validationErrors);
      return;
    }

    try {
      // Show loading state
      const submitBtn = $('#signup-submit');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Creating account...';

      await this.authService.signUp(email, password);

      // Show success message
      this.showFormSuccess(
        'signup',
        'Account created! Please check your email to confirm your account.'
      );

      // Switch to sign in tab after delay
      setTimeout(() => {
        this.switchTab('signin');
        this.showFormInfo('signin', 'Please sign in with your new account');
      }, 3000);
    } catch (error) {
      console.error('Sign up error:', error);
      this.showFormError('signup', error.message || 'Failed to create account. Please try again.');
    } finally {
      const submitBtn = $('#signup-submit');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Create Account';
    }
  }

  /**
   * Handle forgot password
   */
  async handleForgotPassword() {
    const emailInput = $('#signin-email');
    const email = emailInput?.value;

    if (!email || !this.validationService.validateEmail(email)) {
      this.showFormError('signin', 'Please enter a valid email address first');
      return;
    }

    try {
      const forgotBtn = $('#forgot-password');
      forgotBtn.disabled = true;
      forgotBtn.textContent = 'Sending...';

      await this.authService.resetPassword(email);

      this.showFormSuccess('signin', 'Password reset email sent! Please check your inbox.');
    } catch (error) {
      console.error('Password reset error:', error);
      this.showFormError(
        'signin',
        error.message || 'Failed to send reset email. Please try again.'
      );
    } finally {
      const forgotBtn = $('#forgot-password');
      forgotBtn.disabled = false;
      forgotBtn.textContent = 'Forgot Password?';
    }
  }

  /**
   * Show validation errors for specific fields
   * @param {string} formType - 'signin' or 'signup'
   * @param {Object} errors - Field-specific error messages
   */
  showValidationErrors(formType, errors) {
    for (const [field, message] of Object.entries(errors)) {
      const errorEl = $(`#${formType}-${field}-error`);
      if (errorEl) {
        errorEl.textContent = message;
        show(errorEl);
      }
    }
  }

  /**
   * Show form-wide error message
   * @param {string} formType - 'signin' or 'signup'
   * @param {string} message - Error message
   */
  showFormError(formType, message) {
    const errorEl = $(`#${formType}-form-errors`);
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.className = 'form-errors error';
      show(errorEl);
    }
  }

  /**
   * Show form-wide success message
   * @param {string} formType - 'signin' or 'signup'
   * @param {string} message - Success message
   */
  showFormSuccess(formType, message) {
    const errorEl = $(`#${formType}-form-errors`);
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.className = 'form-errors success';
      show(errorEl);
    }
  }

  /**
   * Show form-wide info message
   * @param {string} formType - 'signin' or 'signup'
   * @param {string} message - Info message
   */
  showFormInfo(formType, message) {
    const errorEl = $(`#${formType}-form-errors`);
    if (errorEl) {
      errorEl.textContent = message;
      errorEl.className = 'form-errors info';
      show(errorEl);
    }
  }

  /**
   * Clear all error messages
   */
  clearErrors() {
    // Clear form-wide errors
    const formErrors = document.querySelectorAll('.form-errors');
    formErrors.forEach(el => {
      hide(el);
      el.textContent = '';
    });

    // Clear field-specific errors
    const fieldErrors = document.querySelectorAll('.field-error');
    fieldErrors.forEach(el => {
      hide(el);
      el.textContent = '';
    });
  }

  /**
   * Clear form inputs
   */
  clearForms() {
    const signinForm = $('#signin-form');
    const signupForm = $('#signup-form');

    if (signinForm) signinForm.reset();
    if (signupForm) signupForm.reset();

    this.clearErrors();
  }

  /**
   * Cleanup resources and remove event listeners
   */
  destroy() {
    try {
      // Remove all event listeners to prevent memory leaks
      if (this.elements) {
        if (this.elements.closeBtn) {
          this.elements.closeBtn.removeEventListener('click', this.boundHandlers.hide);
        }
        if (this.elements.signinTab) {
          this.elements.signinTab.removeEventListener('click', this.boundHandlers.switchToSignin);
        }
        if (this.elements.signupTab) {
          this.elements.signupTab.removeEventListener('click', this.boundHandlers.switchToSignup);
        }
        if (this.elements.signinForm) {
          this.elements.signinForm.removeEventListener('submit', this.boundHandlers.handleSignIn);
        }
        if (this.elements.signupForm) {
          this.elements.signupForm.removeEventListener('submit', this.boundHandlers.handleSignUp);
        }
        if (this.elements.forgotBtn) {
          this.elements.forgotBtn.removeEventListener(
            'click',
            this.boundHandlers.handleForgotPassword
          );
        }
        if (this.elements.openOptionsBtn) {
          this.elements.openOptionsBtn.removeEventListener('click', this.boundHandlers.openOptions);
        }
      }

      // Remove modal keydown listener
      if (this.modal) {
        this.modal.removeEventListener('keydown', this.boundHandlers.handleEscape);

        // Close modal if open
        if (typeof this.modal.close === 'function') {
          this.modal.close();
        }
      }

      // Clear all references
      this.modal = null;
      this.elements = null;
      this.boundHandlers = null; // Critical: Clear bound handlers to prevent memory leaks
      this.onAuthSuccess = null;
      this.isInitialized = false;
    } catch (error) {
      console.error('Error during AuthModalComponent cleanup:', error);
    }
  }
}
