import { Grid } from '@mui/material'
import { useStyles } from './styles'
import WrappedStats from '@containers/WrappedStats/WrappedStats'

export const StatsPage: React.FC = () => {
  const { classes } = useStyles()

  return (
    <Grid container className={classes.container}>
      <WrappedStats />
    </Grid>
  )
}

export default StatsPage
