<template>
  <div class="container mt-4">
    <div class="row mb-4">
      <div class="col-12">
        <nav aria-label="breadcrumb">
          <ol class="breadcrumb">
            <li class="breadcrumb-item">
              <router-link to="/">Home</router-link>
            </li>
            <li class="breadcrumb-item active" aria-current="page">
              Evaluation Details
            </li>
          </ol>
        </nav>
      </div>
    </div>

    <div v-if="isLoading" class="text-center py-5">
      <div class="spinner-border spinner-border-lg" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-3">Loading evaluation details...</p>
    </div>

    <div v-else-if="error" class="alert alert-danger">
      <h4>Error</h4>
      <p>{{ error }}</p>
      <router-link to="/" class="btn btn-primary">Go Back Home</router-link>
    </div>

    <div v-else-if="evaluation">
      <!-- Evaluation Header -->
      <div class="row mb-4">
        <div class="col-12">
          <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h2 class="mb-0">Evaluation Details</h2>
              <div>
                <span 
                  class="badge badge-lg me-2"
                  :class="getStatusBadgeClass(evaluation.status)"
                >
                  {{ evaluation.status }}
                </span>
                <button 
                  class="btn btn-outline-primary btn-sm"
                  @click="refreshEvaluation"
                  :disabled="isRefreshing"
                >
                  <span 
                    v-if="isRefreshing" 
                    class="spinner-border spinner-border-sm me-1" 
                    aria-hidden="true"
                  ></span>
                  Refresh
                </button>
              </div>
            </div>
            <div class="card-body">
              <div class="row">
                <div class="col-md-6">
                  <p><strong>OAS Source:</strong> {{ evaluation.oasUrl }}</p>
                  <p><strong>Created:</strong> {{ formatDate(evaluation.createdAt) }}</p>
                  <p v-if="evaluation.completedAt">
                    <strong>Completed:</strong> {{ formatDate(evaluation.completedAt) }}
                  </p>
                </div>
                <div class="col-md-6">
                  <p><strong>Total Endpoints:</strong> {{ evaluation.totalEndpoints }}</p>
                  <p><strong>Successful Requests:</strong> {{ evaluation.successfulRequests }}</p>
                  <p><strong>Failed Requests:</strong> {{ evaluation.failedRequests }}</p>
                  <p v-if="evaluation.successRate !== undefined">
                    <strong>Success Rate:</strong> {{ evaluation.successRate.toFixed(1) }}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Progress Bar for Running Evaluations -->
      <div v-if="evaluation.status === 'running'" class="row mb-4">
        <div class="col-12">
          <div class="card">
            <div class="card-body">
              <h5>Evaluation Progress</h5>
              <div class="progress">
                <div 
                  class="progress-bar progress-bar-striped progress-bar-animated" 
                  :style="{ width: progressPercentage + '%' }"
                >
                  {{ progressPercentage.toFixed(0) }}%
                </div>
              </div>
              <p class="mt-2 mb-0">
                {{ evaluation.requestLogs?.length || 0 }} of {{ evaluation.totalEndpoints }} endpoints tested
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Summary Report -->
      <div v-if="evaluation.summary && evaluation.status === 'completed'" class="row mb-4">
        <div class="col-12">
          <div class="card">
            <div class="card-header">
              <h3>Summary Report</h3>
            </div>
            <div class="card-body">
              <div class="row mb-4">
                <div class="col-md-3">
                  <div class="text-center">
                    <h4 class="text-primary">{{ evaluation.summary.totalRequests }}</h4>
                    <p class="mb-0">Total Requests</p>
                  </div>
                </div>
                <div class="col-md-3">
                  <div class="text-center">
                    <h4 class="text-success">{{ evaluation.summary.successfulRequests }}</h4>
                    <p class="mb-0">Successful</p>
                  </div>
                </div>
                <div class="col-md-3">
                  <div class="text-center">
                    <h4 class="text-danger">{{ evaluation.summary.failedRequests }}</h4>
                    <p class="mb-0">Failed</p>
                  </div>
                </div>
                <div class="col-md-3">
                  <div class="text-center">
                    <h4 class="text-info">{{ evaluation.summary.averageResponseTime.toFixed(0) }}ms</h4>
                    <p class="mb-0">Avg Response Time</p>
                  </div>
                </div>
              </div>

              <!-- Status Code Distribution -->
              <div class="mb-4">
                <h5>Status Code Distribution</h5>
                <div class="row">
                  <div 
                    v-for="(count, statusCode) in evaluation.summary.statusCodeDistribution" 
                    :key="statusCode"
                    class="col-md-2 mb-2"
                  >
                    <div class="text-center p-2 border rounded">
                      <strong>{{ statusCode }}</strong><br>
                      <span class="text-muted">{{ count }} requests</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Endpoint Summary -->
              <div class="mb-4">
                <h5>Endpoint Summary</h5>
                <div class="table-responsive">
                  <table class="table table-sm">
                    <thead>
                      <tr>
                        <th>Endpoint</th>
                        <th>Total</th>
                        <th>Success</th>
                        <th>Failed</th>
                        <th>Success Rate</th>
                        <th>Avg Response Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr 
                        v-for="(stats, endpoint) in evaluation.summary.endpointSummary" 
                        :key="endpoint"
                      >
                        <td><code>{{ endpoint }}</code></td>
                        <td>{{ stats.total }}</td>
                        <td class="text-success">{{ stats.successful }}</td>
                        <td class="text-danger">{{ stats.failed }}</td>
                        <td>
                          <span 
                            class="badge"
                            :class="stats.successRate >= 80 ? 'bg-success' : stats.successRate >= 50 ? 'bg-warning' : 'bg-danger'"
                          >
                            {{ stats.successRate.toFixed(1) }}%
                          </span>
                        </td>
                        <td>{{ stats.averageResponseTime.toFixed(0) }}ms</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Request Logs -->
      <div class="row">
        <div class="col-12">
          <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h3>Request Logs</h3>
              <div>
                <button 
                  class="btn btn-outline-secondary btn-sm me-2"
                  @click="exportLogs"
                  :disabled="!evaluation.requestLogs || evaluation.requestLogs.length === 0"
                >
                  Export JSON
                </button>
                <select 
                  class="form-select form-select-sm d-inline-block w-auto"
                  v-model="logFilter"
                >
                  <option value="all">All Requests</option>
                  <option value="success">Successful Only</option>
                  <option value="failed">Failed Only</option>
                </select>
              </div>
            </div>
            <div class="card-body">
              <div v-if="!evaluation.requestLogs || evaluation.requestLogs.length === 0" class="text-center py-4 text-muted">
                <div v-if="evaluation.status === 'pending'">
                  Evaluation not started yet.
                </div>
                <div v-else-if="evaluation.status === 'running'">
                  Evaluation in progress... Logs will appear here as requests are made.
                </div>
                <div v-else>
                  No request logs available.
                </div>
              </div>
              
              <div v-else class="accordion" id="requestLogsAccordion">
                <div 
                  v-for="(log, index) in filteredLogs" 
                  :key="index"
                  class="accordion-item"
                >
                  <h2 class="accordion-header">
                    <button 
                      class="accordion-button collapsed" 
                      type="button" 
                      :data-bs-toggle="'collapse'" 
                      :data-bs-target="`#collapse${index}`"
                    >
                      <div class="d-flex justify-content-between align-items-center w-100 me-3">
                        <div>
                          <span 
                            class="badge me-2"
                            :class="log.method === 'GET' ? 'bg-primary' : 'bg-info'"
                          >
                            {{ log.method }}
                          </span>
                          <code>{{ log.endpoint }}</code>
                        </div>
                        <div class="d-flex align-items-center">
                          <span 
                            class="badge me-2"
                            :class="getStatusCodeBadgeClass(log.responseStatus)"
                          >
                            {{ log.responseStatus }}
                          </span>
                          <span class="text-muted small">{{ log.responseTime }}ms</span>
                          <span 
                            class="badge ms-2"
                            :class="log.success ? 'bg-success' : 'bg-danger'"
                          >
                            {{ log.success ? 'Success' : 'Failed' }}
                          </span>
                        </div>
                      </div>
                    </button>
                  </h2>
                  <div 
                    :id="`collapse${index}`" 
                    class="accordion-collapse collapse"
                    :data-bs-parent="'#requestLogsAccordion'"
                  >
                    <div class="accordion-body">
                      <div class="row">
                        <div class="col-md-6">
                          <h6>Request Details</h6>
                          <p><strong>URL:</strong> <code>{{ log.url }}</code></p>
                          <p><strong>Method:</strong> {{ log.method }}</p>
                          <p><strong>Timestamp:</strong> {{ formatDate(log.timestamp) }}</p>
                          
                          <h6 class="mt-3">Request Headers</h6>
                          <pre class="bg-light p-2 small">{{ JSON.stringify(log.requestHeaders, null, 2) }}</pre>
                          
                          <div v-if="log.requestBody">
                            <h6 class="mt-3">Request Body</h6>
                            <pre class="bg-light p-2 small">{{ JSON.stringify(log.requestBody, null, 2) }}</pre>
                          </div>
                        </div>
                        <div class="col-md-6">
                          <h6>Response Details</h6>
                          <p><strong>Status:</strong> {{ log.responseStatus }}</p>
                          <p><strong>Response Time:</strong> {{ log.responseTime }}ms</p>
                          <p v-if="log.error"><strong>Error:</strong> <span class="text-danger">{{ log.error }}</span></p>
                          
                          <h6 class="mt-3">Response Headers</h6>
                          <pre class="bg-light p-2 small">{{ JSON.stringify(log.responseHeaders, null, 2) }}</pre>
                          
                          <div v-if="log.responseBody">
                            <h6 class="mt-3">Response Body</h6>
                            <pre class="bg-light p-2 small" style="max-height: 300px; overflow-y: auto;">{{ JSON.stringify(log.responseBody, null, 2) }}</pre>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { evaluationService } from '@/services/api'

