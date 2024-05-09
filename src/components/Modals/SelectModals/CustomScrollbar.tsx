import React from 'react'
import { Scrollbars } from 'rc-scrollbars'
import useStyles from './style'

export interface IProps {
  onScroll?: (e: React.UIEvent<HTMLElement>) => void
  ref?: React.LegacyRef<Scrollbars>
  style?: React.CSSProperties
  children: React.ReactNode
}

export const CustomScrollbar: React.FC<IProps> = props => {
  const { classes } = useStyles()

  return (
    <Scrollbars
      autoHide
      autoHideDuration={200}
      autoHideTimeout={200}
      renderThumbVertical={() => {
        return <div className={classes.scrollbarThumb} />
      }}
      renderTrackVertical={() => {
        return <div className={classes.scrollbarTrack} />
      }}
      className={classes.hideScroll}
      {...props}>
      {props.children}
    </Scrollbars>
  )
}

export default CustomScrollbar
