import bar from './bar'
import line from './line'
import pie from './pie'
import radar from './radar'
import scatter from './scatter'
import { formatData } from './format'
import { Utils, themes } from '@/utils/echartsDefault'
import _ from 'lodash'

const forSetColumn = (arr, columnKey, value) => {
  for (let i = 0; i < arr.length; i++) {
    if (!_.isUndefined(arr[i][columnKey])) arr[i][columnKey] = value
  }
}

const spliceStylesOptions = (
  options,
  { horizontal, xAxis, yAxis, legend, legendSelect, label, labelSelect, labelRotate }
) => {
  const { xAxis: x, yAxis: y, dataZoom, series = [] } = options

  if (horizontal) {
    options.xAxis = y
    options.yAxis = x
    if (dataZoom) {
      options.dataZoom[0].orient = 'vertical'
      options.dataZoom[0].yAxisIndex = dataZoom[0].xAxisIndex
      options.dataZoom[0].xAxisIndex = null
      options.dataZoom[1].orient = 'vertical'
      options.dataZoom[1].yAxisIndex = dataZoom[0].xAxisIndex
      options.dataZoom[1].xAxisIndex = null
    }
  }
  if (label && series.length > 0) {
    for (let i = 0; i < series.length; i++) {
      options.series[i].label = {
        normal: {
          show: true,
          position: labelSelect,
          rotate: labelRotate
        }
      }
    }
  }
  if (!xAxis) options.xAxis && forSetColumn(options.xAxis, 'show', false)
  if (!yAxis) options.yAxis && forSetColumn(options.yAxis, 'show', false)

  if (legend) {
    options.legend.show = true
    options.legend = Object.assign({}, options.legend, Utils.legendType(legendSelect))
    options.grid[legendSelect] = Utils.gridSize(legendSelect)
  }
  return options
}

const eConfig = {
  bar,
  line,
  pie,
  radar,
  scatter,
  getConfig(source, themeTabs, { type, params = {}, styles = {}, high = {} }) {
    if (!this[type]) return {}
    styles = Object.assign({}, styles)
    if (!styles.themes) styles.themes = themes[themeTabs]

    const data = formatData(source, type, params, styles)
    // cloneDeep 防止引用对象而数据错乱
    let options = _.cloneDeep(this[type](data, styles, high))

    // 非饼图使用样式属性配置，饼图在pie.js中配置
    if (!['pie'].includes(type)) {
      options = spliceStylesOptions(options, styles)
    }
    return options
  }
}
export default eConfig
