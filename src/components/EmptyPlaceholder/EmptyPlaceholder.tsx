import { Button, Grid, Typography } from '@mui/material'
import React from 'react'
import { useStyles } from './style'
import icons from '@static/icons'

export interface IEmptyPlaceholder {
  desc: string
  className?: string
  style?: React.CSSProperties
  buttonDesc?: string
  buttonAction?: () => void
}

export const EmptyPlaceholder: React.FC<IEmptyPlaceholder> = ({
  desc,
  buttonDesc,
  buttonAction
}) => {
  const { classes } = useStyles()

  return (
    <>
      <Grid className={classes.container}>
        <Grid className={classes.root}>
          <img className={classes.image} src={icons.empty} alt='empty' />
          <Typography className={classes.title}>It's empty here...</Typography>
          {desc?.length && <Typography className={classes.desc}>{desc}</Typography>}
          <Button className={classes.button} variant='contained' onClick={buttonAction}>
            {buttonDesc}
          </Button>
        </Grid>
      </Grid>
    </>
  )
}
