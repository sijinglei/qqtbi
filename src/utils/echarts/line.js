const options = ({ grid, category = [], xAxis, series, dataZoom }, styles) => {
  const { bgColor: backgroundColor, colors: color } = styles.themes
  return {
    backgroundColor,
    color,
    grid,
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      show: false,
      type: 'scroll',
      data: category
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
    animationEasing: 'elasticOut'
  }
}

export default options
