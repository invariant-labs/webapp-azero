import createSagaMiddleware from 'redux-saga'

import { configureStore } from '@reduxjs/toolkit'

import combinedReducers from './reducers'
import rootSaga from './sagas'

const configureAppStore = (initialState = {}) => {
  const reduxSagaMonitorOptions = {}
  const sagaMiddleware = createSagaMiddleware(reduxSagaMonitorOptions)

  const middleware = [sagaMiddleware]

  const store = configureStore({
    reducer: combinedReducers,
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({
        // serializableCheck: false //Find better solution to fix serializable check error
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
