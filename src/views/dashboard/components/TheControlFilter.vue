<template>
  <v-panel :open="visible" title="设置过滤器" :width="500" :max-height="600" :mask-closable="false" @close="doColse">
    <v-tabs v-model="conditionTabs" indent="50" align="left">
      <v-tab :value="0">条件</v-tab>
      <v-tab :value="1">枚举</v-tab>
    </v-tabs>
    <div class="filterBody">
      <template v-if="conditionTabs===0">
        <div class="filterRows">
          <v-select :options="conditionSet" v-model="condition.value" placeholder="点击选择" />
          <v-input v-model="condition.text" placeholder="值" />
        </div>
        <v-radio-group v-model="condition.relation">
          <v-radio name="relation" value="or">或者</v-radio>
          <v-radio name="relation" value="and">且</v-radio>
        </v-radio-group>
        <div class="filterRows">
          <v-select :options="conditionSet" v-model="condition.value2" placeholder="点击选择" />
          <v-input v-model="condition.text2" placeholder="值" />
        </div>
      </template>
      <template v-else>
        <v-select class="enumsSelect" :options="enumsData" v-model="condition.enums" placeholder="点击选择" multiple />
      </template>
    </div>
    <div class="filterFooter">
      <v-button status="primary" @click="doSubmit">确定</v-button>
      <v-button status="default" @click="doColse">取消</v-button>
    </div>
  </v-panel>
</template>
<script>
import { mapState, mapActions } from 'vuex'
import { columnKey, columnLabel } from '@/utils/echartsDefault'
import _ from 'lodash'

export default {
  data() {
    return {
      columnLabel,
      conditionTabs: 0,
      condition: {},
      enumsData: []
    }
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    item: Object
  },
  computed: {
    ...mapState('dashboard', ['HRDWData']),
    conditionSet() {
      return this.Utility.conditionSet()
    }
  },
  watch: {
    visible(val) {
      if (val) this._theControlFilter_setParams()
    },
    async conditionTabs(val) {
      if (!val) return

      const { AliasName: aliasKey, AppName: appName } = this.item
      const column = this.item[columnKey]
      const fields = [column]
      if (!appName || !aliasKey || fields.length === 0) return
      const result = await this.getControlFilter({ appName, aliasKey, fields })
      const datas = [...new Set(result.map(h => h[column]))]
      this.enumsData = datas.map(a => {
        return { value: a, text: a }
      })
    }
  },
  methods: {
    ...mapActions('dataset', ['getControlFilter']),
    doFilterField() {
      this.$emit('confirm', this.item)
    },
    doColse() {
      this.$emit('confirm')
    },
    doSubmit() {
      const params = this._theControlFilter_getParams()
      this.$emit('confirm', params)
    },
    _theControlFilter_setParams() {
      const condition = this.Utility.factorValue()
      const { factor } = this.item
      if (factor && factor.length > 0) {
        for (let i = 0; i < factor.length; i++) {
          const { logical, operator, value } = factor[i]
          if (typeof value !== 'string') {
            this.conditionTabs = 1
            condition.enums = value
            continue
          }
          if (logical) condition.relation = logical
          if (i > 0) {
            condition.value2 = operator
            condition.text2 = value
          } else {
            condition.value = operator
            condition.text = value
          }
        }
      }
      this.condition = condition
    },
    _theControlFilter_getParams() {
      const { condition, conditionTabs } = this
      const { value, text, value2, text2, relation, enums } = condition
      const result = []
      if (conditionTabs) {
        // 过滤器：枚举页面
        if (enums.length > 0) {
          result.push({ operator: 'in', value: enums })
        }
      } else {
        const bool = value && (text + '').trim() !== ''
        // 过滤器：条件页面
        if (bool) {
          const obj = { operator: value, value: text }
          result.push(obj)
        }
        if (value2 && (text2 + '').trim() !== '') {
          const obj = { operator: value2, value: text2 }
          if (bool) {
            obj.logical = relation
          }
          result.push(obj)
        }
      }
      return result
    }
  },
  mounted() {
    if (_.isEmpty(this.condition)) this._theControlFilter_setParams()
  }
}
</script>
<style lang="less">
.v-panel {
  .filterBody {
    padding: 10px 20px;
    text-align: left;
    .filterRows {
      margin: 30px 0;
      .v-select {
        width: 150px;
        vertical-align: top;
        min-height: 34px;
        .v-select__header {
          line-height: 32px;
          .v-select__header-arrow.v-icon {
            top: 11px;
          }
        }
      }
      .v-input--default {
        width: 280px;
      }
    }
    .enumsSelect {
      width: 100%;
    }
  }
  .filterFooter {
    position: absolute;
    width: 100%;
    bottom: 1px;
    height: 50px;
    text-align: right;
    padding: 0 15px;
    .v-button {
      margin-right: 10px;
    }
  }
}
</style>
