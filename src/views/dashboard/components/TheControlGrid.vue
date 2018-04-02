<template>
  <div class="charts" ref="tabChartBoard">
    <grid-layout :layout="layouts" :col-num="24" :row-height="1" :is-draggable="draggable" :is-resizable="isNoView" :use-css-transforms="true" :vertical-compact="true" :margin="[10, 10]" ref="gridTablayout">
      <template v-for="item in layouts">
        <grid-item :key="item.i" :x="item.x" :y="item.y" :w="item.w" :h="item.h" :i="item.i" class="elItems" :style="{backgroundColor: getThemes(item).bgColor}" :class="{'elActive': selectItem && item.i === selectItem.i && isSelected }" @moved="movedEvent" @resized="resizedItem">
          <!-- 组件标题描述信息  :disabled="item.titleTip==''&& item.showTitle"-->
          <!-- <v-tip kind="large" :ref="Utility.spliceKey('tipTitle',item.i)" placement="right-start" :disabled="item.titleTip==''&& item.showTitle">
            <p v-text="item.titleTip"></p>
          </v-tip> -->
          <!-- 组件标题实现 -->
          <!-- <div class="gridTitle" v-tip.hover.delay="Utility.spliceKey('tipTitle',item.i)" v-if="item.showTitle" :style="{color: getThemes(item).titleColor}">{{item.title}}
            <i class="iconfont icon-tishi blue" v-tip.hover.delay="Utility.spliceKey('tipTitle',item.i)" v-if="item.titleTip != ''"></i>
          </div> -->
          <div class="gridTitle" v-if="item.showTitle" :style="{color: getThemes(item).titleColor}">{{item.title}}
            <i v-if="item.titleTip != ''" class="iconfont icon-tishi blue" :title="item.titleTip"></i>
          </div>
          <!-- 组件拖拽 -->
          <div v-if="isNoView" class="mouseHandler" @mousemove.stop="mouseHandler(0)" @mouseout="mouseHandler(1)" @click.stop="clickSelectItem(item.i)">
            <!-- 组件操作按钮 -->
            <div class="gridTip">
              <v-tip kind="large" :ref="Utility.spliceKey('tip', item.i)" placement="left-start">
                <ul class="gridTipUl">
                  <li class="tipLi" v-if="isCharts(item.type)" @click.stop="clickChartExport(item)">导出为图片</li>
                  <li class="tipLi" @click.stop="clickDeleteItem(item)">删除</li>
                </ul>
              </v-tip>
              <i class="iconfont icon-shenglve" v-tip.hover.delay="Utility.spliceKey('tip', item.i)" />
            </div>
          </div>
          <!-- 组件加载 -->
          <lazy-component class="lazy-component">
            <base-pluginstab :global="global" :item="item" @selectTab="clickSelectItem" />
          </lazy-component>
        </grid-item>
      </template>
    </grid-layout>
  </div>
</template>
<script>
import { mapState } from 'vuex'
import { GridLayout, GridItem } from 'vue-grid-layout'
import { themes } from '@/utils/echartsDefault'
import BasePluginstab from '@/components/plugins/indexTab'
export default {
  data() {
    return {
      themes,
      mouseTimer: null,
      dashboardId: null,
      // selectItem: null,
      isFull: false,
      draggable: false,
      isTitleEmpty: false
    }
  },
  props: {
    layouts: Array,
    global: Object
  },
  computed: {
    ...mapState({ selectItem: 'selectTabItem' }),
    themesIdx() {
      const { themeTabs = 0 } = this.global
      return themeTabs
    },
    isSelected() {
      return this.$store.state.isSelected
    },
    isNoView() {
      return !(this.$route.path.indexOf('view') > -1)
    }
  },
  watch: {
    title() {
      this.isTitleEmpty = this.title.trim() === ''
    },
    'selectItem.showTitle'(newV, oldV) {
      // this.$nextTick(() => {
      //   this._index_elementDoc(this.selectItem.i, el => el.reset())
      // })
    }
  },
  components: {
    GridLayout,
    GridItem,
    BasePluginstab
  },
  methods: {
    getThemes(item) {
      if (item.styles && item.styles.themes) return item.styles.themes
      return themes[this.themesIdx]
    },
    isCharts(type) {
      return !['text', 'table', 'crosstabs', 'treegrid', 'query', 'filters', 'frame'].includes(type)
    },
    doReset() {
      const { layouts } = this
      for (let i = 0; i < layouts.length; i++) {
        this._index_elementDoc(layouts[i].i, el => el.reset())
      }
    },
    mouseHandler(bool) {
      if (!this.isFull) this.draggable = !bool
    },
    movedEvent() {
      this.$emit('reset')
    },
    clickSelectItem(id) {
      // this.draggable = false
      // 鼠标选中事件
      let item = this.layouts.find(l => l.i === id)
      if (item) {
        this.selectItem = item
        this.$emit('selectTab', item)
      }
    },
    clickDeleteItem(obj) {
      const { layouts } = this
      // 删除事件
      const index = layouts.findIndex(l => obj.i === l.i)
      this.layouts.splice(index, 1)
      // 重新选中
      if (this.layouts.length > 0) {
        this.clickSelectItem(this.layouts[0].i)
      }
      this.$nextTick(() => {
        this.$emit('reset')
      })
    },
    clickChartExport(obj) {
      const urlPath = this._index_elementDoc(obj.i, el => el.toDataURL())
      if (!urlPath) return
      const _root = this.$refs.tabChartBoard
      const link = document.createElement('a')
      link.href = urlPath
      link.download = obj.title + '.png'
      _root.appendChild(link)
      link.click()
      _root.removeChild(link)
    },
    resizedItem(i) {
      // 重新刷新
      this.$nextTick(() => {
        this._index_elementDoc(i, el => el.reset())
        this.$emit('reset')
      })
    },
    _index_elementDoc(id, callback) {
      const _el = this.Utility.findComp(this.$refs.gridTablayout, id)
      if (_el) {
        return callback(_el)
      }
    }
  }
}
</script>
<style lang="less">
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
