import { Button, Grid, Typography } from '@mui/material'
import icons from '@static/icons'
import { useStyles } from './style'

export interface INoConnected {
  onConnect: () => void
  descCustomText?: string
}

export const NoConnected: React.FC<INoConnected> = ({ onConnect, descCustomText }) => {
  const { classes } = useStyles()

  return (
    <Grid className={classes.container}>
      <Grid className={classes.root}>
        <img className={classes.image} src={icons.NoConnected} alt='empty' />
        {descCustomText?.length && (
          <Typography className={classes.desc}>{descCustomText}</Typography>
        )}
        <Button className={classes.button} variant='contained' onClick={onConnect}>
          Connect a wallet
        </Button>
      </Grid>
    </Grid>
  )
}
