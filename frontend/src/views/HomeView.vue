<template>
  <div class="container mt-4">
    <div class="row">
      <div class="col-12">
        <h1 class="mb-4">REST API Evaluator</h1>
        <p class="lead">
          Test and evaluate REST APIs using OpenAPI Specifications (OAS). 
          Enter an OAS URL or paste the JSON directly to start testing.
        </p>
      </div>
    </div>

    <!-- Input Form -->
    <div class="row mb-5">
      <div class="col-12">
        <div class="card">
          <div class="card-header">
            <h3>Start New Evaluation</h3>
          </div>
          <div class="card-body">
            <form @submit.prevent="startEvaluation">
              <!-- Input Type Selection -->
              <div class="mb-3">
                <div class="form-check form-check-inline">
                  <input 
                    class="form-check-input" 
                    type="radio" 
                    id="url-input" 
                    value="url" 
                    v-model="inputType"
                  >
                  <label class="form-check-label" for="url-input">
                    OAS URL
                  </label>
                </div>
                <div class="form-check form-check-inline">
                  <input 
                    class="form-check-input" 
                    type="radio" 
                    id="json-input" 
                    value="json" 
                    v-model="inputType"
                  >
                  <label class="form-check-label" for="json-input">
                    OAS JSON
                  </label>
                </div>
              </div>

              <!-- URL Input -->
              <div v-if="inputType === 'url'" class="mb-3">
                <label for="oasUrl" class="form-label">OpenAPI Specification URL</label>
                <input 
                  type="url" 
                  class="form-control" 
                  id="oasUrl" 
                  v-model="oasUrl"
                  placeholder="https://petstore.swagger.io/v2/swagger.json"
                  required
                >
                <div class="form-text">
                  Example: https://petstore.swagger.io/v2/swagger.json
                </div>
              </div>

              <!-- JSON Input -->
              <div v-if="inputType === 'json'" class="mb-3">
                <label for="oasContent" class="form-label">OpenAPI Specification JSON</label>
                <textarea 
                  class="form-control" 
                  id="oasContent" 
                  rows="10" 
                  v-model="oasContent"
                  placeholder="Paste your OpenAPI/Swagger JSON here..."
                  required
                ></textarea>
              </div>

              <button 
                type="submit" 
                class="btn btn-primary btn-lg"
                :disabled="isLoading"
              >
                <span 
                  v-if="isLoading" 
                  class="spinner-border spinner-border-sm me-2" 
                  aria-hidden="true"
                ></span>
                {{ isLoading ? 'Starting Evaluation...' : 'Start Evaluation' }}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Evaluations -->
    <div class="row">
      <div class="col-12">
        <div class="card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h3>Recent Evaluations</h3>
            <button 
              class="btn btn-outline-primary btn-sm" 
              @click="loadEvaluations"
              :disabled="isLoadingEvaluations"
            >
              <span 
                v-if="isLoadingEvaluations" 
                class="spinner-border spinner-border-sm me-1" 
                aria-hidden="true"
              ></span>
              Refresh
            </button>
          </div>
          <div class="card-body">
            <div v-if="isLoadingEvaluations" class="text-center py-4">
              <div class="spinner-border" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
            </div>
            
            <div v-else-if="evaluations.length === 0" class="text-center py-4 text-muted">
              No evaluations found. Start your first evaluation above!
            </div>
            
            <div v-else class="table-responsive">
              <table class="table table-hover">
                <thead>
                  <tr>
                    <th>Created</th>
                    <th>OAS Source</th>
                    <th>Status</th>
                    <th>Endpoints</th>
                    <th>Success Rate</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="evaluation in evaluations" :key="evaluation._id">
                    <td>{{ formatDate(evaluation.createdAt) }}</td>
                    <td>
                      <span class="badge bg-secondary">
                        {{ truncateUrl(evaluation.oasUrl) }}
                      </span>
                    </td>
                    <td>
                      <span 
                        class="badge"
                        :class="getStatusBadgeClass(evaluation.status)"
                      >
                        {{ evaluation.status }}
                      </span>
                    </td>
                    <td>{{ evaluation.totalEndpoints }}</td>
                    <td>
                      <span v-if="evaluation.status === 'completed'">
                        {{ evaluation.successRate?.toFixed(1) }}%
                      </span>
                      <span v-else>-</span>
                    </td>
                    <td>
                      <div class="btn-group btn-group-sm">
                        <router-link 
                          :to="`/evaluation/${evaluation._id}`" 
                          class="btn btn-outline-primary"
                        >
                          View
                        </router-link>
                        <button 
                          class="btn btn-outline-danger" 
                          @click="deleteEvaluation(evaluation._id)"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
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
  name: 'HomeView',
  data() {
    return {
      inputType: 'url',
      oasUrl: 'https://petstore.swagger.io/v2/swagger.json',
      oasContent: '',
      isLoading: false,
      isLoadingEvaluations: false,
      evaluations: []
    }
  },
  mounted() {
    this.loadEvaluations()
  },
  methods: {
    async startEvaluation() {
      this.isLoading = true
      
      try {
        const payload = this.inputType === 'url' 
          ? { oasUrl: this.oasUrl }
          : { oasContent: JSON.parse(this.oasContent) }
        
        const response = await evaluationService.createEvaluation(payload)
        
        // Redirect to evaluation details page
        this.$router.push(`/evaluation/${response.data.id}`)
        
      } catch (error) {
        console.error('Error starting evaluation:', error)
        alert('Failed to start evaluation. Please check your input and try again.')
      } finally {
        this.isLoading = false
      }
    },
    
    async loadEvaluations() {
      this.isLoadingEvaluations = true
      
      try {
        const response = await evaluationService.getEvaluations({ limit: 10 })
        this.evaluations = response.data.evaluations
      } catch (error) {
        console.error('Error loading evaluations:', error)
      } finally {
        this.isLoadingEvaluations = false
      }
    },
    
    async deleteEvaluation(id) {
      if (!confirm('Are you sure you want to delete this evaluation?')) {
        return
      }
      
      try {
        await evaluationService.deleteEvaluation(id)
        this.loadEvaluations() // Refresh the list
      } catch (error) {
        console.error('Error deleting evaluation:', error)
        alert('Failed to delete evaluation.')
      }
    },
    
    formatDate(dateString) {
      return new Date(dateString).toLocaleString()
    },
    
    truncateUrl(url) {
      if (url.length > 50) {
        return url.substring(0, 47) + '...'
      }
      return url
    },
    
    getStatusBadgeClass(status) {
      const classes = {
        pending: 'bg-warning',
        running: 'bg-info',
        completed: 'bg-success',
        failed: 'bg-danger'
      }
      return classes[status] || 'bg-secondary'
    }
  }
}
</script>

<style scoped>
.card {
  box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
  border: 1px solid rgba(0, 0, 0, 0.125);
}

.table th {
  border-top: none;
  font-weight: 600;
}

.btn-group .btn {
  border-radius: 0;
}

.btn-group .btn:first-child {
  border-top-left-radius: 0.375rem;
  border-bottom-left-radius: 0.375rem;
}

.btn-group .btn:last-child {
  border-top-right-radius: 0.375rem;
  border-bottom-right-radius: 0.375rem;
}
</style>