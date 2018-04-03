<template>
  <div class="selectStyles" ref="selectStyles" :style="{maxHeight: maxHeight+'px'}" v-scroll>
    <v-collapse v-model="selectedCollapse">
      <v-collapse-item text="标题" :value="1">
        <template slot="content">
          <slot name="title" />
        </template>
      </v-collapse-item>
      <v-collapse-item class="layoutContent" text="布局" :value="2">
        <template slot="content">
          <div class="rows">
            <v-checkbox v-if="verifyExist('horizontal')" v-model="styles.horizontal" label="横向" />
            <v-checkbox v-if="verifyExist('isStack')" v-model="styles.isStack" :disabled="stackDisabled" label="堆积" />
            <v-checkbox v-if="verifyExist('area')" v-model="styles.area" label="面积" />
            <v-checkbox v-if="verifyExist('gradient')" v-model="styles.gradient" label="渐变" />
            <v-checkbox v-if="verifyExist('smooth')" v-model="styles.smooth" label="曲线" />
            <v-checkbox v-if="verifyExist('xAxis')" v-model="styles.xAxis" label="显示X轴" />
            <v-checkbox v-if="verifyExist('yAxis')" v-model="styles.yAxis" label="显示Y轴" />
            <v-checkbox v-if="verifyExist('axisTitle')" v-model="styles.axisTitle" label="轴标题" />
            <v-checkbox v-if="verifyExist('rowHeaders')" v-model="styles.rowHeaders" label="显示序号" />
            <v-checkbox v-if="verifyExist('showPage')" v-model="styles.showPage" label="显示分页" />
            <v-checkbox v-if="verifyExist('columnResize')" v-model="styles.columnResize" label="列宽自定义" />
            <v-checkbox v-if="verifyExist('noBorder')" v-model="styles.noBorder" label="隐藏边框" />
            <v-checkbox v-if="verifyExist('showTitle')" v-model="styles.showTitle" label="显示字段标题" />
          </div>
          <div class="rows" v-if="verifyExist('mode')">
            <label class="rowsLable alignTop">显示模式</label>
            <v-radio-group vertical v-model="styles.mode">
              <v-radio v-for="(i,idx) in modeSet" :key="Utility.spliceKey('s','mode',idx)" name="modeRadio" :value="i.value">{{i.text}}</v-radio>
            </v-radio-group>
          </div>
          <div class="rows" v-if="verifyExist('multiple') && isShow">
            <label class="rowsLable alignTop">是否多选</label>
            <v-radio-group vertical v-model="styles.multiple">
              <v-radio name="multipleRadio" :value="1">多选</v-radio>
              <v-radio name="multipleRadio" :value="0">单选</v-radio>
            </v-radio-group>
          </div>
          <div class="rows" v-if="verifyExist('shape')">
            <label class="rowsLable labelMiddle">展示形状</label>
            <v-select :options="shapeOptions" v-model="styles.shape" />
          </div>
          <div class="rows" v-if="verifyExist('labelStyle')">
            <label class="rowsLable labelMiddle">标签样式</label>
            <v-select :options="labelStyleOptions" v-model="styles.labelStyle" />
          </div>
        </template>
      </v-collapse-item>
      <v-collapse-item class="designContent" text="设计" :value="3">
        <template slot="content">
          <div class="rows" v-if="verifyExist('legend')">
            <v-checkbox v-model="styles.legend" label="显示图例" />
            <v-select v-if="verifyExist('legendSelect')" :options="legendOptions" v-model="styles.legendSelect" />
          </div>
          <div class="rows" v-if="verifyExist('label')">
            <v-checkbox v-model="styles.label" label="显示标题" />
            <v-select v-if="verifyExist('labelSelect')" :options="labelOptions" v-model="styles.labelSelect" />
          </div>
          <div class="rows designNumber" v-show="verifyExist('alignment')">
            <label class="rowsLable labelMiddle">文本对齐</label>
            <v-select v-if="verifyExist('alignment')" :options="alignmentOptions" v-model="styles.alignment" />
          </div>
          <div class="rows designNumber" v-show="verifyExist('rowHeights')">
            <label class="rowsLable">行&nbsp;高&nbsp;度</label>
            <v-number-input v-model="styles.rowHeights" kind="step" :min="20" :max="100" />
          </div>
          <div class="rows designNumber" v-if="verifyExist('hollow') && styles.mode !== '1'">
            <label class="rowsLable">半径大小</label>
            <v-number-input v-model="styles.hollow" kind="step" :min="1" :max="60" />
          </div>
          <div class="rows designNumber" v-show="verifyExist('isBorder')">
            <v-checkbox v-model="styles.isBorder" label="显示边框" />
          </div>
        </template>
      </v-collapse-item>
      <v-collapse-item text="主题" :value="4" v-if="currThemes">
        <template slot="content">
          <div class="designThemes">
            <span class="themesTitle">背景： </span>
            <color-picker id="b_c_0" :value="currThemes.bgColor" @change="onBgColorChange" />
            <span class="themesTitle">标题： </span>
            <color-picker id="t_c_0" :value="currThemes.titleColor" @change="onTitleChange" />
            <div v-for="(c, i) in currThemes.colors" :key="i">
              <span class="themesTitle">{{i === 0 ? '主题： ' : ''}}</span>
              <color-picker :id="i" :value="c" @change="onChange" />
            </div>
            <span class="themesTitle" />
            <div class="colorPicker">
              <a class="colorsLink" href="javascript:;" @click="colorsLink()">添加</a>
              <a class="colorsLink" href="javascript:;" @click="colorsLink(-1)">删除</a>
            </div>
          </div>
        </template>
      </v-collapse-item>
    </v-collapse>
  </div>
