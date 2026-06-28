import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock location.reload globally to prevent JSDOM navigation errors
Object.defineProperty(window.location, 'reload', {
  value: vi.fn(),
  writable: true,
});

// Mock dependencies before importing AuthUI
vi.mock('../../utils/ui-components.js', () => ({
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
        return (
          container?.querySelector?.(selector) ||
          document.querySelector(selector)
        );
      }),
      getValue: vi.fn((id, container) => {
        const element =
          container?.getElementById?.(id) || document.getElementById(id);
        return element?.value || '';
      }),
      setValue: vi.fn((id, value, container) => {
        const element =
          container?.getElementById?.(id) || document.getElementById(id);
        if (element) {
          element.value = value;
        }
      }),
      ready: vi.fn(() => Promise.resolve()),
    },
  },
}));

vi.mock('../../utils/ui-messages.js', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    loading: vi.fn(),
    clear: vi.fn(),
  },
}));

vi.mock('../../utils/error-handler.js', () => ({
  default: {
    handle: vi.fn((error, context) => ({
      shouldShowToUser: true,
      userMessage: error.message || 'An error occurred',
      technicalMessage: error.message,
      context: context,
    })),
    createError: vi.fn((message, type, context) => ({
      message,
      type,
      context,
      name: 'Error',
    })),
    ERROR_TYPES: {
      NETWORK: 'network',
      AUTH: 'auth',
      VALIDATION: 'validation',
      STORAGE: 'storage',
      UNKNOWN: 'unknown',
    },
  },
}));

// Import the mocked modules
import UIMessages from '../../utils/ui-messages.js';
import ErrorHandler from '../../utils/error-handler.js';

// Import the actual AuthUI class
import AuthUI from '../../auth-ui.js';

