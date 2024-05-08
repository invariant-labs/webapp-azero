import { Route, createBrowserRouter, createRoutesFromElements } from 'react-router-dom'
import SwapPage from './SwapPage'
import StatsPage from './Stats'
import RootPage from './RootPage'
import ListPage from './ListPage'
import NewPositionPage from './NewPositionPage'

export const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path='/' element={<RootPage />}>
      <Route path='/swap' element={<SwapPage />} />
      <Route path='/pool' element={<ListPage />} />
      <Route path='/stats' element={<StatsPage />} />
      <Route path='/newPosition/:item1?/:item2?/:item3?' element={<NewPositionPage />} />
    </Route>
  )
)
