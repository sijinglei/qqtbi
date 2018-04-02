<template>
  <div id="app">
    <div v-if="hasNavigation" class="mainContentBox">
      <left-bar />
      <div class="rightContent">
        <router-view />
      </div>
    </div>
    <router-view v-else />
  </div>
</template>

<script>
import { mapMutations, mapActions } from 'vuex'
import { bus } from '@/utils/bus.js'
import LeftBar from './views/LeftBar.vue'
import _ from 'lodash'

export default {
  name: 'app',
  data() {
    return {}
  },
  components: {
    LeftBar
  },
  computed: {
    hasNavigation() {
      return this.$route.fullPath.indexOf('/view') === -1
    }
  },
  methods: {
    ...mapMutations({
      setWinHeight: 'SET_WIN_HEIGHT',
      setWinWidth: 'SET_WIN_WIDTH'
    }),
    ...mapActions(['getUserCookie']),
    bindWinResize() {
      window.onresize = _.throttle(() => {
        this.setWinHeight(window.innerHeight)
        this.setWinWidth(window.innerWidth)
      }, 500)
    }
  },
  async created() {
    this.bindWinResize()
    await this.getUserCookie()

    bus.$on('showndataabnormal', message => {
      this.$message.error(message)
    })
    // 根据参数全局刷新图表
    bus.$on('reloadChart', (id, argsArr) => {
      const { gridlayout, args } = this.$root
      if (!gridlayout) {
        return
      }
      console.log('查询参数')
      console.log(argsArr)
      const _el = this.Utility.findComp(gridlayout, id)
      // 根据id获取全局过滤字段
      const argsObj = args[id] || []
      // 假如过滤参数argsArr有值则根据参数过滤，没值则移除全局过滤条件中type为0的过滤参数
      if (argsArr && argsArr.length > 0) {
        // 假如全局过滤条件有存在，则替换之前的过滤参数，没有则添加id对应的过滤参数
        if (argsObj.length === 0) {
          args[id] = argsArr
        } else {
          for (let i = 0; i < argsArr.length; i++) {
            const { columns, value, type, operator } = argsArr[i]
            const item = argsObj.find(a => a.columns === columns && a.operator === operator)
            if (item) {
              if (_.isUndefined(value) || _.isNull(value) || value.length === 0) {
                args[id].splice(argsObj.findIndex(a => a.columns === columns), 1)
              } else {
                item.value = value
                item.type = type
              }
            } else {
              if (!_.isUndefined(value) && !_.isNull(value)) {
                args[id].push(argsArr[i])
              }
            }
          }
        }
      } else {
        if (argsObj.length > 0) {
          args[id] = argsObj.filter(a => a.type !== 0)
        }
      }
      _el && _el.reload()
    })
  }
}
</script>

<style lang="less">
@import './assets/css/g.less';
#app {
  // TODO: 管用平台最大990px
  // min-width: 1280px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  .fade-in-transition {
    bottom: 10px;
    transition: all 0.5s ease;
  }
  .fade-in-enter,
  .fade-in-leave {
    bottom: -190px !important;
  }
  .mainContentBox {
    .rightContent {
      margin-left: 49px;
      position: relative;
    }
  }
}
</style>
