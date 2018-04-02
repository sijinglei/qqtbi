<template>
  <div :id="item.i" class="baseQuery" @click.stop="selectItem">
    <div v-for="(item, idx) in blendData" :key="Utility.spliceKey('b',item.i,idx)" class="cards">
      <span v-show="showTitle" class="cardTitle">{{item[columnLabel]}}：</span>
      <div class="cardBody" :class="{isHeng:styles.horizontal,isShowBorder:styles.isBorder}" :style="{height:maxHeight+'px'}">
        <template v-if="allFields.length">
          <v-select-list v-if="mode==='1'" :multiple="multiple" :options="allFields" :single-unselect="true" @select="selectCard"></v-select-list>
          <div class="seach-group" v-else-if="mode==='5'">
            <label for="">{{item.Description}}</label>
            <div class="control">
              <v-select name="multi" :options="allFields" :multiple="multiple" @select="selectOption"></v-select>
            </div>
          </div>
          <v-radio-group v-else-if="mode==='6'" :vertical="styles.horizontal" v-model="defaultRadioChecked" @change="selectRadio">
            <v-radio v-for="(rad,ridx) in allFields" :key="Utility.spliceKey('radio',item.i,ridx)" name="radio" :value="rad.value">{{rad.text}}</v-radio>
          </v-radio-group>
          <div class="seach-group" v-else-if="mode==='7'">
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
import _ from 'lodash'
export default {
  data() {
    return {
      element: null,
      timer: null,
      editorObj: null,
      showToolbar: false
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
    }
  },
  methods: {
    reset() {
      // TODO: 组件对外公布通用方法，需要时增加实现
    },
    reload(args = []) {
      this._baseQuery_initFields(args)
    },
    selectItem() {
      this.$emit('select', this.item.i)
    },
    _baseQuery_init() {
      if (!this.element) {
        this.element = document.getElementById(this.item.i)
      }
      // 定时获取宽高再初始化
      if (!this.element || this.element.clientHeight < 10) {
        this.timer = setTimeout(this._baseQuery_init, 200)
        return
      }
      this.timer && clearTimeout(this.timer)
      this._baseQuery_initFields()
    },
    _baseQuery_initFields() {}
  },
  mounted() {
    this._baseQuery_init()
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
