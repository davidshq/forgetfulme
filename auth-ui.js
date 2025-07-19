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
    const messageEl = container.querySelector('#authMessage')

    if (!email || !password) {
      this.showAuthMessage(container, 'Please fill in all fields', 'error')
      return
    }

    try {
      this.showAuthMessage(container, 'Signing in...', 'info')
      
      await this.config.signIn(email, password)
      
      this.showAuthMessage(container, 'Successfully signed in!', 'success')
      
      // Call the success callback
      if (this.onAuthSuccess) {
        setTimeout(() => {
          this.onAuthSuccess()
        }, 1000)
      }
      
    } catch (error) {
      console.error('Login error:', error)
      this.showAuthMessage(container, this.getErrorMessage(error), 'error')
    }
  }

  async handleSignup(container) {
    const email = container.querySelector('#signupEmail').value
    const password = container.querySelector('#signupPassword').value
    const confirmPassword = container.querySelector('#confirmPassword').value
    const messageEl = container.querySelector('#authMessage')

    if (!email || !password || !confirmPassword) {
      this.showAuthMessage(container, 'Please fill in all fields', 'error')
      return
    }

    if (password !== confirmPassword) {
      this.showAuthMessage(container, 'Passwords do not match', 'error')
      return
    }

    if (password.length < 6) {
      this.showAuthMessage(container, 'Password must be at least 6 characters', 'error')
      return
    }

    try {
      this.showAuthMessage(container, 'Creating account...', 'info')
      
      const result = await this.config.signUp(email, password)
      
      // Check if user was created successfully
      if (result.data && result.data.user) {
        // For browser extensions, we'll try to sign in immediately
        // since email verification links don't work well with extensions
        try {
          await this.config.signIn(email, password)
          this.showAuthMessage(container, 'Account created and signed in successfully!', 'success')
          
          // Call the success callback
          if (this.onAuthSuccess) {
            setTimeout(() => {
              this.onAuthSuccess()
            }, 1000)
          }
        } catch (signInError) {
          // If auto-signin fails, show the email verification message
          this.showAuthMessage(container, 'Account created! Please check your email to verify your account, then sign in.', 'success')
          
          // Switch to login form after successful signup
          setTimeout(() => {
            this.showLoginForm(container)
          }, 3000)
        }
      } else {
        this.showAuthMessage(container, 'Account created! Please check your email to verify your account.', 'success')
        
        // Switch to login form after successful signup
        setTimeout(() => {
          this.showLoginForm(container)
        }, 3000)
      }
      
    } catch (error) {
      console.error('Signup error:', error)
      this.showAuthMessage(container, this.getErrorMessage(error), 'error')
    }
  }

  showAuthMessage(container, message, type) {
    const messageEl = container.querySelector('#authMessage')
    if (messageEl) {
      messageEl.textContent = message
      messageEl.className = `auth-message ${type}`
      
      // Clear message after 5 seconds for success/info, 10 seconds for error
      const timeout = type === 'error' ? 10000 : 5000
      setTimeout(() => {
        messageEl.textContent = ''
        messageEl.className = 'auth-message'
      }, timeout)
    }
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
          console.error('Sign out error:', error)
        }
      })
    }
  }
}

// Export for use in other files
window.AuthUI = AuthUI 