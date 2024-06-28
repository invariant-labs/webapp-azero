import EventsHandlers from '@containers/EventHandlers/index'
import FooterWrapper from '@containers/FooterWrapper'
import HeaderWrapper from '@containers/HeaderWrapper/HeaderWrapper'
import { Grid } from '@mui/material'
import { Status, actions as alephZeroConnectionActions } from '@store/reducers/connection'
import { status as connectionStatus } from '@store/selectors/connection'
import { toBlur } from '@utils/uiUtils'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import useStyles from './style'

const RootPage: React.FC = () => {
  const dispatch = useDispatch()
  const signerStatus = useSelector(connectionStatus)

  const navigate = useNavigate()
  const location = useLocation()

  const { classes } = useStyles()

  useEffect(() => {
    if (location.pathname === '/') {
      navigate('/swap')
    }
    // dispatch(providerActions.initProvider())
    dispatch(alephZeroConnectionActions.initAlephZeroConnection())
  }, [dispatch])

  return (
    <>
      {signerStatus === Status.Initialized && <EventsHandlers />}
      <div id={toBlur}>
        <Grid className={classes.root}>
          <HeaderWrapper />
          <Grid className={classes.body}>
            <Outlet />
          </Grid>
          <FooterWrapper />
        </Grid>
      </div>
    </>
  )
}

export default RootPage
