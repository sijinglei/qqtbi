<template>
  <div :id="item.i" @click.stop="clickItem" class="baseFrame">
    <!-- <div v-if="!isView" class="frameLevel"></div> -->
    <iframe :id="iframeKey" class="frameBody" v-if="link" :src="link"></iframe>
  </div>
</template>
<script>
export default {
  data() {
    return {
      element: null,
      timer: null,
      link: null
    }
  },
  props: {
    item: Object,
    global: Object,
    isView: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    iframeKey() {
      return this.Utility.spliceKey('i', 'frame', this.item.i)
    }
  },
  methods: {
    reset() {
      // this.setTextHeight()
    },
    reload() {
      this._baseFrame_initFrame()
    },
    clickItem() {
      this.$emit('select', this.item.i)
    },
    _baseFrame_init() {
      if (!this.element) {
        this.element = document.getElementById(this.item.i)
      }
      // 定时获取宽高再初始化
      if (!this.element || this.element.clientHeight < 10) {
        this.timer = setTimeout(this._baseFrame_init, 200)
        return
      }
      this.timer && clearTimeout(this.timer)
      this._baseFrame_initFrame()
    },
    _baseFrame_initFrame() {
      const { url, request = [] } = this.item

      if (!url) return
      let link = ''
      if (request && request.length > 0) {
        link = url.substr(0, url.indexOf('?'))
        const query = this.$route.query
        const { fields = {} } = this.global
        for (let i = 0; i < request.length; i++) {
          const { key, value, current } = request[i]
          link += i === 0 ? '?' : '&'
          if (fields[value] && query[value]) {
            link += key + '=' + query[value]
          } else {
            link += key + '=' + current
          }
        }
      } else {
        link = url
      }
      if (!link.startsWith('http://') && !link.startsWith('https://')) {
        link = 'http://' + link
      }
      this.link = link
    }
  },
  mounted() {
    this._baseFrame_init()
  }
}
</script>

<style lang="less">
.baseFrame {
  .frameLevel {
    position: absolute;
    width: 100%;
    height: 100%;
  }
  .frameBody {
    border: 0;
    width: 100%;
    height: 100%;
  }
}
</style>
