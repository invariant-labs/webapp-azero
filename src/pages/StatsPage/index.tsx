import { Grid } from '@mui/material'
import { useStyles } from './styles'
// import workInProgress from '../../static/png/work-in-progress.png'
import WrappedStats from '@containers/WrappedStats/WrappedStats'
// import WrappedStats from '@containers/WrappedStats/WrappedStats'

export const StatsPage: React.FC = () => {
  const { classes } = useStyles()

  return (
    <Grid container className={classes.container}>
      {/* <img src={workInProgress} alt='Work in progress icon' /> */}
      <WrappedStats />
    </Grid>
  )
}

export default StatsPage
