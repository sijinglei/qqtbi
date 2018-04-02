import { columnKey, columnLabel, grid, dataZoom } from '@/utils/echartsDefault'
import _ from 'lodash'
import fNumeral from '@/utils/numFormat' // 数字格式化（sjl暂留）

/**
 * 返回echarts组件格式化后的数据集合
 * @param {后台返回数据} data
 * @param {图表类型} type
 * @param {图表组件数据参数} params
 * @param {图表组件样式参数} styles
 */
export const formatData = (data, type, params, styles) => {
  let result = {}
  switch (type) {
    case 'pie':
      result = formatPieData(data, params, styles)
      break
    case 'radar':
      result = formatRadarData(data, params, styles)
      break
    case 'scatter':
      result = formatScatterData(data, params, styles)
      break
    default:
      result = formatOtherData(data, type, params, styles)
  }
  return result
}

// 渐变样式
const gradientColor = (startColor, endColor = '#F0F8FE') => {
  return {
    x: 0,
    y: 0,
    x2: 0,
    y2: 1,
    colorStops: [
      {
        offset: 0,
        color: startColor
      },
      {
        offset: 1,
        color: endColor
      }
    ]
  }
}
// style color设置
const spliceStyleColor = (bool, startColor, endColor) => {
  let color = startColor
  if (bool) {
    color = gradientColor(startColor, endColor)
    return {
      normal: {
        color
      },
      emphasis: {
        color
      }
    }
  } else {
    return {
      color
    }
  }
}
// dimension key
const spliceDimKey = (obj, arr, idx = 0, suffix = '') => {
  // 按维度递归排序获取key
  if (!arr[idx]) return `${suffix}`
  const key = arr[idx][columnKey]

  return `${obj[key]}${idx === 0 ? '' : '_'}${spliceDimKey(obj, arr, idx - 1, suffix)}`
}

const formatPieData = (data, { dimension = [], measure = [] }) => {
  if (dimension.length === 0 || measure.length === 0) {
    return {
      name: '',
      category: [],
      data: []
    }
  }
  const [dKey, seriesNames, datas] = [dimension[0][columnKey], [], []]
  const dataKeys = new Set(data.map(d => d[dKey]))

  // 添加数据格式处理(度量处理在每个图形里面进行)
  const objformatData = []
  for (let i = 0; i < measure.length; i++) {
    if (measure[i].formatData) {
      objformatData.push(getFomattes(measure[i]))
    }
    seriesNames.push(measure[i][columnLabel])
    const mKey = measure[i][columnKey]
    const mData = []
    for (let name of dataKeys.values()) {
      const items = data.filter(s => name === s[dKey])
      let value = 0
      if (items && items.length > 0) {
        // value = valueItems[0][measure[0][columnKey]]
        value = _.sum(items.map(v => v[mKey]))
      }
      mData.push({
        name,
        data: items,
        value
      })
    }
    datas.push(mData)
  }
  return {
    names: seriesNames,
    category: Array.from(dataKeys),
    data: datas,
    formatData: objformatData
  }
}