</template>
<script>
import { themes } from '@/utils/echartsDefault'
import ColorPicker from '@/components/BaseColorPicker'
import _ from 'lodash'

export default {
  data() {
    return {
      selectedCollapse: [1, 2, 3, 4],
      stackDisabled: false,
      stylesData: {},
      legendOptions: [
        { text: '上', value: 'top' },
        { text: '下', value: 'bottom' },
        { text: '左', value: 'left' },
        { text: '右', value: 'right' }
      ],
      labelOptions: [
        { text: '上', value: 'top' },
        { text: '下', value: 'bottom' },
        { text: '左', value: 'left' },
        { text: '右', value: 'right' },
        { text: '内', value: 'inside' },
        { text: '内向左', value: 'insideLeft' },
        { text: '内向右', value: 'insideRight' },
        { text: '内向上', value: 'insideTop' },
        { text: '内向下', value: 'insideBottom' },
        { text: '内向左上', value: 'insideTopLeft' },
        { text: '内向左下', value: 'insideBottomLeft' },
        { text: '内向右上', value: 'insideTopRight' },
        { text: '内向右下', value: 'insideBottomRight' }
      ],
      alignmentOptions: [
        { text: '左对齐', value: 'htLeft' },
        { text: '居中对齐', value: 'htCenter' },
        { text: '右对齐', value: 'htRight' }
      ],
      labelStyleOptions: [
        { text: '关闭', value: 0 },
        { text: '标题', value: 1 },
        { text: '标题，值', value: 2 },
        { text: '标题，百分比', value: 3 },
        { text: '标题，值(百分比)', value: 4 }
      ],
      shapeOptions: [{ text: '多边形', value: 'polygon' }, { text: '圆形', value: 'circle' }],
      currThemes: null,
      isShow: false
    }
  },
  props: {
    type: String,
    item: Object,
    styles: Object,
    maxHeight: {
      type: Number,
      default: 100
    },
    global: Object
  },
  computed: {
    themesIdx() {
      const { themeTabs = 0 } = this.global || {}
      return themeTabs
    },
    modeSet() {
      let result = []
      switch (this.type) {
        case 'pie':
          result = [
            { value: 1, text: '默认' },
            { value: 2, text: '空心' },
            { value: 3, text: '半径玫瑰图' },
            { value: 4, text: '面积玫瑰图' }
          ]
          break
        default:
          result = [
            { value: 1, text: '复选' },
            { value: 2, text: '卡片' },
            { value: 5, text: '下拉框' },
            { value: 6, text: '单选按钮' },
            { value: 7, text: '日期范围选择' }
          ]
      }
      return result
    }
  },
  watch: {
    type(newVal) {
      this.stylesData = this.Utility.chartStyles(this.type)
    },
    item: {
      handler(newObj) {
        const themesObj = !newObj.styles.themes ? themes[this.themesIdx] : newObj.styles.themes

        this.setCurrThemes(themesObj)
      },
      deep: true
    },
    styles: {
      handler(newObj, oldObj) {
        let tempBool = newObj.mode === 2 || newObj.mode === 5
        this.isShow = tempBool
        // 假如是换图例，不继续执行
        if (Object.keys(newObj).length !== Object.keys(oldObj).length) {
          return
        }
        this.$emit('resetItem', this.type)
      },
      deep: true
    },
    global: {
      handler(newObj, oldObj) {
        if (!newObj) return

        if (!oldObj || newObj.themeTabs !== oldObj.themeTabs) {
          this.setCurrThemes(themes[this.themesIdx])
        }
      },
      deep: true
    }
  },
  components: {
    ColorPicker
  },
  methods: {
    verifyExist(val) {
      // 判断字段是否是图表需要
      const bool = this.stylesData[val] !== undefined
      // 判断字段是否包含在已有styles对象中,没有则添加
      if (bool && this.styles[val] === undefined) {
        this.$set(this.styles, val, this.stylesData[val])
      }
      return bool
    },
    setCurrThemes(obj) {
      this.currThemes = _.cloneDeep(obj)
    },
    setItemThemes() {
      this.$set(this.styles, 'themes', _.cloneDeep(this.currThemes))
    },
    onBgColorChange(id, color) {
      this.$set(this.currThemes, 'bgColor', color)
      this.setItemThemes()
    },
    onTitleChange(id, color) {
      this.$set(this.currThemes, 'titleColor', color)
      this.setItemThemes()
    },
    onChange(id, color) {
      this.$set(this.currThemes.colors, id, color)
      this.setItemThemes()
    },
    colorsLink(num = 1) {
      const { colors = [] } = this.currThemes
      const len = colors.length
      if (num === 1) {
        this.$set(colors, len, colors[len - 1])
      } else {
        this.$delete(colors, len - 1)
      }
      this.setItemThemes()
    }
  },
  mounted() {
    const { styles } = this
    let tempBool = styles.mode === 2 || styles.mode === 5
    this.isShow = tempBool
    this.stylesData = this.Utility.chartStyles(this.type)
    this.setCurrThemes(this.styles.themes || themes[this.themesIdx])
  }
}
</script>

