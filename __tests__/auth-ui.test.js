import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock dependencies before importing AuthUI
vi.mock('../utils/ui-components.js', () => ({
  default: {
    createContainer: vi.fn((title, subtitle, className) => {
      const container = document.createElement('div');
      container.className = `ui-container ${className}`.trim();
      container.innerHTML = `
        <div class="ui-container-header">
          <h2>${title}</h2>
          ${subtitle ? `<p>${subtitle}</p>` : ''}
        </div>
      `;
      return container;
    }),
    createForm: vi.fn((id, onSubmit, fields, options) => {
      const form = document.createElement('form');
      form.id = id;
      form.className = options.className || '';
      
      fields.forEach(field => {
        const fieldElement = document.createElement('input');
        fieldElement.id = field.id;
        fieldElement.type = field.type;
        fieldElement.required = field.options?.required || false;
        fieldElement.placeholder = field.options?.placeholder || '';
        form.appendChild(fieldElement);
      });
      
      const submitButton = document.createElement('button');
      submitButton.type = 'submit';
      submitButton.textContent = options.submitText || 'Submit';
      form.appendChild(submitButton);
      
      return form;
    }),
    createButton: vi.fn((text, onClick, className) => {
      const button = document.createElement('button');
      button.textContent = text;
      button.className = className;
      if (onClick) {
        button.addEventListener('click', onClick);
      }
      return button;
    }),
    DOM: {
      getElement: vi.fn((id, container) => {
        return container?.getElementById?.(id) || document.getElementById(id);
      }),
      querySelector: vi.fn((selector, container) => {
        return container?.querySelector?.(selector) || document.querySelector(selector);
      }),
      getValue: vi.fn((id, container) => {
        const element = container?.getElementById?.(id) || document.getElementById(id);
        return element?.value || '';
      }),
      setValue: vi.fn((id, value, container) => {
        const element = container?.getElementById?.(id) || document.getElementById(id);
        if (element) {
          element.value = value;
        }
      }),
      ready: vi.fn(() => Promise.resolve())
    }
  }
}));

vi.mock('../utils/ui-messages.js', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    loading: vi.fn(),
    clear: vi.fn()
  }
}));

vi.mock('../utils/error-handler.js', () => ({
  default: {
    handle: vi.fn((error, context) => ({
      shouldShowToUser: true,
      userMessage: error.message || 'An error occurred',
      technicalMessage: error.message,
      context: context
    })),
    createError: vi.fn((message, type, context) => ({
      message,
      type,
      context,
      name: 'Error'
    })),
    ERROR_TYPES: {
      NETWORK: 'network',
      AUTH: 'auth',
      VALIDATION: 'validation',
      STORAGE: 'storage',
      UNKNOWN: 'unknown'
    }
  }
}));

// Import the actual AuthUI class by loading the file
import '../auth-ui.js';

