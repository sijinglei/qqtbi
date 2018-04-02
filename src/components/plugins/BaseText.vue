<template>
  <div :id="item.i" @click.stop="clickItem" class="baseEditor" @mouseout="mouseHandler(1)" @mouseover="mouseHandler(0)">
    <div v-show="showTool" :id="toolbarKey" class="toolbar"></div>
    <div :id="textKey" class="text"></div>
  </div>
</template>
<script>
import WEditor from 'wangeditor'
export default {
  data() {
    return {
      element: null,
      timer: null,
      editorObj: null,
      showTool: false
    }
  },
  props: {
    item: Object,
    isView: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    toolbarKey() {
      return this.Utility.spliceKey('e', 'toolbar', this.item.i)
    },
    textKey() {
      return this.Utility.spliceKey('e', 'text', this.item.i)
    }
  },
  methods: {
    reset() {
      this.setTextHeight()
    },
    reload() {
      // TODO: 组件对外公布通用方法，需要时增加实现
    },
    clickItem() {
      this.$emit('select', this.item.i)
    },
    setTextHeight() {
      const maxHeight = this.element.clientHeight
      this.editorObj && this.editorObj.$textContainerElem.css('height', maxHeight + 'px')
    },
    /**
     * 获取内容（不包含滚动条, 提交的内容要加上w-e-text样式，并将a标签 加上http://前缀
     */
    getContent(html) {
      const wrapHtml = document.createElement('div')
      wrapHtml.innerHTML = html
      const linkArr = wrapHtml.getElementsByTagName('a')
      for (let i = 0; i < linkArr.length; i++) {
        const href = linkArr[i].getAttribute('href')
        if (!href.startsWith('http://') && !href.startsWith('https://')) {
          linkArr[i].setAttribute('href', 'http://' + href)
        }
      }
      return `${wrapHtml.innerHTML}`
    },
    _baseText_init() {
      if (!this.element) {
        this.element = document.getElementById(this.item.i)
      }
      // 定时获取宽高再初始化
      if (!this.element || this.element.clientHeight < 10) {
        this.timer = setTimeout(this._baseText_init, 200)
        return
      }
      this.timer && clearTimeout(this.timer)
      this._baseText_initEditor()
    },
    _baseText_initEditor() {
      let editor = new WEditor('#' + this.toolbarKey, '#' + this.textKey)
      editor.customConfig.menus = [
        'head', // 标题
        'bold', // 粗体
        'italic', // 斜体
        'underline', // 下划线
        'strikeThrough', // 删除线
        'foreColor', // 文字颜色
        'backColor', // 背景颜色
        'list', // 列表
        'justify', // 对齐方式
        'quote', // 引用
        'link', // 插入链接
        'undo', // 撤销
        'redo' // 重复
      ]
      editor.customConfig.onchange = html => {
        this.$set(this.item, 'html', this.getContent(html))
      }
      editor.customConfig.zIndex = 100
      editor.create()
      this.editorObj = editor
      this.setTextHeight()
      let { html } = this.item
      // html += '<i class="iconfont icon-tishi blue" title="88888888"></i>'
      html && editor.txt.html(html)
      if (this.isView) editor.$textElem.attr('contenteditable', false)
    },
    mouseHandler(bool) {
      if (!this.isView) this.showTool = !bool
    }
  },
  mounted() {
    this._baseText_init()
  }
}
</script>

<style lang="less">
.baseEditor {
  .w-e-toolbar {
    position: absolute;
    width: 440px;
    border: 1px solid #e0e0e0;
    padding: 5px;
    background-color: #fff !important;
    top: -28px;
  }
  .w-e-text-container {
    .w-e-text {
      position: relative;
      overflow-y: hidden;
      p,
      h1,
      h2,
      h3,
      h4,
      h5,
      table,
      pre {
        margin: 0;
      }
    }
  }
}
</style>
