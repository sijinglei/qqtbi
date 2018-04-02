import { Utils, grid } from '@/utils/echartsDefault'
import fNumeral from '@/utils/numFormat' // 数字格式化

const roseType = mode => {
  switch (mode) {
    case '3':
      return 'radius'
    case '4':
      return 'area'
    default:
      return false
  }
}

const labelFormatter = (type, params, formatData) => {
  let c = params.value
  // 系列名称
  let b = params.seriesName
  let d = params.percent
  if (formatData && formatData.length > 0) {
    let format = formatData[0].formatData
    c = fNumeral.formatNumByRule(c, format)
  }
  switch (type) {
    case 1:
      return `${b}`
    case 2:
      return `${b}:${c}`
    case 3:
      return `${b}:${d}%`
    default:
      return `${b},${d}%(${c}人)`
  }
}

const options = ({ data = [], category, names, formatData }, styles, high = {}) => {
  let { mode, hollow, labelStyle, legend, legendSelect, themes } = styles
  const { bgColor: backgroundColor, colors: color } = themes
  let legendObj = Object.assign({ show: legend, type: 'scroll', data: category }, Utils.legendType(legendSelect))

  hollow = hollow > 60 ? 60 : hollow

  const radiusMax = legend ? '75%' : '80%'

  if (legend) {
    grid[legendSelect] = Utils.gridSize(legendSelect)
  }

  const labelShow = labelStyle !== 0
  const label = {
    normal: {
      show: labelShow,
      formatter: params => {
        return labelFormatter(labelStyle, params, formatData)
      }
    },
    emphasis: {
      show: labelShow,
      textStyle: {
        fontSize: '14',
        fontWeight: 'bold'
      }
    }
  }

  const len = data.length
  const series = []
  const distance = 100 / (len + 1)

  for (let i = 0; i < len; i++) {
    const x = distance * (i + 1) + '%'
    const obj = {
      name: names[i],
      type: 'pie',
      selectedMode: Object.keys(high).length > 0 ? 'single' : false,
      radius: mode !== '1' ? [hollow + '%', radiusMax] : radiusMax,
      roseType: roseType(mode),
      center: [x, '50%'],
      avoidLabelOverlap: false,
      label,
      data: data[i]
    }
    series.push(obj)
  }

  return {
    backgroundColor,
    color,
    grid,
    legend: legendObj,
    // 环形饼图中间文字
    graphic: {
      type: 'text',
      left: 'center',
      top: 'center',
      style: {
        text: '占比情况',
        textAlign: 'center',
        fill: '#000',
        width: 50,
        height: 50
      }
    },
    tooltip: {
      trigger: 'item',
      // formatter: '{a} <br/>{b}: {c} ({d}%)'
      formatter: (params, ticket, callback) => {
        let value = params.value
        let tip = `${params.name}  <br/>${params.seriesName}: ${value} (${params.percent}%)`
        if (formatData && formatData.length > 0) {
          let format = formatData[0].formatData
          value = fNumeral.formatNumByRule(params.value, format)
          tip = `${params.name}  <br/>${params.seriesName}: ${value} (${params.percent}%)`
        }
        return tip
      }
    },
    series,
    animationEasing: 'elasticOut'
  }
}

export default options
