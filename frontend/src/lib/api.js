const API = process.env.NEXT_PUBLIC_API_URL || '';

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('saga_token');
}

export async function api(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };
  const res = await fetch(`${API}${path}`, { ...options, headers });
  if (res.status === 401) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('saga_token');
      window.location.href = '/login';
    }
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || res.statusText);
  }
  const contentType = res.headers.get('content-type');
  if (contentType?.includes('application/json')) return res.json();
  return res.text();
}

export const auth = {
  login: (email, password) => api('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (data) => api('/api/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  me: () => api('/api/auth/me'),
};

export const challenges = {
  list: (status) => api(`/api/challenges${status ? `?status=${status}` : ''}`),
  get: (id) => api(`/api/challenges/${id}`),
  create: (data) => api('/api/challenges', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => api(`/api/challenges/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
};

export const regions = {
  list: () => api('/api/regions'),
};

export const teams = {
  list: (challengeId) => api(`/api/challenges/${challengeId}/teams`),
  create: (challengeId, data) => api(`/api/challenges/${challengeId}/teams`, { method: 'POST', body: JSON.stringify(data) }),
};

export const projects = {
  list: (challengeId) => api(`/api/challenges/${challengeId}/projects`),
  getByTeam: (teamId) => api(`/api/teams/${teamId}/project`),
  create: (teamId, data) => api(`/api/teams/${teamId}/project`, { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => api(`/api/projects/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  submit: (id) => api(`/api/projects/${id}/submit`, { method: 'POST' }),
};

export const evaluations = {
  list: (projectId) => api(`/api/projects/${projectId}/evaluations`),
  submit: (projectId, data) => api(`/api/projects/${projectId}/evaluations`, { method: 'POST', body: JSON.stringify(data) }),
  ranking: (challengeId) => api(`/api/challenges/${challengeId}/ranking`),
};

export const dashboard = {
  national: () => api('/api/dashboard/national'),
  regional: (regionId) => api(`/api/dashboard/regional/${regionId}`),
  me: () => api('/api/dashboard/me'),
};

export const learning = {
  modules: () => api('/api/learning/modules'),
  module: (slug) => api(`/api/learning/modules/${slug}`),
  complete: (moduleId, score) => api(`/api/learning/modules/${moduleId}/complete`, { method: 'POST', body: JSON.stringify({ score }) }),
  myProgress: () => api('/api/learning/me/progress'),
};

export const ai = {
  mentor: (message, context) => api('/api/ai/mentor', { method: 'POST', body: JSON.stringify({ message, context }) }),
  suggestions: (projectId) => api(`/api/ai/suggestions/${projectId}`),
};