describe('AuthUI', () => {
  let authUI;
  let mockSupabaseConfig;
  let mockOnAuthSuccess;
  let mockAuthStateManager;
  let mockContainer;

  beforeEach(() => {
    // Create mock dependencies
    mockSupabaseConfig = {
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      session: null
    };

    mockOnAuthSuccess = vi.fn();
    mockAuthStateManager = {
      setAuthState: vi.fn(),
      clearAuthState: vi.fn()
    };

    // Create mock container
    mockContainer = document.createElement('div');
    mockContainer.id = 'test-container';

    // Create AuthUI instance using the global window object
    authUI = new window.AuthUI(mockSupabaseConfig, mockOnAuthSuccess, mockAuthStateManager);
  });

  describe('Constructor', () => {
    it('should initialize with correct properties', () => {
      expect(authUI.config).toBe(mockSupabaseConfig);
      expect(authUI.onAuthSuccess).toBe(mockOnAuthSuccess);
      expect(authUI.authStateManager).toBe(mockAuthStateManager);
      expect(authUI.currentView).toBe('login');
    });

    it('should work without authStateManager', () => {
      const authUIWithoutManager = new window.AuthUI(mockSupabaseConfig, mockOnAuthSuccess);
      expect(authUIWithoutManager.authStateManager).toBeNull();
    });
  });

  describe('handleLogin', () => {
    beforeEach(() => {
      // Mock the UIComponents.DOM.getValue to return test values
      global.UIComponents.DOM.getValue.mockImplementation((id, container) => {
        if (id === 'loginEmail') return 'test@example.com';
        if (id === 'loginPassword') return 'password123';
        return '';
      });
    });

    it('should validate required fields', async () => {
      // Mock empty values
      global.UIComponents.DOM.getValue.mockReturnValue('');
      
      await authUI.handleLogin(mockContainer);
      
      expect(global.UIMessages.error).toHaveBeenCalledWith(
        'Please fill in all fields',
        mockContainer
      );
    });

    it('should call signIn with correct credentials', async () => {
      // Mock successful sign in
      mockSupabaseConfig.signIn.mockResolvedValue({ user: { id: '123', email: 'test@example.com' } });
      
      await authUI.handleLogin(mockContainer);
      
      expect(mockSupabaseConfig.signIn).toHaveBeenCalledWith('test@example.com', 'password123');
    });

    it('should show loading message during sign in', async () => {
      // Mock successful sign in
      mockSupabaseConfig.signIn.mockResolvedValue({ user: { id: '123', email: 'test@example.com' } });
      
      await authUI.handleLogin(mockContainer);
      
      expect(global.UIMessages.loading).toHaveBeenCalledWith('Signing in...', mockContainer);
    });

    it('should show success message and call onAuthSuccess on successful login', async () => {
      // Mock successful sign in
      mockSupabaseConfig.signIn.mockResolvedValue({ user: { id: '123', email: 'test@example.com' } });
      
      await authUI.handleLogin(mockContainer);
      
      expect(global.UIMessages.success).toHaveBeenCalledWith('Successfully signed in!', mockContainer);
      
      // Wait for setTimeout to execute
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      expect(mockOnAuthSuccess).toHaveBeenCalled();
    });

    it('should handle login errors', async () => {
      // Mock failed sign in
      const error = new Error('Invalid credentials');
      mockSupabaseConfig.signIn.mockRejectedValue(error);
      
      await authUI.handleLogin(mockContainer);
      
      expect(global.ErrorHandler.handle).toHaveBeenCalledWith(error, 'auth-ui.handleLogin');
      expect(global.UIMessages.error).toHaveBeenCalled();
    });
  });

  describe('handleSignup', () => {
    beforeEach(() => {
      // Mock the UIComponents.DOM.getValue to return test values
      global.UIComponents.DOM.getValue.mockImplementation((id, container) => {
        if (id === 'signupEmail') return 'test@example.com';
        if (id === 'signupPassword') return 'password123';
        if (id === 'confirmPassword') return 'password123';
        return '';
      });
    });

    it('should validate required fields', async () => {
      // Mock empty values
      global.UIComponents.DOM.getValue.mockReturnValue('');
      
      await authUI.handleSignup(mockContainer);
      
      expect(global.UIMessages.error).toHaveBeenCalledWith(
        'Please fill in all fields',
        mockContainer
      );
    });

    it('should validate password confirmation', async () => {
      // Mock mismatched passwords
      global.UIComponents.DOM.getValue.mockImplementation((id, container) => {
        if (id === 'signupEmail') return 'test@example.com';
        if (id === 'signupPassword') return 'password123';
        if (id === 'confirmPassword') return 'differentpassword';
        return '';
      });
      
      await authUI.handleSignup(mockContainer);
      
      expect(global.UIMessages.error).toHaveBeenCalledWith(
        'Passwords do not match',
        mockContainer
      );
    });

    it('should validate password length', async () => {
      // Mock short password
      global.UIComponents.DOM.getValue.mockImplementation((id, container) => {
        if (id === 'signupEmail') return 'test@example.com';
        if (id === 'signupPassword') return '123';
        if (id === 'confirmPassword') return '123';
        return '';
      });
      
      await authUI.handleSignup(mockContainer);
      
      expect(global.UIMessages.error).toHaveBeenCalledWith(
        'Password must be at least 6 characters',
        mockContainer
      );
    });

    it('should call signUp with correct credentials', async () => {
      // Mock successful sign up
      mockSupabaseConfig.signUp.mockResolvedValue({ 
        data: { user: { id: '123', email: 'test@example.com' } } 
      });
      mockSupabaseConfig.signIn.mockResolvedValue({ user: { id: '123', email: 'test@example.com' } });
      
      await authUI.handleSignup(mockContainer);
      
      expect(mockSupabaseConfig.signUp).toHaveBeenCalledWith('test@example.com', 'password123');
    });

    it('should show loading message during signup', async () => {
      // Mock successful sign up
      mockSupabaseConfig.signUp.mockResolvedValue({ 
        data: { user: { id: '123', email: 'test@example.com' } } 
      });
      mockSupabaseConfig.signIn.mockResolvedValue({ user: { id: '123', email: 'test@example.com' } });
      
      await authUI.handleSignup(mockContainer);
      
      expect(global.UIMessages.loading).toHaveBeenCalledWith('Creating account...', mockContainer);
    });

    it('should show success message and call onAuthSuccess on successful signup', async () => {
      // Mock successful sign up
      mockSupabaseConfig.signUp.mockResolvedValue({ 
        data: { user: { id: '123', email: 'test@example.com' } } 
      });
      mockSupabaseConfig.signIn.mockResolvedValue({ user: { id: '123', email: 'test@example.com' } });
      
      await authUI.handleSignup(mockContainer);
      
      expect(global.UIMessages.success).toHaveBeenCalledWith(
        'Account created and signed in successfully!',
        mockContainer
      );
      
      // Wait for setTimeout to execute
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      expect(mockOnAuthSuccess).toHaveBeenCalled();
    });

    it('should handle signup errors', async () => {
      // Mock failed sign up
      const error = new Error('Email already exists');
      mockSupabaseConfig.signUp.mockRejectedValue(error);
      
      await authUI.handleSignup(mockContainer);
      
      expect(global.ErrorHandler.handle).toHaveBeenCalledWith(error, 'auth-ui.handleSignup');
      expect(global.UIMessages.error).toHaveBeenCalled();
    });

    it('should handle signin error after successful signup', async () => {
      // Mock successful sign up but failed sign in
      mockSupabaseConfig.signUp.mockResolvedValue({ 
        data: { user: { id: '123', email: 'test@example.com' } } 
      });
      const signInError = new Error('Sign in failed');
      mockSupabaseConfig.signIn.mockRejectedValue(signInError);
      
      await authUI.handleSignup(mockContainer);
      
      // The actual implementation shows a success message and switches to login form
      // instead of calling ErrorHandler for the signin error
      expect(global.UIMessages.success).toHaveBeenCalledWith(
        'Account created! Please check your email to verify your account, then sign in.',
        mockContainer
      );
    });
  });

  describe('handleSignOut', () => {
    it('should call signOut and clear auth state', async () => {
      // Mock successful sign out
      mockSupabaseConfig.signOut.mockResolvedValue();
      
      await authUI.handleSignOut();
      
      expect(mockSupabaseConfig.signOut).toHaveBeenCalled();
      expect(mockAuthStateManager.clearAuthState).toHaveBeenCalled();
    });

    it('should handle sign out errors', async () => {
      // Mock failed sign out
      const error = new Error('Sign out failed');
      mockSupabaseConfig.signOut.mockRejectedValue(error);
      
      await authUI.handleSignOut();
      
      expect(global.ErrorHandler.handle).toHaveBeenCalledWith(error, 'auth-ui.handleSignOut', { silent: true });
    });
  });

  describe('getErrorMessage', () => {
    it('should return user-friendly error messages', () => {
      const invalidCredentialsError = new Error('Invalid login credentials');
      const userExistsError = new Error('User already registered');
      const passwordError = new Error('Password should be at least 6 characters');
      const emailError = new Error('Unable to validate email address');
      const unknownError = new Error('Unknown error');
      
      expect(authUI.getErrorMessage(invalidCredentialsError)).toBe('Invalid email or password');
      expect(authUI.getErrorMessage(userExistsError)).toBe('An account with this email already exists');
      expect(authUI.getErrorMessage(passwordError)).toBe('Password must be at least 6 characters');
      expect(authUI.getErrorMessage(emailError)).toBe('Please enter a valid email address');
      expect(authUI.getErrorMessage(unknownError)).toBe('Unknown error');
    });
  });
}); 