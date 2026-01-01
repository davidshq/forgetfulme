/**
 * @fileoverview Input validation utility
 * @module error-validator
 * @description Validates and sanitizes user input
 */

/**
 * Validate and sanitize user input
 * @param {string} input - User input
 * @param {string} type - Input type (email, url, text, etc.)
 * @returns {Object} - Validation result
 */
export function validateInput(input, type = 'text') {
  const trimmed = input.trim();

  const validators = {
    email: () => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return {
        isValid: emailRegex.test(trimmed),
        message: emailRegex.test(trimmed) ? null : 'Please enter a valid email address.',
      };
    },

    url: () => {
      try {
        new URL(trimmed);
        return {
          isValid: true,
          message: null,
        };
      } catch {
        return {
          isValid: false,
          message: 'Please enter a valid URL.',
        };
      }
    },

    password: () => {
      return {
        isValid: trimmed.length >= 6,
        message: trimmed.length >= 6 ? null : 'Password must be at least 6 characters.',
      };
    },

    text: () => {
      return {
        isValid: trimmed.length > 0,
        message: trimmed.length > 0 ? null : 'This field is required.',
      };
    },
  };

  const validator = validators[type] || validators.text;
  return validator();
}
