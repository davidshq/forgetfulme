// Authentication UI component for ForgetfulMe extension
class AuthUI {
  constructor(supabaseConfig, onAuthSuccess) {
    this.config = supabaseConfig
    this.onAuthSuccess = onAuthSuccess
    this.currentView = 'login' // 'login' or 'signup'
  }

  showLoginForm(container) {
    const loginHTML = `
      <div class="auth-container">
        <div class="auth-header">
          <h2>Sign in to ForgetfulMe</h2>
          <p>Access your bookmarks across all devices</p>
        </div>
        
        <form id="loginForm" class="auth-form">
          <div class="form-group">
            <label for="loginEmail">Email</label>
            <input type="email" id="loginEmail" placeholder="Enter your email" required>
          </div>
          
          <div class="form-group">
            <label for="loginPassword">Password</label>
            <input type="password" id="loginPassword" placeholder="Enter your password" required>
          </div>
          
          <button type="submit" class="auth-btn primary">Sign In</button>
        </form>
        
        <div class="auth-footer">
          <p>Don't have an account? <a href="#" id="showSignup">Sign up</a></p>
        </div>
        
        <div id="authMessage" class="auth-message"></div>
      </div>
    `
    
    container.innerHTML = loginHTML
    this.bindAuthEvents(container)
  }

  showSignupForm(container) {
    const signupHTML = `
      <div class="auth-container">
        <div class="auth-header">
          <h2>Create Account</h2>
          <p>Start organizing your bookmarks with ForgetfulMe</p>
        </div>
        
        <form id="signupForm" class="auth-form">
          <div class="form-group">
            <label for="signupEmail">Email</label>
            <input type="email" id="signupEmail" placeholder="Enter your email" required>
          </div>
          
          <div class="form-group">
            <label for="signupPassword">Password</label>
            <input type="password" id="signupPassword" placeholder="Create a password" required>
            <small>Password must be at least 6 characters</small>
          </div>
          
          <div class="form-group">
            <label for="confirmPassword">Confirm Password</label>
            <input type="password" id="confirmPassword" placeholder="Confirm your password" required>
          </div>
          
          <button type="submit" class="auth-btn primary">Create Account</button>
        </form>
        
        <div class="auth-footer">
          <p>Already have an account? <a href="#" id="showLogin">Sign in</a></p>
        </div>
        
        <div id="authMessage" class="auth-message"></div>
      </div>
    `
    
    container.innerHTML = signupHTML
    this.bindAuthEvents(container)
  }

  bindAuthEvents(container) {
    const loginForm = container.querySelector('#loginForm')
    const signupForm = container.querySelector('#signupForm')
    const showSignupLink = container.querySelector('#showSignup')
    const showLoginLink = container.querySelector('#showLogin')

    if (loginForm) {
      loginForm.addEventListener('submit', (e) => {
        e.preventDefault()
        this.handleLogin(container)
      })
    }

    if (signupForm) {
      signupForm.addEventListener('submit', (e) => {
        e.preventDefault()
        this.handleSignup(container)
      })
    }

    if (showSignupLink) {
      showSignupLink.addEventListener('click', (e) => {
        e.preventDefault()
        this.showSignupForm(container)
      })
    }

    if (showLoginLink) {
      showLoginLink.addEventListener('click', (e) => {
        e.preventDefault()
        this.showLoginForm(container)
      })
    }
  }

  async handleLogin(container) {
    const email = container.querySelector('#loginEmail').value
    const password = container.querySelector('#loginPassword').value

    if (!email || !password) {
      UIMessages.error('Please fill in all fields', container)
      return
    }

    try {
      UIMessages.loading('Signing in...', container)
      
      await this.config.signIn(email, password)
      
      UIMessages.success('Successfully signed in!', container)
      
      // Call the success callback
      if (this.onAuthSuccess) {
        setTimeout(() => {
          this.onAuthSuccess()
        }, 1000)
      }
      
    } catch (error) {
      const errorResult = ErrorHandler.handle(error, 'auth-ui.handleLogin')
      UIMessages.error(errorResult.userMessage, container)
    }
  }

  async handleSignup(container) {
    const email = container.querySelector('#signupEmail').value
    const password = container.querySelector('#signupPassword').value
    const confirmPassword = container.querySelector('#confirmPassword').value

    if (!email || !password || !confirmPassword) {
      UIMessages.error('Please fill in all fields', container)
      return
    }

    if (password !== confirmPassword) {
      UIMessages.error('Passwords do not match', container)
      return
    }

    if (password.length < 6) {
      UIMessages.error('Password must be at least 6 characters', container)
      return
    }

    try {
      UIMessages.loading('Creating account...', container)
      
      const result = await this.config.signUp(email, password)
      
      // Check if user was created successfully
      if (result.data && result.data.user) {
        // For browser extensions, we'll try to sign in immediately
        // since email verification links don't work well with extensions
        try {
          await this.config.signIn(email, password)
          UIMessages.success('Account created and signed in successfully!', container)
          
          // Call the success callback
          if (this.onAuthSuccess) {
            setTimeout(() => {
              this.onAuthSuccess()
            }, 1000)
          }
        } catch (signInError) {
          // If auto-signin fails, show the email verification message
          UIMessages.success('Account created! Please check your email to verify your account, then sign in.', container)
          
          // Switch to login form after successful signup
          setTimeout(() => {
            this.showLoginForm(container)
          }, 3000)
        }
      } else {
        UIMessages.success('Account created! Please check your email to verify your account.', container)
        
        // Switch to login form after successful signup
        setTimeout(() => {
          this.showLoginForm(container)
        }, 3000)
      }
      
    } catch (error) {
      const errorResult = ErrorHandler.handle(error, 'auth-ui.handleSignup')
      UIMessages.error(errorResult.userMessage, container)
    }
  }

  showAuthMessage(container, message, type) {
    // Use the centralized UIMessages system
    UIMessages.show(message, type, container)
  }

  getErrorMessage(error) {
    if (error.message.includes('Invalid login credentials')) {
      return 'Invalid email or password'
    } else if (error.message.includes('User already registered')) {
      return 'An account with this email already exists'
    } else if (error.message.includes('Password should be at least')) {
      return 'Password must be at least 6 characters'
    } else if (error.message.includes('Unable to validate email address')) {
      return 'Please enter a valid email address'
    } else if (error.message.includes('Email not confirmed')) {
      return 'Please check your email and click the verification link before signing in'
    } else if (error.message.includes('Invalid token')) {
      return 'Email verification failed. Please try signing up again or contact support'
    } else {
      return error.message || 'An error occurred. Please try again.'
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
    `
    
    container.innerHTML = profileHTML
    
    const signOutBtn = container.querySelector('#signOutBtn')
    if (signOutBtn) {
      signOutBtn.addEventListener('click', async () => {
        try {
          await this.config.signOut()
          // Refresh the page or show login form
          location.reload()
        } catch (error) {
          const errorResult = ErrorHandler.handle(error, 'auth-ui.signOut', { silent: true })
          // Don't show user for sign out errors as they're not critical
        }
      })
    }
  }
}

// Export for use in other files
window.AuthUI = AuthUI 