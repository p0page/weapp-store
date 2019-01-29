//定义一个用于类型检查的单例
const _ = {
  isObject (value) {
    const type = typeof value
    return type === 'function' || type === 'object' && !!value
  },
  isString (value) {
    const type = typeof value
    return type === 'string' || (type === 'object' && value !== null && !Array.isArray(value) && Object.prototype.toString.call(value) === '[object String]')
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
    //将传入的state交给_observe方法处理
    this.state = this._observe(state)
    if (_.isObject(mutations)) {
      this.mutations = mutations
    }
    if (_.isObject(actions)) {
      this.actions = actions
    }
  }

  createPage (page) {
    const that = this
    if (!_.isObject(page)) {
      return
    }
    const { initStore } = page
    if (_.isObject(initStore)) {
      Object.keys(initStore).forEach(key => {
        const element = initStore[key]
        if (_.isString(element) && that.state[element] !== void 0) {
          const { onUnload, onLoad } = page
          let watcher
          //利用AOP的思想，以无侵入的形式对page的onLoad、onUnload做处理
          page.onLoad = function () {
            //在正常的onLoad操作之前，实例化一个watcher，将page对象保存下来
            watcher = new Watcher(that.state, this, key, element)
            _.isFunction(onLoad) && onLoad.apply(this, arguments)
          }
          page.onUnload = function () {
            //在page卸载前，将其中的watcher销毁
            _.isFunction(onUnload) && onUnload.call(this)
            that.depList[element].destory(watcher.id)
          }
        }
      })
      delete page.initStore
    }
    return page
  }
  
  commit (order, ...arg) {
    if (!_.isString(order)) {
      return
    }
    const fn = this.mutations[order]
    if (_.isFunction(fn)) {
      return fn.call(this.mutations, this.state, ...arg)
    }
  }
  dispatch (order, ...arg) {
    if (!_.isString(order)) {
      return
    }
    const fn = this.actions[order]
    if (_.isFunction(fn)) {
      return fn.call(this.actions, this, ...arg)
    }
  }

  _observe (state) {
    const depList = this.depList
    if (!_.isObject(state)) {
      state = {}
    }
    Object.keys(state).forEach(key => {
      depList[key] = new Dep()
    })
    //通过proxy监听数据变化，对相应的订阅者发出通知
    return new Proxy ({...state}, {
      get (target, key, receiver) {
        const dep = depList[key]
        //利用JavaScript单线程的特性，将watcher推入dep中
        Dep.target && dep.add(Dep.target)
        return Reflect.get(target, key, receiver)
      },
      set (target, key, value, receiver) {
        const dep = depList[key]
        const result = Reflect.set(target, key, value, receiver)
        //通知订阅者完成数据的更新
        dep.notify()
        return result
      }
    })
  }
}

let watcherId = 1

class Watcher { 
  constructor (state, page, name, stateKey) {
    Dep.target = this
    this.id = watcherId++
    this.page = page
    this.name = name
    this.stateKey = stateKey
    this.state = state
    this.update()
    Dep.target = null
  }

  get () {
    this.value = this.state[this.stateKey]
  }

  //获取最新的数据，利用先前保存的page对象中的setData方法，完成对应界面的数据更新
  update () {
    this.get()
    this.page.setData({
      [this.name]: this.value
    })
  }
}

class Dep {
  constructor () {
    this.subs = {}
  }

  add (sub) {
    this.subs[sub.id] = sub
  }

  notify () {
    Object.keys(this.subs).forEach(id => {
      this.subs[id].update()
    })
  }

  //销毁已经失效的watcher
  destory (id) {
    return Reflect.deleteProperty(this.subs, id)
  }
}

module.exports = Store