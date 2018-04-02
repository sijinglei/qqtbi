import fNumeral from '@/utils/numFormat' // 数字格式化
const options = ({ grid, category = [], xAxis, series, dataZoom, formatData }, styles) => {
  const { bgColor: backgroundColor, colors: color } = styles.themes

  // 初始化散点图表判断，如果没有数据，隐藏图表原有x y轴线展示
  let axisValues = {
    axisLine: {
      show: false
    }
  }
  if (series.length > 0) {
    axisValues = [
      {
        show: true,
        type: 'value',
        splitLine: {
          lineStyle: {
            type: 'dashed'
          }
        }
      }
    ]
  }
  return {
    backgroundColor,
    color,
    grid,
    legend: {
      show: false,
      type: 'scroll',
      z: 10,
      data: category
    },
    tooltip: {
      // formatter: series.length === 1 ? '{c}' : '{a}: ({c})'
      formatter: params => {
        let values = ''
        let values1 = ''
        let seriesName = params.seriesName
        let name = params.name
        let format = formatData[0].formatData
        if (params.value.length > 1) {
          values = params.value[0]
          values1 = params.value[1]
          let format2 = formatData[1].formatData
          if (format) {
            values = fNumeral.formatNumByRule(values, format)
            values1 = fNumeral.formatNumByRule(values1, format2)
          }
          return seriesName + ' :<br/>' + values + ',' + values1
        } else {
          values = params.value
          if (format) {
            values = fNumeral.formatNumByRule(values, format)
          }
          return seriesName + ' :<br/>' + name + ':' + values
        }
      }
    },
    xAxis: axisValues,
    yAxis: axisValues,
    series,
    dataZoom,
    animationEasing: 'elasticOut'
  }
}

export default options
