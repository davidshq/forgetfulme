// Test file for AuthStateManager
// This is a simple test to verify the authentication state management works correctly

class AuthStateManagerTest {
  constructor() {
    this.authStateManager = new AuthStateManager()
    this.testResults = []
  }

  async runTests() {
    console.log('🧪 Running AuthStateManager tests...')
    
    try {
      await this.testInitialization()
      await this.testAuthStateSetting()
      await this.testAuthStateClearing()
      await this.testStorageChangeListener()
      await this.testEventListeners()
      
      this.printResults()
    } catch (error) {
      console.error('❌ Test failed:', error)
    }
  }

  async testInitialization() {
    console.log('Testing initialization...')
    
    // Test that initialization works
    await this.authStateManager.initialize()
    
    if (this.authStateManager.initialized) {
      this.addResult('✅ Initialization', 'PASS')
    } else {
      this.addResult('❌ Initialization', 'FAIL')
    }
  }

  async testAuthStateSetting() {
    console.log('Testing auth state setting...')
    
    const testSession = {
      user: { id: 'test-user', email: 'test@example.com' },
      access_token: 'test-token',
      refresh_token: 'test-refresh'
    }
    
    await this.authStateManager.setAuthState(testSession)
    const currentState = await this.authStateManager.getAuthState()
    
    if (currentState && currentState.user.id === 'test-user') {
      this.addResult('✅ Auth state setting', 'PASS')
    } else {
      this.addResult('❌ Auth state setting', 'FAIL')
    }
  }

  async testAuthStateClearing() {
    console.log('Testing auth state clearing...')
    
    await this.authStateManager.clearAuthState()
    const currentState = await this.authStateManager.getAuthState()
    
    if (currentState === null) {
      this.addResult('✅ Auth state clearing', 'PASS')
    } else {
      this.addResult('❌ Auth state clearing', 'FAIL')
    }
  }

  async testStorageChangeListener() {
    console.log('Testing storage change listener...')
    
    let listenerCalled = false
    this.authStateManager.addListener('authStateChanged', (session) => {
      listenerCalled = true
    })
    
    // Simulate storage change
    const testSession = { user: { id: 'test-listener' } }
    await this.authStateManager.setAuthState(testSession)
    
    if (listenerCalled) {
      this.addResult('✅ Storage change listener', 'PASS')
    } else {
      this.addResult('❌ Storage change listener', 'FAIL')
    }
  }

  async testEventListeners() {
    console.log('Testing event listeners...')
    
    let listenerCalled = false
    const testCallback = () => {
      listenerCalled = true
    }
    
    this.authStateManager.addListener('authStateChanged', testCallback)
    await this.authStateManager.setAuthState({ user: { id: 'test-events' } })
    
    if (listenerCalled) {
      this.addResult('✅ Event listeners', 'PASS')
    } else {
      this.addResult('❌ Event listeners', 'FAIL')
    }
    
    // Test listener removal
    this.authStateManager.removeListener('authStateChanged', testCallback)
    listenerCalled = false
    await this.authStateManager.setAuthState({ user: { id: 'test-removal' } })
    
    if (!listenerCalled) {
      this.addResult('✅ Listener removal', 'PASS')
    } else {
      this.addResult('❌ Listener removal', 'FAIL')
    }
  }

  addResult(testName, result) {
    this.testResults.push({ testName, result })
  }

  printResults() {
    console.log('\n📊 Test Results:')
    console.log('================')
    
    let passed = 0
    let failed = 0
    
    this.testResults.forEach(result => {
      console.log(`${result.result} ${result.testName}`)
      if (result.result === 'PASS') {
        passed++
      } else {
        failed++
      }
    })
    
    console.log(`\n📈 Summary: ${passed} passed, ${failed} failed`)
    
    if (failed === 0) {
      console.log('🎉 All tests passed!')
    } else {
      console.log('⚠️  Some tests failed. Please check the implementation.')
    }
  }
}

// Export for use in other files
window.AuthStateManagerTest = AuthStateManagerTest 