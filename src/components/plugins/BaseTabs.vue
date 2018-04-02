<template>
  <div :id="item.i" class="baseTabs" @click.stop="clickItem">
    <div :ref="Utility.spliceKey('tab', item.i)" style="display:inline-block;width:100%;">
      <span :id="item.i+'_tab_title'" class="tab-title" v-if="tabTitle && item.showTitle">
        <i class="border"></i>{{tabTitle}}
        <i v-if="item.titleTip != ''" class="iconfont icon-tishi blue" :title="item.titleTip"></i>
      </span>
      <div v-if="isShowTabTitle" class="v-tabs v-tabs-default" style="padding-left: 10px;" :id="item.i+'_tab_w'">
        <div class="v-tab" v-for="(tab,idx) in tabItems" :class="{ 'is-selected':currentTabIdx===idx}" :key="tab.id" :id="tab.id" @click.stop="changeTab(tab.id,idx)">
          <span class="v-tab__label">{{tab.value}}</span>
        </div>
        <i class="v-tabs-default__underline" :id="item.i+'_tabUnderLine'" style="width: 38px;transition: transform .2s;"></i>
      </div>
      <div class="tab-wrap" v-for="(item,tabIdx) in tabLayouts" :key="Utility.spliceKey('tabcontent',tabIdx)" v-if="currentTabIdx == tabIdx" v-scroll>
        <control-grid :global="global" :layouts="item.layouts" @selectTab="selectTab" @reset="reset"></control-grid>
      </div>
    </div>
  </div>
