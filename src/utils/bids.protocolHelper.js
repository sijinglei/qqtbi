const bids = {
  characters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=',
  atob: function(string) {
    string = encodeURIComponent(string)
    const characters = bids.characters
    let result = ''
    let i = 0
    do {
      let a = string.charCodeAt(i++)
      let b = string.charCodeAt(i++)
      let c = string.charCodeAt(i++)

      a = a || 0
      b = b || 0
      c = c || 0

      let b1 = (a >> 2) & 0x3f
      let b2 = ((a & 0x3) << 4) | ((b >> 4) & 0xf)
      let b3 = ((b & 0xf) << 2) | ((c >> 6) & 0x3)
      let b4 = c & 0x3f

      if (!b) {
        b3 = b4 = 64
      } else if (!c) {
        b4 = 64
      }
      result += characters.charAt(b1) + characters.charAt(b2) + characters.charAt(b3) + characters.charAt(b4)
    } while (i < string.length)
    return result
  },
  // 排序方式
  orderType: {
    // 升序
    asc: 'ASC',
    // 降序
    desc: 'DESC'
  },
  // 运算符类型
  operatorType: {
    // 逻辑运算符AND OR 左右括号
    logical: 'logical',
    // 算数运算符：大于等于
    arithmetic: 'arithmetic'
  },
  // 逻辑运算符
  logicalType: {
    // AND
    and: 'AND',
    // OR
    or: 'OR',
    // 左括号
    leftBracket: '(',
    // 右括号
    rightBracket: ')'
  },
  // 算数运算符
  arithmeticType: {
    // 等于
    eq: '=',
    // 大于
    gt: '&gt;',
    // 大于等于
    gte: '&gt;=',
    // 小于
    lt: '&lt;',
    // 小于等于
    lte: '&lt;=',
    // 是否为空
    isnull: 'IS NULL',
    // 是否不为空
    isnotnull: 'IS NOT NULL',
    // IN
    in: 'IN',
    // NOT IN
    notin: 'NOT IN',
    // LIKE
    like: 'LIKE',
    // NOT LIKE
    notlike: 'NOT LIKE',
    // BETWEEN AND
    between: 'BETWEEN'
  },
  isInteger: function(value) {
    return typeof value === 'number' && value % 1 === 0
  }
}
bids.field = function(name) {
  this.name = name
}
bids.field.prototype.toXml = function() {
  return '<field name="' + this.name + '" />'
}
bids.fieldWithValue = function(name, value) {
  this.name = name
  this.value = bids.atob(value)
}
bids.fieldWithValue.prototype.toXml = function() {
  return '<field name="' + this.name + '" value="' + this.value + '" />'
}
bids.parameter = function(name, value) {
  this.name = name
  this.value = bids.atob(value)
}
bids.parameter.prototype.toXml = function() {
  return '<parameter name="' + this.name + '" value="' + this.value + '" />'
}
bids.where = function() {
  this.formulas = new bids.where.formulas()
  this.logicals = new bids.where.logicals()
  this.arithmetics = new bids.where.arithmetics()
}
/**
 * 添加AND/OR/左右括号
 * @param operator type:bids.logicalType
 **/
bids.where.prototype.addLogical = function(operator) {
  let tempId = this.formulas.items.length + 1
  this.logicals.add(tempId, operator)
  this.formulas.add(tempId, bids.operatorType.logical)
  return this
}
/**
 * 添加大于等于小于……查询条件
 * @param field 要查询的列
 * @param operator 算数运算符：bids.arithmeticType
 * @param value 条件的值，如果operator为范围运算符，则Array类型
 **/
