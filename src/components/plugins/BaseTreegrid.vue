<template>
  <div :id="item.i" class="baseTreegrid" :class="{'noBorder': noBorder}" @click.stop="clickItem">
    <i class="iconfont icon-fanhui" :class="{'hide': !showBacktrack}" @click.stop="backtrackHandler" title="返回" />
    <TreeGrid v-if="data" :ref="Utility.spliceKey('tg', item.i)" :i="item.i" :data="data" :getTreeData="getTreeData" :treegridObj="treegridObj" :linkColKeys="linkColKeys">
    </TreeGrid>
  </div>
</template>
<script>
import { mapActions, mapMutations } from 'vuex'
import TreeGrid from '@/components/treegrid.vue'
import { columnKey, columnLabel, tgConstants, columnFormatData, fieldClickConfig } from '@/utils/echartsDefault'
import { bus } from '@/utils/bus.js'
import fNumeral from '@/utils/numFormat'
import _ from 'lodash'
const jQuery = require('@/../static/lib/easyui/jquery.min.js')

export default {
  components: {
    TreeGrid
  },
  data() {
    return {
      element: null,
      el: null,
      showBacktrack: false,
      noBorder: false,
      columns: [],
      data: null,
      treegridObj: {
        idField: tgConstants.idField,
        treeField: ''
      },
      linkColKeys: [] // 储存可以点击的key值
    }
  },
  props: {
    item: Object,
    global: Object
  },
  methods: {
    ...mapActions('dataset', ['getApiFieldData']),
    ...mapMutations(['SET_TG_COLUMNS']),
    reset() {
      if (!this.element) {
        return
      }
      const width = jQuery(this.element).width()
      const height = jQuery(this.element).height()
      const treeGridCmp = this.$children[0]
      treeGridCmp &&
        treeGridCmp.treegridEl &&
        treeGridCmp.treegridEl.treegrid('resize', {
          width,
          height
        })
    },
    reload(isStyleChange) {
      if (isStyleChange) {
        // 样式
        this._baseTable_initStyles(true)
      } else {
        this._baseTable_initData()
      }
    },
    clickItem() {
      this.$emit('select', this.item.i)
    },
    backtrackHandler() {
      const { i } = this.item
      bus.$emit('reloadChart', i)
    },
    _baseTable_init() {
      if (!this.element) {
        const { i } = this.item
        this.element = document.getElementById(i)
        this.el = this.$refs[this.Utility.spliceKey('treegrid', i)]
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
      // 样式
      this._baseTable_initStyles()
      // 数据
      this._baseTable_getData() // 数据
    },
    _baseTable_initStyles(changed) {
      const { rowHeights, noBorder } = this.item.styles
      this.noBorder = noBorder
      const { i } = this.item
      if (changed || rowHeights !== 25) {
        // 行高
        this.Utility.addCSS(
          `
          #${i} .datagrid-header-row, #${i} .datagrid-row {
              height: ${rowHeights}px;
          }
        `,
          `${i}_style`
        )
        this.reset()
      }
    },
    async getTreeData(treeId = null, isExecute) {
      const { params, i } = this.item
      const { aliasKey, appName, blend = [] } = params
      const { fields = {} } = this.global
      const globalFilter = this.Utility.resolveQueryParams(this.$route.query, fields, i)
      const args = this.$root.args[i] || []
      let data = null
      if (aliasKey && appName && blend.length > 0) {
        const index = globalFilter.findIndex(item => item.key === this.item.relatedKey)
        if (treeId === null) {
          // 有绑定唯一值就直接传唯一值
          // 注意：这里不能把绑定key的值赋给__$PID
          // 经测试，value是key+value加密后的值
          if (index === -1) {
            globalFilter.push({
              key: tgConstants.parentField,
              value: treeId
            })
          }
        } else {
          // 展开后的要将该值移除，继而使用__$PID
          if (index > -1) {
            globalFilter.splice(index, 1)
          }
          globalFilter.push({
            key: tgConstants.parentField,
            value: treeId
          })
        }
        data = await this.getApiFieldData({ aliasKey, appName, params, globalFilter, args })
      }
      // 将[非树必须字段外的字段]的作为列
      const fieldsArr = blend.filter(
        item =>
          item[columnKey] !== tgConstants.parentField &&
          item[columnKey] !== tgConstants.idField &&
          item[columnKey] !== tgConstants.leafField
      )
      if (isExecute) {
        return this.dealData(data, fieldsArr)
      }
      return data
    },
    async _baseTable_getData() {
      const vm = this
      const { params, i } = this.item
      const data = await this.getTreeData()
      if (!data) {
        this.data = null
        this.columns = []
        return
      }
      const args = this.$root.args[i] || []
      this.showBacktrack = args.some(a => a.type === 0)
      const { blend = [] } = params
      // 将[非树必须字段外的字段]的作为列
      let fieldsArr = blend.filter(
        item =>
          item[columnKey] !== tgConstants.parentField &&
          item[columnKey] !== tgConstants.idField &&
          item[columnKey] !== tgConstants.leafField
      )

      const fieldsArrLength = fieldsArr.filter(item => item['Visible']).length

      // 获取列对象
      const tgColumns = fieldsArr.map(item => {
        let isHidden = false
        let _title = item[columnLabel]
        let format = item[columnFormatData]
        if (format && format.tip) {
          _title = vm.Utility.setHeadTip(_title, format.tip)
        }

        // 列字段 :TODO(判断是否可以点击)
        const config = item[fieldClickConfig]
        const visible = item['Visible']
        if (!visible) {
          isHidden = true
        }

        if (config && config.url !== '') {
          vm.linkColKeys.push(item[columnKey])
        }
        return {
          title: _title,
          field: item[columnKey],
          width: 100 / fieldsArrLength + '%',
          align: 'left',
          hidden: isHidden, // 是否隐藏
          formatter: function(value, row) {
            let level = 1
            if (row._parentId) {
              const treeGridCmp = vm.$children[0]
              level =
                treeGridCmp && treeGridCmp.treegridEl && treeGridCmp.treegridEl.treegrid('getLevel', row._parentId)
              level += 1
            }
            const width = this.boxWidth - level * 20
            let str = `${value}`
            if (config && config.params && config.url) {
              let propVal = ''
              config.params.map((key, idex) => {
                propVal += '&' + key + '=' + row[key]
              })
              const title = config.title || '弹出窗口'
              propVal = propVal !== '' && propVal.length > 1 ? propVal.substring(1) : ''
              const _id = item[columnKey] + '_' + row['__$ID']
              str = `<a id="${_id}" href="javascript:;" class="blue click" data-title="${title}" data-params="${propVal}" data-url="${
                config.url
              }">
                      ${value}
                    </a>`
            }
            return `<div style="width:${width}px;overflow: hidden;text-overflow: ellipsis;white-space: nowrap;" title=${value}>
                      ${str}
                    </div>`
          }
        }
      })
      this.columns = [tgColumns]
      if (tgColumns.length) {
        this.treegridObj.treeField = tgColumns[0].field
      }
      if (params.colHeadSetting.length) {
        params.colHeadSetting
          .reduce((acc, curr) => {
            return acc.concat(curr)
          })
          .filter(item => item && item.field)
          .map(item => {
            return _.extend(item, tgColumns.find(it => item.field === it.field))
          })
        this.SET_TG_COLUMNS({ id: this.item.i, data: params.colHeadSetting })
      } else {
        this.SET_TG_COLUMNS({ id: this.item.i, data: this.columns })
      }

      // 获取数据
      const sourceArr = this.dealData(data, fieldsArr)
      this.data = sourceArr
    },
    /**
     * 数据集 列数据
     */
    dealData(data, fieldsArr) {
      if (!data || !data.length) {
        return []
      }
      /**
       * 对是否是叶子节点，非叶子节点是否有子节点进行判断
       */
      const sourceArr = data.map(item => {
        fieldsArr.map(field => {
          let columnVal = item[field[columnKey]]
          let format = field[columnFormatData]
          if (format) {
            if (format.timeFomat && format.timeFomat !== '') {
              item[field[columnKey]] = fNumeral.formatTimeByRule(columnVal, format)
            } else {
              item[field[columnKey]] = fNumeral.formatNumByRule(columnVal, format)
            }
          }
        })
        /**
         * 父id
         * state
         *  '': 叶子节点
         *  'open': 有叶子节点的打开
         *  'closed': 有叶子节点的关闭
         */
        return Object.assign(
          {
            parentId: item[tgConstants.parentField] ? item[tgConstants.parentField] : null,
            state: item[tgConstants.leafField] ? '' : 'closed'
          },
          item
        )
      })
      return sourceArr
    }
  },
  mounted() {
    this._baseTable_init()
  }
}
</script>
<style lang="less">
.baseTreegrid {
  // 无边框
  &.noBorder {
    .datagrid .panel-body {
      border: 0;
    }
    .datagrid-header td,
    .datagrid-body td,
    .datagrid-footer td {
      border: 0;
    }
    .datagrid-header,
    .datagrid-toolbar,
    .datagrid-pager,
    .datagrid-footer-inner {
      border: 0;
    }
  }
  .datagrid-header td,
  .datagrid-body td,
  .datagrid-footer td {
    vertical-align: middle;
  }
  .tree-icon {
    display: none;
  }
  .datagrid-header,
  .datagrid-td-rownumber {
    background: #fff;
  }
}
</style>
