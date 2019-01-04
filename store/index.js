const Store = require('../lib/Store')

const store = new Store({
  state: {
    msg: 'Hello'
  },
  mutations: {
    change (state, value) {
      state.msg = value
    }
  }
})

module.exports = store