import { columnKey, columnType, dataType, columnFormatData } from '@/utils/echartsDefault'
import md5 from 'md5'
import moment from 'moment'
import { bus } from '@/utils/bus.js'
import bids from '@/utils/bids.protocolHelper'
// import bids from '@/utils/bids.protocolHelper-0.30.1'
import _ from 'lodash'
const dbKeys = require('../../static/data/databaseKeys')

/**
 * 各组件获取数据集合
 * aliasKey
 * appName  数据库字段 用来获取databaseKeys.json密匙
 */
const getApiGetParams = ({ appkey, alias, fields = [], rowsNumber = 0, arithmetics = [], orderBys = [] }) => {
  // console.log(arithmetics)
  const timestamp = new Date().getTime()
  // FIXME: 暂时只有一个字段时去重
  let selectSql = new bids.select(appkey, alias, fields.length === 1)
  if (rowsNumber !== 0) {
    selectSql.setRange(1, rowsNumber)
  }

  // .addFields(['a', 'b', 'c'])
  // .addField('d')
  // .addField('e')
  // .addLogical(bids.logicalType.leftBracket)
  // FIXME: in数组有BUG，待验证
  // .addArithmetic('ABC', bids.arithmeticType.in, ['ADSF中SSS国', 'riben'])
  // .addArithmetic('def', bids.arithmeticType.eq, 'ADSF中SSS国')
  // .addLogical(bids.logicalType.rightBracket)
  // .addOrderBy('haha', bids.orderType.asc)
  // .addOrderBy('hehe', bids.orderType.desc)
  if (fields.length > 0) {
    selectSql.addFields(fields)
  }
  for (let i = 0; i < arithmetics.length; i++) {
    const arith = arithmetics[i]
    // 添加逻辑运算符 or、and
    arith.prevLogical && selectSql.addLogical(bids.logicalType[arith.prevLogical])
    // 添加左括号
    if (arith.lefts) {
      for (let j = 0; j < arith.lefts; j++) {
        selectSql.addLogical(bids.logicalType.leftBracket)
      }
    }
    // 添加查询条件
    if (_.isArray(arith.value) && arith.value.length === 1) {
      // 值是数组，且只有一项时用 =
      selectSql.addArithmetic(arith.key, bids.arithmeticType.eq, arith.value[0])
    } else {
      selectSql.addArithmetic(arith.key, bids.arithmeticType[arith.operator], arith.value)
    }
    // 添加逻辑运算符 or、and
    arith.logical && selectSql.addLogical(bids.logicalType[arith.logical])
    // 添加右括号
    if (arith.rights) {
      for (let j = 0; j < arith.rights; j++) {
        selectSql.addLogical(bids.logicalType.rightBracket)
      }
    }
  }
  // 排序
  for (let i = 0; i < orderBys.length; i++) {
    // tempHelper.addOrderBy(orderBys[i], bids.orderType.desc)
    selectSql.addOrderBy(orderBys[i][columnKey], orderBys[i].orderType)
  }
  if (orderBys.length === 0 && fields.length > 0) {
    selectSql.addOrderBy(fields[0], bids.orderType.desc)
  }
  console.log(selectSql.toXml())
  const content = bus.Utility.btoa(selectSql.toXml())
  const timesStr = moment(timestamp).format('YYYY-MM-DD HH:mm:ss.SSS')
  const md5Str = md5(`${dbKeys[appkey] || ''};${content};${timesStr}`)
  return {
    md5: md5Str,
    content,
    timestamp
  }
}

const getFilterToArr = (filters, global = [], args) => {
  let result = []
  // 字段过滤
  for (let i = 0; i < filters.length; i++) {
    if (!filters[i].factor) continue
    const fieldKey = filters[i][columnKey]
    const factorSet = filters[i].factor
    const len = factorSet.length
    for (let f = 0; f < len; f++) {
      const { logical, operator, value } = factorSet[f]
      if (len === 1) {
        const obj = { lefts: 1, operator, key: fieldKey, value, rights: 1 }
        result.push(obj)
      } else {
        const obj = { operator, key: fieldKey, value }
        if (logical) obj.prevLogical = logical
        if (f === 0) {
          obj.lefts = 1
        } else {
          obj.rights = 1
        }
        result.push(obj)
      }
    }
  }
  // 全局过滤
  for (let i = 0; i < global.length; i++) {
    const { key, value } = global[i]
    let obj = { lefts: 1, operator: 'eq', key, value, rights: 1 }
    // 处理是null的情况
    if (value === null) {
      obj = { lefts: 1, operator: 'isnull', key, value, rights: 1 }
    }
    if (result.length > 0) {
      obj.prevLogical = 'and'
    }
    result.push(obj)
  }
  const argsLen = args.length
  if (argsLen === 0) return result
  // 高级-互动关联
  for (let i = 0; i < argsLen; i++) {
    const { columns, value, operator } = args[i]
    const obj = { operator, key: columns, value }
    if (i === 0) {
      obj.lefts = 1
      if (result.length > 0) {
        obj.prevLogical = 'and'
      }
    }
    if (i > 0) {
      obj.prevLogical = 'and'
    }
    if (i === argsLen - 1) {
      obj.rights = 1
    }
    result.push(obj)
  }
  return result
}

