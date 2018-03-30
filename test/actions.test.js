/* global expect, test */

import { app } from '../src'

const mockDelay = () => new Promise(resolve => setTimeout(resolve, 50))

test('sync updates', done => {
  const initialState = {
    value: 1
  }
  const actions = {
    up: () => state => ({ value: state.value + 1 })
  }

  const store = app(initialState, actions)

  store.listen(state => {
    expect(state.value).toBe(2)
    done()
  })

  store.up()
  expect(initialState.value).toBe(1)
})

test('async updates', done => {
  const initialState = {
    value: 2
  }

  const actions = {
    up: data => state => ({ value: state.value + data }),
    upAsync: data => (state, actions) =>
      mockDelay().then(() => actions.up(data))
  }

  const store = app(initialState, actions)

  store.upAsync(1)

  expect(store.getState().value).toBe(2)

  store.listen(state => {
    expect(state.value).toBe(3)
    done()
  })
})

test('call action within action', done => {
  const initialState = {
    value: 1
  }

  const actions = {
    upAndFoo: () => (state, actions) => {
      actions.up()
      return {
        foo: true
      }
    },
    up: () => state => ({
      value: state.value + 1
    })
  }

  const store = app(initialState, actions)

  store.upAndFoo()

  expect(store.getState()).toEqual({
    value: 2,
    foo: true
  })

  done()
})