export default {
  name: 'EvaluationView',
  data() {
    return {
      evaluation: null,
      isLoading: false,
      isRefreshing: false,
      error: null,
      logFilter: 'all',
      refreshInterval: null
    }
  },
  computed: {
    progressPercentage() {
      if (!this.evaluation || !this.evaluation.totalEndpoints) return 0
      const completed = this.evaluation.requestLogs?.length || 0
      return (completed / this.evaluation.totalEndpoints) * 100
    },
    
    filteredLogs() {
      if (!this.evaluation?.requestLogs) return []
      
      switch (this.logFilter) {
        case 'success':
          return this.evaluation.requestLogs.filter(log => log.success)
        case 'failed':
          return this.evaluation.requestLogs.filter(log => !log.success)
        default:
          return this.evaluation.requestLogs
      }
    }
  },
  async mounted() {
    await this.loadEvaluation()
    
    // Auto-refresh for running evaluations
    if (this.evaluation?.status === 'running') {
      this.startAutoRefresh()
    }
  },
  beforeUnmount() {
    this.stopAutoRefresh()
  },
  methods: {
    async loadEvaluation() {
      this.isLoading = true
      this.error = null
      
      try {
        const response = await evaluationService.getEvaluation(this.$route.params.id)
        this.evaluation = response.data
        
        // Stop auto-refresh if evaluation is completed
        if (this.evaluation.status === 'completed' || this.evaluation.status === 'failed') {
          this.stopAutoRefresh()
        }
        
      } catch (error) {
        console.error('Error loading evaluation:', error)
        this.error = 'Failed to load evaluation details. Please try again.'
      } finally {
        this.isLoading = false
      }
    },
    
    async refreshEvaluation() {
      this.isRefreshing = true
      await this.loadEvaluation()
      this.isRefreshing = false
    },
    
    startAutoRefresh() {
      this.refreshInterval = setInterval(() => {
        this.loadEvaluation()
      }, 3000) // Refresh every 3 seconds
    },
    
    stopAutoRefresh() {
      if (this.refreshInterval) {
        clearInterval(this.refreshInterval)
        this.refreshInterval = null
      }
    },
    
    exportLogs() {
      if (!this.evaluation?.requestLogs) return
      
      const dataStr = JSON.stringify(this.evaluation.requestLogs, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `evaluation-logs-${this.evaluation._id}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      URL.revokeObjectURL(url)
    },
    
    formatDate(dateString) {
      return new Date(dateString).toLocaleString()
    },
    
    getStatusBadgeClass(status) {
      const classes = {
        pending: 'bg-warning',
        running: 'bg-info',
        completed: 'bg-success',
        failed: 'bg-danger'
      }
      return classes[status] || 'bg-secondary'
    },
    
    getStatusCodeBadgeClass(statusCode) {
      if (statusCode >= 200 && statusCode < 300) return 'bg-success'
      if (statusCode >= 300 && statusCode < 400) return 'bg-info'
      if (statusCode >= 400 && statusCode < 500) return 'bg-warning'
      if (statusCode >= 500) return 'bg-danger'
      return 'bg-secondary'
    }
  }
}
</script>

<style scoped>
.badge-lg {
  font-size: 0.875rem;
  padding: 0.5rem 0.75rem;
}

.accordion-button:not(.collapsed) {
  background-color: #f8f9fa;
  border-color: #dee2e6;
}

pre {
  font-size: 0.8rem;
  max-height: 200px;
  overflow-y: auto;
}

.progress {
  height: 1.5rem;
}

code {
  color: #e83e8c;
  background-color: #f8f9fa;
  padding: 0.2rem 0.4rem;
  border-radius: 0.25rem;
}
</style>