/**
 * @fileoverview Lightweight pub-sub mixin for extension managers
 * @module utils/event-emitter
 */

/**
 * Simple event emitter using a Set of { event, callback } listeners.
 * Used by ConfigManager and AuthStateManager.
 */
export class EventEmitter {
  constructor() {
    /** @type {Set<{ event: string, callback: Function }>} */
    this.listeners = new Set();
  }

  /**
   * @param {string} event
   * @param {Function} callback
   */
  addListener(event, callback) {
    this.listeners.add({ event, callback });
  }

  /**
   * @param {string} event
   * @param {Function} callback
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
   * @param {string} event
   * @param {*} data
   */
  notifyListeners(event, data) {
    for (const listener of this.listeners) {
      if (listener.event === event) {
        try {
          listener.callback(data);
        } catch (_error) {
          // Listener errors should not break notification chain
        }
      }
    }
  }
}
