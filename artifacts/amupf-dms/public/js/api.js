const API_BASE = '/api';

function getToken() {
  return localStorage.getItem('amupf_token');
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(API_BASE + path, { ...options, headers });

  if (res.status === 401) {
    localStorage.removeItem('amupf_token');
    window.navigate('/login');
    throw new Error('Unauthorized');
  }

  if (res.status === 204) return null;

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || data.message || 'Request failed');
  return data;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: (path, body) => request(path, { method: 'PATCH', body: JSON.stringify(body) }),
  del: (path) => request(path, { method: 'DELETE' }),

  // Auth
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/auth/me'),

  // Departments
  departments: () => request('/departments'),
  createDepartment: (data) => request('/departments', { method: 'POST', body: JSON.stringify(data) }),

  // Users
  users: (params = {}) => request('/users?' + new URLSearchParams(params)),
  user: (id) => request(`/users/${id}`),
  updateUser: (id, data) => request(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  kycQueue: () => request('/users/kyc-queue'),
  approveKyc: (id) => request(`/users/${id}/approve`, { method: 'POST' }),
  rejectKyc: (id, reason) => request(`/users/${id}/reject`, { method: 'POST', body: JSON.stringify({ rejection_reason: reason }) }),

  // Reports
  reports: (params = {}) => request('/reports?' + new URLSearchParams(params)),
  report: (id) => request(`/reports/${id}`),
  createReport: (data) => request('/reports', { method: 'POST', body: JSON.stringify(data) }),
  updateReport: (id, data) => request(`/reports/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  updateReportStatus: (id, data) => request(`/reports/${id}/status`, { method: 'PATCH', body: JSON.stringify(data) }),
  submitFeedback: (id, data) => request(`/reports/${id}/feedback`, { method: 'POST', body: JSON.stringify(data) }),

  // Members
  members: (params = {}) => request('/members?' + new URLSearchParams(params)),
  member: (id) => request(`/members/${id}`),
  createMember: (data) => request('/members', { method: 'POST', body: JSON.stringify(data) }),
  updateMember: (id, data) => request(`/members/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteMember: (id) => request(`/members/${id}`, { method: 'DELETE' }),
  regenerateLink: (id) => request(`/members/${id}/regenerate-link`, { method: 'POST' }),

  // Tasks
  tasks: (params = {}) => request('/tasks?' + new URLSearchParams(params)),
  task: (id) => request(`/tasks/${id}`),
  createTask: (data) => request('/tasks', { method: 'POST', body: JSON.stringify(data) }),
  updateTask: (id, data) => request(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteTask: (id) => request(`/tasks/${id}`, { method: 'DELETE' }),

  // Announcements
  announcements: (params = {}) => request('/announcements?' + new URLSearchParams(params)),
  announcement: (id) => request(`/announcements/${id}`),
  createAnnouncement: (data) => request('/announcements', { method: 'POST', body: JSON.stringify(data) }),
  deleteAnnouncement: (id) => request(`/announcements/${id}`, { method: 'DELETE' }),

  // Events
  events: () => request('/events'),
  event: (id) => request(`/events/${id}`),
  createEvent: (data) => request('/events', { method: 'POST', body: JSON.stringify(data) }),
  registerEvent: (id) => request(`/events/${id}/register`, { method: 'POST' }),

  // Attendance
  attendance: (params = {}) => request('/attendance?' + new URLSearchParams(params)),
  recordAttendance: (data) => request('/attendance', { method: 'POST', body: JSON.stringify(data) }),

  // Delegations
  delegations: () => request('/delegations'),
  createDelegation: (data) => request('/delegations', { method: 'POST', body: JSON.stringify(data) }),
  revokeDelegation: (id) => request(`/delegations/${id}/revoke`, { method: 'POST' }),

  // Notifications
  notifications: () => request('/notifications'),
  markAllRead: () => request('/notifications/read-all', { method: 'POST' }),
  markRead: (id) => request(`/notifications/${id}/read`, { method: 'POST' }),

  // Analytics
  publicStats: () => request('/analytics/public-stats'),
  dashboardStats: () => request('/analytics/dashboard'),
  reportsSummary: () => request('/analytics/reports-summary'),
  memberActivity: () => request('/analytics/member-activity'),
  deptPerformance: () => request('/analytics/department-performance'),
};
