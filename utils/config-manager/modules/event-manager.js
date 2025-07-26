/**
 * @fileoverview Event manager for configuration events
 * @module event-manager
 * @description Handles all event listener management for configuration
 */

/**
 * Event Manager for Configuration Events
 * @class EventManager
 * @description Manages all event listener operations for configuration
 */
class EventManager {
  /**
   * Initialize the event manager
   * @constructor
   * @param {Object} configManager - Reference to the main config manager
   */
  constructor(configManager) {
    this.configManager = configManager;
    /** @type {Set} Set of event listeners */
    this.listeners = new Set();
  }

  /**
   * Add event listener
   * @param {string} event - Event name to listen for
   * @param {Function} callback - Callback function to execute
   * @description Registers a callback for configuration events
   */
  addListener(event, callback) {
    this.listeners.add({ event, callback });
  }

  /**
   * Remove event listener
   * @param {string} event - Event name to remove listener from
   * @param {Function} callback - Callback function to remove
   * @description Removes a specific event listener
   */
  removeListener(event, callback) {
    for (const listener of this.listeners) {
      if (listener.event === event && listener.callback === callback) {
        this.listeners.delete(listener);
        break;
      }
    }
  }

  /**
   * Notify all listeners of an event
   * @param {string} event - Event name to notify
   * @param {*} data - Data to pass to listeners
   * @description Executes all registered callbacks for an event
   */
  notifyListeners(event, data) {
    for (const listener of this.listeners) {
      if (listener.event === event) {
        try {
          listener.callback(data);
        } catch {
          // Error in config listener
        }
      }
    }
  }

  /**
   * Clear all listeners
   * @description Removes all event listeners
   */
  clearListeners() {
    this.listeners.clear();
  }

  /**
   * Get listener count for an event
   * @param {string} event - Event name to count listeners for
   * @returns {number} Number of listeners for the event
   */
  getListenerCount(event) {
    let count = 0;
    for (const listener of this.listeners) {
      if (listener.event === event) {
        count++;
      }
    }
    return count;
  }
}

export default EventManager; 