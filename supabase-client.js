// Simplified Supabase client for Chrome extension
// This is a basic implementation that works within extension CSP restrictions

class SupabaseClient {
  constructor(url, anonKey) {
    this.url = url
    this.anonKey = anonKey
    this.auth = new SupabaseAuth(this)
  }

  createClient(url, anonKey) {
    return new SupabaseClient(url, anonKey)
  }

  // Basic REST API methods
  from(table) {
    console.log('SupabaseClient.from() called with table:', table)
    const query = new SupabaseQuery(this, table)
    const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(query))
    console.log('Created query object with methods:', methods)
    console.log('Has range method:', methods.includes('range'))
    console.log('Has select method:', methods.includes('select'))
    console.log('Has insert method:', methods.includes('insert'))
    return query
  }

  // Auth methods
  get auth() {
    return this._auth
  }

  set auth(auth) {
    this._auth = auth
  }
}

class SupabaseQuery {
  constructor(client, table) {
    this.client = client
    this.table = table
    this.filters = []
    this.selectedFields = '*'
    this.orderBy = null
    this.limit = null
    this.rangeValue = null
    this.singleResult = false
  }

  select(fields) {
    console.log('SupabaseQuery.select() called with fields:', fields)
    this.selectedFields = fields
    return this
  }

  eq(column, value) {
    console.log('SupabaseQuery.eq() called with:', column, value)
    this.filters.push({ type: 'eq', column, value })
    return this
  }

  or(condition) {
    this.filters.push({ type: 'or', condition })
    return this
  }

  overlaps(column, values) {
    this.filters.push({ type: 'overlaps', column, values })
    return this
  }

  order(column, options = {}) {
    console.log('SupabaseQuery.order() called with:', column, options)
    this.orderBy = { column, ...options }
    return this
  }

  range(start, end) {
    console.log('SupabaseQuery.range() called with:', start, end)
    this.rangeValue = { start, end }
    return this
  }

  async insert(data) {
    console.log('SupabaseQuery.insert() called with data:', data)
    // Store the data to be inserted
    this.insertData = data
    return this
  }

  async update(data) {
    // Store the data to be updated
    this.updateData = data
    return this
  }

  async delete() {
    return this
  }

  async upsert(data) {
    // Store the data to be upserted
    this.upsertData = data
    return this
  }

  single() {
    // For single() we'll modify the query to expect only one result
    this.singleResult = true
    return this
  }

  // Execute the query and return data
  async execute() {
    const response = await this._makeRequest('GET', '')
    return response
  }

  // Make the query awaitable by implementing then/catch
  then(resolve, reject) {
    return this.execute().then(resolve, reject)
  }

  catch(reject) {
    return this.execute().catch(reject)
  }

