import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('../views/Dashboard.vue')
  },
  {
    path: '/wrongQuestions',
    name: 'wrongQuestions',
    component: () => import('../views/WrongQuestions.vue')
  },
  {
    path: '/report',
    name: 'report',
    component: () => import('../views/Report.vue')
  },
  {
    path: '/addQuestion',
    name: 'addQuestion',
    component: () => import('../views/AddQuestion.vue')
  },
  {
    path: '/aiTutor',
    name: 'aiTutor',
    component: () => import('../views/AITutor.vue')
  },
  {
    path: '/export',
    name: 'export',
    component: () => import('../views/Export.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