const formatRadarData = (data, { aliasKey, dimension, measure = [] }, { area = false, smooth = false } = {}) => {
  // set fixed parameters
  // set aAxis and group data
  const xAxisArr = []
  const xAxisKeyArr = []
  for (let i = 0; i < data.length; i++) {
    const currItem = data[i]

    const currKey = spliceDimKey(currItem, dimension, dimension.length - 1)
    currItem.dKey = currKey

    if (xAxisKeyArr.includes(currKey)) continue
    xAxisKeyArr.push(currKey)

    for (let j = 0; j < dimension.length; j++) {
      if (!xAxisArr[j]) xAxisArr[j] = []
      const key = dimension[j][columnKey]

      if (!currItem[key]) continue

      if (j !== 0 && i !== 0 && data[i - 1][key] === currItem[key]) {
        xAxisArr[j].push('')
      } else {
        // 处理时间格式
        let currXAxis = currItem[key]
        let formatTime = dimension[j].formatData
        if (formatTime) {
          currXAxis = fNumeral.formatTimeByRule(currXAxis, formatTime)
        }
        xAxisArr[j].push(currItem[key])
      }
    }
  }

  const series = []
  const category = []
  let indicator = []
  let maxValue = 0
  let objformatData = [] /* 数据格式 */
  for (let i = 0; i < measure.length; i++) {
    const measureObj = measure[i]

    const column = measureObj[columnKey]
    const dataArr = []

    category.push(measureObj[columnLabel])
    if (measureObj.formatData) {
      objformatData.push(getFomattes(measureObj))
    }
    for (let j = 0; j < xAxisKeyArr.length; j++) {
      if (i === 0) indicator.push(xAxisKeyArr[j])
      const valueItems = data.filter(s => s.dKey === xAxisKeyArr[j])
      const value = valueItems.length > 0 ? _.sum(valueItems.map(v => v[column])) : 0

      if (value > maxValue) maxValue = value
      dataArr.push(value)
    }
    series.push({
      name: measureObj[columnLabel],
      value: dataArr,
      areaStyle: area ? { normal: {} } : false
    })
  }
  indicator = indicator.map(i => {
    const obj = {
      name: i,
      max: maxValue
    }
    return obj
  })
  return {
    grid,
    category,
    indicator,
    series,
    formatData: objformatData
  }
}
const formatScatterData = (data, { aliasKey, measure, measure2 = [], dimension2 = [] }, { themes }) => {
  const dim2Key = dimension2.length > 0 ? dimension2[0][columnKey] : null
  const mea2Key = measure2.length > 0 ? measure2[0][columnKey] : null
  const group = []
  let dataZoomObj = data.length >= 10 ? dataZoom : null
  if (dataZoomObj) {
    dataZoomObj[0].xAxisIndex = 0
    dataZoomObj[1].xAxisIndex = 0
  }
  for (let i = 0; i < data.length; i++) {
    const currItem = data[i]
    if (!_.isNull(dim2Key) && currItem[dim2Key] && !group.includes(currItem[dim2Key])) {
      group.push(currItem[dim2Key])
    }
  }
  const series = []
  for (let i = 0; i < group.length; i++) {
    const item = group[i]
    const valueItems = data.filter(s => s[dim2Key] === item)
    const dataArr = valueItems.map(v => {
      return [v[measure[0][columnKey]], v[mea2Key]]
    })
    series.push({
      type: 'scatter',
      name: item,
      data: dataArr
    })
  }
  // 添加度量格式化对象
  const objformatData = []
  if (measure[0].formatData) {
    objformatData.push(getFomattes(measure[0]))
  }
  if (measure2[0].formatData) {
    objformatData.push(getFomattes(measure2[0]))
  }
  for (let j = 0; j < measure.length && group.length === 0; j++) {
    const dataArr = data.map(s => {
      return [s[measure[j][columnKey]], s[mea2Key]]
    })
    const obj = {
      type: 'scatter',
      name: measure[j][columnLabel],
      data: dataArr
    }
    series.push(obj)
  }
  const category = group.length > 0 ? group : measure.map(m => m[columnLabel])
  return {
    grid,
    category,
    series,
    dataZoom: dataZoomObj,
    formatData: objformatData
  }
}

