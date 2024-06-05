import { Grid } from '@mui/material'
import workInProgress from '../../static/png/work-in-progress.png'
import { useStyles } from './styles'

export const StatsPage: React.FC = () => {
  const { classes } = useStyles()

  return (
    <Grid container className={classes.container}>
      <img className={classes.workInProgress} src={workInProgress} alt='Work in progress icon' />
    </Grid>
  )
}

export default StatsPage
