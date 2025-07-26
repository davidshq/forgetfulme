/**
 * @fileoverview Error Retry Module for ForgetfulMe Extension
 * @module error-retry
 * @description Handles retry logic and user display decisions for errors
 *
 * @author ForgetfulMe Team
 * @version 1.0.0
 * @since 2024-01-01
 */

/**
 * Error Retry for ForgetfulMe Extension
 * @class ErrorRetry
 * @description Determines retry policies and user display decisions for errors
 *
 * @example
 * const retry = new ErrorRetry();
 * const shouldRetry = retry.shouldRetry(errorInfo);
 * const shouldShow = retry.shouldShowToUser(errorInfo);
 */
export class ErrorRetry {
  /**
   * Initialize error retry
   */
  constructor() {
    // Define retry policies for different error types
    this.retryPolicies = {
      NETWORK: true,
      AUTH: true,
      VALIDATION: false,
      DATABASE: true,
      CONFIG: false,
      UI: false,
      UNKNOWN: false,
    };

    // Define user display policies for different error types
    this.displayPolicies = {
      NETWORK: false,
      AUTH: true,
      VALIDATION: true,
      DATABASE: false,
      CONFIG: true,
      UI: false,
      UNKNOWN: false,
    };

    // Define severity-based display policies
    this.severityDisplayPolicies = {
      LOW: false,
      MEDIUM: false,
      HIGH: true,
      CRITICAL: true,
    };
  }

  /**
   * Determine if operation should be retried
   * @param {Object} errorInfo - Categorized error information
   * @returns {boolean} - Whether to retry
   */
  shouldRetry(errorInfo) {
    const { type } = errorInfo;

    // Check if error type has a specific retry policy
    if (this.retryPolicies.hasOwnProperty(type)) {
      return this.retryPolicies[type];
    }

    // Default to not retrying unknown error types
    return false;
  }

  /**
   * Determine if error should be shown to user
   * @param {Object} errorInfo - Categorized error information
   * @returns {boolean} - Whether to show to user
   */
  shouldShowToUser(errorInfo) {
    const { type, severity } = errorInfo;

    // Check if error type has a specific display policy
    if (this.displayPolicies.hasOwnProperty(type)) {
      return this.displayPolicies[type];
    }

    // Check severity-based display policy
    if (this.severityDisplayPolicies.hasOwnProperty(severity)) {
      return this.severityDisplayPolicies[severity];
    }

    // Default to not showing unknown errors
    return false;
  }

  /**
   * Set retry policy for specific error type
   * @param {string} type - Error type
   * @param {boolean} shouldRetry - Whether to retry
   */
  setRetryPolicy(type, shouldRetry) {
    this.retryPolicies[type] = shouldRetry;
  }

  /**
   * Set display policy for specific error type
   * @param {string} type - Error type
   * @param {boolean} shouldShow - Whether to show to user
   */
  setDisplayPolicy(type, shouldShow) {
    this.displayPolicies[type] = shouldShow;
  }

  /**
   * Set severity-based display policy
   * @param {string} severity - Error severity
   * @param {boolean} shouldShow - Whether to show to user
   */
  setSeverityDisplayPolicy(severity, shouldShow) {
    this.severityDisplayPolicies[severity] = shouldShow;
  }

  /**
   * Get current retry policies
   * @returns {Object} - Current retry policies
   */
  getRetryPolicies() {
    return { ...this.retryPolicies };
  }

  /**
   * Get current display policies
   * @returns {Object} - Current display policies
   */
  getDisplayPolicies() {
    return {
      type: { ...this.displayPolicies },
      severity: { ...this.severityDisplayPolicies },
    };
  }

  /**
   * Reset all policies to defaults
   */
  resetPolicies() {
    this.retryPolicies = {
      NETWORK: true,
      AUTH: true,
      VALIDATION: false,
      DATABASE: true,
      CONFIG: false,
      UI: false,
      UNKNOWN: false,
    };

    this.displayPolicies = {
      NETWORK: false,
      AUTH: true,
      VALIDATION: true,
      DATABASE: false,
      CONFIG: true,
      UI: false,
      UNKNOWN: false,
    };

    this.severityDisplayPolicies = {
      LOW: false,
      MEDIUM: false,
      HIGH: true,
      CRITICAL: true,
    };
  }
} 