bids.where.prototype.addArithmetic = function(field, operator, value) {
  let tempId = this.formulas.items.length + 1
  this.arithmetics.add(tempId, field, operator, value)
  this.formulas.add(tempId, bids.operatorType.arithmetic)
  return this
}
bids.where.prototype.toXml = function() {
  const tempFormulas = this.formulas.toXml()
  const tempLogicals = this.logicals.toXml()
  const tempArithmetics = this.arithmetics.toXml()
  if (tempFormulas === '' && tempLogicals === '' && tempArithmetics === '') {
    return ''
  }

  let tempReturnValue = '<where>' + tempFormulas + tempLogicals + tempArithmetics + '</where>'
  return tempReturnValue
}
bids.where.formula = function(id, type) {
  this.id = id
  this.type = type
}
bids.where.formula.prototype.toXml = function() {
  return '<formula id="' + this.id.toString() + '" type="' + this.type.toString() + '"/>'
}
bids.where.logical = function(id, operator) {
  this.id = id
  this.operator = operator
}
bids.where.logical.prototype.toXml = function() {
  return '<logical id="' + this.id.toString() + '" operator="' + this.operator.toString() + '"/>'
}
bids.where.arithmetic = function(id, name, operator, value) {
  this.id = id
  this.operator = operator
  this.name = name
  this.value = bids.atob('')
  if (
    operator === bids.arithmeticType.in ||
    operator === bids.arithmeticType.notin ||
    operator === bids.arithmeticType.between
  ) {
    if (value instanceof Array === false || value.length < 1) {
      console.error(operator + '运算符，需要传递Array类型的值，且Array的长度要大于1')
    }
    // 数组将每项加密后再逗号隔开
    for (let tempItem of value) {
      this.value += bids.atob(tempItem) + ','
    }
    this.value = this.value.substring(0, this.value.length - 1)
  } else if (operator === bids.arithmeticType.isnull || operator === bids.arithmeticType.isnotnull) {
    this.value = bids.atob('')
  } else {
    this.value = bids.atob(value)
  }
}
bids.where.arithmetic.prototype.toXml = function() {
  return (
    '<arithmetic id="' +
    this.id.toString() +
    '" operator="' +
    this.operator.toString() +
    '" name="' +
    this.name +
    '" value="' +
    this.value +
    '"/>'
  )
}
bids.where.formulas = function() {
  this.items = []
}
/**
 * 添加查询条件
 **/
bids.where.formulas.prototype.add = function(id, type) {
  const tempValue = new bids.where.formula(id, type)
  this.items.push(tempValue)
}
bids.where.formulas.prototype.toXml = function() {
  if (this.items.length === 0) {
    return ''
  }
  let tempReturnValue = '<formulas>'
  for (let tempItem of this.items) {
    tempReturnValue += tempItem.toXml()
  }
  tempReturnValue += '</formulas>'
  return tempReturnValue
}
bids.where.logicals = function() {
  this.items = []
}
/**
 * @param operator 逻辑操作符：bids.logicalType
 **/
bids.where.logicals.prototype.add = function(id, operator) {
  const tempValue = new bids.where.logical(id, operator)
  this.items.push(tempValue)
}
bids.where.logicals.prototype.toXml = function() {
  if (this.items.length === 0) {
    return ''
  }
  let tempReturnValue = '<logicals>'
  for (let tempItem of this.items) {
    tempReturnValue += tempItem.toXml()
  }
  tempReturnValue += '</logicals>'
  return tempReturnValue
}
bids.where.arithmetics = function() {
  this.items = []
}
/**
 * @param field 要查询的列
 * @param operator 算数运算符：bids.arithmeticType
 * @param value 条件的值，如果operator为范围运算符，则Array类型
 **/
bids.where.arithmetics.prototype.add = function(id, field, operator, value) {
  const tempValue = new bids.where.arithmetic(id, field, operator, value)
  this.items.push(tempValue)
}
bids.where.arithmetics.prototype.toXml = function() {
  if (this.items.length === 0) {
    return ''
  }
  let tempReturnValue = '<arithmetics>'
  for (let tempItem of this.items) {
    tempReturnValue += tempItem.toXml()
  }
  tempReturnValue += '</arithmetics>'
  return tempReturnValue
}
/**
 *bids查询专用
 *@param appKey string,应用编码
 *@param alias string,服务名称
 *@param distinct bool,结果集是否排重，true为排重，false与之相反
 **/
