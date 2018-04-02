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
    // 算数运算符：大于等于……
    arithmetic: '0',
    // 逻辑运算符AND OR 左右括号
    logical: '1'
  },
  // 逻辑运算符
  logicalType: {
    // AND
    and: '0',
    // OR
    or: '1',
    // 左括号
    leftBracket: '2',
    // 右括号
    rightBracket: '3'
  },
  // 算数运算符
  arithmeticType: {
    // 等于
    eq: '0',
    // 大于
    gt: '1',
    // 小于
    lt: '2',
    // 大于等于
    gte: '3',
    // 小于等于
    lte: '4',
    // 不等于
    neq: '5',
    // IN
    in: '6',
    // 是否为空
    isnull: '7'
  },
  isInteger: function(value) {
    return typeof value === 'number' && value % 1 === 0
  }
}
bids.newid = function() {
  let chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')
  let uuid = []
  let i
  // rfc4122, version 4 form
  let r
  // rfc4122 requires these characters
  uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-'
  uuid[14] = '4'
  // Fill in random data.  At i===19 set the high bits of clock sequence as
  // per rfc4122, sec. 4.1.5
  for (i = 0; i < 36; i++) {
    if (!uuid[i]) {
      r = 0 | (Math.random() * 16)
      uuid[i] = chars[i === 19 ? (r & 0x3) | 0x8 : r]
    }
  }
  return uuid.join('')
}
bids.field = function(name, rename) {
  this.name = name
  if (rename) {
    this.rename = rename
  } else {
    this.rename = this.name
  }
}
bids.field.prototype.toXml = function() {
  let tempArray = []
  tempArray.push('<field name="')
  tempArray.push(this.name)
  tempArray.push('" rename="')
  tempArray.push(this.rename)
  tempArray.push('" />')
  return tempArray.join('')
}
bids.fieldWithValue = function(name, value) {
  this.name = name
  this.value = bids.atob(value)
}
bids.fieldWithValue.prototype.toXml = function() {
  let tempArray = []
  tempArray.push('<field name="')
  tempArray.push(this.name)
  tempArray.push('" value="')
  tempArray.push(this.value)
  tempArray.push('" />')
  return tempArray.join('')
}
bids.parameter = function(name, value) {
  this.name = name
  this.value = bids.atob(value)
}
bids.parameter.prototype.toXml = function() {
  let tempArray = []
  tempArray.push('<parameter name="')
  tempArray.push(this.name)
  tempArray.push('" value="')
  tempArray.push(this.value)
  tempArray.push('" />')
  return tempArray.join('')
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
  let tempFormulas = this.formulas.toXml()
  let tempLogicals = this.logicals.toXml()
  let tempArithmetics = this.arithmetics.toXml()
  if (tempFormulas === '' && tempLogicals === '' && tempArithmetics === '') {
    return ''
  }
  let tempArray = []
  tempArray.push('<condition>')
  tempArray.push(tempFormulas)
  tempArray.push(tempLogicals)
  tempArray.push(tempArithmetics)
  tempArray.push('</condition>')
  let tempReturnValue = tempArray.join('')
  return tempReturnValue
}
bids.where.formula = function(id, type) {
  this.id = id
  this.type = type
}
bids.where.formula.prototype.toXml = function() {
  let tempArray = []
  tempArray.push('<formula id="')
  tempArray.push(this.id.toString())
  tempArray.push('" type="')
  tempArray.push(this.type)
  tempArray.push('"/>')
  return tempArray.join('')
}
bids.where.logical = function(id, operator) {
  this.id = id
  this.operator = operator
}
bids.where.logical.prototype.toXml = function() {
  let tempArray = []
  tempArray.push('<logical id="')
  tempArray.push(this.id.toString())
  tempArray.push('" operator="')
  tempArray.push(this.operator)
  tempArray.push('"/>')
  return tempArray.join('')
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
  let tempArray = []
  tempArray.push('<arithmetic id="')
  tempArray.push(this.id)
  tempArray.push('" operator="')
  tempArray.push(this.operator)
  tempArray.push('" name="')
  tempArray.push(this.name)
  tempArray.push('" value="')
  tempArray.push(this.value)
  tempArray.push('"/>')
  return tempArray.join('')
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
  let tempArray = []
  tempArray.push('<formulas>')
  for (let tempItem of this.items) {
    tempArray.push(tempItem.toXml())
  }
  tempArray.push('</formulas>')
  return tempArray.join('')
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
  let tempArray = []
  tempArray.push('<logicals>')
  for (let tempItem of this.items) {
    tempArray.push(tempItem.toXml())
  }
  tempArray.push('</logicals>')
  return tempArray.join('')
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
  let tempReturnValue = '<relationals>'
  for (let tempItem of this.items) {
    tempReturnValue += tempItem.toXml()
  }
  tempReturnValue += '</relationals>'
  return tempReturnValue
}
/**
 *bids查询专用
 *@param application string,应用编码
 *@param alias string,服务名称
 *@param distinct bool,结果集是否排重，true为排重，false与之相反
 **/
bids.select = function(application, alias, distinct) {
  this.application = application
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
  let tempArray = []
  tempArray.push('<field name="')
  tempArray.push(this.field)
  tempArray.push('"  asc="')
  tempArray.push(this.orderType)
  tempArray.push('"/>')
  return tempArray.join('')
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
  let tempArray = []
  tempArray.push('<fields>')
  for (let tempItem of this.items) {
    tempArray.push(tempItem.toXml())
  }
  tempArray.push('</fields>')
  return tempArray.join('')
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
//    this.application = application;
//    this.alias = alias;
//    this.distinct = distinct;
//    this.start = 0;
//    this.end = 0;
*/
bids.select.prototype.toXml = function() {
  let tempArray = []
  tempArray.push('<?xml version="1.0" encoding="UTF-8"?>')
  tempArray.push('<content application="')
  tempArray.push(this.application)
  tempArray.push('" guid="')
  tempArray.push(bids.newid())
  tempArray.push('" alias="')
  tempArray.push(this.alias)
  tempArray.push('" distinct="')
  tempArray.push(this.distinct.toString())
  tempArray.push('">')

  tempArray.push(this.fields.toXml())
  tempArray.push(this.where.toXml())

  let tempOrderBy = this.orderBys.toXml()
  if (this.end > 0) {
    if (tempOrderBy === '') {
      console.error('must set order by condition if get range data.')
    }
  }
  if (this.end > 0 || tempOrderBy !== '') {
    tempArray.push('<interval start="')
    tempArray.push(this.start)
    tempArray.push('" end="')
    tempArray.push(this.end)
    tempArray.push('">')
    tempArray.push(tempOrderBy)
    tempArray.push('</interval>')
  }
  tempArray.push('</content>')
  let tempReturnValue = tempArray.join('')
  return tempReturnValue
}
