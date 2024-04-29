import WrappedPositionsList from '@containers/WrappedPositionsList/WrappedPositionsList'
import { Grid } from '@mui/material'
import useStyles from './styles'

export const ListPage: React.FC = () => {
  const { classes } = useStyles()
  return (
    <Grid container className={classes.container}>
      <WrappedPositionsList />
    </Grid>
  )
}
