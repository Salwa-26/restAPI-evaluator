<template>
  <div id="app">
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
      <div class="container">
        <router-link class="navbar-brand" to="/">
          <i class="bi bi-api"></i> REST API Evaluator
        </router-link>
        <button 
          class="navbar-toggler" 
          type="button" 
          data-bs-toggle="collapse" 
          data-bs-target="#navbarNav"
        >
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav ms-auto">
            <li class="nav-item">
              <router-link class="nav-link" to="/">Home</router-link>
            </li>
          </ul>
        </div>
      </div>
    </nav>

    <main>
      <router-view />
    </main>

    <footer class="bg-light mt-5 py-4">
      <div class="container">
        <div class="row">
          <div class="col-md-6">
            <h6>REST API Evaluator</h6>
            <p class="text-muted small">
              Automated testing and evaluation of REST APIs using OpenAPI Specifications.
            </p>
          </div>
          <div class="col-md-6 text-end">
            <p class="text-muted small">
              Built with MEVN Stack (MongoDB, Express.js, Vue.js, Node.js)
            </p>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>

<style>
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

main {
  flex: 1;
}

.font-monospace {
  font-family: 'Courier New', monospace;
}

.accordion-button:not(.collapsed) {
  background-color: #f8f9fa;
  border-color: #dee2e6;
}

pre {
  max-height: 300px;
  overflow-y: auto;
  font-size: 0.8rem;
}

.table th {
  border-top: none;
}

.spinner-border-sm {
  width: 1rem;
  height: 1rem;
}
</style>