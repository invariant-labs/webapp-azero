import FooterWrapper from '@containers/FooterWrapper'
import HeaderWrapper from '@containers/HeaderWrapper'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Outlet, useNavigate } from 'react-router-dom'
import { actions as alephZeroConnectionActions } from '@store/reducers/connection'
import { status as connectionStatus } from '@store/selectors/connection'
import { status } from '@store/selectors/wallet'
import { Status } from '@store/reducers/connection'
import { Status as WalletStatus } from '@store/reducers/wallet'

const RootPage: React.FC = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const signerStatus = useSelector(connectionStatus)
  const walletStatus = useSelector(status)

  useEffect(() => {
    // dispatch(providerActions.initProvider())
    dispatch(alephZeroConnectionActions.initAlephZeroConnection())
  }, [dispatch])

  useEffect(() => {
    if (signerStatus === Status.Initialized && walletStatus === WalletStatus.Initialized) {
      // dispatch(actions.getPositionsList())
    }
  }, [signerStatus, walletStatus])

  useEffect(() => {
    navigate('/swap')
  }, [])
  return (
    <>
      <HeaderWrapper />
      <Outlet />
      <FooterWrapper />
    </>
  )
}

export default RootPage
