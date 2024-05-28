import createSagaMiddleware from 'redux-saga'

import { configureStore, isPlain } from '@reduxjs/toolkit'

import combinedReducers from './reducers'
import rootSaga from './sagas'

const isSerializable = (value: any) => {
  return typeof value === 'bigint' || isPlain(value)
}
const getEntries = (value: any) => {
  return typeof value === 'bigint'
    ? [['bigint', value.toString()] as [string, any]]
    : Object.entries(value)
}

const configureAppStore = (initialState = {}) => {
  const reduxSagaMonitorOptions = {}
  const sagaMiddleware = createSagaMiddleware(reduxSagaMonitorOptions)

  const middleware = [sagaMiddleware]

  const store = configureStore({
    reducer: combinedReducers,
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({
        serializableCheck: {
          isSerializable,
          getEntries,
          ignoredActions: ['positions/closePosition', 'pools/setTickMaps']
        }
      }).concat(middleware),
    preloadedState: initialState,
    // devTools: process.env.NODE_ENV !== "production",
    devTools: {
      serialize: {
        replacer: (_key, value) => (typeof value === 'bigint' ? value.toString() : value),
        options: true
      }
    }
  })

  sagaMiddleware.run(rootSaga)
  return store
}

export const store = configureAppStore()

export type AppDispatch = typeof store.dispatch
export type RootState = ReturnType<typeof store.getState>
