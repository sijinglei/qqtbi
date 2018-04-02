<template>
  <div class="controlsBoard" :style="{height: winHeight + 'px'}">
    <div class="dimensionBoard">
      <v-select :options="aliasData" v-model="item.params.aliasKey" popper-clazz="aliasDataSelect" :max-height="400" :maps="aliasDataMaps" placeholder="切换数据集" @select="aliasDataSelect">
        <template slot="item" scope="props">
          <div class="v-select-list__inner">
            <v-tip :ref="Utility.spliceKey('alias','tip',props.index)" :offset="20">
              <span>{{ props.item[columnLabel] }}</span>
            </v-tip>
            <span v-tip="Utility.spliceKey('alias','tip',props.index)">{{ props.item[columnLabel] }}</span>
          </div>
        </template>
      </v-select>
      <div class="dimensionBody" v-spinner="showLoading">
        <div class="list">
          <span class="title">维度</span>
          <div class="dataFields" v-show="item.params.aliasKey" v-scroll>
            <template v-for="(d, i) in dimension">
              <div class="dataField" :key="Utility.spliceKey('dimension',i)" @dblclick.stop="addFieldHandler(d)" draggable="true" @dragstart="dragSource(d)">
                <v-tip :ref="Utility.spliceKey('dimension','tip',i)" :offset="20">
                  <span>{{d[columnLabel]}}</span>
                </v-tip>
                <span class="subField txtOverflow" v-tip="Utility.spliceKey('dimension','tip',i)">{{d[columnLabel]}}</span>
              </div>
            </template>
          </div>
        </div>
        <div class="list">
          <span class="title">度量</span>
          <div class="dataFields" v-show="item.params.aliasKey" v-scroll>
            <template v-for="(m, i) in measure">
              <div class="dataField" :class="{other:m[columnType]}" :key="Utility.spliceKey('measure',i)" @dblclick.stop="addFieldHandler(m)" draggable="true" @dragstart="dragSource(m)">
                <v-tip :ref="Utility.spliceKey('measure','tip',i)" :offset="20">
                  <span>{{m[columnLabel]}}</span>
                </v-tip>
                <span class="subField txtOverflow" v-tip="Utility.spliceKey('measure','tip',i)">{{m[columnLabel]}}</span>
              </div>
            </template>
          </div>
        </div>
        <v-spinner size="large">加载中...</v-spinner>
      </div>
    </div>
    <div class="controlsBox">
      <div ref="chartsBoard" class="chartsBoard">
        <v-tabs v-model="tab1" indent="5">
          <v-tab :value="0">图表
            <span class="tips">(单击切换，双击新增)</span>
          </v-tab>
        </v-tabs>
        <template v-for="(val, key, index) in chartTitles">
          <span :key="Utility.spliceKey('c','t',index)" class="legends" :class="{'active':item.type === key}" @click="resetHandler(key)" @dblclick="insertHandler(key)">{{val}}</span>
        </template>
      </div>
      <div ref="pluginBoard" class="pluginBoard">
        <v-tabs v-model="tab2" indent="5">
          <v-tab :value="0">控件</v-tab>
        </v-tabs>
        <template v-for="(val, key, idx) in pluginTitles">
          <span :key="Utility.spliceKey('p','t',idx)" class="legends" :class="{'active':item.type === key}" @dblclick="insertHandler(key)">{{val}}</span>
        </template>
      </div>
      <div class="stylesBoard">
        <template v-if="item.type==='frame'">
          <control-frame :item="item" :global="global" :max-height="subBoardHeight" :list="list" @run="submitHander"></control-frame>
        </template>
        <control-tabs v-else-if="item.type==='tab'" :item="item" :global="global" :max-height="subBoardHeight"></control-tabs>
        <control-query v-else-if="item.type==='query'" :item="item" :global="global" :styles="item.styles" :list="list" :max-height="subBoardHeight" :dimension="dimension"></control-query>
        <template v-else>
          <v-tabs v-model="tab3" indent="5">
            <v-tab :value="0">数据</v-tab>
            <v-tab :value="1">样式</v-tab>
            <v-tab :value="2">高级</v-tab>
          </v-tabs>
          <div v-if="tab3===0" class="selectData" :style="{maxHeight: subBoardHeight + 'px'}" v-scroll>
            <template v-if="hasParams">
              <div class="dragData" v-for="(k,kIdx) in dragFieldKeys" :key="Utility.spliceKey('s',k,kIdx)">
                <span class="dataTitle">{{Utility.argsSetTitle(k, item.type)}}</span>
                <v-button v-if="k === 'colHeadSetting'" style="margin-left: 24px;margin-top: 5px;" @click="showColHeadWinClick">设置</v-button>
                <div v-else class="dataFields" @dragover.prevent @drop.prevent="drop(item.params[k])">
                  <template v-for="(v, idx) in item.params[k]">
                    <div class="dataField" :class="{'other':v[columnType]}" :key="Utility.spliceKey('d',k,idx)" draggable="true" @dragenter.stop="dragenter(idx)" @dragstart="dragParams(item.params[k],idx)">
                      <v-tip :ref="Utility.spliceKey('d',k,'tip',idx)" :offset="10">
                        <span>{{v[columnLabel]}}</span>
                      </v-tip>
                      <span class="subField txtOverflow" v-tip="Utility.spliceKey('d',k,'tip',idx)">{{v[columnLabel]}}</span>
                      <span class="icon-btn delete" v-if="checkHidden(v)" @click.stop="deleteField(item.params[k], v)">
                        <i class="iconfont icon-yichu" title="移除" />
                      </span>
                      <span v-if="k==='filter'" class="icon-btn filter" :class="{'active': v.factor}" @click.stop="filterField(v)">
                        <i class="iconfont icon-shaixuanguolv" />
                      </span>
                      <span v-else-if="k==='orderBy'" class="icon-btn filter" @click.stop="orderByField(item.params[k], idx, v)">
                        <i class="iconfont" :class="orderByClass(v.orderType)" />
                      </span>
                      <template v-else>
                        <span class="icon-btn edit" v-if="checkHidden(v)" @click.stop="editField(item.params[k], v)">
                          <i class="iconfont icon-weihu" title="编辑" />
                        </span>
                        <span v-if="isTableType && checkHidden(v)" class="icon-btn click" @click.stop="editFieldClick(item.params[k], v)">
                          <i class="iconfont icon-event" title="添加事件" />
                        </span>
                        <span v-if="item.type === 'treegrid' && v[columnKey] === '__$ID'" class="icon-btn important" @click.stop="editField2(item.params[k], v)">
                          <i class="iconfont icon-weihu" title="编辑" />
                        </span>
                      </template>
                    </div>
                  </template>
                  <span class="noData" v-if="item.params[k].length === 0">{{noDataTitle(k)}}</span>
                </div>
              </div>
              <div class="rowsNumber" v-if="item.params.rowsNumber !== void 0">
                预览行数：
                <v-number-input v-model="item.params.rowsNumber" only-integer :min="2" />
              </div>
              <v-button class="resetRun" status="primary" @click="submitHander" :loading="runLoading">运行</v-button>
            </template>
          </div>
          <control-styles v-else-if="tab3===1" :type="item.type" :max-height="subBoardHeight" :item="item" :global="global" :styles="item.styles" @resetItem="resetItem">
            <template slot="title">
              <v-input v-model="item.title" :placeholder="titlePlaceholder" />
              <v-checkbox v-if="item.showTitle !== void 0" v-model="item.showTitle" label="显示标题"></v-checkbox>
              <v-textarea v-model="item.titleTip" maxlength="100" limit="100" autoheight placeholder="标题描述信息。" v-if="isShowTitleTip"></v-textarea>
            </template>
          </control-styles>
          <control-high v-else :item="item" :max-height="subBoardHeight" :list="list" @changeHigh="changeHigh" />
        </template>
      </div>
    </div>

    <control-filter v-if="filterItem" :visible="filterDialog" :item="filterItem" @confirm="doFilterField" />
    <!-- 数据区域-字段编辑 -->
    <v-dialog v-if="dialogItem" v-model="editDialog" :title="dialogItemTitle" kind="confirm" @confirm="doEditField">
      <div class="editRows">
        <label>
          <span class="red">*</span> {{dialogItem[columnType]===0?'维度':'度量'}}显示名
        </label>
        <v-input v-model="dialogItem[columnLabel]" />
      </div>
      <div class="editRows">
        <label>物理字段名</label>
        <v-input disabled v-model="dialogItem[columnKey]" />
      </div>
      <div class="property" v-if="isTableType">
        <div class="editRows">
          <label>标题描述</label>
          <v-input v-model="dialogItem[columnFormatData].tip" />
        </div>
      </div>
      <div class="property" v-if="isTableType">
        <div class="editRows">
          <label slot="default">是否显示</label>
          <v-checkbox v-model="dialogItem[colVisible]" />
        </div>
      </div>
      <div class="property" v-if="Utility.dataNumType().includes(dialogItem[dataType])">
        <div class="editRows">
          <label>保留小数位</label>
          <v-number-input only-integer :default="2" :min="0" :max="6" v-model="dialogItem[columnFormatData].point" />
        </div>
        <div class="editRows">
          <label slot="default">显示千分位</label>
          <v-checkbox v-model="dialogItem[columnFormatData].isThousandth" />
        </div>
        <div class="editRows">
          <label slot="default">百分比</label>
          <v-checkbox v-model="dialogItem[columnFormatData].isPercent" />
        </div>
        <div class="editRows">
          <label slot="default">显示占比</label>
          <v-checkbox v-model="dialogItem[columnFormatData].isProportion" />
        </div>
        <div class="editRows" v-if="item.type === 'bar'">
          <label slot="default">显示折线</label>
          <v-checkbox v-model="dialogItem[isLine]" />
        </div>
      </div>
      <div class="property" v-if="Utility.dateTimeType().includes(dialogItem[dataType])">
        <div class="editRows">
          <label>时间格式</label>
          <v-select :options="Utility.formatDateSet()" v-model="dialogItem[columnFormatData].timeFomat"></v-select>
        </div>
      </div>
      <span slot="confirm-text">确定</span>
    </v-dialog>

    <!-- 树表格关联唯一key -->
    <v-dialog v-if="dialogItem2" v-model="editDialog2" title="唯一字段关联" kind="confirm">
      <div class="editRows">
        <label>物理字段名</label>
        <v-input disabled v-model="dialogItem2[columnKey]" />
      </div>
      <div class="editRows">
        <label>关联字段</label>
        <v-select placeholder="请选择" :options="HRDWData" v-model="item.relatedKey" :maps="map">
        </v-select>
      </div>
      <span slot="confirm-text">确定</span>
    </v-dialog>

    <!-- 事件配置区域 -->
    <v-dialog v-if="dialogEventItem" :title="dialogEventTitle" v-model="editEventDialog" @confirm="doEditField">
      <div class="v-third">
        <!-- <div class="editRows">
          <label>启动点击事件</label>
          <v-checkbox v-model="dialogItem[columnFormatData].isThousandth" />
        </div> -->
        <div class="editRows">
          <label class="other">
            弹出层标题</label>
          <v-input v-model="dialogEventItem[fieldClickConfig].title" />
        </div>
        <div class="editRows">
          <label class="other">
            弹出层Url地址</label>
          <v-input v-model="dialogEventItem[fieldClickConfig].url" />
        </div>
        <div class="property">
          <div class="editRows">
            <label class="other">关联查询条件</label>
            <v-select name="multi" :options="optionsSelectDatas" multiple v-model="dialogEventItem[fieldClickConfig].params"></v-select>
          </div>
        </div>

      </div>
      <div slot="footer">
        <v-button status="primary" size="large" @click="doEditFieldEvent">确定</v-button>
        <v-button status="default" size="large" @click="editEventDialog=false">取消</v-button>
      </div>
    </v-dialog>
    <!-- 多列头设置窗口 -->
    <v-dialog title="多列头设置" v-model="showColHeadWin">
      <hot-table :settings="hotSettings" ref="hottable" />
      <div slot="footer">
        <v-button status="primary" size="large" @click="confirmColHeadSet">确定</v-button>
        <v-button status="default" size="large" @click="showColHeadWin=false">取消</v-button>
      </div>
    </v-dialog>
  </div>
