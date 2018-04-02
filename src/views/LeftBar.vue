<template>
  <div class="leftSidebarWrap" :style="{height:winHeight+'px'}">
    <div class="projectSidebar">
      <i class="iconfont icon-mofang" />
    </div>
    <div class="sidebarList select" :class="{'afterBd': navCollapsed}" @click="goBack">
      <i title="作品" class="iconfont icon-yibiaoban"></i>
    </div>
    <!-- <router-link tag="div" class="sidebarList" to="/" :class="{'afterBd': navCollapsed}" active-class="select">
			<i class="iconfont icon-yibiaoban" title="作品" />
		</router-link> -->
    <v-dialog v-model="value" title="当前数据有更改，是否确认离开?" kind="confirm" @confirm="sureGoBack">
      <span slot="confirm-text">确认</span>
    </v-dialog>
  </div>
</template>

<script>
import { mapState } from 'vuex'
export default {
  data() {
    return {
      navCollapsed: false,
      value: false
    }
  },
  computed: {
    ...mapState('dashboard', ['curDashData', 'updateDashData']),
    ...mapState({
      winHeight: 'winHeight'
    })
  },
  methods: {
    goBack() {
      var vm = this
      if (vm.$route.path.indexOf('dashBoard') > -1 && this.curDashData !== this.updateDashData) {
        vm.value = true
      } else {
        vm.$router.push('/')
      }
    },
    sureGoBack() {
      this.value = false
      this.$router.push('/')
    }
  }
}
</script>
<style lang="less">
.leftSidebarWrap {
  width: 50px;
  background-color: #172a3d;
  border-right: 1px solid #eee;
  color: #b9bec3;
  position: absolute;
  *position: relative;
  float: left;
  font-size: 12px;
  .select {
    background-color: #455564;
  }
  .projectSidebar {
    line-height: 50px;
    text-align: center;
    .icon-mofang {
      color: #45dfc3;
    }
    .iconfont {
      transition: all 0.2s ease-in 0s;
      font-size: 28px;
    }
    &:hover .iconfont {
      transform: scale(1.3);
    }
  }
  .sidebarList {
    cursor: pointer;
    line-height: 48px;
    padding-left: 0 !important;
    text-align: center;
    .iconfont {
      transition: all 0.2s ease-in 0s;
      font-size: 22px;
    }
    &:hover .iconfont {
      transform: scale(1.2);
    }
  }
  .projectViewBtn {
    .projectTitle {
      padding: 15px 0 5px 42px;
      font-size: 12px;
      cursor: default;
    }
    .sidebarList {
      padding-left: 52px;
    }
  }
}
</style>

