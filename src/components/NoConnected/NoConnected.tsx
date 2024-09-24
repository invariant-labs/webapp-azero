import { Button, Grid, Typography } from '@mui/material'
import icons from '@static/icons'
import classNames from 'classnames'
import { useStyles } from './style'
import { useNavigate } from 'react-router-dom'

export interface INoConnected {
  onConnect: () => void
  descCustomText?: string
}

export const NoConnected: React.FC<INoConnected> = ({ onConnect, descCustomText }) => {
  const { classes } = useStyles()

  const navigate = useNavigate()

  return (
    <>
      <Grid className={classNames(classes.blur, 'blurLayer')} />
      <Grid className={classNames(classes.container, 'blurLayer')}>
        <Grid className={classNames(classes.root, 'blurInfo')}>
          <img className={classes.img} src={icons.NoConnected} alt='Not connected' />
          <Typography className={classes.desc}>
            Start exploring liquidity pools right now!
          </Typography>

          {descCustomText?.length && (
            <Typography className={classes.desc}>
              Or, connect your wallet to see existing positions, and create a new one!
            </Typography>
          )}
          <Button
            className={classes.buttonPrimary}
            onClick={() => {
              navigate('/newPosition/0_01')
            }}
            variant='contained'>
            Explore pools
          </Button>

          <Button className={classes.buttonSecondary} onClick={onConnect} variant='contained'>
            Connect wallet
          </Button>
        </Grid>
      </Grid>
    </>
  )
}
