const _ = {
  isObject (value) {
    const type = typeof value
    return type === 'function' || type === 'object' && !!value
  },
  isString (value) {
    const type = typeof value
    return type === 'string' || (type === 'object' && value !== null && !Array.isArray(value) && toString.call(value) === '[object String]')
  },
  isFunction (value) {
    const type = typeof value
    return type === 'function' || false
  }
}

class Store {
  constructor (options) {
    this.depList = {}
    if (!_.isObject(options)) {
      return
    }
    const { state, mutations, actions } = options
    this._observe(state)
    if (_.isObject(mutations)) {
      this.mutations = mutations
    }
    if (_.isObject(actions)) {
      this.actions = actions
    }
  }

  createPage (page) {
    const that = this
    const { initStore } = page
    if (_.isObject(initStore)) {
      Object.keys(initStore).forEach(key => {
        const element = initStore[key]
        if (_.isString(element) && that.state[element] !== void 0) {
          const { onUnload, onLoad } = page
          let watcher
          page.onLoad = function (options = {}) {
            watcher = new Watcher(that.state, this, key, element)
            _.isFunction(onLoad) && onLoad.call(this, options)
          }
          page.onUnload = function () {
            _.isFunction(onUnload) && onUnload.call(this)
            that.depList[element].destory(watcher)
          }
        }
      })
      delete page.initStore
    }
    return page
  }
  
  commit (order, value) {
    if (!_.isString(order)) {
      return
    }
    const fn = this.mutations[order]
    _.isFunction(fn) && fn.call(this.mutations, this.state, value)
  }

  dispatch (order, value) {
    if (!_.isString(order)) {
      return
    }
    const fn = this.actions[order]
    _.isFunction(fn) && fn.call(this.actions, this, value)
  }

  _observe (state) {
    const _state = {}
    if (_.isObject(state)) {
      Object.keys(state).forEach(key => {
        this._def( _state, key, state[key])
      })
    }
    this.state = _state
  }

  _def (state, key, value) {
    const dep = new Dep()
    this.depList[key] || (this.depList[key] = dep)
    Object.defineProperty(state, key, {
      get () {
        Dep.target && dep.add(Dep.target)
        return value
      },
      set (newValue) {
        if (newValue === value) {
          return
        }
        value = newValue
        dep.notify()
      }
    })
  }
}

class Watcher { 
  constructor (state, page, name, stateKey) {
    Dep.target = this
    this.page = page
    this.name = name
    this.stateKey = stateKey
    this.state = state
    this.update()
    Dep.target = null
  }

  update () {
    this.page.setData({
      [this.name]: this.state[this.stateKey]
    })
  }
}

class Dep {
  constructor () {
    this.subs = []
  }

  add (sub) {
    this.subs.push(sub)
  }

  notify () {
    this.subs.forEach(sub => {
      sub.update()
    })
  }

  destory (sub) {
    for (let index = 0; index < this.subs.length; index++) {
      if (this.subs[index] === sub) {
        this.subs.splice(index, 1)
      }
    }
  }
}

module.exports = Store