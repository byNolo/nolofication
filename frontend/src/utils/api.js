/**
 * API Client for Nolofication Backend
 * Handles all HTTP requests with error handling and auth
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Get auth token from localStorage
 */
const getAuthToken = () => {
  return localStorage.getItem('auth_token');
};

/**
 * Set auth token in localStorage
 */
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('auth_token', token);
  } else {
    localStorage.removeItem('auth_token');
  }
};

/**
 * Make authenticated API request
 */
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getAuthToken();

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    console.log('[API] Making authenticated request to:', endpoint, '(token present)');
  } else {
    console.log('[API] Making unauthenticated request to:', endpoint, '(NO TOKEN)');
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Parse JSON response
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    // Handle errors
    if (!response.ok) {
      console.error('[API] Request failed:', {
        endpoint,
        status: response.status,
        statusText: response.statusText,
        data,
        hasToken: !!token
      });
      throw new ApiError(
        data.message || data.error || 'Request failed',
        response.status,
        data
      );
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Network or other errors
    throw new ApiError(
      error.message || 'Network error',
      0,
      null
    );
  }
};

// ============================================
// User Preferences API
// ============================================

export const getPreferences = async () => {
  return apiRequest('/preferences');
};

export const updatePreferences = async (preferences) => {
  return apiRequest('/preferences', {
    method: 'PUT',
    body: JSON.stringify(preferences),
  });
};

// ============================================
// Sites API
// ============================================

// Public listing for normal users/apps
export const getSites = async () => {
  return apiRequest('/sites/public');
};

// Admin listing (requires admin API key or admin token)
export const getSitesAdmin = async () => {
  return apiRequest('/sites');
};

export const getSite = async (siteId) => {
  return apiRequest(`/sites/${siteId}`);
};

// ============================================
// Site Preferences API
// ============================================

export const getSitePreferences = async (siteId) => {
  return apiRequest(`/sites/${siteId}/preferences`);
};

export const updateSitePreferences = async (siteId, preferences) => {
  return apiRequest(`/sites/${siteId}/preferences`, {
    method: 'PUT',
    body: JSON.stringify(preferences),
  });
};

export const resetSitePreferences = async (siteId) => {
  return apiRequest(`/sites/${siteId}/preferences`, {
    method: 'DELETE',
  });
};

// ============================================
// Categories API
// ============================================

export const getSiteCategories = async (siteId) => {
  return apiRequest(`/sites/${siteId}/my-categories`);
};

export const updateUserCategoryPreference = async (siteId, categoryKey, payload) => {
  return apiRequest(`/sites/${siteId}/categories/${categoryKey}/preferences`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
};

// ============================================
// Notifications API
// ============================================

export const getNotifications = async (params = {}) => {
  const queryString = new URLSearchParams();
  
  if (params.siteId) queryString.append('site_id', params.siteId);
  if (params.read !== undefined) queryString.append('read', params.read);
  if (params.limit) queryString.append('limit', params.limit);
  if (params.offset) queryString.append('offset', params.offset);
  
  const url = `/notifications${queryString.toString() ? '?' + queryString.toString() : ''}`;
  return apiRequest(url);
};

export const markNotificationRead = async (notificationId) => {
  return apiRequest(`/notifications/${notificationId}/read`, {
    method: 'PUT',
  });
};

export const markAllNotificationsRead = async (siteId = null) => {
  const body = siteId ? { site_id: siteId } : {};
  return apiRequest('/notifications/read-all', {
    method: 'PUT',
    body: JSON.stringify(body),
  });
};

export const sendTestNotification = async (channel) => {
  return apiRequest('/notifications/test', {
    method: 'POST',
    body: JSON.stringify({ channel }),
  });
};

// ============================================
// Discord OAuth API
// ============================================

export const getDiscordAuthUrl = async () => {
  return apiRequest('/auth/discord/authorize');
};

export const linkDiscordAccount = async (code) => {
  return apiRequest('/auth/discord/callback', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
};

export const getDiscordDmLink = async () => {
  return apiRequest('/auth/discord/bot-authorize-url');
};

// ============================================
// Web Push API
// ============================================

export const subscribeWebPush = async (subscription) => {
  return apiRequest('/webpush/subscribe', {
    method: 'POST',
    body: JSON.stringify(subscription),
  });
};

export const unsubscribeWebPush = async (endpoint) => {
  return apiRequest('/webpush/unsubscribe', {
    method: 'POST',
    body: JSON.stringify({ endpoint }),
  });
};

export const getVapidPublicKey = async () => {
  return apiRequest('/webpush/vapid-public-key');
};

// ============================================
// Auth API (for testing - actual auth via KeyN)
// ============================================

export const getCurrentUser = async () => {
  return apiRequest('/auth/me');
};

export const logout = () => {
  setAuthToken(null);
};

export { ApiError };