bids.select = function(appKey, alias, distinct) {
  this.appKey = appKey
  this.alias = alias
  this.distinct = distinct
  this.start = 0
  this.end = 0
  this.fields = new bids.select.fields()
  this.orderBys = new bids.select.orderBys()
  this.where = new bids.where()
}
bids.select.fields = function() {
  this.items = []
}
bids.select.fields.prototype.toXml = function() {
  let tempReturnValue = '<fields>'
  for (let tempItem of this.items) {
    tempReturnValue += tempItem.toXml()
  }
  tempReturnValue += '</fields>'
  return tempReturnValue
}
bids.select.fields.prototype.addFields = function(fields) {
  for (let tempItem of fields) {
    this.addField(tempItem)
  }
  return this
}
bids.select.fields.prototype.addField = function(field) {
  let tempUpperCase = field.toUpperCase()
  for (let tempItem of this.items) {
    if (tempItem.toString().toUpperCase() === tempUpperCase) {
      console.error(field + '列已存在')
    }
  }
  const tempValue = new bids.field(field)
  this.items.push(tempValue)
  return this
}

bids.select.orderBy = function(field, orderType) {
  this.field = field
  this.orderType = orderType
}
bids.select.orderBy.prototype.toXml = function() {
  return '<field name="' + this.field + '"  asc="' + this.orderType.toString() + '"/>'
}
bids.select.orderBys = function() {
  this.items = []
}
/**
 * @param field 排序字段
 * @param orderType 排序规则：bidsorderType
 **/
bids.select.orderBys.prototype.add = function(field, orderType) {
  for (let tempItem of this.items) {
    if (tempItem.field === field) {
      console.error(field + '排序规则已存在')
    }
  }
  this.items.push(new bids.select.orderBy(field, orderType))
  return this
}
bids.select.orderBys.prototype.toXml = function() {
  if (this.items.length === 0) {
    return ''
  }
  let tempReturnValue = '<orderby>'
  for (let tempItem of this.items) {
    tempReturnValue += tempItem.toXml()
  }
  tempReturnValue += '</orderby>'
  return tempReturnValue
}
/**
 *设置返回结果集的范围，从1开始计数，如果设置该值，则必须对查询结果进行排序
 *@param start {int} 返回结果集的起始行号，从1开始计数
 *@param end 返回结果集的截止行号，必须大于start
 **/
bids.select.prototype.setRange = function(start, end) {
  if (bids.isInteger(start) && start > 0) {
    this.start = start
  } else {
    console.error('start value must great than 0, current value is ' + start.toString())
  }

  if (bids.isInteger(end) && end > start) {
    this.end = end
  } else {
    console.error(
      'end value must great than sart value, current start value is ' +
        start.toString() +
        ', but end value is ' +
        end.toString()
    )
  }
  return this
}
/**
 * 添加要返回的列
 * @param fields 要返回的列:array
 **/
bids.select.prototype.addFields = function(fields) {
  this.fields.addFields(fields)
  return this
}
/**
 * 添加要返回的列
 * @param fields 要返回的列:string
 **/
bids.select.prototype.addField = function(field) {
  this.fields.addField(field)
  return this
}
/**
 * 添加排序字段
 * @param field 排序字段
 * @param orderType 排序规则：bids.orderType
 **/
bids.select.prototype.addOrderBy = function(field, orderType) {
  this.orderBys.add(field, orderType)
  return this
}
/**
 * 添加AND/OR/左右括号
 * @param operator type:bids.logicalType
 **/
bids.select.prototype.addLogical = function(operator) {
  this.where.addLogical(operator)
  return this
}
/**
 * 添加大于等于小于……查询条件
 * @param field 要查询的列
 * @param operator 算数运算符：bids.arithmeticType
 * @param value 条件的值，如果operator为范围运算符，则Array类型
 */
bids.select.prototype.addArithmetic = function(field, operator, value) {
  this.where.addArithmetic(field, operator, value)
  return this
}
/*
//    this.appKey = appKey;
//    this.alias = alias;
//    this.distinct = distinct;
//    this.start = 0;
//    this.end = 0;
*/
bids.select.prototype.toXml = function() {
  let tempReturnValue =
    '<?xml version="1.0" encoding="UTF-8"?>' +
    '<content appkey="' +
    this.appKey +
    '" alias="' +
    this.alias +
    '" >' +
    '<select start="' +
    this.start.toString() +
    '" end="' +
    this.end.toString() +
    '" distinct="' +
    this.distinct.toString() +
    '">' +
    this.fields.toXml() +
    this.where.toXml() +
    this.orderBys.toXml() +
    '</select></content>'

  return tempReturnValue
}
/**
 *bids插入专用
 *@param appKey string,应用编码
 *@param alias string,服务名称
 **/
