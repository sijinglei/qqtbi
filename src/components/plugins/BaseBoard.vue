<template>
  <div :id="item.i" @click.stop="clickItem" class="v-card-picker">
    <ul class="v-card-picker__list" v-if="datas.length">
      <li class="v-card-picker__item" v-for="(entity, index) in datas" :key="Utility.spliceKey('board',index)">
        <div class="customer-inner" v-if="item.styles.legendSelect==='bottom'">
          <span class="customer-inner-title">{{entity.key}}</span><br />
          <span class="customer-inner-value">{{entity.value}}</span>
        </div>
        <div class="customer-inner customer-inner-single-row" v-else-if="item.styles.legendSelect==='left'">
          <span class="customer-inner-value">{{entity.value}}</span>
          <span class="customer-inner-title">{{entity.key}}</span>
        </div>
        <div class="customer-inner customer-inner-single-row" v-else-if="item.styles.legendSelect==='right'">
          <span class="customer-inner-title">{{entity.key}}</span>
          <span class="customer-inner-value">{{entity.value}}</span>
        </div>
        <div class="customer-inner" v-else>
          <span class="customer-inner-value">{{entity.value}}</span><br />
          <span class="customer-inner-title">{{entity.key}}</span>
        </div>
      </li>
    </ul>
    <span v-else class="no-data"></span>
  </div>
</template>

<script>
import { mapActions } from 'vuex'
import { columnLabel, columnKey } from '@/utils/echartsDefault'
import _ from 'lodash'
import fNumeral from '@/utils/numFormat' // 数字格式化
export default {
  data() {
    return {
      element: null,
      chartObj: null,
      timer: null,
      defaultGlobal: {
        themeTabs: 0
      },
      datas: []
    }
  },
  props: {
    item: Object,
    global: Object
  },
  methods: {
    ...mapActions('dataset', ['getApiFieldData']),
    reset() {
      this.setBoardHeight()
    },
    reload() {
      this._baseBoard_getDataToOptions()
    },
    clickItem() {
      this.$emit('select', this.item.i)
    },
    setBoardHeight() {},
    _baseBoard_init() {
      if (!this.element) {
        this.element = document.getElementById(this.item.i)
      }
      // 定时获取宽高再初始化
      if (!this.element || this.element.clientHeight < 10) {
        this.timer = setTimeout(this._baseBoard_init, 200)
        return
      }
      this.timer && clearTimeout(this.timer)
      this._baseBoard_getDataToOptions()
    },
    async _baseBoard_getDataToOptions(notMerge = true) {
      const { item, global, Utility } = this
      let result = []
      const { params, i } = item
      const { fields = {} } = global
      const { aliasKey, appName, measure = [], dimension2 = [] } = params
      const globalFilter = Utility.resolveQueryParams(this.$route.query, fields, i)
      const args = this.$root.args[i] || []
      let data = []
      if (aliasKey && appName && measure.length > 0) {
        data = await this.getApiFieldData({ aliasKey, appName, params, globalFilter, args })
      }
      if (dimension2.length > 0) {
        // 有颜色图例/维度
        // 获取维度
        let dim2Key = dimension2[0][columnKey]
        const meaKey = measure.length > 0 ? measure[0][columnKey] : null
        const group = []
        for (let i = 0; i < data.length; i++) {
          const currItem = data[i]
          if (!_.isNull(dim2Key) && currItem[dim2Key] && !group.includes(currItem[dim2Key])) {
            group.push(currItem[dim2Key])
          }
        }
        // 获取对应度量
        for (let i = 0; i < group.length; i++) {
          const key = group[i]
          const valueItems = data.filter(s => s[dim2Key] === key)
          let value = _.sum(valueItems.map(v => v[meaKey]))
          result.push({
            key,
            value
          })
        }
      } else {
        // 没有颜色图例/维度
        for (let i = 0; i < measure.length; i++) {
          let value = _.sum(data.map(v => v[measure[i][columnKey]]))
          let format = measure[i]['formatData']
          if (format) {
            value = fNumeral.formatNumByRule(value, format)
          }
          result.push({
            key: measure[i][columnLabel],
            value
          })
        }
      }
      // 替换管理幅度，添加1:
      // for (let i = 0; i < result.length; i++) {
      //   if (_.includes(result[i][columnLabel], '管理幅度')) {
      //     result[i][columnKey] = '1:' + result[i][columnKey]
      //   }
      // }
      this.datas = result
      this.setBoardHeight()
    }
  },
  mounted() {
    this._baseBoard_init()
  }
}
</script>
<style>
.customer-inner {
  height: 40px;
  width: 100%;
  min-width: 80px;
  vertical-align: middle;
}
.customer-inner-title {
  font-weight: normal;
}
.customer-inner-value {
  font-weight: bold;
}
.customer-inner-single-row {
  height: 20px;
}
</style>