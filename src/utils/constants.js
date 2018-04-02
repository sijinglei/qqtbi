export const storageHelper = {
  getUserInfo() {
    return JSON.parse(localStorage.getItem('userInfo') || '{}')
  },
  setUserInfo(data) {
    localStorage.setItem('userInfo', JSON.stringify(data))
  },
  getEngName() {
    // 非生产环境
    if (config.env !== 'production') {
      return 'v_weiqincai'
    }
    return localStorage.getItem('engName')
  },
  setEngName(data) {
    localStorage.setItem('engName', data)
  }
}
