// Popup script for ForgetfulMe extension
class ForgetfulMePopup {
  constructor() {
    this.initializeElements();
    this.bindEvents();
    this.loadRecentEntries();
    this.loadCustomStatusTypes();
  }

  initializeElements() {
    this.readStatusSelect = document.getElementById('read-status');
    this.tagsInput = document.getElementById('tags');
    this.markReadBtn = document.getElementById('mark-read');
    this.settingsBtn = document.getElementById('settings-btn');
    this.recentList = document.getElementById('recent-list');
  }

  bindEvents() {
    this.markReadBtn.addEventListener('click', () => this.markAsRead());
    this.settingsBtn.addEventListener('click', () => this.openSettings());
    
    // Allow Enter key to mark as read
    this.tagsInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.markAsRead();
      }
    });
  }

  async markAsRead() {
    try {
      const status = this.readStatusSelect.value;
      const tags = this.tagsInput.value.trim();
      
      // Get current tab info
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) {
        this.showMessage('Cannot mark browser pages as read', 'error');
        return;
      }

      const entry = {
        url: tab.url,
        title: tab.title,
        status: status,
        tags: tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
        timestamp: Date.now(),
        id: this.generateId()
      };

      await this.saveEntry(entry);
      this.showMessage('Page marked as read!', 'success');
      this.tagsInput.value = '';
      this.loadRecentEntries();
      
      // Close popup after a short delay
      setTimeout(() => {
        window.close();
      }, 1500);

    } catch (error) {
      console.error('Error marking as read:', error);
      this.showMessage('Error saving entry', 'error');
    }
  }

  async saveEntry(entry) {
    return new Promise((resolve, reject) => {
      chrome.storage.sync.get(['entries'], (result) => {
        const entries = result.entries || [];
        entries.unshift(entry);
        
        // Keep only the last 1000 entries to prevent storage issues
        if (entries.length > 1000) {
          entries.splice(1000);
        }
        
        chrome.storage.sync.set({ entries }, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve();
          }
        });
      });
    });
  }

  async loadRecentEntries() {
    try {
      const result = await chrome.storage.sync.get(['entries']);
      const entries = result.entries || [];
      
      this.recentList.innerHTML = '';
      
      if (entries.length === 0) {
        this.recentList.innerHTML = '<div class="recent-item">No entries yet</div>';
        return;
      }

      // Show last 5 entries
      const recentEntries = entries.slice(0, 5);
      
      recentEntries.forEach(entry => {
        const item = document.createElement('div');
        item.className = 'recent-item';
        
        const title = document.createElement('div');
        title.className = 'title';
        title.textContent = entry.title || 'Untitled';
        title.title = entry.title || 'Untitled';
        
        const meta = document.createElement('div');
        meta.className = 'meta';
        
        const status = document.createElement('span');
        status.className = `status status-${entry.status}`;
        status.textContent = this.formatStatus(entry.status);
        
        const time = document.createElement('span');
        time.textContent = this.formatTime(entry.timestamp);
        
        meta.appendChild(status);
        meta.appendChild(time);
        
        if (entry.tags && entry.tags.length > 0) {
          const tags = document.createElement('span');
          tags.textContent = ` • ${entry.tags.join(', ')}`;
          meta.appendChild(tags);
        }
        
        item.appendChild(title);
        item.appendChild(meta);
        this.recentList.appendChild(item);
      });
      
    } catch (error) {
      console.error('Error loading recent entries:', error);
    }
  }

  async loadCustomStatusTypes() {
    try {
      const result = await chrome.storage.sync.get(['customStatusTypes']);
      const customStatusTypes = result.customStatusTypes || [];
      
      if (customStatusTypes.length > 0) {
        // Clear default options and add custom ones
        this.readStatusSelect.innerHTML = '';
        customStatusTypes.forEach(status => {
          const option = document.createElement('option');
          option.value = status;
          option.textContent = this.formatStatus(status);
          this.readStatusSelect.appendChild(option);
        });
      }
    } catch (error) {
      console.error('Error loading custom status types:', error);
    }
  }

  formatStatus(status) {
    return status.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  formatTime(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return new Date(timestamp).toLocaleDateString();
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  showMessage(message, type) {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.success-message, .error-message');
    existingMessages.forEach(msg => msg.remove());
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `${type}-message`;
    messageDiv.textContent = message;
    
    // Insert after header
    const header = document.querySelector('header');
    header.parentNode.insertBefore(messageDiv, header.nextSibling);
    
    // Remove message after 3 seconds
    setTimeout(() => {
      messageDiv.remove();
    }, 3000);
  }

  openSettings() {
    chrome.runtime.openOptionsPage();
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new ForgetfulMePopup();
}); 