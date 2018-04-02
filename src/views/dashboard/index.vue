<template>
  <div class="dashboard overflow">
    <control v-if="selectItem" :item="selectItem" :list="layouts" :global="global" @addItem="addItem" @resetItem="resetItem" @run="controlRun"></control>
    <div class="chartBoard" :style="{height: winHeight + 'px'}">
      <div class="chartTools">
        <span class="toolsNode" @click="saveDB" v-spinner="saveLoading">
          <i class="iconfont icon-baocun" title="保存" />
          <v-spinner />
        </span>
        <span class="toolsNode" @click="saveAsNew" v-spinner="saveAsLoading">
          <i class="iconfont icon-lingcunwei" title="另存为" />
          <v-spinner />
        </span>
        <span class="toolsNode" v-full:chartBoard="isFull">
          <i class="iconfont icon-yanjing" title="预览" />
        </span>
        <span class="toolsNode">
          <i class="iconfont icon-setting" @click="settingDialog=true" title="全局设置" />
        </span>
        <v-input :maxlength="20" class="title" :class="{'v-red':isTitleEmpty}" v-model="title" ref="title" placeholder="未命名仪表板" />
      </div>
      <div class="charts" ref="chartBoard" :style="{height: winHeight-45+'px'}" v-scroll @click="clearSelect()">
        <i class="iconfont icon-fanhui" :class="{'hide': !isFull}" v-full:chartBoard="isFull" title="返回" />
        <grid-layout :layout="layouts" :col-num="24" :row-height="1" :is-draggable="draggable" :is-resizable="true" :use-css-transforms="true" :vertical-compact="true" :margin="[10, 10]" ref="gridlayout">
          <template v-for="item in layouts">
            <grid-item :id="Utility.spliceKey('griditem', item.i)" :key="item.i" :x="item.x" :y="item.y" :w="item.w" :h="item.h" :i="item.i" class="elItems" :style="{backgroundColor: getThemes(item).bgColor}" :class="{'elActive':selectItem && item.i === selectItem.i && isActive }" @resized="resizedItem">
              <!-- 组件标题描述信息  :disabled="item.titleTip==''&& item.showTitle"-->
              <!-- <v-tip kind="large" :ref="Utility.spliceKey('tipTitle',item.i)" placement="right-start" :disabled="item.titleTip==''&& item.showTitle">
                <p v-text="item.titleTip"></p>
              </v-tip> -->
              <!-- 组件标题实现 -->
              <!-- <div class="gridTitle" v-if="item.showTitle" :style="{color: getThemes(item).titleColor}">{{item.title}}
                <i class="iconfont icon-tishi blue" v-tip.hover.delay="Utility.spliceKey('tipTitle',item.i)" v-if="item.titleTip != ''"></i>
              </div> -->
              <!-- 组件拖拽 -->
              <div class="gridTitle" v-if="item.showTitle && item.type!=='tab'" :style="{color: getThemes(item).titleColor}">{{item.title}}
                <i v-if="item.titleTip != ''" class="iconfont icon-tishi blue" :title="item.titleTip"></i>
              </div>
              <div class="mouseHandler" @mousemove.stop="mouseHandler(0)" @mouseout="mouseHandler(1)" @click.stop="clickSelectItem(item.i)">
                <!-- 组件操作按钮 -->
                <div class="gridTip">
                  <v-tip kind="large" :ref="Utility.spliceKey('tip', item.i || 'nothing')" placement="left-start">
                    <ul class="gridTipUl">
                      <li class="tipLi" v-if="isCharts(item.type)" @click.stop="clickChartExport(item)">导出为图片</li>
                      <li class="tipLi" @click.stop="clickDeleteItem(item)">删除</li>
                    </ul>
                  </v-tip>
                  <i class="iconfont icon-shenglve" v-tip.hover.delay="Utility.spliceKey('tip', item.i || 'nothing')" />
                </div>
              </div>
              <!-- 组件加载 -->
              <lazy-component class="lazy-component">
                <base-plugins :global="global" :item="item" @select="clickSelectItem" @selectTab="clickSelectItemTab" />
              </lazy-component>
            </grid-item>
          </template>
        </grid-layout>
      </div>
    </div>
    <db-setting :visible="settingDialog" :list="layouts" :options="global" @confirm="doSettingSave" />
  </div>
