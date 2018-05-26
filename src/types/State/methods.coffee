import Core, { queueTask, isObject, isFunction, clone } from '../../Core'
import Handler from './Handler'

methods = {
  trigger: (property, value, notify) ->
    subs = @_child_subscriptions[property]
    if subs?.size
      queueTask(sub, value) for sub from subs
    @notify(@_target) if notify

  peek: (property) ->
    value = @_target[property]
    if isObject(value) and Object.isFrozen(value)
      value = clone(value)
      @_target[property] = value
    Handler.wrap(value)

  on: (property, fn) ->
    value = @_target[property]
    disposable = null
    if isObject(value) and not (isFunction(value) or value instanceof Element)
      handler = Handler.handler(value)
      disposable = handler.subscribe(fn)
    @_child_subscriptions[property] or= new Set()
    @_child_subscriptions[property].add(fn)
    return {unsubscribe: =>
      disposable.unsubscribe() if disposable
      @_child_subscriptions[property].delete(fn)
    }
}

Object.assign(Handler::, methods)

export default methods