const formatOtherData = (
  data,
  type = 'line',
  { aliasKey, dimension, dimension2 = [], measure = [] },
  { themes, area = false, gradient = false, horizontal = false, isStack = false, smooth = false } = {}
) => {
  // set fixed parameters 分组名称
  const dim2Key = dimension2.length > 0 ? dimension2[0][columnKey] : null
  const positionOffset = horizontal ? 'left' : 'bottom'
  const stack = isStack ? 'stack' : null
  const { colors } = themes
  // set aAxis and group data
  const xAxisArr = []
  const group = []
  let xMajorOffset = 2
  const xAxisKeyArr = []
  for (let i = 0; i < data.length; i++) {
    const currItem = data[i]
    if (!_.isNull(dim2Key) && currItem[dim2Key] && !group.includes(currItem[dim2Key])) {
      group.push(currItem[dim2Key])
    }

    const currKey = spliceDimKey(currItem, dimension, dimension.length - 1)
    currItem.dKey = currKey

    if (xAxisKeyArr.includes(currKey)) continue
    xAxisKeyArr.push(currKey)

    for (let j = 0; j < dimension.length; j++) {
      if (!xAxisArr[j]) xAxisArr[j] = []
      const key = dimension[j][columnKey]
      if (!currItem[key]) continue

      if (j !== 0 && i !== 0 && data[i - 1][key] === currItem[key]) {
        xAxisArr[j].push('')
      } else {
        // 处理时间格式
        let currXAxis = currItem[key]
        let formatTime = dimension[j].formatData
        if (formatTime) {
          currXAxis = fNumeral.formatTimeByRule(currXAxis, formatTime)
        }
        xAxisArr[j].push(currXAxis)
      }
    }
  }
  // set aAxisArr to aAxis
  const xAxis = []
  const xAxisIndexArr = []
  let gridOffset = 0
  let dataZoomObj = null

  for (let i = 0; i < xAxisArr.length; i++) {
    xAxisIndexArr.push(i)
    gridOffset = xMajorOffset * (12 * i)
    if (i === 0) {
      if (xAxisArr[i].length >= 6) dataZoomObj = dataZoom

      xAxis.push({
        show: true,
        type: 'category',
        axisLine: {
          show: false
        },
        axisTick: {
          lineStyle: {
            color: '#999'
          }
        },
        splitArea: {
          show: false
        },
        // axisLabel: { rotate: 90 },
        data: xAxisArr[i]
      })
    } else {
      xAxis.push({
        show: true,
        type: 'category',
        position: positionOffset,
        offset: gridOffset,
        axisLine: {
          show: false
        },
        axisTick: {
          length: gridOffset + 22,
          lineStyle: {
            color: '#999'
          },
          interval: function(index, value) {
            return value !== ''
          }
        },
        data: xAxisArr[i]
      })
    }
  }
  grid[positionOffset] = gridOffset + 20
  if (dataZoomObj) {
    dataZoomObj[0].xAxisIndex = xAxisIndexArr
    dataZoomObj[1].xAxisIndex = xAxisIndexArr
  }
  const series = []
  // warn: group and measure no same time Multiple
  for (let i = 0; i < group.length; i++) {
    const item = group[i]
    const dataArr = []
    for (let j = 0; j < xAxisKeyArr.length; j++) {
      const valueItems = data.filter(s => s.dKey === xAxisKeyArr[j] && item === s[dim2Key])
      // const value = !valueItems ? 0 : valueItems[0][measure[0][columnKey]]
      const value = valueItems.length > 0 ? _.sum(valueItems.map(v => v[measure[0][columnKey]])) : 0

      dataArr.push(type === 'map' ? { name: xAxisKeyArr[j], value } : { data: valueItems, value })
    }
    const seriesTemp = forSetSeriesData(dataArr, i, item)
    series.push(seriesTemp)
  }
  // 添加数据格式处理(度量处理在每个图形里面进行)
  const objformatData = []
  for (let i = 0; i < measure.length; i++) {
    if (measure[i].formatData) {
      objformatData.push({ type, AppName: measure[i].AppName, formatData: measure[i].formatData })
    }
  }
  for (let i = 0; i < measure.length && group.length === 0; i++) {
    const column = measure[i][columnKey]
    const dataArr = []
    // 判断是否启用了折线
    const isLine = measure[i].isLine
    type = isLine ? 'line' : 'bar'

    for (let j = 0; j < xAxisKeyArr.length; j++) {
      const valueItems = data.filter(s => s.dKey === xAxisKeyArr[j])
      // const value = !valueItems ? 0 : valueItems[0][column]
      const value = valueItems.length > 0 ? _.sum(valueItems.map(v => v[column])) : 0

      dataArr.push(type === 'map' ? { name: xAxisKeyArr[j], value } : { data: valueItems, value })
    }

    const seriesTemp = forSetSeriesData(dataArr, i, measure[i][columnLabel])
    series.push(seriesTemp)
  }
  // 显示图例的数据
  const category = group.length > 0 ? group : measure.map(m => m[columnLabel])

  // 初始化时图表判断，如果没有数据，隐藏图表原有x轴线展示
  if (xAxis.length === 0) {
    xAxis.push({
      type: 'category',
      axisLine: {
        show: false
      }
    })
  }

  function forSetSeriesData(data, idx, name) {
    let seriesTemp = {}
    const currIdx = idx >= colors.length ? parseInt(idx % colors.length) : idx

    switch (type) {
      case 'bar':
        seriesTemp = {
          type,
          name,
          stack,
          barGap: 0,
          barMaxWidth: 25,
          data,
          itemStyle: spliceStyleColor(gradient, colors[currIdx])
        }
        break
      case 'map':
        seriesTemp = {
          type,
          name,
          mapType: 'china',
          selectedMode: 'single',
          data
        }
        break
      case 'line':
        seriesTemp = {
          type,
          name,
          stack,
          smooth,
          data,
          areaStyle: area ? spliceStyleColor(gradient, colors[currIdx]) : false
        }
        break
      default:
        seriesTemp = {
          type,
          stack,
          name,
          data
        }
    }
    return seriesTemp
  }

  return {
    grid,
    category,
    xAxis,
    series,
    dataZoom: dataZoomObj,
    formatData: objformatData
  }
}
/**
 * 根据字段对象（纬度和度量）获取他的格式
 * @param {*获取} type
 * @param {*} fieldObj
 */
function getFomattes(fieldObjs) {
  // 添加数据格式处理(度量处理在每个图形里面进行)
  return { formatData: fieldObjs.formatData }
}
