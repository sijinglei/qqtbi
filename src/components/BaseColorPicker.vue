<template>
	<div class="colorPicker">
		<v-tip :ref="pickerTipKey" kind="large">
			<div :ref="pickerKey"></div>
		</v-tip>
		<v-input v-model="inputValue" @change="inputChange" @enter="inputEnter"></v-input>
		<div class="colorPickerArea">
			<span class="pickerColor" :style="{backgroundColor:value}" v-tip.click="pickerTipKey"></span>
		</div>
	</div>
</template>
<script>
import ColorPicker from 'simple-color-picker'
export default {
  data() {
    return {
      colorPicker: null,
      inputValue: null
    }
  },
  props: {
    id: [String, Number],
    value: String
  },
  watch: {
    value(newVal) {
      if (this.inputValue !== newVal) this.inputValue = newVal
    }
  },
  computed: {
    pickerTipKey() {
      return this.Utility.spliceKey('color', 'p', 'tip', this.id)
    },
    pickerKey() {
      return this.Utility.spliceKey('color', 'p', this.id)
    }
  },
  methods: {
    inputChange(newVal) {
      if (newVal === this.value) return
      const bool = this.Utility.validColor(newVal)
      if (bool) {
        this.$emit('change', this.id, newVal)
        return
      }
      this.inputValue = this.value
    },
    inputEnter() {
      if (this.inputValue === this.value) return
      const bool = this.Utility.validColor(this.inputValue)
      if (bool) {
        this.$emit('change', this.id, this.inputValue)
        return
      }
      this.inputValue = this.value
    },
    _baseColorPicker_init() {
      this.colorPicker = new ColorPicker({
        color: this.value,
        el: this.$refs[this.pickerKey]
      })
      this.colorPicker.on('update', () => {
        const newColor = this.colorPicker.getHexString()
        this.$emit('change', this.id, newColor)
      })
    }
  },
  mounted() {
    this.inputValue = this.value
    this._baseColorPicker_init()
  }
}
</script>

<style lang="less" scoped>
.colorPicker {
  width: 100%;
  .v-input--default {
    width: ~'calc(100% - 43px)';
  }
  .v-input--default--focus,
  .v-input--default--focus:hover {
    border-color: #a8abb3 !important;
  }
  .colorPickerArea {
    display: inline-block;
    vertical-align: top;
    width: 40px;
    height: 34px;
    margin-left: -5px;
    border: 1px solid #dadee7;
    &:hover {
      border-color: #a8abb3;
    }
    .pickerColor {
      display: inline-block;
      height: 16px;
      width: 16px;
      margin: 8px 11px;
      border: 1px solid transparent;
      cursor: pointer;
    }
  }
}
</style>
