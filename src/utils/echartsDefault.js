export const columnLabel = 'Description'
export const columnKey = 'Name'
export const columnType = 'type'
export const dataType = 'DataType'
export const analysys = 'Analysys'
export const filterKey = 'filterKey'
export const colVisible = 'Visible' // 是否显示
export const columnFormatData = 'formatData' // 格式化规则
export const fieldClickConfig = 'fieldClickConfig' // 字段点击配置项
// fieldClickConfig = {
//   titleL:'',// 弹出层标题
//   url:'', // 弹出成url
//   params:[] // url所带的查询参数
// }
// 树表格的必须字段
export const tgConstants = {
  idField: '__$ID',
  leafField: '__$LEAF',
  parentField: '__$PID'
}
export const isLine = 'isLine'
export const grid = {
  top: '5',
  bottom: '5',
  left: '1%',
  right: '1%',
  containLabel: true
}

export const dataZoom = [
  {
    type: 'inside'
  },
  {
    realtime: true,
    end: 100,
    orient: null
  }
]

export const themes = [
  {
    bgColor: '#FFFFFF',
    titleColor: '#333333',
    colors: [
      '#d87c7c',
      '#919e8b',
      '#d7ab82',
      '#6e7074',
      '#61a0a8',
      '#efa18d',
      '#787464',
      '#cc7e63',
      '#724e58',
      '#4b565b'
    ]
  },
  {
    bgColor: '#FFFFFF',
    titleColor: '#666666',
    colors: ['#3fb1e3', '#6be6c1', '#626c91', '#a0a7e6', '#c4ebad', '#96dee8']
  },
  {
    bgColor: '#fef8ef',
    titleColor: '#333333',
    colors: ['#c12e34', '#e6b600', '#0098d9', '#2b821d', '#005eaa', '#339ca8', '#cda819', '#32a487']
  }
]

export const Utils = {
  legendType(type) {
    const result = {
      top: {
        top: 0
      },
      bottom: {
        bottom: 0
      },
      left: {
        orient: 'vertical',
        x: 'left'
      },
      right: {
        orient: 'vertical',
        x: 'right'
      }
    }
    return result[type]
  },
  gridSize(type) {
    return ['top', 'bottom'].includes(type) ? '30' : '6%'
  }
}
