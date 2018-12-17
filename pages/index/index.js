//index.js
//获取应用实例
const store = require('../../store/index')

Page(store.createPage({
  data: {
  },
  initStore: {
    msg: 'msg'
  },
  onLoad() {
  },
  change() {
    store.commit('change', 'fuck')
  },
  handleNavigate(e) {
    wx.navigateTo({
      url: e.currentTarget.dataset.url
    })
  }
}))