</template>
<script>
// import { bus } from '@/utils/bus.js'
import _ from 'lodash'
import ControlGrid from '@/views/dashboard/components/TheControlGrid.vue'
export default {
  data() {
    return {
      isFull: false,
      element: null,
      timer: null,
      currentTabIdx: 0, // 当前选中的选项卡
      curTabId: '',
      curtabLayoutsId: '',
      _deepItem: null,
      _tabLayouts: null
    }
  },
  props: {
    item: Object,
    global: Object
  },
  computed: {
    isShowTabTitle() {
      // 主要配合查询组件和tab组件一起使用，样式问题
      return !(this.item.params.tabItems.length === 1 && this.item.params.tabItems[0].value === '')
    },
    tabTitle() {
      return this.item.title
    },
    tabItems() {
      console.log(this.item.params.tabItems)
      return this.item.params.tabItems
    },
    tabLayouts() {
      return this.item.params.tabLayouts
    },
    isView() {
      return this.$route.path.indexOf('view') > -1
    }
  },
  watch: {
    'item.showTitle'(newVal) {
      this.$nextTick(() => {
        this.getTabWidth()
      })
    },
    'item.title'(newVal) {
      this.$nextTick(() => {
        this.getTabWidth()
      })
    },
    'item.params.tabLayouts': {
      handler(newValue, oldValue) {
        this._init_item_height(this.currentTabIdx)
      },
      deep: true
    }
  },
  methods: {
    getTabWidth() {
      const tabDom = document.getElementById(this.item.i + '_tab_w')
      const tabTitleDom = document.getElementById(this.item.i + '_tab_title')
      if (tabTitleDom) {
        const tabTitleWidth = tabTitleDom.offsetWidth
        tabDom.style.display = 'inline-block'
        tabDom.style.width = `calc(100% - ${tabTitleWidth + 10}px)`
      }
    },
    reset() {
      // TODO
      this.$nextTick(() => {
        this._init_item_height(this.currentTabIdx)
      })
    },
    reload() {
      // 重新加载
    },
    clickItem() {
      this.$emit('select', this.item.i)
    },
    selectTab(obj) {
      // 选中组件，方法转接
      this.$emit('selectTab', obj)
    },
    changeTab(tabId, tabIndex) {
      var tabLen = this.item.params.tabItems.length
      this.tabIndex = tabIndex
      this._init_tab_style(tabIndex, tabId)
      this.currentTabIdx = tabIndex // 选项卡索引
      this._init_item_height(tabIndex)
      if (tabLen > 0) {
        this.setCache(tabIndex)
      }
    },
    _init_tab_style(tabIndex, tabId) {
      var tabDom = document.getElementById(tabId)
      if (tabDom) {
        var offsetLeft = parseInt(tabDom.offsetLeft)
        const tabTitleDom = document.getElementById(this.item.i + '_tab_title')
        if (tabIndex === 0 && tabTitleDom) {
          offsetLeft = 10
        }
        var _tabLine = document.getElementById(this.item.i + '_tabUnderLine')
        _tabLine.style.width = tabDom.offsetWidth + 'px'
        _tabLine.style.transform = 'translateX(' + offsetLeft + 'px)'
      }
    },
    // 初始化当前tab组件的高度
    _init_item_height(tabIndex) {
      const layouts = _.cloneDeep(_.sortBy(this.tabLayouts[tabIndex].layouts))
      if (layouts.length > 0) {
        let sumH = layouts[0].h // 默认第一个高
        let tempY = layouts[0].y
        let tempH = 0
        for (let i = 1; i < layouts.length; i++) {
          let item = layouts[i]
          if (item.y === tempY) {
            if (item.h > tempH) {
              sumH += parseInt(item.h - tempH)
            }
          } else {
            tempY = item.y
            tempH = item.h
            sumH += item.h
          }
        }
        this.$set(this.item, 'h', sumH + parseInt(this.isView && !this.isShowTabTitle ? 2 : 6))
      }
      this.$nextTick(() => {
        this._init_layouts_gloabHeight()
      })
    },
    // 初始化全局
    _init_layouts_gloabHeight() {
      const layouts = _.sortBy(this.$root.gridlayout.layout, l => l.y)
      if (layouts.length > 0) {
        let sumH = 0
        let tempY = layouts[0].y
        for (let i = 0; i < layouts.length; i++) {
          let item = layouts[i]
          if (i > 0) {
            if (item.y === tempY) {
              this.$set(item, 'y', layouts[i - 1].y)
            } else {
              tempY = item.y
              this.$set(item, 'y', sumH)
              sumH += item.h
            }
          } else {
            this.$set(item, 'y', 0)
            sumH += item.h
          }
        }
      }
    },
    _baseTabs_init() {
      if (!this.element) {
        this.element = document.getElementById(this.item.i)
      }
      // 定时获取宽高再初始化
      if (!this.element || this.element.clientHeight < 10) {
        this.timer = setTimeout(this._baseTabs_init, 200)
        return
      }
      this.timer && clearTimeout(this.timer)
    },
    addTab() {
      var vm = this
      var Utility = this.Utility
      var deepItem = _.cloneDeep(vm.item)
      var tabItems = [
        {
          id: Utility.spliceKey(deepItem.i, 'tab1'),
          value: 'Tab1'
        }
      ]
      var tabLayouts = [
        {
          id: Utility.spliceKey(deepItem.i, 'tab1', 'content'),
          layouts: []
        }
      ]
      vm.$set(vm.item.params, 'tabItems', tabItems)
      vm.$set(vm.item.params, 'tabLayouts', tabLayouts)
    },
    /**
     * 设置选中选项卡组件的缓存信息
     */
    setCache(tabIndex) {
      this.curTabId = this.item.params.tabItems[tabIndex].id
      this.curtabLayoutsId = this.curTabId + '_content'
      this.Utility.setItem('TAB_KEY', this.item.i) // 当前选项卡组件id
      this.Utility.setItem('TABITEM_KEY', this.curTabId) // 当前选项卡id
      this.Utility.setItem('TABLAYOUTS_KEY', this.curtabLayoutsId) // 当前选项卡内容id
    }
  },
  mounted() {
    this._deepItem = _.cloneDeep(this.item)
    var _tabItems = this.item.params.tabItems
    if (_tabItems.length === 0) {
      this.addTab()
    } else {
      this._init_item_height(0)
      this._init_tab_style(0, _tabItems[0].id)
    }
    this.setCache(0)
    this._baseTabs_init()
    this.$nextTick(() => {
      this.getTabWidth()
    })
  },
  components: {
    ControlGrid
  }
}
</script>
<style lang="less">
.border {
  display: inline-block;
  width: 5px;
  height: 18px;
  margin-bottom: -2px;
  background-color: #2c8fea;
  margin-right: 4px;
}
.v-tabs .v-tab.is-selected,
.v-tabs .v-tab:hover {
  color: #0067ed;
}
.tab-title {
  font-size: 16px;
  float: left;
  max-width: 50%;
}
</style>