bids.insert = function(appKey, alias) {
  this.appKey = appKey
  this.alias = alias
  this.fields = new bids.insert.fields()
  this.records = new bids.insert.records()
}
bids.insert.fields = function() {
  this.items = []
}
bids.insert.fields.prototype.toXml = function() {
  let tempReturnValue = '<fields>'
  for (let tempItem of this.items) {
    tempReturnValue += tempItem.toXml()
  }
  tempReturnValue += '</fields>'
  return tempReturnValue
}
bids.insert.fields.prototype.addFields = function(fields) {
  for (let tempItem of fields) {
    this.addField(tempItem)
  }
  return this
}
bids.insert.fields.prototype.addField = function(field) {
  let tempUpperCase = field.toUpperCase()
  for (let tempItem of this.items) {
    if (tempItem.toString().toUpperCase() === tempUpperCase) {
      console.error(field + '列已存在')
    }
  }
  const tempValue = new bids.field(field)
  this.items.push(tempValue)
  return this
}
bids.insert.record = function(value) {
  this.items = []
  for (let tempItem of value) {
    const tempValue = new bids.fieldWithValue(tempItem.name, tempItem.value)
    this.items.push(tempValue)
  }
}
bids.insert.record.prototype.toXml = function() {
  let tempReturnValue = '<record>'
  for (let tempItem of this.items) {
    tempReturnValue += tempItem.toXml()
  }
  tempReturnValue += '</record>'
  return tempReturnValue
}
bids.insert.records = function() {
  this.items = []
}
/**
 *添加要插入的记录
 *@param value obj array such as [{name:"col1", value:"col1 value"},{name:"col2", value:"col2 value"}]
 **/
bids.insert.records.prototype.addValue = function(value) {
  const tempValue = new bids.insert.record(value)
  this.items.push(tempValue)
  return this
}
/**
 *添加要插入的记录
 *@param values record array such as [[{name:"col1", value:"col1 value"},{name:"col2", value:"col2 value"}]]
 **/
bids.insert.records.prototype.addValues = function(values) {
  for (let tempItem of values) {
    const tempValue = new bids.insert.record(tempItem)
    this.items.push(tempValue)
  }
  return this
}
bids.insert.records.prototype.toXml = function() {
  let tempReturnValue = '<records>'
  for (let tempItem of this.items) {
    tempReturnValue += tempItem.toXml()
  }
  tempReturnValue += '</records>'
  return tempReturnValue
}
/**
 *添加要插入的记录
 *@param value obj array such as [{name:"col1", value:"col1 value"},{name:"col2", value:"col2 value"}]
 **/
bids.insert.prototype.addValue = function(value) {
  this.records.addValue(value)
  return this
}
/**
 *添加要插入的记录
 *@param values record array such as [[{name:"col1", value:"col1 value"},{name:"col2", value:"col2 value"}]]
 **/
bids.insert.prototype.addValues = function(values) {
  this.records.addValues(values)
  return this
}
/**
 *添加要插入的列
 *@param fields type:array,将多个列名放在数组中
 **/
bids.insert.prototype.addFields = function(fields) {
  this.fields.addFields(fields)
  return this
}
/**
 *添加要插入的列
 *@param field type:string,列名
 **/
bids.insert.prototype.addField = function(field) {
  this.fields.addField(field)
  return this
}
bids.insert.prototype.toXml = function() {
  let tempReturnValue =
    '<?xml version="1.0" encoding="UTF-8"?>' +
    '<content appkey="' +
    this.appKey +
    '" alias="' +
    this.alias +
    '" >' +
    '<insert>' +
    this.fields.toXml() +
    this.records.toXml() +
    '</insert></content>'

  return tempReturnValue
}
/**
 *bids更新专用
 *@param appKey string,应用编码
 *@param alias string,服务名称
 **/
