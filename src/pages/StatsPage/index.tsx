import { Grid } from '@mui/material'
import { useStyles } from './styles'
import comingSoon from '../../static/png/coming-soon.png'
// import WrappedStats from '@containers/WrappedStats/WrappedStats'

export const StatsPage: React.FC = () => {
  const { classes } = useStyles()

  return (
    <Grid container className={classes.container}>
      <img src={comingSoon} alt='Coming soon' />
      {/* <WrappedStats /> */}
    </Grid>
  )
}

export default StatsPage
