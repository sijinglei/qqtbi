<template>
  <div :id="item.i" class="baseFilters" @click.stop="selectItem">
    <div v-for="(item, idx) in blendData" :key="Utility.spliceKey('b',item.i,idx)" class="cards">
      <span v-show="showTitle" class="cardTitle">{{item[columnLabel]}}：</span>
      <div class="cardBody" :class="{isHeng:styles.horizontal,isShowBorder:styles.isBorder}" :style="{height:maxHeight+'px'}">
        <template v-if="allFields.length">
          <v-select-list v-if="mode===1" :multiple="multiple" :options="allFields" :single-unselect="true" @select="selectCard"></v-select-list>
          <div class="seach-group" v-else-if="mode===5">
            <label for="">{{item.Description}}</label>
            <div class="control">
              <v-select name="multi" :multiple="multiple" :options="allFields" @select="selectOption"></v-select>
            </div>
          </div>
          <v-radio-group v-else-if="mode===6" :vertical="styles.horizontal" v-model="defaultRadioChecked" @change="selectRadio">
            <v-radio v-for="(rad,ridx) in allFields" :key="Utility.spliceKey('radio',item.i,ridx)" name="radio" :value="rad.value">{{rad.text}}</v-radio>
          </v-radio-group>
          <div class="seach-group" v-else-if="mode===7">
            <label for="start">开始日期</label>
            <div class="control">
              <v-date-picker v-model="startDate" kind="DatePanel" @change="selectDater">
              </v-date-picker>
            </div>
            <label for="end">结束日期</label>
            <div class="control">
              <v-date-picker v-model="endDate" kind="DatePanel" @change="selectDater">
              </v-date-picker>
            </div>
          </div>
          <v-card-picker v-else :multiple="multiple" :options="allFields" :single-unselect="true" @select="selectCard"></v-card-picker>
        </template>
        <span v-else class="no-data"></span>
      </div>
    </div>
  </div>
</template>

<script>
import { mapActions, mapMutations } from 'vuex'
import { columnKey, columnLabel, columnFormatData } from '@/utils/echartsDefault'
import { bus } from '@/utils/bus.js'
import fNumeral from '@/utils/numFormat'
import _ from 'lodash'
import moment from 'moment'