  async _makeRequest(method, path = '', data = null) {
    // Determine the actual method and data based on stored operations
    let actualMethod = method
    let actualData = data
    
    if (this.insertData) {
      actualMethod = 'POST'
      actualData = this.insertData
    } else if (this.updateData) {
      actualMethod = 'PATCH'
      actualData = this.updateData
    } else if (this.upsertData) {
      actualMethod = 'POST'
      actualData = this.upsertData
    }
    
    const url = `${this.client.url}/rest/v1/${this.table}${path}`
    
    const headers = {
      'Content-Type': 'application/json',
      'apikey': this.client.anonKey,
      'Authorization': `Bearer ${this.client.anonKey}`
    }
    
    // Add session token if available
    if (this.client.auth && this.client.auth.session) {
      headers['Authorization'] = `Bearer ${this.client.auth.session.access_token}`
    }

    // Add filters to query string
    const params = new URLSearchParams()
    this.filters.forEach(filter => {
      if (filter.type === 'eq') {
        params.append(`${filter.column}`, `eq.${filter.value}`)
      } else if (filter.type === 'or') {
        params.append('or', filter.condition)
      } else if (filter.type === 'overlaps') {
        params.append(`${filter.column}`, `ov.(${filter.values.join(',')})`)
      }
    })

    if (this.selectedFields !== '*') {
      params.append('select', this.selectedFields)
    }

    if (this.orderBy) {
      const direction = this.orderBy.ascending === false ? 'desc' : 'asc'
      params.append('order', `${this.orderBy.column}.${direction}`)
    }

    if (this.rangeValue) {
      headers['Range'] = `${this.rangeValue.start}-${this.rangeValue.end}`
    }

    const config = {
      method: actualMethod,
      headers,
      credentials: 'omit'
    }

    if (actualData) {
      config.body = JSON.stringify(actualData)
    }

    const fullUrl = params.toString() ? `${url}?${params.toString()}` : url
    console.log('Making request to:', fullUrl)
    console.log('Request headers:', headers)
    const response = await fetch(fullUrl, config)

    console.log('Response status:', response.status)
    console.log('Response headers:', response.headers)

    if (!response.ok) {
      // Try to get error details from response
      let errorMessage = `HTTP error! status: ${response.status}`
      try {
        const errorData = await response.text()
        if (errorData) {
          errorMessage += ` - ${errorData}`
        }
      } catch (e) {
        // Ignore parsing errors for error responses
      }
      throw new Error(errorMessage)
    }

    // Check if response has content before parsing JSON
    const responseText = await response.text()
    console.log('Response text:', responseText)
    
    // For successful operations with empty response, return appropriate data
    if (!responseText) {
      if (actualMethod === 'POST' && this.insertData) {
        // For INSERT operations, return the inserted data
        return { data: [this.insertData], error: null }
      } else if (actualMethod === 'PATCH' && this.updateData) {
        // For UPDATE operations, return the updated data
        return { data: [this.updateData], error: null }
      } else if (actualMethod === 'DELETE') {
        // For DELETE operations, return success
        return { data: null, error: null }
      } else {
        return { data: null, error: null }
      }
    }

    const result = JSON.parse(responseText)
    
    // Clear stored data after use
    this.insertData = null
    this.updateData = null
    this.upsertData = null
    
    // Handle single result if requested
    if (this.singleResult && Array.isArray(result) && result.length > 0) {
      return { data: result[0], error: null }
    }
    
    return { data: result, error: null }
  }
}

class SupabaseAuth {
  constructor(client) {
    this.client = client
    this.session = null
    this.user = null
  }

  async getSession() {
    // Try to get session from storage
    const sessionData = await chrome.storage.sync.get(['supabaseSession'])
    if (sessionData.supabaseSession) {
      this.session = sessionData.supabaseSession
      this.user = sessionData.supabaseSession.user
      return { data: { session: this.session } }
    }
    return { data: { session: null } }
  }

  async signInWithPassword(credentials) {
    const response = await fetch(`${this.client.url}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': this.client.anonKey,
        'Authorization': `Bearer ${this.client.anonKey}`
      },
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error_description || 'Sign in failed')
    }

    const data = await response.json()
    this.session = data
    this.user = data.user

    // Store session in chrome storage
    await chrome.storage.sync.set({ supabaseSession: data })

    return { data, error: null }
  }

  async signUp(credentials) {
    const response = await fetch(`${this.client.url}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': this.client.anonKey,
        'Authorization': `Bearer ${this.client.anonKey}`
      },
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password,
        data: {
          // Add metadata to indicate this is a browser extension
          source: 'browser_extension'
        }
      })
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error_description || 'Sign up failed')
    }

    const data = await response.json()
    
    // For browser extensions, we might want to auto-confirm the user
    // or handle email verification differently
    if (data.user && !data.user.email_confirmed_at) {
      // Store the user data but mark as unconfirmed
      this.user = data.user
      this.session = data.session
      
      if (data.session) {
        await chrome.storage.sync.set({ supabaseSession: data })
      }
    }
    
    return { data, error: null }
  }

  async signOut() {
    // Clear session from storage
    await chrome.storage.sync.remove(['supabaseSession'])
    this.session = null
    this.user = null
  }
}

// Create global supabase object
window.supabase = {
  createClient: (url, anonKey) => {
    console.log('Creating Supabase client with:', { url, anonKey: anonKey ? '***' : 'undefined' })
    const client = new SupabaseClient(url, anonKey)
    console.log('Created client:', client)
    console.log('Client has from method:', typeof client.from)
    return client
  }
} 