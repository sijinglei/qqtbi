<template>
  <v-panel :open="visible" title="全局设置" :width="800" :mask-closable="false" @close="doColse">
    <div class="dbSettingBody" v-scroll:update>
      <span class="bodyTitle">默认主题</span>
      <div class="bodyContent">
        <template v-for="(t, tIdx) in themes">
          <div class="bodyThemes overflow" :class="{'active': compareActive(tIdx)}" :key="Utility.spliceKey('theme', tIdx)" :style="{backgroundColor:t.bgColor}" @click="switchThemes(tIdx)">
            <span class="bodySubThemes" v-for="(c, cIdx) in t.colors" :key="Utility.spliceKey('theme', 'sub' , cIdx)" :style="{backgroundColor: c}" />
          </div>
        </template>
      </div>
      <span class="bodyTitle">懒加载设置</span>
      <div class="bodyContent">
        <v-checkbox v-model="global.lazyload" label="启用懒加载"/>
      </div>
      <span class="bodyTitle">过滤参数
        <i class="iconfont icon-jiahao transition" @click="addParameter" title="添加" />
        <span class="tips">
          <span>(点击</span>
          <i class="iconfont icon-jiahao" />
          <span>添加字段，点击</span>
          <i class="iconfont icon-jianhao" />
          <span>删除字段，点击</span>
          <i class="iconfont icon-arrows-down" />
          <span>展开面板配置关联图表，点击</span>
          <i class="iconfont icon-dagou" />
          <span>可取消关联)</span>
        </span>
      </span>
      <div class="bodyContent">
        <v-collapse accordion v-model="collapseVal">
          <v-collapse-item v-for="(fp, fIdx) in fieldsParameter" :key="Utility.spliceKey('f','p',fIdx)" :value="fIdx">
            <div slot="header">
              <multiselect :options="allFields" :id="fIdx" :value="fp.value" :max-height="300" :label="fieldLabel" @click.native.stop="fieldsClick" placeholder="选择字段" selectLabel="点击或回车选中" selectedLabel="已选" deselectLabel="点击或回车取消" @select="fieldsSelect">
                <span slot="noResult">没有找到搜索字段，请改变搜索条件</span>
              </multiselect>
              <i class="iconfont icon-jianhao transition" @click.stop="deleteParameter(fIdx, fp)" title="删除" />
              <i class="iconfont icon-arrows-down" :class="{'transf0': switchIcon(fIdx)}" />
            </div>
            <div slot="content">
              <div class="chartItem" v-for="(c, cIdx) in fp.charts" :key="Utility.spliceKey('f','p',fIdx, cIdx)">
                <span class="chartTitle" @click="clickItem(c, fp.charts)">{{c.title}}</span>
                <i v-if="c.values && c.values.length > 0" class="iconfont icon-dagou transition" @click="delColumnsVal(fIdx, cIdx)" />
                <span v-if="c.values && c.values.length > 0">{{c.values}}</span>
                <v-select-list v-show="c.show" :options="c.columns" :maps="columnMaps" v-model="c.values">
                  <template slot="item" scope="props">
                    <span class="v-select-list__inner">{{props.item[columnLabel]}} | {{props.item[columnKey]}}</span>
                  </template>
                </v-select-list>
              </div>
            </div>
          </v-collapse-item>
        </v-collapse>
      </div>
    </div>
    <div class="dbSettingFooter">
      <v-button status="primary" @click="doSubmit">确定</v-button>
      <v-button status="default" @click="doColse">取消</v-button>
    </div>
  </v-panel>
