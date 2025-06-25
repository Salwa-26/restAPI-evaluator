import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import EvaluationView from '../views/EvaluationView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/evaluation/:id',
      name: 'evaluation',
      component: EvaluationView
    }
  ]
})

export default router