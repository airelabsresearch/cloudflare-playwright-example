/**
 * Timeout configuration for E2E tests
 * Centralized timeout management for different types of operations
 */

export const TIMEOUTS = {
  // Standard timeouts
  SHORT: 10000, // 10 seconds - for quick UI interactions
  MEDIUM: 30000, // 30 seconds - for standard operations
  LONG: 60000, // 60 seconds - for complex operations
  VERY_LONG: 120000, // 2 minutes - for heavy computations

  // Specific operation timeouts
  AUTHENTICATION: 60000, // 60 seconds for login process
  NAVIGATION: 60000, // 60 seconds for page navigation
  AI_RESPONSE: 90000, // 90 seconds for AI responses
  AI_ANALYSIS: 120000, // 2 minutes for AI analysis
  SENSITIVITY_ANALYSIS: 120000, // 2 minutes for sensitivity analysis
  SCENARIO_ANALYSIS: 120000, // 2 minutes for scenario analysis
  DATA_LOADING: 30000, // 30 seconds for data loading
  EXPORT_DOWNLOAD: 60000, // 60 seconds for file downloads
  FORM_SUBMISSION: 30000, // 30 seconds for form submissions
  MODAL_OPENING: 10000, // 10 seconds for modal dialogs
  SEARCH_RESULTS: 20000, // 20 seconds for search operations
  FILTER_RESULTS: 15000, // 15 seconds for filter operations
} as const;

/**
 * Helper function to get timeout for specific operations
 */
export function getTimeout(operation: keyof typeof TIMEOUTS): number {
  return TIMEOUTS[operation];
}

/**
 * Helper function to create timeout options for Playwright assertions
 */
export function createTimeoutOptions(operation: keyof typeof TIMEOUTS) {
  return { timeout: getTimeout(operation) };
}
