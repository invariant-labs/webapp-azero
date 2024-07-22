import { Button, Grid, Typography } from '@mui/material'
import classNames from 'classnames'
import React from 'react'
import { useStyles } from './style'
import icons from '@static/icons'

export interface IEmptyPlaceholder {
  desc: string
  onAction?: () => void
  className?: string
  style?: React.CSSProperties
}

export const EmptyPlaceholder: React.FC<IEmptyPlaceholder> = ({ desc, onAction }) => {
  const { classes } = useStyles()

  return (
    <>
      <Grid className={classNames(classes.blur, 'noConnectedLayer')} />
      <Grid className={classNames(classes.container, 'noConnectedLayer')}>
        <Grid className={classNames(classes.root, 'noConnectedInfo')}>
          <img className={classes.img} src={icons.empty} alt='Not connected' />
          <Typography className={classes.desc}>It's empty here...</Typography>
          {desc?.length && <Typography className={classes.desc}>{desc}</Typography>}
          <Button className={classes.button} onClick={onAction} variant='contained'>
            Add a position
          </Button>
        </Grid>
      </Grid>
    </>
    // <Grid
    //   container
    //   direction='column'
    //   alignItems='center'
    //   className={classNames(classes.wrapper, className)}
    //   style={style}>
    //   <img src={icons.empty} className={classes.image} alt='empty' />
    //   <Typography className={classes.title}>It's empty here...</Typography>
    //   <Typography className={classes.desc}>{desc}</Typography>
    // </Grid>
  )
}