bids.update = function(appKey, alias) {
  this.appKey = appKey
  this.alias = alias
  this.fields = new bids.update.fields()
  this.where = new bids.where()
}
bids.update.fields = function() {
  this.items = []
}
bids.update.fields.prototype.toXml = function() {
  let tempReturnValue = '<fields>'
  for (let tempItem of this.items) {
    tempReturnValue += tempItem.toXml()
  }
  tempReturnValue += '</fields>'
  return tempReturnValue
}
bids.update.fields.prototype.addFields = function(fields) {
  for (let tempItem of fields) {
    this.addField(tempItem.name, tempItem.value)
  }
  return this
}
bids.update.fields.prototype.addField = function(field, value) {
  let tempUpperCase = field.toUpperCase()
  for (let tempItem of this.items) {
    if (tempItem.toString().toUpperCase() === tempUpperCase) {
      console.error(field + '列已存在')
    }
  }
  const tempValue = new bids.fieldWithValue(field, value)
  this.items.push(tempValue)
  return this
}
/**
 *添加要更新的列及其对应的值
 *@param value obj array such as [{name:"col1", value:"col1 value"},{name:"col2", value:"col2 value"}]
 **/
bids.update.prototype.addFields = function(fields) {
  this.fields.addFields(fields)
  return this
}
bids.update.prototype.addField = function(field, value) {
  this.fields.addField(field, value)
  return this
}
/**
 * 添加AND/OR/左右括号
 * @param operator type:bids.logicalType
 **/
bids.update.prototype.addLogical = function(operator) {
  this.where.addLogical(operator)
  return this
}
/**
 * 添加大于等于小于……查询条件
 * @param field 要查询的列
 * @param operator 算数运算符：bids.arithmeticType
 * @param value 条件的值，如果operator为范围运算符，则Array类型
 */
bids.update.prototype.addArithmetic = function(field, operator, value) {
  this.where.addArithmetic(field, operator, value)
  return this
}
bids.update.prototype.toXml = function() {
  let tempReturnValue =
    '<?xml version="1.0" encoding="UTF-8"?>' +
    '<content appkey="' +
    this.appKey +
    '" alias="' +
    this.alias +
    '" >' +
    '<update>' +
    this.where.toXml() +
    this.fields.toXml() +
    '</update></content>'

  return tempReturnValue
}
/**
 *bids删除
 *@param appKey string,应用编码
 *@param alias string,服务名称
 **/
bids.delete = function(appKey, alias) {
  this.appKey = appKey
  this.alias = alias
  this.where = new bids.where()
}
/**
 * 添加AND/OR/左右括号
 * @param operator type:bids.logicalType
 **/
bids.delete.prototype.addLogical = function(operator) {
  this.where.addLogical(operator)
  return this
}
/**
 * 添加大于等于小于……查询条件
 * @param field 要查询的列
 * @param operator 算数运算符：bids.arithmeticType
 * @param value 条件的值，如果operator为范围运算符，则Array类型
 */
bids.delete.prototype.addArithmetic = function(field, operator, value) {
  this.where.addArithmetic(field, operator, value)
  return this
}
bids.delete.prototype.toXml = function() {
  let tempReturnValue =
    '<?xml version="1.0" encoding="UTF-8"?>' +
    '<content appkey="' +
    this.appKey +
    '" alias="' +
    this.alias +
    '" >' +
    '<delete>' +
    this.where.toXml() +
    '</delete></content>'

  return tempReturnValue
}
/**
 *bids执行脚本
 *@param appKey string,应用编码
 *@param alias string,服务名称
 **/
bids.execute = function(appKey, alias) {
  this.appKey = appKey
  this.alias = alias
  this.parameters = []
}
/**
 *bids添加参数
 *@param name string,参数名
 *@param value 参数值
 **/
bids.execute.prototype.addParameter = function(name, value) {
  var tempUpperCase = name.toString().toUpperCase()
  for (let tempItem of this.parameters) {
    if (tempItem.toString().toUpperCase() === tempUpperCase) {
      console.error(name + '参数已经存在')
    }
  }
  const tempValue = new bids.parameter(name, value)
  this.parameters.push(tempValue)
  return this
}
bids.execute.prototype.toXml = function() {
  var tempStr = ''
  for (let tempItem of this.parameters) {
    tempStr += tempItem.toXml()
  }
  let tempReturnValue =
    '<?xml version="1.0" encoding="UTF-8"?>' +
    '<content appkey="' +
    this.appKey +
    '" alias="' +
    this.alias +
    '" >' +
    '<execute>' +
    tempStr +
    '</execute></content>'

  return tempReturnValue
}
export default bids
