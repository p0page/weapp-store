// pages/test/test.js
const store = require('../../store/index')

Page(store.createPage({
  data: {
  },
  initStore: {
    msg: 'msg'
  },
  change() {
    store.commit('change', 'thanks')
  }
}))
