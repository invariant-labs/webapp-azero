import { Route, createBrowserRouter, createRoutesFromElements } from 'react-router-dom'
import SwapPage from './SwapPage'
import ListPage from './ListPage'
import StatsPage from './Stats'
import RootPage from './RootPage'

export const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path='/' element={<RootPage />}>
      <Route path='/swap' element={<SwapPage />} />
      <Route path='/pool' element={<ListPage />} />
      <Route path='/stats' element={<StatsPage />} />
    </Route>
  )
)
