import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/Home.vue')
  },
  {
    path: '/CompA',
    name: 'CompA',
    component: () => import('@/components/CompA.vue')
  },
  {
    path: '/CompB',
    name: 'CompB',
    component: () => import('@/components/CompB.vue')
  },
  {
    path: '/CompC',
    name: 'CompC',
    component: () => import('@/components/CompC.vue')
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export function setupRouter(app) {
  app.use(router)
}

export default router
