export const OpenDialog = {
  getUrls(tdVal) {
    let url = ''
    const params = tdVal.match(/data-params=[\\'\\"]?([^\\'\\"]*)[\\'\\"]?/i)
    const urls = tdVal.match(/data-url=[\\'\\"]?([^\\'\\"]*)[\\'\\"]?/i)
    if (urls) {
      url = urls[1].indexOf('?') > 0 ? urls[1] + '&' + params[1] : urls[1] + '?' + params[1]
    }
    return url
  },
  open(tdVal) {
    const title = tdVal.match(/data-title=[\\'\\"]?([^\\'\\"]*)[\\'\\"]?/i)
    let url = this.getUrls(tdVal)
    if (window.parent.openDialog !== 'undefined' && typeof window.parent.openDialog === 'function') {
      window.parent.openDialog(title[1], url)
    } else {
      console.log(url)
      window.open(url, title[1], '_blank')
      return
    }
  }
}
export default OpenDialog
