// src/api.js

// Detects if you are running locally or on Render
export const API_BASE_URL =
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://127.0.0.1:8000'
    : '';

/**
 * Wrapper for native fetch that handles dynamic API Base URLs automatically.
 */
export const customFetch = (endpoint, options = {}) => {
  // Guarantees endpoint starts with a slash
  const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return fetch(`${API_BASE_URL}${formattedEndpoint}`, options);
};