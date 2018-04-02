const options = ({ grid, category = [], indicator, series }, styles) => {
  const { shape, legend, themes } = styles
  const { bgColor: backgroundColor, colors: color } = themes
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
      trigger: 'item'
    },
    radar: {
      shape,
      radius: legend ? '65%' : '80%',
      indicator
    },
    series: [
      {
        type: 'radar',
        data: series
      }
    ],
    animationEasing: 'elasticOut'
  }
}

export default options
