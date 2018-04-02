<template>
  <div :id="item.i" class="baseTable" @click.stop="clickItem">
    <i class="iconfont icon-fanhui" :class="{'hide': !showBacktrack}" @click.stop="backtrackHandler" title="返回" />
    <hot-table :root="Utility.spliceKey('hsc', item.i)" :ref="Utility.spliceKey('hsc', item.i)" :class="{'noBorder': noBorder}" :settings="hotSettings" :readOnly="true" :rowHeaders="rowHeaders" />
    <v-pagination v-if="showPage" @change="onChange" :total="source.length" />
  </div>
</template>

<script>
import { mapActions } from 'vuex'
import { columnKey, columnLabel, columnFormatData, fieldClickConfig } from '@/utils/echartsDefault'
import HotTable from 'vue-handsontable-official'
import fNumeral from '@/utils/numFormat'
import openDialog from '@/utils/openDialog'
export default {
  data() {
    return {
      element: null,
      el: null,
      showBacktrack: false,
      hotTable: null,
      timer: null,
      rowHeaders: false,
      showPage: false,
      noBorder: false,
      pageCount: 15,
      source: [],
      hiddenColumns: [], // 储存需要隐藏的列索引
      hotSettings: {
        colHeaders: [],
        data: [],
        columnSorting: true,
        height: 0,
        stretchH: 'all',
        currentHeaderClassName: '',
        className: 'htCenter',
        rowHeights: 23,
        manualColumnResize: false,
        afterOnCellMouseDown: function(event, coords, tdObj) {
          let tdVal = String(this.getValue())
          if (coords.row !== -1 && tdVal.indexOf('blue') > 0) {
            this.deselectCell()
            openDialog.open(tdVal)
          }
        }
      }
    }
  },
  props: {
    item: Object,
    global: Object
  },
  computed: {
    pageHeight() {
      return this.showPage ? 35 : 0
    }
  },
  components: {
    HotTable
  },
  methods: {
    ...mapActions('dataset', ['getApiFieldData']),
    reset() {
      this.hotSettings.height = this.element.clientHeight - this.pageHeight
    },
    reload() {
      this._baseTable_initData()
    },
    clickItem() {
      this.$emit('select', this.item.i)
    },
    backtrackHandler() {
      const { i } = this.item
      const { args } = this.$root
      const argArr = args[i] || []
      args[i] = argArr.filter(a => a.type !== 0)

      this.reload()
    },
    onChange(current, count) {
      this.pageCount = count
      const start = current === 1 ? 0 : (current - 1) * count
      const end = current * count
      const sourceArr = this.source.slice(start, end)

      this.hotSettings.data = sourceArr
      this._baseTable_initStyles()
    },
    _baseTable_getColHeaders() {
      const { params } = this.item
      const { dimension = [], measure = [] } = params
      let colHeads = []
      let columns = []
      let hiddenColumns = []
      let linkColKeys = []
      for (let i = 0; i < dimension.length; i++) {
        let format = dimension[i][columnFormatData]
        if (format && format.tip) {
          colHeads.push(this.Utility.setHeadTip(dimension[i][columnLabel], format.tip))
        } else {
          colHeads.push(dimension[i][columnLabel])
        }
      }

      for (let i = 0; i < measure.length; i++) {
        let format = measure[i][columnFormatData]
        if (format && format.tip) {
          colHeads.push(this.Utility.setHeadTip(measure[i][columnLabel], format.tip))
        } else {
          colHeads.push(measure[i][columnLabel])
        }
      }
      // 弹框事件处理
      const mergeData = [...dimension, ...measure]
      for (let i = 0; i < mergeData.length; i++) {
        // 列字段 :TODO(判断是否可以点击)
        const config = mergeData[i][fieldClickConfig]
        const visible = mergeData[i]['Visible']
        if (!visible) {
          // 隐藏列
          columns.push({})
          hiddenColumns.push(i)
          continue
        }
        if (config && config.url !== '') {
          linkColKeys.push(mergeData[i][columnKey])
          columns.push({ data: mergeData[i][columnKey], renderer: 'html', className: 'htBlue_SJL' })
        } else {
          columns.push({ data: mergeData[i][columnKey] })
        }
      }
      if (hiddenColumns.length > 0) {
        columns = columns.filter((val, idx) => {
          return !hiddenColumns.includes(idx)
        })
        colHeads = colHeads.filter((val, idx) => {
          return !hiddenColumns.includes(idx)
        })
      }
      this.linkColumnKey = linkColKeys
      this.hiddenColumns = hiddenColumns
      this.hotSettings.columns = columns
      this.hotSettings.colHeaders = colHeads
    },
    async _baseTable_getData() {
      const { params, i } = this.item
      const { aliasKey, appName, dimension = [], measure = [] } = params
      const { fields = {} } = this.global
      const globalFilter = this.Utility.resolveQueryParams(this.$route.query, fields, i)
      const args = this.$root.args[i] || []
      let data = []
      if (aliasKey && appName && (dimension.length > 0 || measure.length > 0)) {
        data = await this.getApiFieldData({ aliasKey, appName, params, globalFilter, args })
      }
      this.showBacktrack = args.length > 0
      if (!data) {
        this.hotSettings.data = []
        return
      }

      // var numArr = []
      const mergeData = [...dimension, ...measure]

      let sourceArr = data.map((item, idx) => {
        let dataObj = {}
        for (let i = 0; i < mergeData.length; i++) {
          let columnVal = item[mergeData[i][columnKey]]
          let format = mergeData[i][columnFormatData]
          if (format) {
            if (format.timeFomat && format.timeFomat !== '') {
              columnVal = fNumeral.formatTimeByRule(columnVal, format)
            } else {
              columnVal = fNumeral.formatNumByRule(columnVal, format)
            }
          }
          // TODO: 判断是否有点击事件
          if (this.linkColumnKey.includes(mergeData[i][columnKey])) {
            let propVal = ''
            const config = mergeData[i][fieldClickConfig]
            if (config && config.url !== '') {
              config.params.map((key, idex) => {
                propVal += '&' + key + '=' + item[key]
              })
            }
            const title = config.title || '弹出窗口'
            propVal = propVal.substring(1)
            columnVal = `<a href="javascript:;" class="blue click" data-title="${title}" data-params="${propVal}" data-url="${
              config.url
            }">${columnVal}</a>`
          }
          dataObj[mergeData[i][columnKey]] = columnVal
        }
        return dataObj
      })
      if (this.showPage) {
        this.source = sourceArr
        sourceArr = sourceArr.slice(0, this.pageCount)
      }
      this.hotSettings.data = sourceArr
    },
    _baseTable_init() {
      if (!this.element) {
        const { i } = this.item
        this.element = document.getElementById(i)
        this.el = this.$refs[this.Utility.spliceKey('hsc', i)].table
      }
      // 定时获取宽高再初始化
      if (!this.element || this.element.clientHeight < 10) {
        this.timer = setTimeout(this._baseTable_init, 200)
        return
      }
      this.timer && clearTimeout(this.timer)
      this._baseTable_initData()
    },
    _baseTable_initData() {
      this._baseTable_initStyles()
      this._baseTable_getColHeaders()
      this._baseTable_getData()
    },
    _baseTable_initStyles() {
      const {
        rowHeights,
        alignment,
        rowHeaders = false,
        showPage = false,
        noBorder = false,
        columnResize = false
      } = this.item.styles

      this.noBorder = noBorder
      this.showPage = showPage
      this.rowHeaders = rowHeaders
      this.hotSettings.className = alignment === 'htLeft' ? '' : alignment
      this.hotSettings.manualColumnResize = columnResize
      if (rowHeights) this.hotSettings.rowHeights = rowHeights + 'px'

      const _htLeft = this.element.getElementsByClassName('ht_clone_left')
      this.Utility.addClass(_htLeft[0], 'hide', !rowHeaders)
      this.hotSettings.height = this.element.clientHeight - this.pageHeight
    }
  },
  mounted() {
    this._baseTable_init()
  }
}
</script>
