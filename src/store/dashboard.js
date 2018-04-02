import Utility from '@/utility'
export default client => ({
  namespaced: true,
  state: {
    dashboardData: [],
    curDashboard: {},
    curDashData: '', // 保存第一次进来的布局信息
    updateDashData: '' // 有修改过的值
  },
  actions: {
    /** 获取单个仪表板数据 */
    async getDashboardData({ commit, dispatch, state, rootState }, params = {}) {
      if (!params.customizationKey) return null

      params.engName = rootState.engName
      // 本地存储则取本地，没有则后台获取
      if (state.dashboardData.length > 0) {
        const item = state.dashboardData.find(d => {
          return d.CustomizationKey === params.customizationKey && d.EngName === rootState.engName
        })
        if (item) {
          commit('GET_DASHBOARD_DATA', item)
          commit('SET_DASHBOARD_STRING', item.Data)
          commit('SET_UPDATE_STRING', item.Data)
          return item
        }
      }
      const result = await dispatch('asyncDashboardData', params)
      return result
    },
    /** 获取仪表板数据 */
    async asyncDashboardData({ commit, state }, params) {
      const url = '/api/Customization/GetDashboardData'
      const result = await client.get(url, { params })
      if (result.Code && result.Code === 1) {
        await commit('GET_DASHBOARD_DATA', result.Result)
        await commit('SET_DASHBOARD_STRING', result.Result.Data)
        await commit('SET_UPDATE_STRING', result.Result.Data)
        return result.Result
      }
      return []
    },
    /** 根据登录用户获取仪表板集合 */
    async getDashboardDataByEngName({ commit, rootState }, params = {}) {
      const url = '/api/Customization/GetDashboardDataByEngName'
      params.engName = rootState.engName
      const result = await client.get(url, { params })
      if (result.Code && result.Code === 1) commit('SET_DASHBOARD_DATA', result.Result)
    },
    /** 保存仪表板信息（新建+修改） */
    async setDashboardData({ commit, rootState }, data = {}) {
      const url = '/api/Customization/SetDashboardData'

      data.EngName = rootState.engName
      const result = await client.post(url, { data })
      if (result.Code && result.Code === 1) {
        await commit('GET_DASHBOARD_DATA', data)
        await commit('SET_DASHBOARD_STRING', data.Data)
        await commit('SET_UPDATE_STRING', data.Data)
      }
      return result
    },
    /** 移除仪表板信息（engName+customizationKey） */
    async deleteDashboardData({ commit, rootState }, params = {}) {
      const url = '/api/Customization/DeleteDashboardData'

      params.engName = rootState.engName
      const result = await client.get(url, { params })
      return result
    }
  },
  mutations: {
    SET_DASHBOARD_DATA: (state, data) => {
      state.dashboardData = data
    },
    GET_DASHBOARD_DATA: (state, data) => {
      state.curDashboard = data
    },
    SET_DASHBOARD_STRING: (state, data) => {
      state.curDashData = data
    },
    SET_UPDATE_STRING: (state, data) => {
      state.updateDashData = data
    }
  },
  getters: {
    navs: state => {
      const { Data } = state.curDashboard
      if (Data) {
        try {
          const { layouts = [] } = JSON.parse(Data)
          const items = [
            {
              navTitle: ''
            },
            {
              navId: 'root',
              navTitle: '根导航'
            }
          ].concat(
            layouts
              .filter(item => item.navTitle)
              .sort((a, b) => {
                return b.x - a.x - (b.y - a.y)
              })
              .map(item => {
                return {
                  navId: Utility.spliceKey('griditem', item.i),
                  navTitle: item.navTitle,
                  navParent: item.navParent
                }
              })
          )
          top.NAVS = items.slice(1)
          return items
        } catch (error) {
          return []
        }
      }
      return []
    }
  }
})
