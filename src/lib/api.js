/**
 * API Client for Aroma Plus Backend
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

/**
 * Generic fetch wrapper with error handling
 */
async function fetchAPI(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;

  const config = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'שגיאה בתקשורת עם השרת');
    }

    return response.json();
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

// ========== Auth ==========
export const authAPI = {
  login: (data) => fetchAPI('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  logout: () => fetchAPI('/auth/logout', { method: 'POST' }),
  getMe: () => fetchAPI('/auth/me'),
  refresh: () => fetchAPI('/auth/refresh', { method: 'POST' }),
  register: (data) => fetchAPI('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
};

// ========== Users ==========
export const usersAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchAPI(`/users${query ? `?${query}` : ''}`);
  },
  getById: (id) => fetchAPI(`/users/${id}`),
  create: (data) => fetchAPI('/users', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => fetchAPI(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => fetchAPI(`/users/${id}`, { method: 'DELETE' }),
};

// ========== Work Orders ==========
export const workOrdersAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchAPI(`/work-orders${query ? `?${query}` : ''}`);
  },
  getMy: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchAPI(`/work-orders/my${query ? `?${query}` : ''}`);
  },
  getById: (id) => fetchAPI(`/work-orders/${id}`),
  create: (data) => fetchAPI('/work-orders', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => fetchAPI(`/work-orders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateStatus: (id, status, data = {}) => fetchAPI(`/work-orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, ...data }) }),
  autoGenerate: (data) => fetchAPI('/work-orders/auto-generate', { method: 'POST', body: JSON.stringify(data) }),
};

// ========== Customers ==========
export const customersAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchAPI(`/customers${query ? `?${query}` : ''}`);
  },
  getById: (id) => fetchAPI(`/customers/${id}`),
  create: (data) => fetchAPI('/customers', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => fetchAPI(`/customers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => fetchAPI(`/customers/${id}`, { method: 'DELETE' }),
};

// ========== Branches ==========
export const branchesAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchAPI(`/branches${query ? `?${query}` : ''}`);
  },
  getById: (id) => fetchAPI(`/branches/${id}`),
  create: (data) => fetchAPI('/branches', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => fetchAPI(`/branches/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => fetchAPI(`/branches/${id}`, { method: 'DELETE' }),
};

// ========== Devices ==========
export const devicesAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchAPI(`/devices${query ? `?${query}` : ''}`);
  },
  getById: (id) => fetchAPI(`/devices/${id}`),
  getDueForRefill: (days = 45) => fetchAPI(`/devices/due-for-refill?days=${days}`),
  getDashboardStats: () => fetchAPI('/devices/stats/dashboard'),
  create: (data) => fetchAPI('/devices', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => fetchAPI(`/devices/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => fetchAPI(`/devices/${id}`, { method: 'DELETE' }),
};

// ========== Service Logs ==========
export const serviceLogsAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchAPI(`/service-logs${query ? `?${query}` : ''}`);
  },
  getById: (id) => fetchAPI(`/service-logs/${id}`),
  getDeviceHistory: (deviceId) => fetchAPI(`/service-logs/device/${deviceId}/history`),
  create: (data) => fetchAPI('/service-logs', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => fetchAPI(`/service-logs/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => fetchAPI(`/service-logs/${id}`, { method: 'DELETE' }),
};

// ========== Scents ==========
export const scentsAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchAPI(`/scents${query ? `?${query}` : ''}`);
  },
  getById: (id) => fetchAPI(`/scents/${id}`),
  getLowStockAlerts: () => fetchAPI('/scents/alerts/low-stock'),
  create: (data) => fetchAPI('/scents', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => fetchAPI(`/scents/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => fetchAPI(`/scents/${id}`, { method: 'DELETE' }),
  addStock: (id, amount) => fetchAPI(`/scents/${id}/add-stock`, { method: 'POST', body: JSON.stringify({ amount }) }),
};

// ========== Admin Dashboard ==========
export const adminAPI = {
  getDashboardStats: () => fetchAPI('/admin/stats'),
};

// ========== Chat ==========
export const chatAPI = {
  sendMessage: (data) => fetchAPI('/chat/message', { method: 'POST', body: JSON.stringify(data) }),
  getConversations: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchAPI(`/chat/conversations${query ? `?${query}` : ''}`);
  },
  getConversation: (id) => fetchAPI(`/chat/conversations/${id}`),
  archiveConversation: (id) => fetchAPI(`/chat/conversations/${id}`, { method: 'DELETE' }),
};

// ========== Device Types ==========
export const deviceTypesAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchAPI(`/device-types${query ? `?${query}` : ''}`);
  },
  getById: (id) => fetchAPI(`/device-types/${id}`),
  getLowStockAlerts: () => fetchAPI('/device-types/alerts/low-stock'),
  create: (data) => fetchAPI('/device-types', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => fetchAPI(`/device-types/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => fetchAPI(`/device-types/${id}`, { method: 'DELETE' }),
  addStock: (id, amount) => fetchAPI(`/device-types/${id}/add-stock`, { method: 'POST', body: JSON.stringify({ amount }) }),
};
