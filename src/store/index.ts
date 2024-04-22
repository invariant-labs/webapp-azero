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
    middleware: getDefaultMiddleware => getDefaultMiddleware().concat(middleware),
    preloadedState: initialState,
    // devTools: process.env.NODE_ENV !== "production",
    devTools: true
  })

  sagaMiddleware.run(rootSaga)
  return store
}

export const store = configureAppStore()

export type AppDispatch = typeof store.dispatch
export type RootState = ReturnType<typeof store.getState>