</template>
<script>
import { mapActions, mapState, mapMutations } from 'vuex'
import {
  columnKey,
  columnLabel,
  columnType,
  dataType,
  columnFormatData,
  fieldClickConfig,
  isLine,
  colVisible,
  tgConstants
} from '@/utils/echartsDefault'
import ControlHigh from './TheControlHigh'
import ControlStyles from './TheControlStyles'
import ControlFilter from './TheControlFilter'
import ControlFrame from './TheControlFrame'
import ControlTabs from './TheControlTabs'
import ControlQuery from './TheControlQuery'
import bids from '@/utils/bids.protocolHelper'
// import bids from '@/utils/bids.protocolHelper-0.30.1'
import HotTable from 'vue-handsontable-official'
import _ from 'lodash'

export default {
  data() {
    return {
      columnLabel,
      columnType,
      columnKey,
      dataType,
      columnFormatData,
      fieldClickConfig,
      isLine,
      colVisible,
      times: null,
      showLoading: false,
      tab1: 0,
      tab2: 0,
      tab3: 0,
      sourceDrag: null,
      paramsDrag: null,
      dragIndex: 0,
      runLoading: false,
      editDialog: false,
      editEventDialog: false,
      dialogItemTitle: '',
      dialogEventTitle: '',
      dialogItem: null,
      dialogEventItem: null,
      dialogItems: [],
      filterDialog: false,
      filterItem: null,
      orderByItem: null,
      orderByItems: [],
      subBoardHeight: 0,
      titleTip: '',
      TreeAllowed: false,
      showColHeadWin: false,
      hotSettings: null,
      tgColumnFields: null,
      dialogItem2: null,
      dialogItems2: [],
      editDialog2: false,
      map: {
        text: columnLabel,
        value: columnKey
      }
    }
  },
  props: {
    item: Object,
    list: Array,
    global: Object
  },
  watch: {
    async 'item.params.aliasKey'(newVal) {
      if (!newVal) return
      this.showLoading = true
      const obj = this.aliasData.find(d => d[columnKey] === newVal)
      if (!obj) {
        this.$message.error('数据获取异常，请重新加载...')
        return
      }
      const curSelAlias = this.aliasData.find(item => item[columnKey] === this.item.params.aliasKey)
      this.TreeAllowed = curSelAlias && curSelAlias.TreeAllowed
      await this.getApiFieldList({ aliasKey: newVal, appName: obj.AppName })
      this.showLoading = false
    },
    // 字段集
    HRDWData() {
      this.insertTreeGridFields()
    }
    // global: {
    //   handler(newVal, oldVal) {
    //     if (_.isEqual(newVal, oldVal)) {
    //       return
    //     }
    //     this.submitHander()
    //   },
    //   deep: true
    // },
    // item: {
    //   handler(newVal, oldVal) {
    //     if (_.isEqual(newVal, oldVal)) {
    //       return
    //     }
    //     this.submitHander()
    //   },
    //   deep: true
    // }
  },
  computed: {
    ...mapState(['winHeight', 'winWidth', 'tgColsObj']),
    ...mapState('dataset', ['HRDWData', 'dimension', 'measure', 'aliasData', 'aliasDataMaps']),
    optionsSelectDatas() {
      const optData = []
      const allData = [...this.dimension, ...this.measure].filter(l => l[columnKey].indexOf('__$') < 0)
      allData.map((item, idex) => {
        optData.push({ text: item[columnLabel], value: item[columnKey] })
      })
      return optData
    },
    chartTitles() {
      return this.Utility.chartAllTitle()
    },
    pluginTitles() {
      return this.Utility.pluginAllTitle()
    },
    chartKeys() {
      return Object.keys(this.chartTitles)
    },
    pluginKeys() {
      return Object.keys(this.pluginTitles)
    },
    titlePlaceholder() {
      return this.pluginKeys.includes(this.item.type) ? '控件名称' : '标题名称'
    },
    dragFieldKeys() {
      const arr = ['aliasKey', 'appName', 'rowsNumber']
      return Object.keys(this.item.params).filter(f => !arr.includes(f))
    },
    hasParams() {
      const { params } = this.item
      return params.measure || params.dimension || params.dimension2 || params.measure2 || params.blend
    },
    isShowTitleTip() {
      return this.chartKeys.includes(this.item.type)
    },
    isTableType() {
      return this.Utility.getTableType().includes(this.item.type)
    }
  },
  components: {
    ControlStyles,
    ControlFilter,
    ControlFrame,
    ControlTabs,
    ControlQuery,
    ControlHigh,
    HotTable
  },
  methods: {
    ...mapActions('dataset', ['getApiData', 'getApiFieldList']),
    ...mapMutations(['SET_TG_COLUMNS']),
    showColHeadWinClick() {
      this.showColHeadWin = true
      let cols = null
      let columns = null
      const data = []
      const mergedArr = []
      const id = this.item.i
      if (this.tgColsObj[id].length === 1) {
        // 未设置过列头
        cols = _.cloneDeep(this.tgColsObj[id][0])
        if (!cols || !cols.length) {
          alert('没有列不能设置列头!')
          return
        }
        this.tgColumnFields = cols.map(item => item.field)
        columns = cols.map(item => {
          return {
            type: 'text' /* ,
            data: item.field */
          }
        })
        const tmp = cols.map(item => item.title)
        data.push(tmp)
      } else {
        // 设置过列头
        const fields = this.tgColsObj[id]
          .reduce((acc, curr) => {
            return acc.concat(curr)
          })
          .filter(item => item && item.field)
        this.tgColumnFields = fields.map(item => item.field)
        columns = fields.map(item => {
          return {
            type: 'text' /* ,
            data: item.field */
          }
        })
        this.tgColsObj[id].forEach(item => {
          const tmp = []
          item.forEach((it, index) => {
            if (it.colspan !== 1 || it.rowspan !== 1) {
              const obj = {}
              obj.startRow = it.rowIndex
              obj.startColumn = it.colIndex
              obj.endRow = it.rowspan + it.rowIndex - 1
              obj.endColumn = it.colspan + it.colIndex - 1
              mergedArr.push(obj)
            }
            tmp[it.colIndex] = it.title
          })
          data.push(tmp)
        })
      }

      this.hotSettings = {
        colHeaders: true,
        rowHeaders: true,
        height: 200,
        width: Math.min(900, this.winWidth - 400),
        stretchH: 'all',
        language: 'zh-CN',
        rowHeights: 23,
        columns,
        data,
        contextMenu: [
          'row_above',
          'row_below',
          '---------',
          'remove_row',
          '---------',
          'mergeCells',
          '---------',
          'alignment',
          '---------',
          'undo',
          'redo'
        ],
        mergeCells: true
      }
      if (!this.hotSettings.afterContextMenuShow) {
        this.hotSettings.afterContextMenuShow = function() {
          var item = this.getPlugin('contextMenu').menu.menuItems[7].submenu.items
          if (item[3].key === 'alignment:justify') {
            item.splice(3, 1)
          }
        }
      }
      this.$nextTick(() => {
        const mc = this.$refs.hottable.table.getPlugin('mergeCells')
        mergedArr.forEach(item => {
          mc.merge(item.startRow, item.startColumn, item.endRow, item.endColumn)
        })
      })
    },
    confirmColHeadSet() {
      this.showColHeadWin = false

      const hot = this.$refs.hottable.table
      var cols = hot.countCols()
      var rows = hot.countRows()
      var tmpTgCols = []
      var obj = {}
      var isPushed = false
      for (var i = 0; i < rows; i++) {
        var temp = []
        for (var j = 0; j < cols; j++) {
          isPushed = false
          var dom = hot.getCell(i, j)
          var colspan = dom.getAttribute('colspan') - 0 || 1
          var rowspan = dom.getAttribute('rowspan') - 0 || 1
          var classArr = Array.prototype.slice
            .call(dom.classList)
            .filter(item => item.startsWith('ht'))
            .map(item => item.toLowerCase().substr(2))
          var title = dom.innerText
          var styleObj = {
            halign: classArr[0] || 'center',
            hvAlign: classArr[1] || 'middle'
          }
          if (obj[title + colspan + rowspan]) {
            continue
          }
          // 不是列向合并，就一定是表格字段
          if (colspan !== 1) {
            if (colspan === cols) {
              temp.push(
                Object.assign(
                  {
                    title: title,
                    rowIndex: i,
                    colIndex: j,
                    colspan: colspan,
                    rowspan: rowspan
                  },
                  styleObj
                )
              )
              tmpTgCols.push(temp)
              obj[title + colspan + rowspan] = true
              isPushed = true
              if (rowspan > 1) {
                for (var k = 0; k < rowspan - 1; k++) {
                  tmpTgCols.push([])
                }
              }
              break
            } else {
              temp.push(
                Object.assign(
                  {
                    title: title,
                    rowIndex: i,
                    colIndex: j,
                    colspan: colspan,
                    rowspan: rowspan
                  },
                  styleObj
                )
              )
              obj[title + colspan + rowspan] = true
            }
          } else {
            // 上行与本行未合并
            temp.push(
              Object.assign(
                {
                  title: title,
                  rowIndex: i,
                  colIndex: j,
                  colspan: colspan,
                  rowspan: rowspan,
                  field: obj[this.tgColumnFields[j]] ? '' : this.tgColumnFields[j] // j为实际数据列索引
                },
                styleObj
              )
            )
            obj[title + colspan + rowspan] = true
            obj[this.tgColumnFields[j]] = true
          }
        }
        !isPushed && temp.length && tmpTgCols.push(temp)
      }
      this.SET_TG_COLUMNS({ id: this.item.i, data: tmpTgCols })
      this.item.params.colHeadSetting = tmpTgCols
    },
    insertTreeGridFields() {
      if (this.TreeAllowed && this.item.type === 'treegrid') {
        const fields = this.item.params.blend.filter(
          item =>
            item[columnKey] !== tgConstants.parentField &&
            item[columnKey] !== tgConstants.idField &&
            item[columnKey] !== tgConstants.leafField
        )
        this.item.params.blend = fields.concat(
          this.HRDWData.filter(
            item =>
              item[columnKey] === tgConstants.parentField ||
              item[columnKey] === tgConstants.idField ||
              item[columnKey] === tgConstants.leafField
          )
        )
      }
    },
    noDataTitle(dimKey) {
      const bool = ['measure', 'dimension', 'blend'].includes(dimKey)
      return bool ? '双击或拖动数据字段至此处' : '拖动数据字段至此处'
    },
    aliasDataSelect({ value, current }) {
      if (!value) return
      const TreeAllowed = current.TreeAllowed
      this.TreeAllowed = TreeAllowed
      if (!this.TreeAllowed && this.item.type === 'treegrid') {
        this.$message.error('该数据集不支持树表格')
      }
      const { AppName: appName } = current
      this.item.params = Object.assign(this.Utility.chartParams(this.item.type), { aliasKey: value, appName })
    },
    changeHigh(data) {
      if (data) {
        console.log(data)
        this.$set(this.item, 'high', data)
        return
      }
      this.$delete(this.item, 'high')
    },
    insertHandler(type) {
      let isInsert = false
      if (type === 'treegrid') {
        if (this.item.params.aliasKey) {
          if (!this.TreeAllowed) {
            this.$message.error('该数据集不支持树表格')
            return
          } else {
            isInsert = true
          }
        } else {
          // 必须选了数据集
          this.$message.error('请先选择数据集')
          return
        }
      }
      // 鼠标双击事件，添加图表（防止单击和双击事件冲突）
      this.times && clearTimeout(this.times)
      this.$emit('addItem', type)
      this.$nextTick(() => {
        isInsert && this.insertTreeGridFields()
      })
    },
    resetHandler(type) {
      let isInsert = false
      // 必须选了数据集
      if (type === 'treegrid') {
        if (this.item.params.aliasKey) {
          if (!this.TreeAllowed) {
            this.$message.error('该数据集不支持树表格')
            return
          } else {
            isInsert = true
          }
        } else {
          // 必须选了数据集
          this.$message.error('请先选择数据集')
          return
        }
      }
      // 原类型为控件的不转换
      if (this.pluginKeys.includes(this.item.type)) return
      // 鼠标单击事件，重选图表（防止单击和双击事件冲突）
      this.times && clearTimeout(this.times)
      this.times = setTimeout(() => {
        this.$emit('resetItem', type)
        isInsert && this.insertTreeGridFields()
      }, 300)
    },
    resetItem(type) {
      this.$emit('resetItem', type)
    },
    addFieldHandler(obj) {
      const Utility = this.Utility
      const { type, params } = this.item
      if (['text', 'frame'].includes(type)) return
      if (type === 'line') obj.isLine = true
      // 跳转到数据tab中
      if (this.tab3) this.tab3 = 0
      obj = Object.assign({}, obj)
      const { measure, dimension, dimension2, blend } = params
      if (!dimension && !measure && blend) {
        if (this._theControl_includes(blend, obj)) {
          return
        }
        if (blend.length >= Utility.chartValid(type, 'blend')) {
          const msg = `已超出[${Utility.argsSetTitle('blend', type)}]最多可添加项数量（${blend.length}）`
          this.$message.error(msg)
          return
        }
        blend.push(obj)
        return
      }
      if (obj[columnType] === 0) {
        if (!dimension && dimension2) {
          if (dimension2.length > 0) {
            const msg = `已超出[${Utility.argsSetTitle('dimension2')}]最多可添加项数量（1）`
            this.$message.error(msg)
            return
          }
          if (measure.length > 1 && !['pie'].includes(type)) {
            const msg = `[${Utility.argsSetTitle('dimension2')}]与[${Utility.argsSetTitle('measure', type)}]选择有冲突`
            this.$message.error(msg)
            return
          }
          dimension2.push(obj)
          return
        }
        // 赋值纬度对象
        let dimArr = [...dimension]
        if (dimension2) dimArr = dimArr.concat(dimension2)
        if (dimArr.length >= Utility.chartValid(type, 'dimension')) {
          const message = `已超出[${Utility.argsSetTitle('dimension', type)}]最多可添加项数量（${dimArr.length}）`
          this.$message.error(message)
          return
        }
        if (!this._theControl_includes(dimArr, obj)) {
          dimension.push(obj)
        }
        return
      }
      if (dimension2 && dimension2.length > 0 && measure.length === 1 && !['pie'].includes(type)) {
        const msg = `[${Utility.argsSetTitle('dimension2')}]与[${Utility.argsSetTitle('measure', type)}]选择有冲突`
        this.$message.error(msg)
        return
      }
      if (measure.length >= Utility.chartValid(type, 'measure')) {
        const message = `已超出[${Utility.argsSetTitle('measure', type)}]最多可添加项数量（${measure.length}）`
        this.$message.error(message)
        return
      }
      if (!this._theControl_includes(measure, obj)) {
        measure.push(obj)
      }
    },
    dragSource(item) {
      this.sourceDrag = Object.assign({}, item)
      this.paramsDrag = null
    },
    dragParams(source, index) {
      this.paramsDrag = { index, source }
      this.sourceDrag = null
    },
    dragenter(idx) {
      this.dragIndex = idx
    },
    drop(items) {
      if (!this.item.params) return
      // 跳转到数据tab中
      if (this.tab3) this.tab3 = 0
      // sourceDrag 有值则为源数据拖拽，不然则在现有数据字段拖拽
      this.sourceDrag ? this.dropSource(items, this.sourceDrag) : this.dropParams(items, this.item.params)
    },
    dropSource(target, item) {
      if (this._theControl_includes(target, item)) return

      const Utility = this.Utility

      const { type, params } = this.item
      const { measure, dimension, filter, orderBy, measure2 = [], dimension2 = [], blend = [] } = params

      if ([filter, blend, orderBy].includes(target)) {
        // 排序
        const args = target === blend ? 'blend' : target === filter ? 'filter' : 'orderBy'
        if (target.length >= Utility.chartValid(type, args)) {
          const msg = `已超出[${Utility.argsSetTitle(args, type)}]最多可添加项数量（${target.length}）`
          this.$message.error(msg)
          return
        }
        if (args === 'orderBy') {
          if (!item.orderType) {
            item.orderType = bids.orderType.asc
          }
        }
        target.push(item)
        return
      }
      // 维度
      if (item[columnType] === 0) {
        if (target === measure || target === measure2) return
        if (target === dimension) {
          if (this._theControl_includes(dimension2, item)) return

          if (target.length >= Utility.chartValid(type, 'dimension')) {
            const msg = `已超出[${Utility.argsSetTitle('dimension', type)}]最多可添加项数量（${target.length}）`
            this.$message.error(msg)
            return
          }
        }
        if (target === dimension2) {
          if (dimension && this._theControl_includes(dimension, item)) return
          if (target.length > 0 || measure.length > 1) return
        }
        target.push(item)
        return
      }
      // 度量
      if (item[columnType] === 1) {
        if (target === dimension || target === dimension2) return
        if (target === measure) {
          if (this._theControl_includes(measure2, item)) return
          if (dimension2.length > 0 && target.length > 0 && !['pie'].includes(type)) {
            const msg = `[${Utility.argsSetTitle('dimension2')}]与[${Utility.argsSetTitle('measure', type)}]选择有冲突`
            this.$message.error(msg)
            return
          }
          if (measure.length >= Utility.chartValid(type, 'measure')) {
            const msg = `已超出[${Utility.argsSetTitle('measure', type)}]最多可添加项数量（${measure.length}）`
            this.$message.error(msg)
            return
          }
        }
        if (target === measure2) {
          if (this._theControl_includes(measure, item)) return
          if (target.length >= Utility.chartValid(type, 'measure2')) {
            const msg = `已超出[${Utility.argsSetTitle('measure2', type)}]最多可添加项数量（${measure.length}）`
            this.$message.error(msg)
            return
          }
        }
        target.push(item)
      }
    },
    dropParams(target, sources = {}) {
      const { paramsDrag, dragIndex, Utility } = this
      const { source, index } = paramsDrag
      const item = Object.assign({}, source[index])
      if (target === source) {
        target.splice(index, 1)
        target.splice(dragIndex, 0, item)
        return
      }
      const { measure, measure2 = [], dimension, dimension2 = [], blend = [], filter, orderBy } = sources
      // 维度
      if (item[columnType] === 0) {
        if (target === measure || target === measure2) return
        if (target === dimension2 && (target.length > 0 || measure.length > 1)) {
          const { type } = this.item
          const msg = `[${Utility.argsSetTitle('dimension2')}]与[${Utility.argsSetTitle('measure', type)}]选择有冲突`
          this.$message.error(msg)
          return
        }
      }
      if (item[columnType] === 1 && [dimension, dimension2].includes(target)) {
        return
      }
      source.splice(index, 1)
      if ([filter, blend, orderBy].includes(target)) {
        // const newObj = {
        //   [columnLabel]: item[columnLabel],
        //   [columnKey]: item[columnKey],
        //   [columnType]: item[columnType]
        // }
        target.push(Object.assign({}, item))
      } else {
        target.push(item)
      }
    },
    checkHidden(item) {
      if (!this.TreeAllowed || this.item.type !== 'treegrid') {
        return true
      }
      for (let i in tgConstants) {
        if (item[columnKey] === tgConstants[i]) {
          return false
        }
      }
      return true
    },
    editField2(items, item) {
      this.dialogItem2 = Object.assign({}, item)
      this.dialogItems2 = items
      this.editDialog2 = true
    },
    editField(items, item) {
      // 如果是纬度且字段类型是时间的，默认添加时间格式验证（主要针对老数据没有此格式）
      if (this.Utility.dataNumType().includes(item.DataType) && !item.formatData) {
        item.formatData = {
          point: 2,
          isThousandth: true,
          isPercent: false,
          isProportion: false
        }
      } else {
        if (item.DataType) {
          if (this.Utility.dateTimeType().includes(item.DataType) && !item.formatData) {
            item.formatData = { timeFomat: 'YYYY-MM-DD' }
          }
        }
      }
      if (this.Utility.getTableType().includes(this.item.type) && (!item.formatData || !item.formatData.tip)) {
        item.formatData = {
          tip: ''
        }
      }
      this.dialogItem = Object.assign({}, item)
      this.dialogItemTitle = '编辑字段名'
      this.dialogItems = items
      this.editDialog = true
    },
    editFieldClick(items, item) {
      if (this.isTableType) {
        this.dialogEventTitle = '弹出层相关配置'
        if (!item[fieldClickConfig]) {
          item[fieldClickConfig] = {
            title: '',
            url: '',
            params: []
          }
        }
        this.dialogEventItem = Object.assign({}, item)
        this.dialogItems = items
        this.editEventDialog = true
      }
    },
    doEditFieldEvent() {
      // const edit = this.dialogItem
      // const url = edit[fieldClickConfig].url
      // if (url !== '' && !this.Utility.isURL(url)) {
      //   this.$message.error('url地址不合法！')
      //   return
      // }
      this.editEventDialog = false
    },
    doEditField() {
      const edit = this.dialogItem
      const item = this.dialogItems.find(d => d[columnKey] === edit[columnKey])
      if (item) {
        item[columnLabel] = edit[columnLabel]
        // 赋值折线sijl
        item[isLine] = edit[isLine]
        //
        item[colVisible] = edit[colVisible]
      }
      // item[columnLabel] = edit[columnLabel]
    },
    deleteField(items, item) {
      // if (!this.checkHidden(item)) {
      //   this.$message.error('树表格组件的该字段不能被删除')
      //   return
      // }
      // 移除字段
      const idx = items.findIndex(i => i === item)
      idx !== -1 && items.splice(idx, 1)
    },
    filterField(item) {
      this.filterItem = item
      this.filterDialog = true
    },
    doFilterField(params) {
      if (params) {
        if (params.length > 0) {
          this.filterItem.factor = params
        } else {
          this.$delete(this.filterItem, 'factor')
        }
      }
      this.filterDialog = false
    },
    orderByClass(type) {
      return type === bids.orderType.desc ? 'icon-jiangxu' : 'icon-shengxu'
    },
    orderByField(items, idx, item) {
      const { asc, desc } = bids.orderType
      const orderType = item.orderType === asc ? desc : asc
      item.orderType = orderType
      this.$set(items, idx, item)
    },
    submitHander() {
      // 点击运行就是执行组件的reload方法
      // 页面宽高改变，就会调用组件的reset方法
      this.runLoading = true
      this.$emit('run')
      this.$nextTick(() => {
        this.runLoading = false
      })
    },
    _theControl_includes(list, obj) {
      return list.some(l => l[columnKey] === obj[columnKey])
    },
    _theControl_subBoardHeight() {
      const cbHeight = this.$refs.chartsBoard ? this.$refs.chartsBoard.clientHeight : 0
      const pbHeight = this.$refs.pluginBoard ? this.$refs.pluginBoard.clientHeight : 0
      // chartsBoard height + pluginBoard height + tabs height
      const overHeight = cbHeight < 10 || pbHeight < 10 ? 300 : cbHeight + pbHeight + 28
      this.subBoardHeight = this.winHeight - overHeight
    },
    async _theControl_init() {
      await this.getApiData()
      const curSelAlias = this.aliasData.find(item => item[columnKey] === this.item.params.aliasKey)
      this.TreeAllowed = curSelAlias && curSelAlias.TreeAllowed
      const { aliasKey, appName } = this.item.params
      if (aliasKey && appName) await this.getApiFieldList({ aliasKey, appName })
      this._theControl_subBoardHeight()
    }
  },
  mounted() {
    this._theControl_init()
  }
}
</script>
<style lang="less">
.controlsBoard {
  display: inline;
  .tips {
    display: inline-block;
    color: #bbb;
    font-size: 12px;
  }
  .dataFields {
    position: relative;
    padding: 1px 2px;
    .dataField {
      position: relative;
      margin: 1px 0;
      border: 1px solid transparent;
      border-radius: 3px;
      cursor: pointer;
      .subField {
        padding: 5px 3px;
        display: inline-block;
        width: 100%;
      }
    }
    .noData {
      display: inline-block;
      font-size: 12px;
      line-height: 28px;
      padding-left: 20px;
    }
  }
  .dimensionBoard {
    position: absolute;
    width: 200px;
    height: 100%;
    background-color: #fff;
    .v-select {
      min-height: 35px;
      .v-select__header {
        font-size: 13px;
        padding: 0 6px;
        line-height: 32px;
        .v-select__header-arrow.v-icon {
          top: 10px;
        }
      }
    }
    .dimensionBody {
      height: ~'calc(100% - 35px)';
      .list {
        height: 50%;
        box-sizing: border-box;
        border-left: 1px solid #d0d0d0;
        border-right: 1px solid #d0d0d0;
        &:first-child {
          margin-top: -2px;
        }
        & > .dataFields {
          max-height: ~'calc(100% - 25px)';
          .dataField:hover {
            background-color: #def1f6;
            border-color: #00c1de;
          }
          .dataField.other:hover {
            background-color: #ddeed5;
            border-color: #64bd4f;
          }
        }
        .title {
          display: inline-block;
          width: 100%;
          padding: 5px;
          border-top: 1px solid #d0d0d0;
          border-bottom: 1px solid #d0d0d0;
        }
      }
    }
  }
  .controlsBox {
    position: absolute;
    left: 199px;
    width: 200px;
    height: 100%;
    border: 1px solid #d0d0d0;
    background-color: #fff;
    .legends {
      display: inline-block;
      margin-left: 3px;
      padding: 5px 6px;
      cursor: pointer;
      border: 1px solid transparent;
      border-radius: 3px;
      &.active {
        border-color: #e0e0e0;
      }
    }
    .chartsBoard {
      padding-bottom: 20px;
      user-select: none;
      .v-tabs {
        margin-bottom: 8px;
        .v-tabs-default__underline {
          width: 35px !important;
        }
      }
    }
    .pluginBoard {
      padding-bottom: 20px;
      .v-tabs {
        margin-bottom: 8px;
      }
    }
    .resetRun {
      float: right;
      margin: 8px 10px;
      margin-right: 10px;
    }
    .stylesBoard {
      .selectData {
        position: relative;
        padding-top: 10px;
        .linkInput {
          margin-left: 5px;
        }
        .dragData {
          .dataTitle {
            display: inline-block;
            font-weight: bold;
            width: 100%;
            padding: 3px 5px;
          }
          & > .dataFields {
            padding: 5px 3px;
            .dataField {
              background-color: #def1f6;
              border-color: #00c1de;
              .subField {
                width: 87%;
              }
              &.other {
                background-color: #ddeed5;
                border-color: #64bd4f;
                .delete:hover,
                .edit:hover,
                .filter:hover,
                .filter.active {
                  color: #64bd4f;
                }
              }
              .icon-btn {
                position: absolute;
                top: 4px;
                &.important {
                  color: red;
                }
              }
              .delete {
                right: 7px;
              }
              .edit {
                right: 24px;
              }
              .filter {
                right: 24px;
              }
              .click {
                right: 40px;
              }
              .icon-btn:hover,
              .icon-btn.active {
                color: #00c1de;
              }
            }
          }
        }
        .rowsNumber {
          margin-top: 10px;
          padding: 6px 3px;
          border-top: 1px solid #d0d0d0;
          border-bottom: 1px solid #d0d0d0;
          .v-number-input {
            width: 60%;
            border: 1px solid #dadee7;
            padding: 5px;
            .v-number-input--default__input {
              width: 100%;
            }
          }
        }
      }
      .v-textarea {
        width: 100%;
      }
    }
  }
}
.v-dialog {
  .editRows {
    margin: 2px 0;
    .v-checkbox {
      vertical-align: middle;
    }
    label {
      display: inline-block;
      width: 32%;
      text-align: right;
      padding-right: 15px;
    }
    label.other {
      width: 22%;
    }
    .v-select {
      vertical-align: middle;
      width: 187px;
    }
  }
  .v-third {
    .editRows {
      width: 550px;
      .v-input,
      .v-select {
        width: 70%;
      }
    }
  }

  .v-vertical {
    vertical-align: top;
    margin-top: 3px;
  }
  .property {
    .v-checkbox {
      &:extend(.v-dialog .v-vertical);
    }
    .v-select {
      vertical-align: middle;
    }
    .v-number-input--default {
      &:extend(.v-dialog .v-vertical);
      border: 1px solid #dadee7;
      line-height: 34px;
      padding: 0 8px;
      vertical-align: middle;
    }
  }
}
.aliasDataSelect {
  .v-select-list__item {
    min-height: 30px;
    .v-select-list__inner {
      margin: 0 5px;
      line-height: 30px;
    }
  }
}
.htContextMenu {
  z-index: 10000 !important;
}
</style>
