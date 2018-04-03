<template>
  <div :id="item.i" class="baseTable" @click.stop="clickItem">
    <!-- <button type="button" class="export-table" @click="onExport">导出</button> -->
    <i class="iconfont icon-fanhui" :class="{'hide': !showBacktrack}" @click.stop="backtrackHandler" title="返回" />
    <hot-table :root="Utility.spliceKey('hst', item.i)" :ref="Utility.spliceKey('hst', item.i)" :class="{'noBorder': noBorder}" :settings="hotSettings" :readOnly="true" :rowHeaders="rowHeaders" />
    <v-pagination v-if="showPage" @change="onChange" :total="source.length" />
  </div>
</template>

<script>
import { mapActions } from 'vuex'
import { columnKey, columnLabel, columnFormatData, fieldClickConfig } from '@/utils/echartsDefault'
import HotTable from 'vue-handsontable-official'
import { bus } from '@/utils/bus.js'
import fNumeral from '@/utils/numFormat'
import openDialog from '@/utils/openDialog'
// import _ from 'lodash'
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
      /** handsontable 相关参数 */
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
        columns: [],
        // hiddenColumns: {// 仅在pro版本中才可以使用
        //   columns: [],
        //   indicators: false
        // },
        // 点击单元格或行头/列头后被调用
        afterOnCellMouseDown: function(event, coords, tdObj) {
          // console.log('点击对象')
          // console.log(this.getCellMeta(coords.row, coords.col))
          // console.log(this.getDataAtRow(coords.row))
          let tdVal = String(this.getValue())
          if (tdVal && coords.row !== -1 && tdVal.indexOf('blue') > 0) {
            this.deselectCell()
            openDialog.open(tdVal)
          }
        }
      },
      linkColumnKey: []
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
      if (!this.element) {
        return
      }
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
      bus.$emit('reloadChart', i)
      // const { args } = this.$root
      // const argArr = args[i] || []
      // args[i] = argArr.filter(a => a.type !== 0)
      // this._baseTable_initData()
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
      const { blend = [] } = params
      let colHeads = []
      let columns = []
      let hiddenColumns = []
      let linkColKeys = []
      for (let i = 0; i < blend.length; i++) {
        const format = blend[i][columnFormatData]

        if (format && format.tip && format.tip !== '') {
          colHeads.push(this.Utility.setHeadTip(blend[i][columnLabel], format.tip))
        } else {
          colHeads.push(blend[i][columnLabel])
        }
        // 列字段 :TODO(判断是否可以点击)
        const config = blend[i][fieldClickConfig]
        const visible = blend[i]['Visible']
        if (!visible) {
          // 隐藏列
          columns.push({})
          hiddenColumns.push(i)
          continue
        }
        if (config && config.url !== '') {
          linkColKeys.push(blend[i][columnKey])
          columns.push({ data: blend[i][columnKey], renderer: 'html', className: 'htBlue_SJL' })
        } else {
          columns.push({ data: blend[i][columnKey] })
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
      // this.hotSettings.hiddenColumns.columns = hiddenColumns
      this.hiddenColumns = hiddenColumns
      this.hotSettings.columns = columns
      this.hotSettings.colHeaders = colHeads
    },
    async _baseTable_getData() {
      const { params, i } = this.item
      const { aliasKey, appName, blend = [] } = params
      const { fields = {} } = this.global
      const globalFilter = this.Utility.resolveQueryParams(this.$route.query, fields, i)
      const args = this.$root.args[i] || []
      let data = []
      if (aliasKey && appName && blend.length > 0) {
        data = await this.getApiFieldData({ aliasKey, appName, params, globalFilter, args })
      }
      this.showBacktrack = args.some(a => a.type === 0)
      if (!data) {
        this.hotSettings.data = []
        return
      }

      let sourceArr = data.map((item, idx) => {
        let dataObj = {}
        for (let i = 0; i < blend.length; i++) {
          let columnVal = item[blend[i][columnKey]]
          let format = blend[i][columnFormatData]
          if (format) {
            if (format.timeFomat && format.timeFomat !== '') {
              columnVal = fNumeral.formatTimeByRule(columnVal, format)
            } else {
              columnVal = fNumeral.formatNumByRule(columnVal, format)
            }
          }
          // TODO: 判断是否有点击事件
          if (this.linkColumnKey.includes(blend[i][columnKey])) {
            let propVal = ''
            const config = blend[i][fieldClickConfig]
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
          dataObj[blend[i][columnKey]] = columnVal
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
        this.el = this.$refs[this.Utility.spliceKey('hst', i)].table
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
    },
    onExport() {
      var vm = this
      const tHeader = vm.hotSettings.colHeaders // 获取列标题名
      const tData = vm.hotSettings.data // 列表数据集合
      // console.log(tHeader)
      // console.log(tData)
      this.Utility.exportToExcel(tHeader, tData, this.item.title)
    }
  },
  mounted() {
    this._baseTable_init()
  }
}
</script>
<style>
.blue {
  cursor: pointer;
}
table td {
  text-overflow: ellipsis;
}
.export-table {
  position: absolute;
  top: -26px;
  right: 10px;
  z-index: 100;
  border: 1px solid #0091ea;
  border-radius: 3px;
  color: #0392e0;
  background-color: #ffffff;
  padding: 3px 20px;
  font-size: 12px;
  cursor: pointer;
  line-height: 16px;
}
</style>

