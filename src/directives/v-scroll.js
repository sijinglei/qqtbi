const scrollFunc = require('perfect-scrollbar')
export default {
  bind: function(el, binding, vnode) {
    if (el && el.getAttribute('data-ps-id')) {
      el.scrollTop = 0
    } else {
      scrollFunc.initialize(el, {
        wheelSpeed: 1,
        minScrollbarLength: 10,
        wheelPropagation: true
      })
      const expression = binding.value
      const obj = {
        isDoing: false
      }
      expression &&
        el.addEventListener('ps-y-reach-end', function() {
          if (el.scrollTop === 0) {
            return
          }
          if (obj.isDoing) {
            return
          }
          obj.isDoing = true
          expression(obj)
        })
    }
  },
  componentUpdated: function(el, object) {
    let isScrollTop = object.rawName.indexOf('toTop') > -1
    if (isScrollTop) {
      if (!el.scrollTop) {
        return
      }
      el.scrollTop = 0
      scrollFunc.update(el)
    } else {
      scrollFunc.update(el)
    }
  },
  unbind: function(el) {
    scrollFunc.destroy(el)
  }
}
