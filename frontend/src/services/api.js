import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

export const evaluationService = {
  
  createEvaluation: (data) => api.post('/evaluations', data),
  
  getEvaluation: (id) => api.get(`/evaluations/${id}`),
  
  getEvaluations: (params = {}) => api.get('/evaluations', { params }),
  
  deleteEvaluation: (id) => api.delete(`/evaluations/${id}`)
}

export default api