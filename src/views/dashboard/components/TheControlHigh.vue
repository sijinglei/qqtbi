<template>
  <div class="selectHigh">
    <div class="nav-area">
      <span class="highTitle">导航设置-{{item.type === 'text' ? item.html.replace(reg, "") : item.title}}</span>
      <v-select placeholder="请选择所属导航" :disabled="!item.i" :options="navs" v-model="item.navParent" :maps="map" />
      <v-input v-model="item.navTitle" placeholder="导航标题">
      </v-input>
    </div>
    <div v-if="hasRelated" style="position: relative;" :style="{height: (maxHeight - 112) + 'px'}" v-scroll>
      <span class="highTitle">互动关联</span>
      <v-collapse accordion v-model="selectCollapse">
        <v-collapse-item v-for="(column, sIdx) in sourceData" :key="Utility.spliceKey('s', 'i', sIdx)" :value="sIdx">
          <div class="highColumn txtOverflow" slot="header" :title="'源字段 - '+column[columnLabel]">
            <span>源字段 -</span>
            <span class="blue">{{column[columnLabel]}}</span>
            <i class="iconfont icon-arrows-down" :class="{'transf0': switchIcon(sIdx)}" />
          </div>
          <template slot="content">
            <div class="chartItem" v-for="(c, cIdx) in column.charts" :key="Utility.spliceKey('s', 'c', cIdx)">
              <span class="chartTitle txtOverflow" @click="clickItem(sIdx, cIdx)" :title="c.title">{{c.title}}</span>
              <i v-if="c.values" class="iconfont icon-dagou transition" @click="delColumnsVal(sIdx, cIdx)" />
              <v-select-list v-show="c.show" :options="c.columns" :maps="columnMaps" v-model="c.values" @change="columnChange" />
            </div>
          </template>
        </v-collapse-item>
      </v-collapse>
      <span class="noData" v-if="!item.high">暂无相关控制关系</span>
    </div>
  </div>
