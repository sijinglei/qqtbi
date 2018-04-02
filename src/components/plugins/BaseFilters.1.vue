<template>
  <div :id="item.i" class="baseFilters" @click.stop="selectItem">
    <div v-for="(item, idx) in blendData" :key="Utility.spliceKey('b',item.i,idx)" class="cards">
      <span v-show="showTitle" class="cardTitle">{{item[columnLabel]}}：</span>
      <div class="cardBody" :class="{isHeng:styles.horizontal,isShowBorder:styles.isBorder}" :style="{height:maxHeight+'px'}">
        <template v-if="allFields.length">
          <v-select-list v-if="mode==='1'" :multiple="multiple" :options="allFields" :single-unselect="true" @select="selectCard"></v-select-list>
          <div v-else-if="mode==='5'">
            {{item.Description}}
            <v-select name="multi" :options="allFields" :multiple="multiple" @select="selectOption"></v-select>
          </div>
          <v-radio-group v-else-if="mode==='6'" :vertical="styles.horizontal" v-model="defaultRadioChecked" @change="selectRadio">
            <v-radio v-for="(rad,ridx) in allFields" :key="Utility.spliceKey('radio',item.i,ridx)" name="radio" :value="rad.value">{{rad.text}}</v-radio>
          </v-radio-group>
          <v-card-picker v-else :multiple="multiple" :options="allFields" :single-unselect="true" @select="selectCard"></v-card-picker>
        </template>
        <span v-else class="no-data"></span>
      </div>
    </div>
  </div>
</template>

<script>
import { mapActions } from 'vuex'
import { columnKey, columnLabel, columnFormatData } from '@/utils/echartsDefault'
import { bus } from '@/utils/bus.js'
import fNumeral from '@/utils/numFormat'
import _ from 'lodash'

export default {
  data() {
    return {
      columnKey,
      columnLabel,
      fieldLabel: 'fieldLabel',
      element: null,
      timer: null,
      num: 4,
      mode: '1',
      showTitle: true,
      multiple: true,
      blendData: [],
      allFields: [],
      maxHeight: 0,
      argsArr: {}
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
    }
  },
  methods: {
    ...mapActions('dataset', ['getApiFieldData']),
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
    selectCard({ value, option, current }) {
      if (_.isEmpty(this.argsArr)) return
      const operator = this.item.params.multiple ? 'in' : 'eq'
      for (const [gKey, gValue] of Object.entries(this.argsArr)) {
        const args = []
        for (const argValue of Object.values(gValue)) {
          args.push({ columns: argValue, operator, value, type: 1 })
        }
        bus.$emit('reloadChart', gKey, args)
      }
    },
    selectOption({ value, option, current }) {
      console.log(this.item)
      const operator = this.item.params.multiple ? 'in' : 'eq'
      for (const [gKey, gValue] of Object.entries(this.argsArr)) {
        const args = []
        for (const argValue of Object.values(gValue)) {
          args.push({ columns: argValue, operator, value, type: 1 })
        }
        bus.$emit('reloadChart', gKey, args)
        console.log(gKey)
        console.log(args)
      }
    },
    selectRadio(value) {
      alert(value)
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
      const { params, i, high = {} } = item
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
      const argsArr = {}
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
        margin: 10px 0;
        margin-right: 10px;
      }
      .v-radio-group--vertical .v-radio-group-item {
        display: inline-block;
      }
    }
  }
}
</style>


