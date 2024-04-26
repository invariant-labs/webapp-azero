import { Grid, Typography } from '@mui/material'
import empty from '@static/svg/empty.svg'
import classNames from 'classnames'
import React from 'react'
import { useStyles } from './style'

export interface IEmptyPlaceholder {
  desc: string
  className?: string
  style?: React.CSSProperties
}

export const EmptyPlaceholder: React.FC<IEmptyPlaceholder> = ({ desc, className, style }) => {
  const { classes } = useStyles()

  return (
    <Grid
      container
      direction='column'
      alignItems='center'
      className={classNames(classes.wrapper, className)}
      style={style}>
      <img src={empty} className={classes.image} />
      <Typography className={classes.title}>It's empty here...</Typography>
      <Typography className={classes.desc}>{desc}</Typography>
    </Grid>
  )
}
