import { columnKey, columnType } from '@/utils/echartsDefault'

const output = {
  uuid() {
    const speci = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'
    return speci.replace(/[xy]/g, c => {
      const r = (Math.random() * 16) | 0
      const v = c === 'x' ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  },
  rep(str) {
    return str ? str.replace(/(\r\n)|(\n)/g, '<br>') : ''
  },
  validID(data) {
    const regExp = /^\d{6}(18|19|20)?\d{2}(0[1-9]|1[12])(0[1-9]|[12]\d|3[01])\d{3}(\d|X)$/i
    return regExp.test(data)
  },
  validNumber(data) {
    return data && /^[0-9]+(.[0-9]{1,3})?$/.test(data)
  },
  validColor(data) {
    return data && /^#[0-9a-fA-F]{6}$/.test(data)
  },
  btoa(str) {
    return window.btoa(unescape(encodeURIComponent(str)))
  },
  atob(str) {
    return decodeURIComponent(escape(window.atob(str)))
  },
  spliceKey() {
    const arg = Array.from(arguments)
    let result = arg.join('_')
    return result
  },
  defaultSize(type) {
    let result = {}
    switch (type) {
      case 'filters':
        result = { h: 25, w: 6 }
        break
      case 'frame':
        result = { h: 30, w: 24 }
        break
      case 'text':
      case 'query':
        result = { h: 10, w: 24 }
        break
      default:
        result = { h: 25, w: 24 }
    }
    return result
  },
  chartAllTitle() {
    return {
      bar: '柱状图',
      line: '折线图',
      pie: '饼图',
      scatter: '散点图',
      radar: '雷达图',
      crosstabs: '交叉表',
      table: '二维表',
      treegrid: '树表格',
      board: '指标看板'
    }
  },
  chartTitle(type) {
    return this.chartAllTitle()[type] || ''
  },
  pluginAllTitle() {
    return {
      text: '文本框',
      // query: '查询条件',
      frame: 'IFRAME',
      tab: 'Tab',
      filters: '查询条件组件'// 查询条件组件
    }
  },
  pluginTitle(type) {
    return this.pluginAllTitle()[type] || ''
  },
  // 数据区域的标题
  argsSetTitle(args, type) {
    const titles = {
      dimension: {
        bar: '类别轴/维度',
        line: '类别轴/维度',
        crosstabs: '行（维度）',
        pie: '扇区标签/维度',
        radar: '分支标签/维度',
        board: '类别轴/维度'
      },
      // dimension2字段在echarts中主要适用分组，详情请看format.js具体使用
      dimension2: '颜色图例/维度',
      measure: {
        bar: '值轴/度量',
        line: '值轴/度量',
        crosstabs: '列（度量）',
        pie: '扇区角度/度量',
        scatter: 'X轴/度量',
        radar: '分支长度/度量',
        board: '值轴/度量'
      },
      measure2: {
        scatter: 'Y轴/度量'
      },
      /* 包含维度跟度量的字段 */
      blend: {
        table: '列（维度/度量）',
        query: '字段（维度/度量）',
        filters: '条件来源字段',
        treegrid: '列（维度/度量）'
      },
      filter: '过滤器',
      orderBy: '排序',
      colHeadSetting: '列头设置'
    }
    if (!titles[args]) return ''
    if (titles[args] && typeof titles[args] === 'string') return titles[args]
    return titles[args][type] || ''
  },
  chartValid(type, args) {
    const valids = {
      pie: { dimension: 1, measure: 4 },
      scatter: { measure2: 1 },
      // 过滤组件（字段个数）
      filters: { blend: 1 }
    }

    if (valids[type] && valids[type][args]) {
      return valids[type][args]
    }
    // 默认验证字段
    return ['crosstabs', 'table'].includes(type) ? 50 : 10
  },
  // get styles
  chartStyles(type, source) {
    const styles = {
      bar: {
        horizontal: false,
        isStack: false,
        xAxis: true,
        yAxis: true,
        gradient: false,
        // axisTitle: false,
        legend: false,
        legendSelect: 'top',
        label: false,
        labelSelect: 'top',
        labelRotate: 0
      },
      line: {
        horizontal: false,
        isStack: false,
        area: false,
        smooth: false,
        xAxis: true,
        yAxis: true,
        gradient: false,
        // axisTitle: false,
        legend: false,
        legendSelect: 'top',
        label: false,
        labelSelect: 'top',
        labelRotate: 0
      },
      crosstabs: {
        rowHeaders: false,
        showPage: false,
        noBorder: false,
        columnResize: false,
        alignment: 'htLeft',
        rowHeights: 23
      },
      table: {
        rowHeaders: false,
        showPage: false,
        noBorder: false,
        columnResize: false,
        alignment: 'htLeft',
        rowHeights: 23
      },
      treegrid: {
        rowHeights: 25,
        noBorder: false
      },
      pie: {
        legend: false,
        labelStyle: 1,
        legendSelect: 'top',
        mode: '1',
        hollow: 10
      },
      radar: {
        area: false,
        shape: 'polygon',
        legend: false,
        legendSelect: 'top'
      },
      scatter: {
        xAxis: true,
        yAxis: true,
        legend: false,
        legendSelect: 'top'
      },
      board: {
        xAxis: true,
        yAxis: true,
        legend: true,
        legendSelect: 'top'
      },
      query: {
        horizontal: false,
        showTitle: true,
        multiple: 1,
        mode: '1'
      },
      filters: {
        horizontal: false,
        showTitle: true,
        multiple: 1,
        mode: 1,
        isBorder: true
      }
    }
    if (!styles[type]) return {}
    // 保存原有值
    const target = Object.assign({}, styles[type])
    if (!source) return target
    for (let key of Object.keys(target)) {
      if (source[key] !== void 0) target[key] = source[key]
    }
    return target
  },
  // get params
  chartParams(type, source, sourceType) {
    const params = {
      bar: {
        aliasKey: null,
        appName: null,
        dimension: [],
        measure: [],
        dimension2: [], // 图例维度
        filter: [],
        rowsNumber: 100
      },
      line: {
        aliasKey: null,
        appName: null,
        dimension: [],
        measure: [],
        dimension2: [],
        filter: [],
        rowsNumber: 100
      },
      crosstabs: {
        aliasKey: null,
        appName: null,
        dimension: [],
        measure: [],
        filter: [],
        rowsNumber: 100
      },
      table: {
        aliasKey: null,
        appName: null,
        blend: [],
        filter: [],
        orderBy: [],
        rowsNumber: 100
      },
      treegrid: {
        aliasKey: null,
        appName: null,
        blend: [],
        filter: [],
        orderBy: [],
        colHeadSetting: [] // 列头设置
      },
      pie: {
        aliasKey: null,
        appName: null,
        dimension: [],
        measure: [],
        filter: [],
        rowsNumber: 100
      },
      radar: {
        aliasKey: null,
        appName: null,
        dimension: [],
        measure: [],
        filter: [],
        rowsNumber: 100
      },
      scatter: {
        aliasKey: null,
        appName: null,
        measure: [],
        measure2: [],
        dimension2: [],
        filter: [],
        rowsNumber: 100
      },
      board: {
        aliasKey: null,
        appName: null,
        dimension: [],
        measure: [],
        dimension2: [],
        filter: [],
        rowsNumber: 100
      },
      text: {
        aliasKey: null,
        appName: null
      },
      query: {
        aliasKey: null,
        appName: null,
        blend: [],
        querys: []
      },
      filters: {
        aliasKey: null,
        appName: null,
        blend: [],
        filter: [],
        orderBy: [],
        rowsNumber: 100
      },
      frame: {
        aliasKey: null,
        appName: null
      },
      tab: {
        tabItems: [],
        tabLayouts: []
      }
    }
    if (!params[type]) return {}
    // 保存原有值
    const target = Object.assign({}, params[type])
    if (!source) return target
    for (let key of Object.keys(target)) {
      const validNum = this.chartValid(type, key)
      if (source[key] !== void 0) {
        target[key] = validNum < 10 ? source[key].slice(0, validNum) : source[key]
      }
    }
    // 单击切换
    const comps = ['table', 'treegrid']
    // 目标类型是二维表/树表格，所有字段添加到混合字段
    if (comps.includes(type)) {
      const { measure = [], dimension = [], measure2 = [], dimension2 = [] } = source
      target.blend = [...dimension, ...measure, ...measure2, ...dimension2]
    }
    // 源类型是二维表/树表格，所有字段解析到相关字段集
    if (comps.includes(sourceType)) {
      const { blend = [] } = source
      for (let i = 0; i < blend.length; i++) {
        const colType = blend[i][columnType]
        const operatorStr = colType === 0 ? 'dimension' : 'measure'
        if (target[operatorStr] && target[operatorStr].length < this.chartValid(type, operatorStr)) {
          target[operatorStr].push(blend[i])
        }
      }
    }
    return target
  },
  // filter compare source and target
  filterCompare(source, value, target) {
    let bool = target === ''
    if (bool) return bool
    switch (value) {
      case 1:
        bool = source === target
        break
      case 2:
        bool = source.indexOf(target) > -1
        break
      case 3:
        bool = source.indexOf(target) === 0
        break
      case 4:
        bool = source !== target
        break
      case 5:
        bool = source.indexOf(target) === -1
        break
      case 6:
        bool = source === null
        break
      case 7:
        bool = source !== null
        break
      default:
        bool = true
    }
    return bool
  },
  filterWhere(i, { value, text, value2, text2, relation }) {
    if (value === 0) {
      if (value2 === 0) return true
      return this.filterCompare(i, value2, text2)
    }
    if (value2 === 0) {
      return this.filterCompare(i, value, text)
    }
    if (relation === 0) {
      return this.filterCompare(i, value, text) || this.filterCompare(i, value2, text2)
    }
    return this.filterCompare(i, value, text) && this.filterCompare(i, value2, text2)
  },
  filterSource(source, filter = [], eventParam = {}) {
    if (source.length === 0) return []
    let data = [...source]
    for (let i = 0; i < filter.length; i++) {
      const item = filter[i]
      if (!item.condition) continue
      const column = item[columnKey]
      const { tabs, enums } = item.condition
      data = data.filter(d => {
        const val = d[column]
        if (tabs) return enums.includes(val)
        return this.filterWhere(val, item.condition)
      })
    }
    if (Object.keys(eventParam).length === 0) return data
    for (let i = 0; i < eventParam.columns.length; i++) {
      const column = eventParam.columns[i]
      data = data.filter(d => {
        return d[column] === eventParam.value
      })
    }
    return data
  },
  resolveQueryParams(params, fields, idx) {
    const filterFields = []
    for (let [key, value] of Object.entries(params)) {
      if (key === 'id' || !fields[key] || !value) {
        continue
      }
      const items = fields[key].find(f => f.i === idx)
      items && filterFields.push({ key: items.values, value })
    }
    return filterFields
  },
  conditionSet() {
    return [
      { value: 0, text: '点击选择' },
      { value: 'eq', text: '精准匹配' },
      { value: 'gt', text: '大于' },
      { value: 'gte', text: '大于等于' },
      { value: 'lt', text: '小于' },
      { value: 'lte', text: '小于等于' },
      { value: 'like', text: '包含' },
      { value: 'notlike', text: '不包含' },
      { value: 'isnull', text: '为空' },
      { value: 'isnotnull', text: '不为空' }
    ]
  },
  // get filter factor
  factorValue() {
    return {
      value: 0,
      text: '',
      value2: 0,
      text2: '',
      relation: 'or',
      enums: []
    }
  },
  addClass(el, clas, bool) {
    if (bool) {
      const objClass = el.className
      const blank = objClass !== '' ? ' ' : ''
      const added = objClass + blank + clas
      el.className = added
      return
    }
    let objClass = ' ' + el.className + ' '
    objClass = objClass.replace(/(\s+)/gi, ' ')
    let removed = objClass.replace(' ' + clas + ' ', ' ')
    removed = removed.replace(/(^\s+)|(\s+$)/g, '')
    el.className = removed
  },
  setDocumentTitle(title) {
    document.title = 'TBI-' + title
  },
  addCSS(cssText, id) {
    var style = document.getElementById(id)
    if (!style) {
      style = document.createElement('style') // 创建一个style元素
      style.id = id
    }
    var head = document.head || document.getElementsByTagName('head')[0] // 获取head元素
    style.type = 'text/css' // 这里必须显示设置style元素的type属性为text/css，否则在ie中不起作用
    if (style.styleSheet) {
      // IE
      var func = function() {
        try {
          // 防止IE中stylesheet数量超过限制而发生错误
          style.styleSheet.cssText = cssText
        } catch (e) {}
      }
      // 如果当前styleSheet还不能用，则放到异步中则行
      if (style.styleSheet.disabled) {
        setTimeout(func, 10)
      } else {
        func()
      }
    } else {
      // w3c
      // w3c浏览器中只要创建文本节点插入到style元素中就行了
      // var textNode = document.createTextNode(cssText)
      // style.appendChild(textNode)
      style.innerText = cssText
    }
    head.appendChild(style) // 把创建的style元素插入到head中
  },
  findComp(comp, id) {
    for (let i = 0; i < comp.$children.length; i++) {
      const item = comp.$children[i]
      if (item.$el && item.$el.id === id && item.reset) {
        return item
      } else {
        const itComp = this.findComp(item, id)
        if (itComp && itComp.$el && itComp.$el.id === id && itComp.reset) {
          return itComp
        }
      }
    }
  },
  formatDateSet() {
    return [
      { value: 'YYYY-MM-DD', text: 'YYYY-MM-DD' },
      { value: 'YYYY-MM-DD HH:mm', text: 'YYYY-MM-DD HH:mm' },
      { value: 'YYYY-MM-DD HH:mm:ss', text: 'YYYY-MM-DD HH:mm:ss' },
      { value: 'YYYY/MM/DD', text: 'YYYY/MM/DD' }
    ]
  },
  // mysql 数据类型判断
  dataNumType() {
    return ['TINYINT', 'SMALLINT', 'MEDIUMINT', 'INT', 'BIGINT', 'FLOAT', 'DOUBLE', 'DECIMAL', 'NUMERIC']
  },
  dateTimeType() {
    return ['YEAR', 'DATE', 'TIME', 'DATETIME', 'TIMESTAMP', 'DATETIME2']
  },
  getTableType() {
    return ['crosstabs', 'table', 'treegrid']
  },
  setItem(key, value) {
    localStorage.setItem(key, value)
  },
  getItem(key) {
    return localStorage.getItem(key)
  },
  removeItem(key) {
    localStorage.removeItem(key)
  },
  setHeadTip(columnLabel, tip) {
    let _tipContnetHtml = `${columnLabel}<i class="iconfont icon-tishi blue" title="${tip}"></i>`
    return _tipContnetHtml
  },
  /**
   * 导出excel数据
   * @param {导出表格列标题集合} tHeader
   * @param {导出表格列数据集合} tData
   * @param {导出excel名称} excelName
   */
  exportToExcel(tHeader, tData, excelName = '列表excel数据') {
    require.ensure([], () => {
      const { export_json_to_excel } = require('@/vendor/Export2Excel') // 引入文件
      console.log(export_json_to_excel)
      export_json_to_excel(tHeader, tData, excelName)
    })
  },
  isURL(strUrl) {
    // 验证url
    var strRegex =
      '^((https|http|ftp|rtsp|mms)?://)' +
      "?(([0-9a-zA-Z_!~*'().&=+$%-]+: )?[0-9a-zA-Z_!~*'().&=+$%-]+@)?" + // ftp的user@
      '(([0-9]{1,3}.){3}[0-9]{1,3}' + // IP形式的URL- 199.194.52.184
      '|' + // 允许IP和DOMAIN（域名）
      "([0-9a-zA-Z_!~*'()-]+.)*" + // 域名- www.
      '([0-9a-zA-Z][0-9a-zA-Z-]{0,61})?[0-9a-zA-Z].' + // 二级域名
      '[a-zA-Z]{2,6})' + // first level domain- .com or .museum
      '(:[0-9]{1,4})?' + // 端口- :80
      '((/?)|' +
      "(/[0-9a-zA-Z_!~*'().;?:@&=+$,%#-]+)+/?)$"
    var re = new RegExp(strRegex)
    return re.test(strUrl)
  }
}

export default output
