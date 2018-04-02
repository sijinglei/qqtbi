<template>
    <component :is="compContainer" class="itemEl" :global="global" :item="item" :is-view="isView" @select="selectItem" />
</template>
<script>
import BaseCharts from './BaseCharts'
import BaseCrosstabs from './BaseCrosstabs'
import BaseTable from './BaseTable'
import BaseText from './BaseText'
import BaseQuery from './BaseQuery'
import BaseFilters from './BaseFilters'
import BaseFrame from './BaseFrame'
import BaseBoard from './BaseBoard'
import BaseTreegrid from './BaseTreegrid'
export default {
  data() {
    return {}
  },
  props: {
    isView: {
      type: Boolean,
      default: false
    },
    item: Object,
    global: Object
  },
  computed: {
    compContainer() {
      let container = null
      switch (this.item.type) {
        case 'text':
          container = BaseText
          break
        case 'board':
          container = BaseBoard
          break
        case 'crosstabs':
          container = BaseCrosstabs
          break
        case 'table':
          container = BaseTable
          break
        case 'query':
          container = BaseQuery
          break
        case 'filters':
          container = BaseFilters
          break
        case 'frame':
          container = BaseFrame
          break
        case 'treegrid':
          container = BaseTreegrid
          break
        default:
          container = BaseCharts
      }
      return container
    }
  },
  methods: {
    selectItem(obj) {
      this.$emit('selectTab', obj)
    }
  }
}
</script>
<style lang="less">
.itemEl {
  position: relative;
  width: 100%;
  height: 100%;
}
</style>
