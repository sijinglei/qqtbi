import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)

import Works from '@/views/works.vue'
import DashBoard from '@/views/dashboard/index'
import DashBoardView from '@/views/dashboard/preview'

const router = new Router({
  mode: 'history',
  routes: [
    { path: '/', redirect: '/works' },
    {
      path: '/works',
      name: 'Works',
      component: Works
    },
    {
      path: '/dashBoard',
      name: 'DashBoard',
      component: DashBoard
    },
    {
      path: '/view',
      name: 'DashBoardView',
      component: DashBoardView
    }
  ]
})

export default router