</template>
<script>
import { columnKey, columnLabel } from '@/utils/echartsDefault'
import { mapActions, mapState, mapGetters } from 'vuex'
import _ from 'lodash'
export default {
  data() {
    return {
      columnKey,
      columnLabel,
      sourceData: [],
      selectCollapse: [],
      hasRelated: true,
      columnMaps: {
        text: columnLabel,
        value: columnKey
      },
      map: {
        text: 'navTitle',
        value: 'navId'
      },
      reg: /<(?:.|\s)*?>/g
    }
  },
  props: {
    item: Object,
    list: Array,
    maxHeight: {
      type: Number,
      default: 100
    }
  },
  computed: {
    ...mapGetters('dashboard', ['navs']),
    ...mapState('dashboard', ['fromJsonData'])
  },
  watch: {
    item: {
      handler(newObj, oldObj) {
        if (newObj.i !== oldObj.i) {
          this.selectCollapse = []
          if (this.isTypeHasRelated(newObj.type)) {
            this.hasRelated = true
            this._theControlHigh_init()
          } else {
            this.hasRelated = false
          }
        }
      },
      deep: true
    }
  },
  methods: {
    ...mapActions('dataset', ['getApiFieldListResult']),
    switchIcon(idx) {
      return this.selectCollapse.includes(idx)
    },
    isTypeHasRelated(type) {
      // 看板 过滤组件 查询组件 Echarts组件有互动关联
      // board filters query
      return !['text', 'table', 'crosstabs', 'frame', 'treegrid'].includes(type)
    },
    delColumnsVal(sIdx, cIdx) {
      const fp = this.sourceData
      if (fp[sIdx] && fp[sIdx].charts[cIdx]) {
        fp[sIdx].charts[cIdx].values = ''
      }
    },
    columnChange() {
      const highData = {}
      for (let i = 0; i < this.sourceData.length; i++) {
        const column = this.sourceData[i]
        const highKey = column[columnKey]
        highData[highKey] = {}
        for (let j = 0; j < column.charts.length; j++) {
          const { i: id, values } = column.charts[j]
          if (values) {
            highData[highKey][id] = values
          }
        }
        if (Object.keys(highData[highKey]).length === 0) {
          delete highData[highKey]
        }
      }
      if (Object.keys(highData).length > 0) {
        this.$emit('changeHigh', highData)
      } else {
        this.$emit('changeHigh')
      }
    },
    async clickItem(sIdx, cIdx) {
      const columnObj = this.sourceData[sIdx]
      const obj = columnObj.charts[cIdx]
      const { aliasKey, appName } = obj
      // const selectedArr = this._theControlHigh_getSelectedFields(sIdx, cIdx)
      // TODO: 后期可能在获取字段需要添加权限
      // const { deptid } = this.$route.query
      const result = await this.getApiFieldListResult({ aliasKey, appName, full: true })
      const data = result.map(s => {
        // s.disabled = selectedArr.includes(s[columnKey])
        return s
      })
      obj.columns = _.cloneDeep(data)
      obj.show = !obj.show

      this.$set(this.sourceData, sIdx, columnObj)
    },
    _theControlHigh_getSelectedFields(sIdx, cIdx) {
      const result = []
      for (let i = 0; i < this.sourceData.length; i++) {
        if (i === sIdx) continue
        const { charts } = this.sourceData[i]
        const { values } = charts[cIdx]
        if (values !== '' && !result.includes(values)) {
          result.push(values)
        }
      }
      return result
    },
    _theControlHigh_init() {
      const { i: id, params, high = {} } = this.item
      // 过滤掉text frame组件
      let data = this.list.filter(l => l.type !== 'text' && l.type !== 'frame' && l.i !== id)

      let chartArr = []

      data.map(d => {
        if (d.type === 'tab') {
          const tabLayoutData = d.params.tabLayouts
          tabLayoutData.map(tab => {
            const { layouts } = tab
            const layoutsData = layouts.filter(l => l.type !== 'text' && l.type !== 'frame' && l.i !== id)
            layoutsData.map(dd => {
              chartArr.push({
                i: dd.i,
                title: dd.title,
                type: dd.type,
                aliasKey: dd.params.aliasKey,
                appName: dd.params.appName,
                columns: [],
                values: '',
                show: false
              })
            })
          })
        } else {
          chartArr.push({
            i: d.i,
            title: d.title,
            type: d.type,
            aliasKey: d.params.aliasKey,
            appName: d.params.appName,
            columns: [],
            values: '',
            show: false
          })
        }
      })
      // const chartArr = data.map(d => {
      //   const { aliasKey, appName } = d.params
      //   if (d.type === 'tab') {
      //     data = d.params.tabLayouts.filter(l => l.type !== 'text' && l.type !== 'frame' && l.i !== id)
      //   }
      //   return {
      //     i: d.i,
      //     title: d.title,
      //     type: d.type,
      //     aliasKey,
      //     appName,
      //     columns: [],
      //     values: '',
      //     show: false
      //   }
      // })
      const { dimension = [], dimension2 = [], blend = [] } = params
      const source = [...dimension, ...dimension2, ...blend]
      for (let i = 0; i < source.length; i++) {
        const column = source[i]
        column.charts = []
        const highColumn = high[column[columnKey]]
        if (!highColumn) {
          column.charts = _.cloneDeep(chartArr)
          continue
        }
        for (let j = 0; j < chartArr.length; j++) {
          const chartObj = _.cloneDeep(chartArr[j])
          if (highColumn[chartObj.i]) {
            chartObj.values = highColumn[chartObj.i]
          }
          column.charts.push(chartObj)
        }
      }
      console.log('hige数据')
      console.log(high)
      this.sourceData = source
    }
  },
  mounted() {
    if (this.isTypeHasRelated(this.item.type)) {
      this.hasRelated = true
      this._theControlHigh_init()
    } else {
      this.hasRelated = false
    }
  }
}
</script>
<style lang="less">
.selectHigh {
  position: relative;
  .nav-area {
    padding: 0 10px;
    .highTitle {
      padding-left: 0;
      padding-right: 0;
    }
    .v-select,
    .v-input {
      width: 100%;
    }
    .v-select__header {
      height: 38px;
      padding-left: 8px;
    }
  }
  .highTitle {
    display: inline-block;
    width: 100%;
    font-size: 16px;
    font-weight: bold;
    padding: 3px 10px;
    margin-top: 15px;
  }
  .highBody {
    margin-top: 10px;
    padding-left: 15px;
  }
  .v-collapse {
    min-width: 198px;
    .v-collapse-item {
      width: 100%;
      .v-collapse-item__header {
        position: relative;
        padding: 5px 15px;
        height: 26px;
        .highColumn {
          width: 90%;
          font-size: 12px;
          font-weight: bold;
          .blue {
            font-style: italic;
          }
          .icon-arrows-down {
            position: absolute;
            font-size: 14px;
            top: 6px;
            right: 10px;
          }
        }
      }
      .v-collapse-item__content {
        padding: 5px 20px 0;
        .chartItem {
          position: relative;
          .chartTitle {
            display: inline-block;
            width: 90%;
            min-height: 18px;
            font-size: 12px;
            font-weight: bold;
            cursor: pointer;
          }
          .icon-dagou {
            position: absolute;
            margin-left: 3px;
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
                line-height: 24px;
                margin: 3px 0 3px 5px;
                .v-checkbox__label {
                  margin-left: 5px;
                }
              }
            }
          }
        }
      }
    }
  }

  .noData {
    display: inline-block;
    margin: 10px;
  }
}
</style>