</template>
<script>
import { mapState, mapActions, mapMutations } from 'vuex'
import { GridLayout, GridItem } from 'vue-grid-layout'
import { themes } from '@/utils/echartsDefault'
import BasePlugins from '@/components/plugins'
import Control from './components/TheControl'
import DbSetting from './components/TheDbSetting'
import _ from 'lodash'
export default {
  data() {
    return {
      themes,
      mouseTimer: null,
      dashboardId: null,
      isFull: false,
      draggable: false,
      currIdx: 0,
      selectItem: null,
      saveLoading: false,
      saveAsLoading: false,
      settingDialog: false,
      layouts: [],
      title: '',
      global: {},
      isTitleEmpty: false,
      isActive: true
    }
  },
  watch: {
    height_width() {
      this.doReset()
    },
    isFull(newVal) {
      if (!newVal) {
        this.doReset()
      } else {
        this.draggable = false
      }
    },
    title() {
      this.isTitleEmpty = this.title.trim() === ''
    },
    'selectItem.showTitle'(newV, oldV) {
      this.$nextTick(() => {
        this._index_elementDoc(this.selectItem.i, el => el.reset())
      })
    },
    global: {
      handler(newVal, oldVal) {
        const curDashData = JSON.stringify(_.merge({ global: newVal, layouts: this.layouts }))
        // console.log(curDashData)
        // 提交状态
        this.SET_UPDATE_STRING(curDashData)
      },
      deep: true
    },
    layouts: {
      handler(newVal, oldVal) {
        const curDashData = JSON.stringify(_.merge({ global: this.global, layouts: newVal }))
        // console.log(curDashData })))
        this.SET_UPDATE_STRING(curDashData)
      },
      deep: true
    }
  },
  computed: {
    ...mapState(['winHeight', 'winWidth']),
    height_width() {
      return this.winHeight + '_' + this.winWidth
    },
    layoutsNextY() {
      if (this.layouts.length === 0) return 0
      return _.max(this.layouts.map(l => l.y)) + 6
    },
    gridIndex() {
      const date = new Date()
      const idxArr = [
        (date.getFullYear() + '').substring(2),
        date.getMonth() + 1,
        date.getDate(),
        date.getHours(),
        date.getMinutes(),
        this.currIdx
      ]
      return idxArr.join('')
    },
    themesIdx() {
      const { themeTabs = 0 } = this.global
      return themeTabs
    },
    pluginKeys() {
      return Object.keys(this.Utility.pluginAllTitle())
    }
  },
  components: {
    GridLayout,
    GridItem,
    BasePlugins,
    Control,
    DbSetting
  },
  methods: {
    ...mapActions('dashboard', ['getDashboardData', 'setDashboardData']),
    ...mapMutations('dashboard', ['GET_DASHBOARD_DATA', 'SET_UPDATE_STRING']),
    getThemes(item) {
      if (item.styles && item.styles.themes) return item.styles.themes
      return themes[this.themesIdx]
    },
    isCharts(type) {
      return !['text', 'table', 'crosstabs', 'treegrid', 'query', 'filters', 'frame', 'tab'].includes(type)
    },
    doReset() {
      const { layouts } = this
      for (let i = 0; i < layouts.length; i++) {
        this._index_elementDoc(layouts[i].i, el => el.reset())
      }
    },
    _index_elementTabDoc(id, callback) {
      const _el = this.Utility.findComp(this.$root.gridlayout, id)
      if (_el) {
        return callback(_el)
      }
    },
    mouseHandler(bool) {
      if (!this.isFull) this.draggable = !bool
    },
    addTabs(tabitem) {
      const item = this.layouts.find(l => l.i === tabitem.i)
      item.params = tabitem.params
    },
    async controlRun() {
      // this._index_getSelectedItem()
      if (!this.isRun()) {
        return
      }
      if (!this.selectItem) return
      const { type, i } = this.selectItem
      if (type === 'frame') {
        this._index_elementDoc(i, el => el.reload())
        return
      }
      this._index_elementDoc(i, el => el.reload())
    },
    isRun() {
      const { type, params } = this.selectItem
      const { aliasKey, measure = [], dimension = [], blend = [] } = params
      // 1.统一维度度量的类型
      // 2.仅维度的类型
      // 3.仅度量的类型
      const bool =
        !aliasKey ||
        (['treegrid', 'table', 'query', 'filters'].includes(type) && blend.length === 0) ||
        (!['scatter', 'treegrid', 'table', 'query', 'filters'].includes(type) && dimension.length === 0) ||
        (!['crosstabs', 'treegrid', 'table', 'query', 'filters'].includes(type) && measure.length === 0)
      if (bool && type !== 'tab') {
        const title = this.pluginKeys.includes(type) ? this.Utility.pluginTitle(type) : this.Utility.chartTitle(type)
        this.$message.error(`${title}缺少维度或度量项`)
        return
      }
      return true
    },
    clickDeleteItem(obj) {
      const { layouts, selectItem } = this
      // 删除事件
      const index = layouts.findIndex(l => obj.i === l.i)
      layouts.splice(index, 1)
      // 删除的就是选中的, 就重新选中第一个(如果有的话)
      if (selectItem.i === obj.i && layouts.length) {
        this.selectItem = layouts[0]
      }
      // 将所有组件重新渲染
      this.$nextTick(() => {
        for (let i = 0; i < layouts.length; i++) {
          const layout = layouts[i]
          this._index_elementDoc(layout.i, el => el.reset())
        }
      })
    },
    clickChartExport(obj) {
      const urlPath = this._index_elementDoc(obj.i, el => el.toDataURL())
      if (!urlPath) return

      const _root = this.$refs.chartBoard
      const link = document.createElement('a')
      link.href = urlPath
      link.download = obj.title + '.png'
      _root.appendChild(link)
      link.click()
      _root.removeChild(link)
    },
    addItem(type) {
      let tabId = this.Utility.getItem('TAB_KEY') // 当前选项卡组件id
      const newObj = this._index_getParams(type)
      if (tabId && tabId !== '' && type !== 'tab') {
        const item = this.layouts.find(l => l.i === tabId)
        let tabContentId = this.Utility.getItem('TABLAYOUTS_KEY')
        let layouts = item.params.tabLayouts.find(l => l.id === tabContentId)
        layouts && layouts.layouts.push(newObj)
        // 选中组件
        this.clickSelectItemTab(newObj)
      } else {
        this.layouts.push(newObj)
        this.clickSelectItem(newObj.i)
      }
    },
    clickSelectItemTab(item) {
      let cloneObj = _.cloneDeep(item)
      // 状态管理当前选中的tab子组件
      this.$store.dispatch('setSelectTabItem', cloneObj)
      // 选中当前组件判断
      this.$store.dispatch('setSelected', true)
      this.selectItem = item
    },
    clickSelectItem(id) {
      // this.draggable = false
      // 鼠标选中事件
      const item = this.layouts.find(l => l.i === id)
      if (item.type === 'tab') {
        this.Utility.setItem('TAB_KEY', id)
      } else {
        this.clearSelect()
      }
      this.isActive = true
      this.$store.dispatch('setSelected', false)
      if (item) {
        this.selectItem = item
        this.selectItem.params.orderBy = []
      }
    },
    // 点击空白地方，清空所有缓存数据
    clearSelect() {
      this.Utility.removeItem('TAB_KEY')
      // this.Utility.removeItem('TABITEM_KEY')
      // this.Utility.removeItem('TABLAYOUTS_KEY')
      this.isActive = false
    },
    // 样式更改时触发
    resetItem(type) {
      // this._index_getSelectedItem()
      if (!this.selectItem) return
      const Utility = this.Utility
      const { title, params, styles, i, type: sourceType } = this.selectItem
      // 假如类型不一样，重新设相关属性值
      if (sourceType !== type) {
        const oldTitle = Utility.chartTitle(sourceType)
        if (title === oldTitle) {
          this.selectItem.title = Utility.chartTitle(type)
        }
        this.selectItem.titleTip = ''
        this.selectItem.type = type
        this.selectItem.params = Utility.chartParams(type, params, sourceType)
        this.selectItem.styles = Utility.chartStyles(type, styles)
      }
      this.$nextTick(() => {
        this._index_elementDoc(i, el => {
          el.reload(el.item.type === 'treegrid')
        })
      })
    },
    resizedItem(i) {
      // 重新刷新
      this.$nextTick(() => {
        this._index_elementDoc(i, el => el.reset())
      })
    },
    async saveDB() {
      this.isTitleEmpty = this.title.trim() === ''
      if (this.isTitleEmpty) {
        this.$refs.title.focus()
        return
      }
      const data = this._index_getSavaData(this.dashboardId)
      if (data) {
        this.saveLoading = true
        const result = await this.setDashboardData(data)
        if (result && result.Code === 1) {
          this.$message.success(result.Message)
        } else {
          this.$message.error(result.Message)
        }
        this.saveLoading = false
      }
    },
    async saveAsNew() {
      this.isTitleEmpty = this.title.trim() === ''
      if (this.isTitleEmpty) {
        this.$refs.title.focus()
        return
      }
      const CustomizationKey = this.Utility.uuid()
      const data = this._index_getSavaData(CustomizationKey)
      this.saveAsLoading = true
      const result = await this.setDashboardData(data)
      if (result && result.Code === 1) {
        this.$message.success(result.Message)
      } else {
        this.$message.error(result.Message)
      }
      if (result && result.Code === 1) {
        this.dashboardId = CustomizationKey
      }
      this.saveAsLoading = false
    },
    doSettingSave(obj) {
      this.settingDialog = false
      if (!obj) {
        return
      }
      this.global = obj
      this.$nextTick(() => {
        this.setReload()
      })
    },
    setReload() {
      const { layouts } = this
      for (let i = 0; i < layouts.length; i++) {
        let { styles, i: idx } = layouts[i]
        if (styles && styles.themes) {
          delete styles.themes
        }
        this._index_elementDoc(idx, el => el.reload())
      }
    },
    _index_getSavaData(CustomizationKey) {
      // if (this.isRun()) {
      let { global, layouts } = this
      const Data = JSON.stringify({ global, layouts })
      return {
        CustomizationKey,
        CustomizationTitle: this.title.trim(),
        Data
      }
      // } else {
      //   return null
      // }
    },
    _index_getSelectedItem() {
      const _root = this.$refs.chartBoard
      // 获取选中dom元素
      const items = _root.getElementsByClassName('elActive')[0]
      if (!items) {
        this.$message.error('缺少图表，请选择图表或双击添加图表！')
        return
      }
      const _el = items.getElementsByClassName('itemEl')[0]
      const item = this.layouts.find(l => l.i === _el.id)
      this.selectItem = item
    },
    _index_elementDoc(id, callback) {
      const _el = this.Utility.findComp(this.$refs.gridlayout, id)
      if (_el) {
        return callback(_el)
      }
    },
    _index_getParams(type) {
      const Utility = this.Utility
      const idStr = Utility.spliceKey('g', this.gridIndex)
      this.currIdx++
      // aliasKey和appName参数防止新建图表切换数据集
      const { aliasKey, appName } = this.selectItem && type !== 'text' ? this.selectItem.params : {}
      const { h, w } = Utility.defaultSize(type)

      /**
       * i  id
       * x  x轴坐标
       * y  y轴坐标
       * h  高度
       * w  宽度
       * minH 最小高度
       * type 组件类型
       * params 组件数据参数
       * styles 组件样式参数
       * title 组件标题
       */
      const params = {
        i: idStr,
        x: 0,
        y: this.layoutsNextY,
        h,
        w,
        type,
        params: Utility.chartParams(type, { aliasKey, appName }),
        styles: Utility.chartStyles(type),
        title: '',
        titleTip: '' // 标题提示描述信息
      }
      if (this.pluginKeys.includes(type) && type !== 'tab') {
        return Object.assign(params, { title: Utility.pluginTitle(type) })
      }
      // 非控件显示标题
      return Object.assign(params, { showTitle: true, title: Utility.chartTitle(type) })
    },
    async _index_init() {
      const Utility = this.Utility
      const { id: customizationKey } = this.$route.query
      if (!customizationKey) {
        Utility.setDocumentTitle('新建仪表板')
        this.GET_DASHBOARD_DATA({
          Data: '{}'
        })
        this.dashboardId = Utility.uuid()
        this.addItem('bar')
        return
      }
      Utility.setDocumentTitle('编辑仪表板')
      const result = await this.getDashboardData({ customizationKey })
      let layoutLen = 0
      if (result && result.Data) {
        const { global, layouts } = JSON.parse(result.Data)
        this.global = global
        this.layouts = layouts
        this.title = result.CustomizationTitle
        this.dashboardId = result.CustomizationKey
        this.currIdx = layouts.length
        layoutLen = layouts.length
      }
      if (layoutLen > 0) {
        this.clickSelectItem(this.layouts[layoutLen - 1].i)
      } else {
        this.$router.replace({ name: 'DashBoard', params: {} })
        // TODO: this.$root未执行
        this._index_init()
      }
    }
  },
  mounted() {
    const _root = this.$root
    _root.gridlayout = this.$refs.gridlayout
    _root.args = {}

    this._index_init()
  }
}
</script>
<style lang="less">
.dashboard {
  background-color: #e9e9e9;
  &:after {
    display: inherit;
    clear: both;
    content: ' ';
  }
  .chartBoard {
    position: relative;
    top: 0;
    left: 400px;
    width: ~'calc(100% - 400px)';
    .chartTools {
      display: inline-block;
      width: ~'calc(100% - 20px)';
      height: 45px;
      background-color: #fff;
      margin: 0 10px;
      .toolsNode {
        display: inline-block;
        padding: 10px 5px;
        cursor: pointer;
        .iconfont {
          transition: all 0.2s ease-in 0s;
          font-size: 20px;
        }
        &:hover .iconfont {
          transform: scale(1.3);
        }
        &:first-child {
          margin-left: 15px;
        }
      }
      .title {
        width: 250px;
        margin-left: 25%;
        &.v-input--default--focus.v-red {
          border-color: red;
          box-shadow: 0 1px 1px rgb(243, 88, 88, 0.6);
        }
      }
    }
    .charts {
      position: relative;
      width: 100%;
      padding-bottom: 5px;
      > .icon-fanhui {
        position: absolute;
        top: 10px;
        right: 20px;
        font-size: 28px;
        color: #fff;
        cursor: pointer;
      }
      &:after {
        display: inherit;
        clear: both;
        content: ' ';
      }
      .elItems {
        background-color: #fff;
        border: 1px solid transparent;
        position: relative;
        padding: 5px;
        &.elActive {
          border-color: #00c1de;
          box-shadow: 0 3px 10px #99ecf9;
        }
        &.hide {
          display: none;
        }
        .mouseHandler {
          /*position: absolute;*/
          top: -1px;
          left: 0;
          height: 20px;
          width: 100%; /* ~'calc(100% - 35px)';*/
          cursor: move;
          z-index: 1;
          background: transparent;
        }
        .gridTitle {
          display: inline-block;
          height: 22px;
          line-height: 22px;
          margin-left: 3px;
          font-size: 14px;
          z-index: 2;
          position: absolute;
          top: 1px;
          cursor: default;
        }
        .gridTip {
          position: absolute;
          right: 6px;
          top: 0;
          padding: 5px 5px 1px;
          z-index: 10001;
        }
      }
      .lazy-component {
        height: ~'calc(100% - 25px)';
      }
    }
  }
}
.v-popper {
  .gridTipUl {
    text-align: center;
    .tipli {
      width: 100%;
      display: inline-block;
      padding: 2px 10px;
    }
  }
}
</style>
