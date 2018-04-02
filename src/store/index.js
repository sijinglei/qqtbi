import Vue from 'vue'
import Vuex from 'vuex'
import createLogger from 'vuex/dist/logger'
import HttpClient from '../utils/httpClient'
import { storageHelper } from '../utils/constants'
import ModDashboard from './dashboard'
import ModDataset from './dataset'

Vue.use(Vuex)
Vue.config.devtools = config.env !== 'production'
const client = new HttpClient()

const store = new Vuex.Store({
  strict: Vue.config.devtools,
  middlewares: Vue.config.devtools ? [createLogger()] : [],
  modules: {
    dashboard: ModDashboard(client),
    dataset: ModDataset(client)
  },
  state: {
    winHeight: window.innerHeight,
    winWidth: window.innerWidth,
    selectTabItem: null, // 当前选定的图表
    isSelected: true,
    testVal: 0,
    engName: storageHelper.getEngName(),
    tgColsObj: {},
    filterValues: []
  },
  actions: {
    // 获取用户基本信息
    async getUserCookie({ commit }) {
      const allCookie = document.cookie.split(';')
      const uIdStr = allCookie.find(c => c.indexOf('t_uid') > 0)
      const uId = uIdStr && uIdStr.split('=')[1]
      if (uId) storageHelper.setEngName(uId)
    },
    // 清楚缓存接口
    clearUserCookie({ commit }) {
      var keys = document.cookie.match(/[^ =;]+(?==)/g)
      if (keys) {
        for (var i = keys.length; i >= 0; i--) {
          const curr = new Date(0).toUTCString()
          document.cookie = `${keys[i]}=0;expires=${curr}`
        }
      }
      // window.location.href = config.logoutUrl
    },
    setLayoutsList({ commit }, data) {
      commit('SET_LAYOUTS', data)
    },
    setSelectTabItem({ commit }, item) {
      commit('SET_SELECTTABITEM', item)
    },
    setSelected({ commit }, value) {
      commit('SET_SELECTED', value)
    }
  },
  mutations: {
    SET_WIN_HEIGHT: (state, data) => {
      state.winHeight = data
    },
    SET_WIN_WIDTH: (state, data) => {
      state.winWidth = data
    },
    SET_TEST_VALUE: (state, data) => {
      state.testVal = data
    },
    SET_SELECTTABITEM: (state, item) => {
      state.selectTabItem = item
    },
    SET_SELECTED: (state, item) => {
      state.isSelected = item
    },
    SET_TG_COLUMNS: (state, { id, data }) => {
      if (state.tgColsObj[id]) {
        state.tgColsObj[id] = data
      } else {
        state.tgColsObj = {
          [id]: data,
          ...state.tgColsObj
        }
      }
      state.tgColsObj.opId = id
    },
    SET_FILTER_VALUES(state, data) {
      // state.filterValues{
      // fileterId,  // 组件id
      // filterField,// 查询字段
      // multiple,   // 是否多选
      // mode,       // 显示模式
      // value       // 当前值
      // }
      if (Object.keys(data).length > 0) {
        if (state.filterValues.length > 0) {
          let filterIds = [].concat(...state.filterValues.map(item => item.fileterId))
          if (!filterIds.includes(data.fileterId)) {
            state.filterValues.push(data)
          } else {
            let currentIdx = state.filterValues.findIndex(d => d.fileterId === data.fileterId)
            state.filterValues.splice(currentIdx, 1, data)
          }
        } else {
          state.filterValues.push(data)
        }
      }
    }
  }
})

export default store
