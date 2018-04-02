<template>
  <div class="query-control">
    <v-tabs v-model="defaultIdx" indent="4">
      <v-tab :value="0">标题</v-tab>
    </v-tabs>
    <v-input v-model="item.title" placeholder="查询条件组件标题" style="margin-top:5px;margin-left:5px;" />

    <div class="v-tabs v-tabs-default" style="padding-left: 4px;margin-top:5px;">
      <div class="v-tab is-selected">
        <span class="v-tab__label">条件配置</span>
      </div>
      <i class="iconfont icon-jiahao" title="新增条件" @click="addQuery"></i>
      <i class="v-tabs-default__underline" style="width: 64px; transform: translateX(4px); transition: transform 0s;"></i>
    </div>
    <div v-if="defaultIdx===0" class="query-list" :style="{'maxHeight': maxHeight + 'px'}" v-scroll>
      <p class="btns">
        <!-- <v-button status="success" @click="addQuery">新增条件</v-button> -->
      </p>
      <section class="query">
        <fieldset>
          <legend>条件一</legend>
          <i class="iconfont icon-yichu" title="移除条件" @click="delQuery"></i>
          <v-tabs v-model="queryTabIndex" indent="4">
            <v-tab :value="0">数据</v-tab>
            <v-tab :value="1">样式</v-tab>
          </v-tabs>
          <div v-if="queryTabIndex===0" class="data-wrap" :style="{'maxHeight': maxHeight + 'px'}">
            <v-input v-model="queryText1" name="queryTitle" placeholder="请输入标题">
            </v-input>
            <v-select :options="queryFields" v-model="default1" placeholder="请选择查询字段"></v-select>
          </div>
          <div v-else class="style-wrap">
            <v-collapse v-model="selectedCollapse">
              <v-collapse-item class="layoutContent" text="布局" :value="1">
                <div class="rows" slot="content">
                  <v-checkbox v-model="styles.horizontal" label="横向" />
                </div>
              </v-collapse-item>
              <v-collapse-item class="layoutContent" text="设计" :value="2">
                <div class="rows">
                  <label class="rowsLable alignTop">是否多选</label>
                  <v-radio-group vertical v-model="styles.multiple">
                    <v-radio name="multipleRadio" :value="1">多选</v-radio>
                    <v-radio name="multipleRadio" :value="0">单选</v-radio>
                  </v-radio-group>
                </div>
                <div class="rows" slot="content">
                  <label class="rowsLable alignTop">显示模式</label>
                  <v-radio-group vertical v-model="styles.mode">
                    <v-radio v-for="(i,idx) in modeSet" :key="Utility.spliceKey('s','mode',idx)" name="modeRadio" :value="i.value">{{i.text}}</v-radio>
                  </v-radio-group>
                </div>
              </v-collapse-item>
            </v-collapse>
          </div>
        </fieldset>
      </section>
    </div>
    <v-tabs v-model="currentTabIdx" indent="5">
      <v-tab :value="0">高级</v-tab>
    </v-tabs>
    <div>
      <control-high v-if="currentTabIdx==0" :item="item" :list="list" @changeHigh="changeHigh" />
    </div>

  </div>
</template>
<script>
import { columnKey, columnLabel } from '@/utils/echartsDefault'
import ControlHigh from './TheControlHigh'
import ControlStyles from './TheControlStyles'
// import _ from 'lodash'
export default {
  data() {
    return {
      selectedCollapse: [1, 2],
      defaultIdx: 0,
      queryText1: '',
      queryTabIndex: 0,
      currentTabIdx: 0
    }
  },
  props: {
    maxHeight: Number,
    item: Object,
    styles: Object,
    dimension: Array,
    list: Array,
    global: Object
  },
  computed: {
    dragFieldKeys() {
      const arr = ['aliasKey', 'appName', 'rowsNumber']
      return Object.keys(this.item.params).filter(f => !arr.includes(f))
    },
    queryFields() {
      return this.dimension.map(item => {
        return { text: item[columnLabel], value: item[columnKey] }
      })
    },
    modeSet() {
      return [
        { value: '1', text: '默认' },
        { value: '2', text: '卡片' },
        { value: '5', text: '下拉框' },
        { value: '6', text: '单选按钮' },
        { value: '7', text: '日期范围选择' }
      ]
    }
  },
  components: {
    ControlStyles,
    ControlHigh
  },
  methods: {
    /**
     * 新增tab项
     */
    addQuery() {},
    /**
     * 删除tab
     */
    delQuery(idx) {}
  },
  watch: {}
}
</script>
<style lang="less">
.v-collapse-item__content-inner {
  font-size: 12px;
}
.v-collapse-item__header {
  background: #f5f8fa;
  box-sizing: border-box;
  height: 30px;
  padding: 5px 10px 0;
  cursor: pointer;
}
.v-collapse-item__header__text {
  font-size: 12px;
}

.layoutContent {
  .v-checkbox {
    min-width: 48.5%;
    font-size: 12px;
    .v-checkbox__label {
      margin-left: 3px;
    }
  }
  .v-select {
    width: 70%;
  }
  .v-collapse-item__content {
    padding: 5px;
  }
}
.query-control {
  .btns {
    padding: 0 5px;
    .v-button {
      width: 100%;
    }
  }
  .iconfont {
    top: 2px;
    right: 10px;
    position: absolute;
  }
}
.query-list {
  margin-top: 5px;
  .query {
    margin-top: 5px;
    fieldset {
      border: 1px solid #eee;
      margin: 5px 0;
      border-left: none;
      border-right: none;
      position: relative;
      legend {
        font-size: 12px;
        padding: 5px;
        font-weight: 600;
      }
    }
    .data-wrap {
      width: 100%;
      margin: 5px 0;
      padding: 0 5px;
      height: 200px;
      position: relative;
      .v-input--simple {
        width: 100%;
      }
      .v-select {
        width: 190px;
        margin: 5px 0;
      }
    }
    .rows {
      margin-top: 3px;
      vertical-align: middle;
      .rowsLable {
        display: inline-block;
        vertical-align: middle;
        font-size: 12px;
      }
      .alignTop {
        vertical-align: top;
      }
      .labelMiddle {
        vertical-align: top;
        line-height: 30px;
      }
      .v-select {
        min-height: 30px;
        .v-select-list {
          font-size: 12px;
        }
        .v-select__header {
          padding: 0 10px 0 8px;
          line-height: 30px;
          font-size: 12px;
          .v-select__header-arrow.v-icon {
            top: 9px;
            right: 8px;
          }
        }
      }
      .v-radio-group {
        .v-radio-group-item {
          margin: 0 10px 5px 0;
        }
      }
    }
  }
}
</style>
