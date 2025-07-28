/**
 * @fileoverview Dependency injection container for the ForgetfulMe extension
 */

/**
 * Simple dependency injection container
 */
export class ServiceContainer {
  constructor() {
    this.services = new Map();
    this.factories = new Map();
  }

  /**
   * Register a service factory function
   * @param {string} name - Service name
   * @param {Function} factory - Factory function that returns service instance
   * @param {boolean} [singleton=true] - Whether to create singleton instance
   */
  register(name, factory, singleton = true) {
    this.factories.set(name, { factory, singleton });
    if (!singleton) {
      this.services.delete(name);
    }
  }

  /**
   * Register a service instance directly
   * @param {string} name - Service name
   * @param {*} instance - Service instance
   */
  registerInstance(name, instance) {
    this.services.set(name, instance);
  }

  /**
   * Get service instance
   * @param {string} name - Service name
   * @returns {*} Service instance
   * @throws {Error} If service not found
   */
  get(name) {
    // Return cached instance if exists
    if (this.services.has(name)) {
      return this.services.get(name);
    }

    // Get factory configuration
    const config = this.factories.get(name);
    if (!config) {
      throw new Error(`Service '${name}' not registered`);
    }

    // Create instance
    const instance = config.factory(this);

    // Cache if singleton
    if (config.singleton) {
      this.services.set(name, instance);
    }

    return instance;
  }

  /**
   * Check if service is registered
   * @param {string} name - Service name
   * @returns {boolean} Whether service is registered
   */
  has(name) {
    return this.services.has(name) || this.factories.has(name);
  }

  /**
   * Clear all services and factories
   */
  clear() {
    this.services.clear();
    this.factories.clear();
  }

  /**
   * Get all registered service names
   * @returns {string[]} Service names
   */
  getServiceNames() {
    const names = new Set();

    this.services.forEach((_, name) => names.add(name));
    this.factories.forEach((_, name) => names.add(name));

    return Array.from(names);
  }
}

// Create and export default container instance
export const container = new ServiceContainer();