</template>
<script>
import { mapActions } from 'vuex'
import { themes, columnKey, columnLabel } from '@/utils/echartsDefault'
import Multiselect from 'vue-multiselect'
import _ from 'lodash'
export default {
  data() {
    return {
      columnLabel,
      columnKey,
      themes,
      allFields: [],
      allCharts: [],
      fieldLabel: 'fieldLabel',
      collapseVal: [],
      fieldsParameter: [{ value: '' }], // 便于初始化显示
      columnMaps: {
        text: columnLabel,
        value: columnKey
      },
      global: {
        themeTabs: 0,
        lazyload: false
      }
    }
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    list: Array,
    options: Object
  },
  watch: {
    visible(val) {
      if (!val) return
      this._TheDbSetting_init()
    }
  },
  components: {
    Multiselect
  },
  methods: {
    ...mapActions('dataset', ['getApiFieldListResult']),
    compareActive(idx) {
      return this.global.themeTabs === idx
    },
    switchIcon(idx) {
      return this.collapseVal.includes(idx)
    },
    switchThemes(idx) {
      this.global.themeTabs = idx
    },
    doSubmit() {
      const fields = this._TheDbSetting_getParams()
      if (_.isEmpty(fields)) {
        delete this.global.fields
      } else {
        this.global.fields = fields
      }
      this.$emit('confirm', Object.assign({}, this.global))
    },
    doColse() {
      this.$emit('confirm')
    },
    async clickItem(item, parent) {
      for (let i = 0; i < parent.length; i++) {
        if (parent[i] !== item) parent[i].show = false
      }
      item.show = !item.show
    },
    delColumnsVal(fIdx, cIdx) {
      const fp = this.fieldsParameter
      if (fp[fIdx] && fp[fIdx].charts[cIdx]) {
        fp[fIdx].charts[cIdx].values = []
      }
    },
    fieldsClick() {
      // 触发原生事件阻止事件冒泡
    },
    fieldsSelect(item, idx) {
      this.fieldsParameter[idx].value = item
    },
    addParameter() {
      const newObj = {
        value: '',
        charts: _.cloneDeep(this.allCharts)
      }
      this.fieldsParameter.push(newObj)
    },
    deleteParameter(idx, item) {
      this.fieldsParameter.splice(idx, 1)
    },
    _TheDbSetting_getParams() {
      const parameter = this.fieldsParameter
      const fields = {}
      for (let p = 0; p < parameter.length; p++) {
        const { value, charts } = parameter[p]
        // 没有值和已存在的不加
        if (!value || fields[value[columnKey]]) continue

        const data = []
        for (let j = 0; j < charts.length; j++) {
          const { i, values } = charts[j]
          if (!values || values.length === 0) continue
          data.push({ i, values })
        }
        if (data.length > 0) fields[value[columnKey]] = data
      }
      return fields
    },
    async _TheDbSetting_initField() {
      const [keyArr, resultArr, fields, chartArr] = [[], [], [], []]
      const { list, fieldLabel } = this

      for (let l = 0; l < list.length; l++) {
        const { params, type, title, i } = list[l]
        const { aliasKey, appName } = params
        if (['text', 'frame'].includes(type) || !aliasKey || !appName) continue
        const chartObj = {
          i,
          title,
          columns: [],
          values: [],
          show: false
        }
        const spliceKey = this.Utility.spliceKey(aliasKey, appName)
        const arrIdx = keyArr.indexOf(spliceKey)
        // 已执行过查询的数据集
        if (arrIdx > -1) {
          chartObj.columns = _.cloneDeep(resultArr[arrIdx])
          chartArr.push(chartObj)
          continue
        }
        let result = await this.getApiFieldListResult({ aliasKey, appName, full: true })
        if (!result) continue

        keyArr.push(spliceKey)
        resultArr.push(result)

        chartObj.columns = _.cloneDeep(result)
        chartArr.push(chartObj)

        for (let j = 0; j < result.length; j++) {
          const obj = result[j]
          if (!fields.some(f => f[columnKey] === obj[columnKey])) {
            const fieldStr = obj[columnLabel] + ' | ' + obj[columnKey]
            fields.push(Object.assign({ [fieldLabel]: fieldStr }, obj))
          }
        }
      }
      this.allFields = fields
      this.allCharts = chartArr
      return chartArr
    },
    async _TheDbSetting_init() {
      const { options, global } = this
      const chartArr = await this._TheDbSetting_initField()
      // 初始化默认值
      if (options) {
        for (let [key, value] of Object.entries(options)) {
          global[key] = value
        }
      }
      this.fieldsParameter = []
      if (!global.fields) {
        const newObj = {
          value: '',
          charts: _.cloneDeep(chartArr)
        }
        this.fieldsParameter.push(newObj)
      } else {
        // 解析已有字段
        for (let [key, value] of Object.entries(global.fields)) {
          const keyObj = this.allFields.find(f => f[columnKey] === key)
          if (!keyObj) continue
          const charts = _.cloneDeep(chartArr)
          for (let v = 0; v < value.length; v++) {
            const { i, values } = value[v]
            for (let c = 0; c < charts.length; c++) {
              if (charts[c].i === i) {
                charts[c].values = values
                continue
              }
            }
          }
          const newObj = {
            value: keyObj,
            charts
          }
          this.fieldsParameter.push(newObj)
        }
      }
    }
  },
  mounted() {
    if (this.visible) this._TheDbSetting_init()
  }
}
</script>

