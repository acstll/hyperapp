// @ts-check

/*
  TODO
  - [ ] figure out `wireStateToActions` (and remove ternary?)
  - [ ] finish slices.test (and fully understand it)
  - [ ] test unlisten
  - [ ] find out if `scheduleDispatch` makes any sense
  - [ ] rename `app` to `createStore`
  - [ ] is `store` a good name for this? (I guess)
  - [ ] make it observable-compatible (callbags too?)
  - [ ] return a store object with an `actions` property
        instead of "monkey-patched" `wiredActions`?
  - [ ] update TS definitions and tests
*/

export function app (state, actions) {
  var skipDispatch // is this needed?
  var globalState = clone(state)
  var wiredActions = wireStateToActions([], globalState, clone(actions))
  var listeners = new Set()

  scheduleDispatch() // wouldn't `tryDispatch` be a better name?

  wiredActions.listen = wiredActions.subscribe = listen

  if (!('getState' in wiredActions)) {
    wiredActions.getState = () => globalState
  }

  return wiredActions

  function listen (fn) {
    listeners.add(fn)
    return () => { listeners.delete(fn) }
  }

  function dispatch () {
    skipDispatch = !skipDispatch
    listeners.forEach(fn => fn(globalState))
  }

  function scheduleDispatch () {
    if (!skipDispatch) {
      skipDispatch = true
      dispatch()
    }
  }

  function clone (target, source) {
    var i
    var out = {}
    for (i in target) {
      out[i] = target[i]
    }
    for (i in source) {
      out[i] = source[i]
    }

    return out
  }

  function set (path, value, source) {
    var target = {}
    if (path.length) {
      target[path[0]] =
        path.length > 1 ? set(path.slice(1), value, source[path[0]]) : value
      return clone(source, target)
    }

    return value
  }

  function get (path, source) {
    var i = 0
    while (i < path.length) {
      source = source[path[i++]]
    }

    return source
  }

  // I don't understand this yet!
  function wireStateToActions (path, state, actions) {
    for (var key in actions) {
      typeof actions[key] === 'function'
        ? (function (key, action) {
            actions[key] = function (data) {
              var result = action(data)

              if (typeof result === 'function') {
                result = result(get(path, globalState), actions)
              }

              if (
                result &&
                result !== (state = get(path, globalState)) &&
                !result.then // !isPromise
              ) {
                scheduleDispatch(
                  (globalState = set(path, clone(state, result), globalState))
                )
              }

              return result
            }
          })(key, actions[key])
        : wireStateToActions(
            path.concat(key),
            (state[key] = clone(state[key])),
            (actions[key] = clone(actions[key]))
          )
    }

    return actions
  }
}
