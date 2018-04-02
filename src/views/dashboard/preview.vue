<template>
  <div class="dashboardView">
    <div style="position: absolute;top: 0!important;left: -9999px;visibility: hidden;">
      <span v-for="item in navs" :key="item.navId">{{item && item.navTitle}}</span>
    </div>
    <grid-layout :layout="previewData" :col-num="24" :row-height="1" :is-draggable="false" :is-resizable="false" :use-css-transforms="false" :vertical-compact="false" :margin="[10, 10]" ref="gridlayout">
      <grid-item v-for="(item, i) in previewData" :id="Utility.spliceKey('griditem', item.i)" :key="i" :x="item.x" :y="item.y" :w="item.w" :h="item.h" :i="item.i" class="elementItems" :style="{backgroundColor: themes[themesIdx].bgColor}">
        <!-- 组件标题实现 -->
        <div class="gridTitle" v-if="item.showTitle && item.type!=='tab'" :style="{color: themes[themesIdx].titleColor}">{{item.title}}
         <i v-if="item.titleTip != ''" class="iconfont icon-tishi blue" :title="item.titleTip"></i>
        </div>
        <template v-if="global.lazyload">
          <lazy-component class="lazy-component" :class="{'show-title': item.showTitle}">
            <base-plugins :global="global" :item="item" is-view />
          </lazy-component>
        </template>
        <div v-else class="lazy-component" :class="{'show-title': item.showTitle}">
            <base-plugins :global="global" :item="item" is-view />
        </div>
      </grid-item>
    </grid-layout>
  </div>
</template>
<script>
import { mapActions, mapState, mapGetters } from 'vuex'
import { GridLayout, GridItem } from 'vue-grid-layout'
import { themes } from '@/utils/echartsDefault'
import BasePlugins from '@/components/plugins'
export default {
  data() {
    return {
      themes,
      global: {},
      previewData: []
    }
  },
  computed: {
    ...mapState(['winHeight', 'winWidth']),
    ...mapGetters('dashboard', ['navs']),
    themesIdx() {
      const { themeTabs = 0 } = this.global
      return themeTabs
    },
    height_width() {
      return this.winHeight + '_' + this.winWidth
    }
  },
  watch: {
    height_width() {
      // 页面宽高改变重新加载
      const data = this.previewData
      for (let i = 0; i < data.length; i++) {
        this._preview_currElement(data[i].i, el => el.reset())
      }
    }
  },
  components: {
    GridLayout,
    GridItem,
    BasePlugins
  },
  methods: {
    ...mapActions('dashboard', ['getDashboardData']),
    async _preview_init() {
      const { id: customizationKey } = this.$route.query
      const result = await this.getDashboardData({ customizationKey })
      if (result && result.Data) {
        const { global, layouts } = JSON.parse(result.Data)
        this.global = global
        this.previewData = layouts
        this.Utility.setDocumentTitle(result.CustomizationTitle)
        return
      } else {
        this.$message.error('您没有权限查看该仪表板！')
      }
      this.Utility.setDocumentTitle('仪表板')
    },
    _preview_currElement(id, callback) {
      const _el = this.Utility.findComp(this.$refs.gridlayout, id)
      if (_el) {
        return callback(_el)
      }
    }
  },
  mounted() {
    const _root = this.$root
    _root.gridlayout = this.$refs.gridlayout
    _root.args = {}

    this._preview_init()
  }
}
</script>
<style lang="less">
.dashboardView {
  .elementItems {
    border: 1px solid #e0e0e0;
    padding: 5px;
    border-radius: 3px;
    .gridTitle {
      display: inline-block;
      height: 22px;
      margin-left: 3px;
      font-size: 12px;
    }
    .lazy-component {
      height: 100%;
      &.show-title {
        height: ~'calc(100% - 25px)';
      }
    }
  }
}
</style>