export default {
  data() {
    return {
      columnKey,
      columnLabel,
      fieldLabel: 'fieldLabel',
      element: null,
      timer: null,
      num: 4,
      mode: 1,
      showTitle: true,
      multiple: true,
      blendData: [],
      allFields: [],
      maxHeight: 0,
      argsArr: {},
      startDate: [],
      endDate: []
    }
  },
  props: {
    item: Object,
    global: Object,
    isView: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    blendData() {
      const { item } = this
      if (!item || !item.params || !item.params.blend) return []
      const data = _.cloneDeep(item.params.blend)
      return data
    },
    cardWidth() {
      if (!this.element) return parseInt(100 / this.num) + '%'
      return this.element.clientWidth / this.num + 'px'
    },
    styles() {
      return this.item.styles
    },
    defaultRadioChecked() {
      return this.allFields[0].value
    },
    filterValues() {
      return this.$store.state.filterValues
    }
  },
  watch: {
    // filterValues: {
    //   handler(newValue, oldValue) {
    //     console.log('赋值查询参数')
    //     console.log(newValue)
    //   },
    //   deep: true
    // }
  },
  methods: {
    ...mapActions('dataset', ['getApiFieldData']),
    ...mapMutations(['SET_FILTER_VALUES']),
    reset() {
      const deviation = this.showTitle ? 18 : 0
      this.maxHeight = this.element.clientHeight - deviation
    },
    reload() {
      this._baseFilters_initStyles()
      this._baseFilters_initFields()
    },
    selectItem() {
      this.$emit('select', this.item.i)
    },
    getFilterObj(value) {
      const { i: fileterId, styles, params, high } = this.item
      const { blend } = params
      var filterObj = {
        fileterId, // 组件id
        filterField: blend[0][columnKey], // 查询字段
        multiple: styles.multiple, // 是否多选
        mode: styles.mode, // 显示模式
        value, // 当前值
        eleIds: high ? Object.keys(Object.values(high)[0]) : []
      }
      return filterObj
    },
    selectCard({ value, option, current }) {
      if (_.isEmpty(this.argsArr)) return
      const operator = this.item.styles.multiple ? 'in' : 'eq'
      for (const [gKey, gValue] of Object.entries(this.argsArr)) {
        const args = []
        for (const argValue of Object.values(gValue)) {
          args.push({ columns: argValue, operator, value, type: 1 })
        }
        bus.$emit('reloadChart', gKey, args)
      }
    },
    selectOption({ value, option, current }) {
      let filterValue = ''
      if (typeof value === 'string') {
        filterValue = value
      } else {
        filterValue = value.join('|')
      }
      this.SET_FILTER_VALUES(this.getFilterObj(filterValue))
      this._baseFilters_reloadChart(value)
    },
    selectRadio(value) {
      this.SET_FILTER_VALUES(this.getFilterObj(value))
      this._baseFilters_reloadChart(value)
    },
    selectDater(value) {
      let strStartDate = ''
      let strEndDate = ''
      if (this.startDate.length > 0) {
        strStartDate = moment(this.startDate[0].toString()).format('YYYY-MM-DD')
      }
      if (this.endDate.length > 0) {
        strEndDate = moment(this.endDate[0].toString()).format('YYYY-MM-DD')
      }
      this.SET_FILTER_VALUES(this.getFilterObj([strStartDate, strEndDate].join('|')))
      this._baseFilters_reloadChart([strStartDate, strEndDate])
    },
    _baseGet_initHigh(highObj) {
      let argsArr = {}
      for (let [key, value] of Object.entries(highObj)) {
        for (let [subKey, subValue] of Object.entries(value)) {
          if (subValue !== '') {
            if (!argsArr[subKey]) argsArr[subKey] = {}
            argsArr[subKey][key] = subValue
          }
        }
      }
      if (_.isEmpty(argsArr)) return
      return argsArr
    },
    _disposeHighArgs(arr) {
      // 循环处理高级条件参数
      const vm = this
      let highObj = {}
      arr.map((item, idx) => {
        if (item.type === 'tab') {
          const tabLayouts = item.params.tabLayouts[0].layouts
          Array.isArray(tabLayouts) && vm._disposeHighArgs(tabLayouts)
        } else {
          const { high } = item
          if (high && Object.keys(high).length > 0) {
            highObj = vm._baseGet_initHigh(high)
            let tempObj = {}
            for (const [aKey, aValue] of Object.entries(vm.argsArr)) {
              for (const [bKey, bValue] of Object.entries(highObj)) {
                if (aKey === bKey) {
                  // 判断是不是同一个组件
                  if (!tempObj[aKey]) tempObj[aKey] = {}
                  tempObj[aKey] = Object.assign({}, aValue, bValue)
                  vm.argsArr = Object.assign({}, vm.argsArr, tempObj)
                }
              }
            }
          }
        }
      })
      return vm.argsArr
    },
    _baseFilters_reloadChart(value) {
      const layout = this.$root.gridlayout.layout
      let argsArr = this._disposeHighArgs(layout)
      if (_.isEmpty(argsArr)) return

      for (const [gKey, gValue] of Object.entries(argsArr)) {
        const args = []
        if (Object.values(gValue).length > 1) {
          // console.log('处理多条件')
          // 处理多条件
          // console.log(gKey)
          // console.log(Object.values(gValue))
          // console.log(this.filterValues)
          if (this.filterValues && this.filterValues.length > 0) {
            this.filterValues.map(item => {
              if (item.eleIds.includes(gKey)) {
                const { mode, filterField, multiple, value } = item
                // { value: 1, text: '默认' },
                // { value: 2, text: '卡片' },
                // { value: 5, text: '下拉框' },
                // { value: 6, text: '单选按钮' },
                // { value: 7, text: '日期范围选择' }
                let operator = multiple ? 'in' : 'eq'
                if (mode === 1 || mode === 2 || mode === 5) {
                  if (multiple) {
                    let tempVal = value.split('|') || []
                    args.push({ columns: filterField, operator, value: tempVal, type: 1 })
                  } else {
                    args.push({ columns: filterField, operator, value, type: 1 })
                  }
                } else if (mode === 6) {
                  args.push({ columns: filterField, operator: 'eq', value, type: 1 })
                } else if (mode === 7) {
                  let temlVal = value.split('|')
                  const value1 = temlVal[0]
                  const value2 = temlVal[1]
                  if (value1 !== '' && value2 === '') {
                    args.push({ columns: filterField, operator: 'gte', value: value1, type: 1 })
                  } else if (value2 !== '' && value1 === '') {
                    args.push({ columns: filterField, operator: 'lte', value: value2, type: 1 })
                  } else if (value1 !== '' && value2 !== '') {
                    args.push({ columns: filterField, operator: 'gte', value: value1, type: 1 })
                    args.push({ columns: filterField, operator: 'lte', value: value2, type: 1 })
                  }
                }
              }
            })
          }
        } else {
          let operator = this.item.styles.multiple ? 'in' : 'eq'
          for (const argValue of Object.values(gValue)) {
            const mode = this.item.styles.mode
            if (mode === 7) {
              const value1 = value[0]
              const value2 = value[1]
              if (value1 !== '' && value2 === '') {
                args.push({ columns: argValue, operator: 'gte', value: value1, type: 1 })
              } else if (value2 !== '' && value1 === '') {
                args.push({ columns: argValue, operator: 'lte', value: value2, type: 1 })
              } else if (value1 !== '' && value2 !== '') {
                args.push({ columns: argValue, operator: 'gte', value: value1, type: 1 })
                args.push({ columns: argValue, operator: 'lte', value: value2, type: 1 })
              }
            } else {
              args.push({ columns: argValue, operator, value, type: 1 })
            }
          }
        }
        bus.$emit('reloadChart', gKey, args)
      }
    },
    _baseFilters_init() {
      if (!this.element) {
        this.element = document.getElementById(this.item.i)
      }
      // 定时获取宽高再初始化
      if (!this.element || this.element.clientHeight < 10) {
        this.timer = setTimeout(this._baseFilters_init, 200)
        return
      }
      this.timer && clearTimeout(this.timer)
      this._baseFilters_initFields()
      this._baseFilters_initStyles()
    },
    async _baseFilters_initFields() {
      const { item, global, Utility } = this
      const { params, i, high = {} } = item // styles
      const { aliasKey, appName, blend = [] } = params
      const { fields = {} } = global
      this.blendData = _.cloneDeep(blend)

      const globalFilter = Utility.resolveQueryParams(this.$route.query, fields, i)
      const args = this.$root.args[i] || []

      let data = []
      if (aliasKey && appName && blend.length > 0) {
        data = await this.getApiFieldData({ aliasKey, appName, params, globalFilter, args })
        if (data && data.length > 0) {
          const blendKey = blend[0][columnKey]
          const newData = []
          // if (styles.mode === 5) {
          //   newData.push({ value: '', text: '请选择' })
          // }
          for (let i = 0; i < data.length; i++) {
            let field = data[i][blendKey]
            if (!newData.some(n => n.value === field)) {
              let format = blend[0][columnFormatData]
              if (format) {
                if (format.timeFomat && format.timeFomat !== '') {
                  field = fNumeral.formatTimeByRule(field, format)
                } else {
                  field = fNumeral.formatNumByRule(field, format)
                }
              }
              newData.push({ value: field, text: field })
            }
          }

          data = newData
        }
      }
      this.allFields = data
      /* if (!this.allFields.length) {
        const layouts = this.$root.gridlayout.layout
        const index = layouts.findIndex(item => item.i === i)
        layouts.splice(index, 1)
        this._init_layouts_gloabHeight(i)
      } */
      if (Object.keys(high).length > 0) {
        console.log('原始参数获取')
        console.log(high)
        this._baseFilters_initHigh(high)
      } else {
        this.argsArr = {}
      }
    },
    /* _init_layouts_gloabHeight(i) {
      const layouts = _.sortBy(this.$root.gridlayout.layout, l => l.y)
      if (layouts.length > 0) {
        let bh = layouts[0].h
        for (let i = 0; i < layouts.length; i++) {
          let item = layouts[i]
          if (i > 0) {
            this.$set(item, 'y', bh)
            bh += item.h
          } else {
            this.$set(item, 'y', 0)
          }
        }
      }
    }, */
    _baseFilters_initHigh(highObj) {
      let argsArr = {}
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
    },
    _baseFilters_initStyles() {
      const { styles } = this.item
      for (const [key, value] of Object.entries(styles)) {
        if (key === 'multiple') {
          this.multiple = !!value
          continue
        }
        this[key] = value
      }
      const deviation = this.showTitle ? 18 : 0
      this.maxHeight = this.element.clientHeight - deviation
    }
  },
  mounted() {
    this._baseFilters_init()
  }
}
</script>
<style lang="less">
.baseFilters {
  .cards {
    .cardTitle {
      display: inline-block;
      font-weight: bold;
      height: 18px;
    }
    .cardBody {
      display: inline-block;
      height: 100%;
      width: 100%;
      padding: 0 3px;
      font-size: 12px;
      .v-select-list {
        margin-top: 3px;
        max-height: 100%;
      }
      .v-card-picker {
        max-height: 100%;
        overflow-y: auto;
      }
    }
    .isShowBorder {
      .v-select-list {
        border: 1px double #e0e0e0;
      }
    }
    .isHeng {
      .v-select-list__item {
        display: inline-block;
      }
      .v-radio-group--vertical .v-radio-group-item:first-child {
        margin: 5px 0;
        margin-right: 10px;
      }
      .v-radio-group--vertical .v-radio-group-item {
        display: inline-block;
      }
      .v-radio-group--vertical .v-radio-group-item {
        margin: 5px 0;
        margin-right: 10px;
      }
      .v-radio__inner {
        width: 18px;
        height: 18px;
      }
      .v-radio__inner:after {
        width: 8px;
        height: 8px;
      }
    }
  }
  .v-select {
    min-height: 30px;
  }
  .v-select__header {
    line-height: 28px;
  }
  .v-select__header-arrow.v-icon {
    top: 10px;
  }
  .seach-group {
    display: inline-block;
    margin-bottom: 0;
    vertical-align: middle;
  }
  label {
    display: inline-block;
    max-width: 100%;
    margin-bottom: 5px;
  }
  .control {
    display: inline-block;
    width: auto;
    vertical-align: middle;
  }
  .v-date-picker {
    font-size: 12px;
    line-height: 0;
  }
  .v-date-picker__input {
    height: 30px;
  }
  .v-date-picker__label {
    height: 28px;
    line-height: 28px;
  }
  .v-date-picker__arrow {
    top: 10px;
  }
}
</style>