<style lang="less">
.selectStyles {
  position: relative;
  font-size: 12px;
  .ps__scrollbar-x-rail {
    display: none !important;
  }
  .v-collapse-item {
    width: 99%;
    .v-checkbox {
      vertical-align: top;
      padding-top: 3px;
    }
    .v-collapse-item__header {
      height: 40px;
      padding: 15px 12px 0;
      .v-collapse-item__header__icon {
        float: left;
        margin-right: 5px;
      }
      .v-collapse-item__header__text {
        font-size: 14px;
        font-weight: bold;
      }
      &:after {
        content: '';
        float: right;
        width: 70%;
        margin-top: 10px;
        border-bottom: 1px solid #999;
      }
    }
    .v-collapse-item__content {
      padding: 0 10px;
    }
    .rows {
      margin-top: 3px;
      vertical-align: middle;
      .rowsLable {
        display: inline-block;
        vertical-align: middle;
        font-size: 12px;
      }
      .alignTop {
        vertical-align: top;
      }
      .labelMiddle {
        vertical-align: top;
        line-height: 30px;
      }
      .v-select {
        min-height: 30px;
        .v-select-list {
          font-size: 12px;
        }
        .v-select__header {
          padding: 0 10px 0 8px;
          line-height: 30px;
          font-size: 12px;
          .v-select__header-arrow.v-icon {
            top: 9px;
            right: 8px;
          }
        }
      }
      .v-radio-group {
        .v-radio-group-item {
          margin: 0 10px 5px 0;
        }
      }
    }
    &.layoutContent {
      .v-checkbox {
        min-width: 48.5%;
        font-size: 12px;
        .v-checkbox__label {
          margin-left: 3px;
        }
      }
      .v-select {
        width: 70%;
      }
    }
    &.designContent {
      .v-checkbox {
        min-width: 45%;
        font-size: 12px;
        .v-checkbox__label {
          margin-left: 3px;
        }
      }
      .v-select {
        width: 52%;
      }
      .designNumber {
        margin: 5px 0;
        .v-number-input--step__wrap {
          padding: 6px;
        }
        .v-number-input--step__input {
          width: 41px;
        }
        .v-number-input--step__input.core-input {
          margin: 2px;
        }
      }
    }
  }
  .designThemes {
    .themesTitle {
      display: inline-block;
      width: 25%;
    }
    .colorPicker {
      display: inline-block;
      margin: 3px 0;
      width: 70%;
      .colorsLink {
        font-size: 12px;
        color: #0067ed;
        &:hover {
          text-decoration: underline;
        }
      }
    }
  }
}
</style>
