<template>
  <div :id="item.i" @click.stop="clickItem" />
</template>
<script>
import { mapActions } from 'vuex'
import echarts from 'echarts'
import eConfigs from '@/utils/echarts'
import { bus } from '@/utils/bus.js'
import _ from 'lodash'

export default {
  data() {
    return {
      element: null,
      chartObj: null,
      argsArr: {},
      timer: null
    }
  },
  props: {
    item: Object,
    global: Object
  },
  computed: {
    resetIcon() {
      return [
        'path://M656.807 675.478h-360.94v103.93c0 37.82-26.05 52.047-57.862 31.621L44.373',
        '686.811c-31.867-20.426-31.867-53.822 0-74.22l193.632-124.245c31.84-20.426',
        '57.862-6.172 57.862 31.648V606.72h343.737c189.863 0 292.181-85.142 292.181-274.978',
        '0-144.015-56.47-274.978-292.181-274.978H158.378c-0.219 0-0.41-0.137-0.628-0.164-0.518',
        '0.028-1.01 0.164-1.53 0.164-23.729 0-42.954-19.251-42.954-42.98s19.223-42.954',
        '42.954-42.954c0.518 0 1.01 0.137 1.53 0.164 0.219 0 0.41-0.164 0.628-0.164h498.429c189.863',
        '0 343.737 119.521 343.737 309.357v103.11c0 189.863-153.873 292.181-343.737 292.181z m0 0z'
      ].join(' ')
    }
  },
  methods: {
    ...mapActions('dataset', ['getApiFieldData']),
    reset() {
      this.chartObj && this.chartObj.resize()
    },
    toDataURL(type = 'image/png') {
      if (!this.chartObj) return null
      return this.chartObj.getDataURL(type)
    },
    reload() {
      if (!this.chartObj) {
        this._baseCharts_init()
        return
      }
      this._baseCharts_getDataToOptions()
    },
    clickItem() {
      this.$emit('select', this.item.i)
    },
    _baseCharts_init() {
      if (!this.element) {
        this.element = document.getElementById(this.item.i)
      }
      // 定时获取宽高再初始化
      if (!this.element || this.element.clientHeight < 10) {
        this.timer = setTimeout(this._baseCharts_init, 200)
        return
      }
      this.timer && clearTimeout(this.timer)

      if (!this.chartObj) {
        this.chartObj = echarts.init(this.element)
      }
      this._baseCharts_getDataToOptions(false)
    },
    async _baseCharts_getDataToOptions(notMerge = true) {
      const { item, global, Utility, resetIcon: icon, chartObj } = this
      const { params, high = {}, i, type } = item
      const { themeTabs = 0, fields = {} } = global
      const globalFilter = Utility.resolveQueryParams(this.$route.query, fields, i)
      const { aliasKey, appName, measure = [], dimension = [], measure2 = [] } = params
      const { args } = this.$root
      const argsArr = args[i] || []

      chartObj.showLoading()
      let data = []
      const bool =
        aliasKey &&
        appName &&
        measure.length > 0 &&
        ((!['scatter'].includes(type) && dimension.length > 0) || (['scatter'].includes(type) && measure2.length > 0))

      if (bool) {
        data = await this.getApiFieldData({ aliasKey, appName, params, globalFilter, args: argsArr })
      }
      const options = eConfigs.getConfig(data, themeTabs, item)
      // 工具栏添加返回按钮
      if (argsArr.some(a => a.type === 0)) {
        const myReset = {
          show: true,
          title: '返回',
          icon,
          onclick: e => {
            args[i] = argsArr.filter(a => a.type !== 0)
            this.reload()
          }
        }
        if (options.toolbox) {
          options.toolbox.feature.myReset = myReset
        } else {
          options.toolbox = {
            feature: {
              myReset
            }
          }
        }
      }

      if (notMerge) {
        chartObj.setOption(options, notMerge)
      } else {
        chartObj.setOption(options)
      }
      // 高级互动事件
      if (Object.keys(high).length > 0) {
        this._baseCharts_initHigh(high)
      } else {
        chartObj.off('click')
      }
      if (data.length) {
        chartObj.hideLoading()
      } else {
        chartObj.showLoading('default', {
          text: '暂无数据',
          color: '#fff',
          textColor: '#000',
          maskColor: 'rgba(255, 255, 255, 1)',
          zlevel: 0
        })
      }
    },
    _baseCharts_initHigh(highObj) {
      const argsArr = {}
      // 对存储字段解析
      for (let [key, value] of Object.entries(highObj)) {
        for (let [subKey, subValue] of Object.entries(value)) {
          if (subValue !== '') {
            if (!argsArr[subKey]) argsArr[subKey] = {}

            argsArr[subKey][key] = subValue
          }
        }
      }
      if (_.isEmpty(argsArr)) return

      this.argsArr = argsArr
      // 定义字段
      const handler = this.item.type === 'pie' ? this._baseCharts_pieClickHandler : this._baseCharts_clickHandler
      this.chartObj.off('click')
      this.chartObj.on('click', handler)
    },
    _baseCharts_pieClickHandler(params) {
      const { selected, data = [] } = params.data
      if (data.length === 0) return
      const source = data[0]
      const { argsArr } = this
      for (const [key, value] of Object.entries(argsArr)) {
        if (!selected) {
          bus.$emit('reloadChart', key)
          continue
        }
        const args = []
        for (const [argKey, argValue] of Object.entries(value)) {
          if (source[argKey]) {
            args.push({ columns: argValue, operator: 'eq', value: source[argKey], type: 0 })
          }
        }
        bus.$emit('reloadChart', key, args)
      }
    },
    _baseCharts_clickHandler(params) {
      const { data = [] } = params.data
      if (data.length === 0) return
      const source = data[0]
      for (const [key, value] of Object.entries(this.argsArr)) {
        const args = []
        for (const [argKey, argValue] of Object.entries(value)) {
          if (source[argKey]) {
            // type = 0 为关联事件参数
            args.push({ columns: argValue, operator: 'eq', value: source[argKey], type: 0 })
          }
        }
        bus.$emit('reloadChart', key, args)
      }
    }
  },
  mounted() {
    // 防止第一次加载宽度为初始化
    setTimeout(() => {
      this._baseCharts_init()
    }, 0)
  }
}
</script>

