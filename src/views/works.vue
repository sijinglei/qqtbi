<template>
  <div class="works">
    <div class="worksHeader">
      <v-button status="primary" @click="$router.push({name: 'DashBoard'})">新建仪表板</v-button>
    </div>
    <div class="worksBody" :style="{height: (winHeight - 60) + 'px', overflow: 'hidden' }">
      <v-table :data="dashboardData" :loading="doLoading" :header-fix="true" >
        <v-table-column label="名称" :sortable="true">
          <template slot="cell" scope="props">
            <router-link :to="{ name: 'DashBoard', query: { id: props.row.CustomizationKey }}">{{props.row.CustomizationTitle}}</router-link>
            <router-link :to="{ name: 'DashBoardView', query: { id: props.row.CustomizationKey }}" target="_blank">
              <i class="iconfont icon-yanjing" title="预览" />
            </router-link>
          </template>
        </v-table-column>
        <v-table-column v-for="column in columns" :key="column.label" :column-key="column.columnKey" :label="column.label" :align="column.align" :sortable="column.sortable" :width="column.width" :formatter="column.formatter">
        </v-table-column>
        <v-table-column align="right" label="操作">
          <template slot="cell" scope="props">
            <v-tip kind="large" :ref="Utility.spliceKey('tip', 'share', props.index)" placement="left-start">
              <v-input :ref="Utility.spliceKey('share', 'copy', props.index)" class="tipCopyInput" :value="shareUrlPath(props.row.CustomizationKey)"></v-input>
              <v-copy :value="Utility.spliceKey('share', 'copy', props.index)" class="tipCopyBtn" @success="copySuccess(Utility.spliceKey('tip', 'share', props.index))">
                <v-button kind="primary">复制</v-button>
              </v-copy>
              <span class="tipTxt"> 注：&#38;后面部分为非必加字段</span>
            </v-tip>
            <a href="javascript:;" v-tip.click="Utility.spliceKey('tip', 'share', props.index)" class="table-link">分享</a>
            <a href="javascript:;" @click.stop="deleteRow(props.row.CustomizationKey)" class="table-link">删除</a>
          </template>
        </v-table-column>
      </v-table>
    </div>
  </div>
</template>
<script>
import { mapActions, mapState } from 'vuex'
import moment from 'moment'
export default {
  data() {
    return {
      doLoading: false,
      fields: {}, // 全局变量存储
      columns: [
        // TODO: 权限开放之后再考虑显示
        // {
        //   label: '所有者',
        //   columnKey: 'EngName',
        //   width: 150
        // },
        {
          label: '创建时间',
          columnKey: 'CreateTime',
          sortable: true,
          width: 200,
          formatter: value => {
            return moment(value).format('YYYY-MM-DD hh:mm')
          }
        },
        {
          label: '修改时间',
          columnKey: 'UpdateTime',
          sortable: true,
          width: 200,
          formatter: value => {
            return moment(value).format('YYYY-MM-DD hh:mm')
          }
        }
      ]
    }
  },
  computed: {
    ...mapState('dashboard', ['dashboardData']),
    ...mapState(['winHeight'])
  },
  methods: {
    ...mapActions('dashboard', ['getDashboardDataByEngName', 'deleteDashboardData']),
    shareUrlPath(key) {
      let url = `${window.location.origin}/view?id=${key}`
      const fieldArr = this.fields[key]
      if (!fieldArr) return url

      for (let i = 0; i < fieldArr.length; i++) {
        url += `&${fieldArr[i]}=`
      }
      return url
    },
    copySuccess(tipId) {
      this.$message.success('复制成功！请使用右键粘贴或按Ctrl+V组合键粘贴')
      this.$refs[tipId].hide()
    },
    async _works_init() {
      this.doLoading = true
      await this.getDashboardDataByEngName()
      // 解析全局参数
      const fieldArr = {}
      for (let i = 0; i < this.dashboardData.length; i++) {
        const { CustomizationKey, Data } = this.dashboardData[i]
        const { global } = JSON.parse(Data)
        if (!global) continue

        const { fields } = global
        if (!fields) continue
        const keyArr = []
        for (let key of Object.keys(fields)) {
          keyArr.push(key)
        }
        fieldArr[CustomizationKey] = keyArr
      }
      this.fields = fieldArr
      this.doLoading = false
    },
    async deleteRow(customizationKey) {
      const isConfirm = confirm('确定要删除吗？')
      if (!isConfirm) {
        return
      }
      const result = await this.deleteDashboardData({ customizationKey })
      if (result && result.Code === 1) {
        this.$message.success(result.Message)
      } else {
        this.$message.error(result.Message)
      }
      this._works_init()
    }
  },
  mounted() {
    this.Utility.setDocumentTitle('仪表板')
    this._works_init()
  }
}
</script>
<style lang="less">
.works {
  .worksHeader {
    height: 50px;
    width: 100%;
    border-bottom: 1px solid #e9e9e9;
    padding: 8px 20px;
  }
  .worksBody {
    padding: 5px;
    .v-table__td .table-cell {
      padding: 10px 0;
    }
    .icon-yanjing {
      padding-left: 5px;
      font-size: 15px;
      transition: all 0.2s ease-in 0s;
      color: #0000cc;
      &:hover {
        transform: scale(1.3);
      }
    }
    .table-link {
      font-size: 12px;
      color: #0000cc;
      &:hover {
        text-decoration: underline;
      }
    }
    .v-table{
      height: 100%;
    }
    .v-table__table{
      table-layout: fixed;
    }
    .v-table__fixbody{
      height: ~'calc( 100% - 40px)';
      overflow: scroll;
    }
  }
}
.v-popper {
  .tipCopyInput {
    width: 100%;
  }
  .tipCopyBtn {
    display: inline-block;
    margin-top: 5px;
  }
  .tipTxt {
    display: inline-block;
    color: #999;
  }
}
</style>