export default client => ({
  namespaced: true,
  state: {
    dimension: [],
    measure: [],
    aliasData: [],
    aliasDataMaps: {
      value: 'Name',
      text: 'Description'
    },
    HRDWData: [],
    // Analysys int值 0：标签（文本） 1：编码 2：统计量 3：日期 4：布尔5：其他
    numberTypes: [2],
    numDataType: ['TINYINT', 'SMALLINT', 'MEDIUMINT', 'INT', 'BIGINT', 'FLOAT', 'DOUBLE', 'DECIMAL', 'NUMERIC'],
    dashboardData: []
  },
  actions: {
    /** 获取各组件数据集合 */
    async getApiFieldData({ commit, dispatch }, { aliasKey, appName, params, globalFilter, args } = {}) {
      const {
        filter,
        orderBy,
        rowsNumber,
        dimension = [],
        measure = [],
        dimension2 = [],
        measure2 = [],
        blend = []
      } = params
      const arithmetics = getFilterToArr(filter, globalFilter, args)
      let fields = [...dimension, ...dimension2, ...measure, ...measure2, ...blend]
      fields = fields.map(f => f[columnKey])
      // const operator = dimension.length === 0 && blend.length > 0 ? blend : dimension
      // const orderBys = operator.map(d => d[columnKey])
      const orderBys = orderBy
      const content = {
        appkey: appName,
        alias: aliasKey,
        fields,
        rowsNumber,
        arithmetics,
        orderBys
      }
      const result = await dispatch('getApiGetData', content)
      return result
    },
    /** 获取过滤条件使用数据集 */
    async getControlFilter({ commit, dispatch }, { aliasKey, appName, fields } = {}) {
      const content = {
        appkey: appName,
        alias: aliasKey,
        fields,
        rowsNumber: 100
      }
      const result = await dispatch('getApiGetData', content)
      return result
    },
    /** 获取数据集信息 */
    async getApiData({ commit, dispatch }) {
      // FIXME: arithmetics的值目前用于测试
      const content = {
        appkey: 'HRMAP_MGR',
        alias: 'GET_ALIASLIST_INFO',
        arithmetics: [{ operator: 'eq', key: 'DSName', value: 'DM' }]
      }
      const result = await dispatch('getApiGetData', content)
      if (result && result.length > 0) {
        commit('SET_ALIAS_DATAS', result)
      }
    },
    /** 根据数据集获取字段信息(可存储) */
    async getApiFieldList({ commit, dispatch }, params) {
      const { aliasKey, appName, setData = true } = params

      const content = {
        appkey: 'HRMAP_MGR',
        alias: 'GET_FIELDLIST_INFO',
        arithmetics: [
          { operator: 'eq', key: 'AppName', value: appName, logical: 'and' },
          { operator: 'eq', key: 'AliasName', value: aliasKey }
        ]
      }
      const result = await dispatch('getApiGetData', content)
      if (result && result.length > 0 && setData) {
        commit('SET_DIMENSION_DATA', result)
      }
      return result
    },
    /** 根据URL获取数据信息 */
    async getUrlData({ commit }, params) {
      const url = params.url
      delete params.url
      const result = await client.get(url, { params })
      return result || []
    },
    /** 根据条件获取API GET 数据 */
    async getApiGetData({ commit }, params) {
      const url = '/api/get/json'
      params = getApiGetParams(params)
      let result = await client.get(url, { params })
      if (result.Code && result.Code === 1) return result.Result
      else bus.$emit('showndataabnormal', result.Message || '获取数据异常')
      return []
    },
    /** 根据数据集获取字段信息(不存储，直接return) */
    async getApiFieldListResult({ commit, state, dispatch }, params) {
      params.setData = false
      const data = await dispatch('getApiFieldList', params)
      if (data.length === 0) return []
      if (params.full) return data
      // 解析字段
      const numArr = state.numDataType // state.numberTypes //临时更改
      const dimension = []
      for (let i = 0; i < data.length; i++) {
        const item = data[i]
        if (!numArr.includes(item[dataType])) {
          dimension.push(Object.assign({ [columnType]: 0 }, item))
        }
      }
      return dimension
    }
  },
  mutations: {
    SET_DIMENSION_DATA: (state, data) => {
      state.HRDWData = data
      // 解析字段
      const dimension = []
      const measure = []
      const numArr = state.numDataType // state.numberTypes
      for (let i = 0; i < data.length; i++) {
        const item = data[i]
        let ismeasure = numArr.includes(item[dataType])
        const operateArr = ismeasure ? measure : dimension
        let formattingObj = null
        if (ismeasure) {
          formattingObj = {
            point: 2,
            isThousandth: true,
            isPercent: false,
            isProportion: false
          }
        }
        if (!ismeasure && item[dataType].indexOf('DATE') > -1) {
          formattingObj = {
            timeFomat: 'YYYY-MM-DD' // 时间格式化规则
          }
        }
        const obj = {
          [columnType]: ismeasure ? 1 : 0,
          // 添加默认字段格式化规则
          [columnFormatData]: formattingObj
        }
        // 如果是度量
        if (ismeasure) {
          obj.isLine = false // 是否是折线数据，默认否
        }
        operateArr.push(Object.assign(obj, item))
      }
      state.dimension = dimension
      state.measure = measure
    },
    SET_ALIAS_DATAS: (state, data) => {
      state.aliasData = data
    }
  },
  getters: {}
})
