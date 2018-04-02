import fNumeral from '@/utils/numFormat' // 数字格式化

const options = ({ grid, category = [], xAxis, series, dataZoom, formatData }, styles) => {
  const { bgColor: backgroundColor, colors: color } = styles.themes
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
      trigger: 'axis', // 坐标轴触发，主要在柱状图，折线图等会使用类目轴的图表中使用。
      axisPointer: {
        type: 'shadow'
      },
      formatter: (params, ticket, callback) => {
        var tip = []
        var title = params[0].name + '<br/>'
        params.map((item, idx) => {
          let val = item.value
          if (formatData.length > 0) {
            let format = formatData[idx].formatData
            val = fNumeral.formatNumByRule(item.value, format)
          }
          tip.push(`${item.marker}${item.seriesName}:${val}<br/>`)
        })
        return title + tip.join('')
      }
    },
    xAxis,
    yAxis: [
      {
        show: true,
        type: 'value',
        axisLine: {
          show: series.length !== 0
        }
      }
    ],
    series,
    animationEasing: 'elasticOut',
    dataZoom
  }
}

export default options
