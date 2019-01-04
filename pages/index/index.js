// pages/index/index.js
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
    store.commit('change', 'Hello')
  },
  handleNavigate(e) {
    wx.navigateTo({
      url: e.currentTarget.dataset.url
    })
  }
}))
