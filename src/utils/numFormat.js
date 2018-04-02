/**
 * 数字格式化通用类
 * author：sjl
 * time  :2018-1-22
 */
import numeral from 'numeral'
import moment from 'moment'

const FormatNum = {
  strPoint(pointNum) {
    var strPoint = '0'
    for (let i = 0; i < pointNum; i++) {
      if (i === 0) {
        strPoint += '.0'
        continue
      }
      strPoint += '0'
    }
    return strPoint
  },
  fNumPercent(val, point) {
    return numeral(val).format(this.strPoint(point) + '%')
  },
  /**
   * 格式为100,000.00
   */
  fNumThousandth(val, point) {
    let thousFomat = '0,0'
    if (point > 0) {
      thousFomat = '0,' + this.strPoint(point)
    }
    return numeral(val).format(thousFomat)
  },
  /**
   * 保留小数位
   * @param {number} val
   */
  fNumPoint(val, pointNum) {
    return numeral(val).format(this.strPoint(pointNum))
  },
  /**
   * 根据格式化规则进行数字格式化
   * @param {格式化前的值} beforeVal
   * @param {格式化规则} formatData
   */
  formatNumByRule(beforeVal, formatData) {
    let afterVal = beforeVal
    let point = formatData.point
    const isThousandth = formatData.isThousandth
    const isPercent = formatData.isPercent
    const isProportion = formatData.isProportion
    // let timeFomat =formatData.timeFomat
    if (point > 0 && !isPercent) {
      afterVal = this.fNumPoint(beforeVal, point)
    }
    if (isPercent) {
      afterVal = this.fNumPercent(afterVal, point)
    }
    if (isThousandth) {
      afterVal = this.fNumThousandth(afterVal, point)
    }
    if (isProportion) {
      afterVal = '1:' + afterVal
    }
    if (afterVal === '0.00%' || afterVal === '0.0%') {
      afterVal = '-'
    }
    if (afterVal === '0.00' || afterVal === '0.0') {
      afterVal = '0'
    }
    return afterVal
  },
  /**
   * 根据格式化规则进行时间格式化
   * @param {格式化前的值} beforeTime
   * @param {格式化规则} formatData
   */
  formatTimeByRule(beforeTime, formatData) {
    let afterTime = beforeTime
    const timeFormat = formatData.timeFomat
    if (formatData && timeFormat) {
      afterTime = moment().format(timeFormat)
    }
    return afterTime
  }
}
export default FormatNum
