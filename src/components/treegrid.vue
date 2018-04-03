<template>
  <table ref="table"></table>
</template>
<script>
import _ from 'lodash'
import { mapState } from 'vuex'
import openDialog from '@/utils/openDialog'
const $ = require('@/../static/lib/easyui/jquery.min.js')
window.jQuery = $
require('@/../static/lib/easyui/jquery.easyui.min.js')
export default {
  data() {
    return {
      treegridEl: null,
      treegrid: null
    }
  },
  props: ['data', 'treegridObj', 'getTreeData', 'linkColKeys', 'i', 'columns'],
  computed: {
    ...mapState(['tgColsObj'])
  },
  mounted() {
    this.initTreeGrid()
  },
  watch: {
    data(newV, oldV) {
      const treegridEl = this.treegridEl
      if (_.isEqual(newV, oldV) || !treegridEl) {
        return
      }
      const treePanel = this.treegridEl.parents('.panel-body')
      const fields = this.tgColsObj[this.i]
        .reduce((acc, curr) => {
          return acc.concat(curr)
        })
        .filter(item => item && item.field)
      if (!fields.length) {
        treePanel.addClass('empty')
      } else {
        treePanel.removeClass('empty')
      }
      treegridEl.treegrid('loadData', _.cloneDeep(this.data))
    },
    tgColsObj: {
      deep: true,
      handler: function(newV, oldV) {
        if (newV.opId !== this.i) {
          return
        }
        newV = newV[this.i]
        oldV = oldV[this.i]
        const treegridEl = this.treegridEl
        if (!treegridEl) {
          return
        }
        const tgInsFields = this.treegridEl
          .treegrid('options')
          .columns.reduce((acc, curr) => {
            return acc.concat(curr)
          })
          .filter(item => item && item.field)
        // formatter width 拷贝到新值去
        let cloneColumns = _.cloneDeep(newV)
        cloneColumns.forEach(item => {
          item.map(it => {
            const tmp = tgInsFields.find(item => item.field === it.field)
            if (tmp) {
              it.formatter = tmp.formatter
              it.width = tmp.width
            }
            return it
          })
        })
        if (!_.isEqual(tgInsFields.map(item => item.field), this.columns[0].map(item => item.field))) {
          this.$emit('columnchange')
          cloneColumns = this.columns
        }
        treegridEl.treegrid({
          columns: cloneColumns,
          treeField: this.treegridObj.treeField,
          data: _.cloneDeep(this.data)
        })
      }
    }
  },
  methods: {
    initTreeGrid() {
      let self = this
      const cloneTgCols = _.cloneDeep(this.tgColsObj[this.i])
      const { idField, treeField } = this.treegridObj
      const data = _.cloneDeep(this.data)
      const fields = cloneTgCols
        .reduce((acc, curr) => {
          return acc.concat(curr)
        })
        .filter(item => item && item.field)
      if (!data.length || !fields.length) {
        return
      }
      if (!this.treegrid) {
        this.treegridEl = $(this.$refs.table)
        this.treegrid = this.treegridEl.treegrid({
          height: '100%',
          // rownumbers: true, // 列索引
          animate: false,
          collapsible: true,
          fitColumns: true,
          idField,
          treeField,
          data,
          loader: async (param, success, error) => {
            const data = await this.getTreeData(param.id, true)
            success(data)
          },
          columns: cloneTgCols,
          onBeforeLoad: function(row, params) {
            if (!row) {
              // 处理首次不进loader
              return false
            }
          },
          onClickCell: function(field, row) {
            // 列表点击事件
            // console.log(row)
            const htmlDom = document.getElementById(field + '_' + row['__$ID'])
            if (self.linkColKeys.includes(field)) {
              openDialog.open(htmlDom.outerHTML)
              // return
            }
          }
        })
      }
    }
  }
}
</script>
<style lang="less">
.panel-body {
  &.empty {
    > div {
      display: none;
    }
    &:after {
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      top: 0;
      text-align: center;
      height: 14px;
      margin: auto;
      content: '暂无数据';
    }
  }
}
</style>
