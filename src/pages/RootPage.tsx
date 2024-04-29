import FooterWrapper from '@containers/FooterWrapper'
import HeaderWrapper from '@containers/HeaderWrapper'
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { Outlet, useNavigate } from 'react-router-dom'
import { actions as alephZeroConnectionActions } from '@store/reducers/connection'
// import { status } from '@store/selectors/connection'
// import { Status } from '@store/reducers/connection'

const RootPage: React.FC = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  // const signerStatus = useSelector(solanaConnectionSelector.status)
  // const walletStatus = useSelector(status)

  useEffect(() => {
    // dispatch(providerActions.initProvider())
    dispatch(alephZeroConnectionActions.initAlephZeroConnection())
  }, [dispatch])

  // useEffect(() => {
  //   if (signerStatus === Status.Initialized && walletStatus === WalletStatus.Initialized) {
  //     dispatch(actions.getPositionsList())
  //   }
  // }, [signerStatus, walletStatus])

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
