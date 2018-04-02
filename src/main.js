// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import 'babel-polyfill'
import Vue from 'vue'
import App from './App'
import store from './store'
import router from './router'
import VHtmlUI from 'vhtml-ui'
import Clickoutside from './directives/v-clickoutside'
import Scroll from './directives/v-scroll'
import Utility from './utility'
import VueLazyload from 'vue-lazyload'

Vue.use(VueLazyload, {
  lazyComponent: true
})

Vue.use(VHtmlUI)
Vue.directive('clickoutside', Clickoutside)
Vue.directive('scroll', Scroll)
// 全局添加
Vue.prototype.Utility = Utility

Vue.config.productionTip = false

document.domain = 'oa.com'

/* eslint-disable no-new */
new Vue({
  el: '#app',
  router,
  store,
  template: '<App/>',
  components: {
    App
  },
  data: {
    args: {}, // 过滤参数
    gridlayout: null  // 当前视图所有控件的容器
  }
})
