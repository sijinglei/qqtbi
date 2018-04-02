<template>
  <div>
    <v-tabs v-model="tab1" indent="5">
      <v-tab :value="0">链接</v-tab>
      <v-tab :value="1">高级</v-tab>
    </v-tabs>
    <div v-if="tab1===0" class="selectData" :style="{'maxHeight': maxHeight + 'px'}" v-scroll>
      <v-input class="linkInput" v-model="item.url" placeholder="链接地址" @enter="linkHandler" @blur="linkHandler" />
      <ul class="paramsUl">
        <li v-for="(item, idx) in requestParams" :key="Utility.spliceKey('f','p',idx)">
          <span class="paramsTitle">{{item.key}}</span>
          <v-select :options="fieldKeys" v-model="item.value" popper-clazz="controlFrameSelect" :max-height="400" placeholder="切换字段" @select="aliasDataSelect">
          </v-select>
        </li>
      </ul>
    </div>
    <control-high v-else :item="item" :max-height="maxHeight" :list="list"/>
  </div>
</template>
<script>
import { mapState } from 'vuex'
import ControlHigh from './TheControlHigh'
import _ from 'lodash'

export default {
  data() {
    return {
      tab1: 0,
      fieldKeys: [],
      requestParams: []
    }
  },
  props: {
    maxHeight: Number,
    item: Object,
    global: Object,
    list: Array
  },
  components: {
    ControlHigh
  },
  computed: {
    ...mapState('dataset', ['aliasDataMaps'])
  },
  watch: {
    global() {
      this._theControlFrame_initGlobal()
    }
  },
  methods: {
    linkHandler() {
      this._theControlFrame_initParams()
      this.$emit('run')
    },
    aliasDataSelect({ value, current }) {
      this.$nextTick(() => {
        const isChange = this.requestParams.some(p => p.value !== -1)
        if (isChange) {
          this.item.request = _.cloneDeep(this.requestParams)
        } else {
          delete this.item.request
        }
        this.$emit('run')
      })
    },
    _theControlFrame_initParams() {
      const { url, request = [] } = this.item
      if (!url || url.trim() === '') return
      let questionIdx = url.indexOf('?')
      this.requestParams = []
      if (questionIdx > -1) {
        const str = url.substr(questionIdx + 1)
        const strArr = str.split('&')
        for (let i = 0; i < strArr.length; i++) {
          let paramArr = strArr[i].split('=')
          const item = request.find(r => r.key === paramArr[0])
          const value = item ? item.value : -1
          this.requestParams.push({ key: paramArr[0], value, current: paramArr[1] })
        }
      } else {
        delete this.item.request
      }
    },
    _theControlFrame_initGlobal() {
      const { fields } = this.global
      if (!fields) return
      this.fieldKeys = [{ value: -1, text: '原值' }]
      for (let key of Object.keys(fields)) {
        this.fieldKeys.push({ value: key, text: key })
      }
    }
  },
  mounted() {
    this._theControlFrame_initGlobal()
    this._theControlFrame_initParams()
  }
}
</script>
<style lang="less">
.selectData {
  .paramsUl {
    margin-top: 10px;
    li {
      line-height: 28px;
      padding: 0 3px;
      .paramsTitle {
        font-size: 14px;
        font-weight: bold;
        margin-left: 5px;
      }
    }
    .v-select {
      width: 180px;
      margin-left: 5px;
    }
  }
}
</style>

