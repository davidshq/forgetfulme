// Options page script for ForgetfulMe extension
class ForgetfulMeOptions {
  constructor() {
    this.initializeElements();
    this.bindEvents();
    this.loadData();
  }

  initializeElements() {
    this.statusTypesList = document.getElementById('status-types-list');
    this.newStatusInput = document.getElementById('new-status');
    this.addStatusBtn = document.getElementById('add-status-btn');
    this.exportDataBtn = document.getElementById('export-data-btn');
    this.importDataBtn = document.getElementById('import-data-btn');
    this.importFile = document.getElementById('import-file');
    this.clearDataBtn = document.getElementById('clear-data-btn');
    this.viewAllBtn = document.getElementById('view-all-btn');
    this.recentEntriesList = document.getElementById('recent-entries-list');
    
    // Stats elements
    this.totalEntries = document.getElementById('total-entries');
    this.statusTypesCount = document.getElementById('status-types-count');
    this.mostUsedStatus = document.getElementById('most-used-status');
  }

  bindEvents() {
    this.addStatusBtn.addEventListener('click', () => this.addStatusType());
    this.newStatusInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.addStatusType();
      }
    });
    
    this.exportDataBtn.addEventListener('click', () => this.exportData());
    this.importDataBtn.addEventListener('click', () => this.importFile.click());
    this.importFile.addEventListener('change', (e) => this.importData(e));
    this.clearDataBtn.addEventListener('click', () => this.clearData());
    this.viewAllBtn.addEventListener('click', () => this.viewAllEntries());
  }

  async loadData() {
    try {
      const result = await chrome.storage.sync.get(['entries', 'customStatusTypes']);
      const entries = result.entries || [];
      const customStatusTypes = result.customStatusTypes || [];
      
      this.loadStatusTypes(customStatusTypes);
      this.loadStatistics(entries, customStatusTypes);
      this.loadRecentEntries(entries);
      
    } catch (error) {
      console.error('Error loading data:', error);
      this.showMessage('Error loading data', 'error');
    }
  }

  loadStatusTypes(statusTypes) {
    this.statusTypesList.innerHTML = '';
    
    if (statusTypes.length === 0) {
      this.statusTypesList.innerHTML = '<p style="color: #6c757d; font-style: italic;">No custom status types defined</p>';
      return;
    }
    
    statusTypes.forEach(status => {
      const item = document.createElement('div');
      item.className = 'status-type-item';
      
      const name = document.createElement('span');
      name.className = 'status-name';
      name.textContent = this.formatStatus(status);
      
      const removeBtn = document.createElement('button');
      removeBtn.className = 'remove-btn';
      removeBtn.textContent = 'Remove';
      removeBtn.addEventListener('click', () => this.removeStatusType(status));
      
      item.appendChild(name);
      item.appendChild(removeBtn);
      this.statusTypesList.appendChild(item);
    });
  }

  async addStatusType() {
    const status = this.newStatusInput.value.trim().toLowerCase().replace(/\s+/g, '-');
    
    if (!status) {
      this.showMessage('Please enter a status type', 'error');
      return;
    }
    
    if (status.length < 2) {
      this.showMessage('Status type must be at least 2 characters', 'error');
      return;
    }
    
    try {
      const result = await chrome.storage.sync.get(['customStatusTypes']);
      const customStatusTypes = result.customStatusTypes || [];
      
      if (customStatusTypes.includes(status)) {
        this.showMessage('Status type already exists', 'error');
        return;
      }
      
      customStatusTypes.push(status);
      await chrome.storage.sync.set({ customStatusTypes });
      
      this.newStatusInput.value = '';
      this.loadData();
      this.showMessage('Status type added successfully', 'success');
      
    } catch (error) {
      console.error('Error adding status type:', error);
      this.showMessage('Error adding status type', 'error');
    }
  }

  async removeStatusType(status) {
    if (!confirm(`Are you sure you want to remove "${this.formatStatus(status)}"?`)) {
      return;
    }
    
    try {
      const result = await chrome.storage.sync.get(['customStatusTypes']);
      const customStatusTypes = result.customStatusTypes || [];
      
      const updatedTypes = customStatusTypes.filter(type => type !== status);
      await chrome.storage.sync.set({ customStatusTypes: updatedTypes });
      
      this.loadData();
      this.showMessage('Status type removed successfully', 'success');
      
    } catch (error) {
      console.error('Error removing status type:', error);
      this.showMessage('Error removing status type', 'error');
    }
  }

  loadStatistics(entries, statusTypes) {
    this.totalEntries.textContent = entries.length;
    this.statusTypesCount.textContent = statusTypes.length;
    
    // Calculate most used status
    const statusCounts = {};
    entries.forEach(entry => {
      statusCounts[entry.status] = (statusCounts[entry.status] || 0) + 1;
    });
    
    let mostUsed = '-';
    let maxCount = 0;
    
    Object.entries(statusCounts).forEach(([status, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostUsed = this.formatStatus(status);
      }
    });
    
    this.mostUsedStatus.textContent = mostUsed;
  }

  loadRecentEntries(entries) {
    this.recentEntriesList.innerHTML = '';
    
    if (entries.length === 0) {
      this.recentEntriesList.innerHTML = '<p style="color: #6c757d; font-style: italic;">No entries yet</p>';
      return;
    }
    
    // Show last 10 entries
    const recentEntries = entries.slice(0, 10);
    
    recentEntries.forEach(entry => {
      const item = document.createElement('div');
      item.className = 'recent-entry-item';
      
      const title = document.createElement('div');
      title.className = 'entry-title';
      title.textContent = entry.title || 'Untitled';
      
      const meta = document.createElement('div');
      meta.className = 'entry-meta';
      
      const status = document.createElement('span');
      status.className = `entry-status status-${entry.status}`;
      status.textContent = this.formatStatus(entry.status);
      
      const time = document.createElement('span');
      time.textContent = this.formatTime(entry.timestamp);
      
      meta.appendChild(status);
      meta.appendChild(document.createTextNode(' • '));
      meta.appendChild(time);
      
      if (entry.tags && entry.tags.length > 0) {
        meta.appendChild(document.createTextNode(' • '));
        const tags = document.createElement('span');
        tags.textContent = entry.tags.join(', ');
        meta.appendChild(tags);
      }
      
      item.appendChild(title);
      item.appendChild(meta);
      this.recentEntriesList.appendChild(item);
    });
  }

  async exportData() {
    try {
      const result = await chrome.storage.sync.get(['entries', 'customStatusTypes']);
      
      const data = {
        entries: result.entries || [],
        customStatusTypes: result.customStatusTypes || [],
        exportDate: new Date().toISOString(),
        version: '1.0.0'
      };
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `forgetfulme-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      this.showMessage('Data exported successfully', 'success');
      
    } catch (error) {
      console.error('Error exporting data:', error);
      this.showMessage('Error exporting data', 'error');
    }
  }

  async importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (!data.entries || !Array.isArray(data.entries)) {
        throw new Error('Invalid data format');
      }
      
      await chrome.storage.sync.set({
        entries: data.entries,
        customStatusTypes: data.customStatusTypes || []
      });
      
      this.loadData();
      this.showMessage('Data imported successfully', 'success');
      
    } catch (error) {
      console.error('Error importing data:', error);
      this.showMessage('Error importing data. Please check the file format.', 'error');
    }
    
    // Reset file input
    event.target.value = '';
  }

  async clearData() {
    if (!confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      return;
    }
    
    try {
      await chrome.storage.sync.clear();
      this.loadData();
      this.showMessage('All data cleared successfully', 'success');
      
    } catch (error) {
      console.error('Error clearing data:', error);
      this.showMessage('Error clearing data', 'error');
    }
  }

  viewAllEntries() {
    // For now, just show a message. In a full implementation, this could open a new tab
    // with a comprehensive view of all entries
    this.showMessage('View all entries feature coming soon!', 'info');
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

  showMessage(message, type) {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => msg.remove());
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
    messageDiv.textContent = message;
    
    // Insert at the top of the container
    const container = document.querySelector('.container');
    container.insertBefore(messageDiv, container.firstChild);
    
    // Remove message after 5 seconds
    setTimeout(() => {
      messageDiv.remove();
    }, 5000);
  }
}

// Initialize options page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new ForgetfulMeOptions();
}); 