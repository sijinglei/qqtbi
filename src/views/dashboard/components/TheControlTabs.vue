<template>
  <div class="tabs-control">
    <v-tabs v-model="currentTabIdx" indent="4">
      <v-tab :value="0">标题</v-tab>
    </v-tabs>
    <div class="item-tab-title">
      <v-input v-model="item.title" name="tabTitle" placeholder="标题名称">
      </v-input>
      <v-checkbox v-if="item.showTitle !== void 0" v-model="item.showTitle" label="显示标题"></v-checkbox>
      <v-textarea v-model="item.titleTip" maxlength="100" limit="100" autoheight placeholder="标题描述信息。" v-if="item.showTitle"></v-textarea>
    </div>
    <v-tabs v-model="currentTabIdx" indent="5">
      <v-tab :value="0">标签</v-tab>
    </v-tabs>
    <div class="tab-items" :style="{'maxHeight': maxHeight + 'px'}" v-scroll>
      <ul>
        <li class="input-wrap" v-for="(item,idx) in tabItems" :key="idx">
          <v-input v-model="item.value" name="tabName">
          </v-input>
          <i class="iconfont icon-shanchu" title="删除" @click="delTab(idx)" />
        </li>
      </ul>
      <div class="btn-tab">
        <p>
          <v-button status="success" @click="addTab">新增TAB标签</v-button>&nbsp;</p>
      </div>
    </div>
  </div>
</template>
<script>
import _ from 'lodash'
export default {
  data() {
    return {
      currentTabIdx: 0
    }
  },
  props: {
    maxHeight: Number,
    item: Object,
    global: Object
  },
  computed: {
    tabItems() {
      return this.item.params.tabItems
    },
    tabLayouts() {
      return this.item.params.tabLayouts
    },
    tabLen() {
      return this.item.params.tabItems.length
    }
  },
  methods: {
    /**
     * 新增tab项
     */
    addTab() {
      var vm = this
      var Utility = this.Utility
      let deepItem = _.cloneDeep(vm.item)
      const tabidStr = String(vm.tabLen + 1)
      const tabItem = {
        id: Utility.spliceKey(deepItem.i, 'tab' + tabidStr),
        value: 'Tab' + tabidStr
      }
      const tabLayout = {
        id: Utility.spliceKey(deepItem.i, 'tab' + tabidStr, 'content'),
        layouts: []
      }
      // 新增时添加默认值
      vm.tabItems.push(tabItem)
      vm.tabLayouts.push(tabLayout)
    },
    /**
     * 删除tab
     */
    delTab(idx) {
      this.tabItems.splice(idx, 1)
      this.tabLayouts.splice(idx, 1)
    }
  },
  watch: {}
}
</script>
<style lang="less">
.tabs-control {
  .item-tab-title {
    margin: 5px;
  }
}
.tab-items {
  position: relative;
  padding: 5px 0;
  .input-wrap {
    margin-top: 5px;
    margin-left: 5px;
    .v-input {
      width: 160px;
    }
    .iconfont {
      font-size: 16px;
      cursor: pointer;
    }
    &:hover {
      color: #00cc26;
    }
  }
  .btn-tab {
    text-align: center;
    margin-top: 5px;
    .v-button {
      height: 30px;
      line-height: 30px;
      width: 90%;
      font-size: 12px;
    }
  }
}
</style>
