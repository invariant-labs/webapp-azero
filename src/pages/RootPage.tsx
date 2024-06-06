import EventsHandlers from '@containers/EventHandlers/index'
import FooterWrapper from '@containers/FooterWrapper'
import HeaderWrapper from '@containers/HeaderWrapper/HeaderWrapper'
import { Status, actions as alephZeroConnectionActions } from '@store/reducers/connection'
import { actions } from '@store/reducers/positions'
import { Status as WalletStatus } from '@store/reducers/wallet'
import { status as connectionStatus } from '@store/selectors/connection'
import { address, status } from '@store/selectors/wallet'
import { toBlur } from '@utils/uiUtils'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'

const RootPage: React.FC = () => {
  const dispatch = useDispatch()
  const signerStatus = useSelector(connectionStatus)
  const walletStatus = useSelector(status)
  const walletAddress = useSelector(address)

  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (location.pathname === '/') {
      navigate('/swap')
    }
    // dispatch(providerActions.initProvider())
    dispatch(alephZeroConnectionActions.initAlephZeroConnection())
  }, [dispatch])

  useEffect(() => {
    if (
      signerStatus === Status.Initialized &&
      walletStatus === WalletStatus.Initialized &&
      walletAddress
    ) {
      dispatch(actions.getPositionsList())
    }
  }, [signerStatus, walletStatus, walletAddress])

  return (
    <>
      {signerStatus === Status.Initialized && <EventsHandlers />}
      <div id={toBlur}>
        <HeaderWrapper />
        <Outlet />
        <FooterWrapper />
      </div>
    </>
  )
}

export default RootPage