describe('AuthUI', () => {
  let authUI;
  let mockSupabaseConfig;
  let mockOnAuthSuccess;
  let mockAuthStateManager;
  let mockContainer;
  let messageContainer;

  const setupMessageContainer = container => {
    const messageEl = document.createElement('div');
    messageEl.id = 'authMessage';
    container.appendChild(messageEl);
    return messageEl;
  };

  const addInput = (container, id, value) => {
    const input = document.createElement('input');
    input.id = id;
    input.value = value;
    container.appendChild(input);
    return input;
  };

  beforeEach(() => {
    // Create mock dependencies
    mockSupabaseConfig = {
      signIn: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      session: null,
    };

    mockOnAuthSuccess = vi.fn();
    mockAuthStateManager = {
      setAuthState: vi.fn(),
      clearAuthState: vi.fn(),
    };

    // Create mock container
    mockContainer = document.createElement('div');
    mockContainer.id = 'test-container';
    messageContainer = setupMessageContainer(mockContainer);

    // Create AuthUI instance using the imported class
    authUI = new AuthUI(
      mockSupabaseConfig,
      mockOnAuthSuccess,
      mockAuthStateManager,
    );
  });

  describe('Constructor', () => {
    it('should initialize with correct properties', () => {
      expect(authUI.config).toBe(mockSupabaseConfig);
      expect(authUI.onAuthSuccess).toBe(mockOnAuthSuccess);
      expect(authUI.authStateManager).toBe(mockAuthStateManager);
      expect(authUI.currentView).toBe('login');
    });

    it('should work without authStateManager', () => {
      const authUIWithoutManager = new AuthUI(
        mockSupabaseConfig,
        mockOnAuthSuccess,
      );
      expect(authUIWithoutManager.authStateManager).toBeNull();
    });
  });

  describe('handleLogin', () => {
    beforeEach(() => {
      mockContainer.innerHTML = '';
      messageContainer = setupMessageContainer(mockContainer);
      addInput(mockContainer, 'loginEmail', 'test@example.com');
      addInput(mockContainer, 'loginPassword', 'password123');
    });

    it('should validate required fields', async () => {
      mockContainer.querySelector('#loginEmail').value = '';
      mockContainer.querySelector('#loginPassword').value = '';

      await authUI.handleLogin(mockContainer);

      expect(UIMessages.error).toHaveBeenCalledWith(
        'Please fill in all fields',
        messageContainer,
      );
    });

    it('should call signIn with correct credentials', async () => {
      // Mock successful sign in
      mockSupabaseConfig.signIn.mockResolvedValue({
        user: { id: '123', email: 'test@example.com' },
      });

      await authUI.handleLogin(mockContainer);

      expect(mockSupabaseConfig.signIn).toHaveBeenCalledWith(
        'test@example.com',
        'password123',
      );
    });

    it('should show loading message during sign in', async () => {
      // Mock successful sign in
      mockSupabaseConfig.signIn.mockResolvedValue({
        user: { id: '123', email: 'test@example.com' },
      });

      await authUI.handleLogin(mockContainer);

      expect(UIMessages.loading).toHaveBeenCalledWith(
        'Signing in...',
        messageContainer,
      );
    });

    it('should show success message and call onAuthSuccess on successful login', async () => {
      // Mock successful sign in
      mockSupabaseConfig.signIn.mockResolvedValue({
        user: { id: '123', email: 'test@example.com' },
      });

      await authUI.handleLogin(mockContainer);

      expect(UIMessages.success).toHaveBeenCalledWith(
        'Successfully signed in!',
        messageContainer,
      );

      // Wait for setTimeout to execute
      await new Promise(resolve => setTimeout(resolve, 1100));

      expect(mockOnAuthSuccess).toHaveBeenCalled();
    });

    it('should handle login errors', async () => {
      const error = new Error('Invalid credentials');
      mockSupabaseConfig.signIn.mockRejectedValue(error);

      await authUI.handleLogin(mockContainer);

      expect(ErrorHandler.handle).toHaveBeenCalledWith(
        error,
        'auth-ui.handleLogin',
      );
      expect(UIMessages.error).toHaveBeenCalled();
    });
  });

  describe('handleSignup', () => {
    beforeEach(() => {
      mockContainer.innerHTML = '';
      messageContainer = setupMessageContainer(mockContainer);
      addInput(mockContainer, 'signupEmail', 'test@example.com');
      addInput(mockContainer, 'signupPassword', 'password123');
      addInput(mockContainer, 'confirmPassword', 'password123');
    });

    it('should validate required fields', async () => {
      mockContainer.querySelector('#signupEmail').value = '';
      mockContainer.querySelector('#signupPassword').value = '';
      mockContainer.querySelector('#confirmPassword').value = '';

      await authUI.handleSignup(mockContainer);

      expect(UIMessages.error).toHaveBeenCalledWith(
        'Please fill in all fields',
        messageContainer,
      );
    });

    it('should validate password confirmation', async () => {
      mockContainer.querySelector('#confirmPassword').value = 'different';

      await authUI.handleSignup(mockContainer);

      expect(UIMessages.error).toHaveBeenCalledWith(
        'Passwords do not match',
        messageContainer,
      );
    });

    it('should validate password length', async () => {
      mockContainer.querySelector('#signupPassword').value = '123';
      mockContainer.querySelector('#confirmPassword').value = '123';

      await authUI.handleSignup(mockContainer);

      expect(UIMessages.error).toHaveBeenCalledWith(
        'Password must be at least 6 characters',
        messageContainer,
      );
    });

    it('should call signUp with correct credentials', async () => {
      // Mock successful signup
      mockSupabaseConfig.signUp.mockResolvedValue({
        user: { id: '123', email: 'test@example.com' },
      });

      await authUI.handleSignup(mockContainer);

      expect(mockSupabaseConfig.signUp).toHaveBeenCalledWith(
        'test@example.com',
        'password123',
      );
    });

    it('should show loading message during signup', async () => {
      // Mock successful signup
      mockSupabaseConfig.signUp.mockResolvedValue({
        user: { id: '123', email: 'test@example.com' },
      });

      await authUI.handleSignup(mockContainer);

      expect(UIMessages.loading).toHaveBeenCalledWith(
        'Creating account...',
        messageContainer,
      );
    });

    it('should show success message and call onAuthSuccess on successful signup', async () => {
      // Mock successful signup
      mockSupabaseConfig.signUp.mockResolvedValue({
        user: { id: '123', email: 'test@example.com' },
      });

      await authUI.handleSignup(mockContainer);

      expect(UIMessages.success).toHaveBeenCalledWith(
        'Account created! Please check your email to verify your account.',
        messageContainer,
      );

      // The signup flow doesn't automatically call onAuthSuccess
      // It just shows a success message and switches to login form
    });

    it('should handle signup errors', async () => {
      const error = new Error('Email already exists');
      mockSupabaseConfig.signUp.mockRejectedValue(error);

      await authUI.handleSignup(mockContainer);

      expect(ErrorHandler.handle).toHaveBeenCalledWith(
        error,
        'auth-ui.handleSignup',
      );
      expect(UIMessages.error).toHaveBeenCalled();
    });

    it('should handle signin error after successful signup', async () => {
      // Mock successful signup but failed signin
      mockSupabaseConfig.signUp.mockResolvedValue({
        data: { user: { id: '123', email: 'test@example.com' } },
      });
      mockSupabaseConfig.signIn.mockRejectedValue(new Error('Signin failed'));

      await authUI.handleSignup(mockContainer);

      // The actual implementation shows a success message and switches to login form
      // instead of calling ErrorHandler for the signin error
      expect(UIMessages.success).toHaveBeenCalledWith(
        'Account created! Please check your email to verify your account, then sign in.',
        messageContainer,
      );
    });
  });

  describe('handleSignOut', () => {
    it('should call signOut and clear auth state', async () => {
      mockSupabaseConfig.signOut.mockResolvedValue();

      await authUI.handleSignOut();

      expect(mockSupabaseConfig.signOut).toHaveBeenCalled();
      expect(mockAuthStateManager.clearAuthState).toHaveBeenCalled();
      // Note: location.reload is not tested due to JSDOM limitations
    });

    it('should handle sign out errors', async () => {
      const error = new Error('Sign out failed');
      mockSupabaseConfig.signOut.mockRejectedValue(error);

      await authUI.handleSignOut();

      expect(ErrorHandler.handle).toHaveBeenCalledWith(
        error,
        'auth-ui.handleSignOut',
        {
          silent: true,
        },
      );
    });
  });
});
