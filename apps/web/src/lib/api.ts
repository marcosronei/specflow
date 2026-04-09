import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message)
    return Promise.reject(error)
  }
)

// ── Projects ──────────────────────────────────────────────────────────────────

export const projectsApi = {
  list: () => api.get('/api/projects').then((r) => r.data.data),
  get: (id: string) => api.get(`/api/projects/${id}`).then((r) => r.data.data),
  create: (data: {
    name: string
    path: string
    description?: string
    defaultAgent?: string
    mainBranch?: string
  }) => api.post('/api/projects', data).then((r) => r.data.data),
  update: (id: string, data: Partial<{ name: string; description: string; constitution: string; defaultAgent: string }>) =>
    api.put(`/api/projects/${id}`, data).then((r) => r.data.data),
  delete: (id: string) => api.delete(`/api/projects/${id}`),
}

// ── Features ──────────────────────────────────────────────────────────────────

export const featuresApi = {
  list: (projectId: string) =>
    api.get('/api/features', { params: { projectId } }).then((r) => r.data.data),
  get: (id: string) => api.get(`/api/features/${id}`).then((r) => r.data.data),
  create: (data: { projectId: string; name: string; slug?: string }) =>
    api.post('/api/features', data).then((r) => r.data.data),
  update: (id: string, data: Partial<{ name: string; status: string; branch: string }>) =>
    api.put(`/api/features/${id}`, data).then((r) => r.data.data),
  delete: (id: string) => api.delete(`/api/features/${id}`),
}

// ── Specs ─────────────────────────────────────────────────────────────────────

export const specsApi = {
  get: (featureId: string) =>
    api.get(`/api/features/${featureId}/spec`).then((r) => r.data.data),
  save: (featureId: string, data: { contentMd: string; status?: string }) =>
    api.put(`/api/features/${featureId}/spec`, data).then((r) => r.data.data),
  generate: (featureId: string, description: string, agent?: string) =>
    api
      .post(`/api/features/${featureId}/spec/generate`, { description, agent })
      .then((r) => r.data.data),
}

// ── Plans ─────────────────────────────────────────────────────────────────────

export const plansApi = {
  get: (featureId: string) =>
    api.get(`/api/features/${featureId}/plan`).then((r) => r.data.data),
  save: (featureId: string, data: { contentMd: string }) =>
    api.put(`/api/features/${featureId}/plan`, data).then((r) => r.data.data),
  generate: (featureId: string) =>
    api.post(`/api/features/${featureId}/plan/generate`).then((r) => r.data.data),
}

// ── Tasks ─────────────────────────────────────────────────────────────────────

export const tasksApi = {
  list: (featureId: string) =>
    api.get(`/api/features/${featureId}/tasks`).then((r) => r.data.data),
  create: (
    featureId: string,
    data: { title: string; description?: string; priority?: string; status?: string; agent?: string },
  ) => api.post(`/api/features/${featureId}/tasks`, data).then((r) => r.data.data),
  update: (
    id: string,
    data: Partial<{ title: string; description: string; status: string; priority: string; agent: string; order: number }>,
  ) => api.put(`/api/tasks/${id}`, data).then((r) => r.data.data),
  delete: (id: string) => api.delete(`/api/tasks/${id}`),
  generate: (featureId: string) =>
    api.post(`/api/features/${featureId}/tasks/generate`).then((r) => r.data.data),
  reorder: (featureId: string, tasks: Array<{ id: string; order: number; status?: string }>) =>
    api.put(`/api/features/${featureId}/tasks/reorder`, { tasks }).then((r) => r.data),
}