<style lang="less">
.v-panel {
  .dbSettingBody {
    position: relative;
    padding: 5px 20px;
    text-align: left;
    height: 640px;
    max-height: 640px;
    .iconfont.transition {
      transition: all 0.2s ease-in 0s;
      cursor: pointer;
      &:hover {
        transform: scale(1.2);
      }
    }
    .bodyTitle {
      display: inline-block;
      font-size: 16px;
      border-left: 3px solid #2c8fea;
      padding-left: 5px;
      margin: 10px 0;
      &:first-child {
        margin-top: 0;
      }
      > .icon-jiahao {
        font-size: 18px;
        position: absolute;
        right: 50px;
      }
      .tips {
        display: inline-block;
        font-size: 12px;
        color: #777;
        .iconfont {
          font-size: 14px;
          color: #333;
          &.icon-dagou {
            color: #008800;
          }
        }
      }
    }
    .bodyContent {
      position: relative;
      .bodyThemes {
        display: inline-flex;
        flex-wrap: wrap;
        justify-content: space-between;
        margin: 3px 10px 3px 0;
        width: 32%;
        height: 34px;
        padding: 5px;
        border: 1px solid #eee;
        cursor: pointer;
        .bodySubThemes {
          display: inline-block;
          height: 16px;
          width: 16px;
          margin: 3px 2px;
          border: 1px solid transparent;
        }
        &:hover {
          border-color: #ddd;
        }
        &.active {
          border-color: #00c1de;
        }
      }
      .multiselect {
        width: 85%;
        display: inline-block;
        min-height: 36px;
      }
      .v-collapse-item {
        .v-collapse-item__header {
          padding: 5px 5px 0;
          height: 48px;
        }
        .v-collapse-item__content {
          padding: 0 15px;
          .chartItem {
            .chartTitle {
              font-size: 13px;
              font-weight: bold;
              cursor: pointer;
            }
            .icon-dagou {
              margin-left: 10px;
              font-size: 13px;
              color: #008800;
              cursor: pointer;
            }
            .v-select-list {
              border-left: 1px dashed #bbb;
              border-bottom: 1px dashed #bbb;
              .v-select-list__item {
                min-height: 24px;
                .v-select-list__inner {
                  font-size: 12px;
                  line-height: 24px;
                  margin: 3px 0 3px 6px;
                }
              }
            }
          }
        }
      }
      .icon-jianhao {
        vertical-align: top;
        margin-top: 7px;
        margin-left: 10px;
      }
      .icon-arrows-down {
        vertical-align: top;
        margin-top: 7px;
        margin-left: 30px;
      }
    }
  }
  .dbSettingFooter {
    position: absolute;
    width: 100%;
    bottom: 1px;
    height: 50px;
    text-align: right;
    padding: 0 15px;
    .v-button {
      margin-right: 10px;
    }
  }
}
</style>
