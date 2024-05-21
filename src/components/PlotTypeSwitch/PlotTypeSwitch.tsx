import { Tab, Tabs } from '@mui/material'
import Continuous from '@static/svg/continuous.svg'
import Discrete from '@static/svg/discrete.svg'
import React, { useState } from 'react'
import { useSingleTabStyles, useStyles, useTabsStyles } from './style'

export interface IPlotTypeSwitch {
  onSwitch: (isDiscrete: boolean) => void
  initialValue: number
}

export const PlotTypeSwitch: React.FC<IPlotTypeSwitch> = ({ onSwitch, initialValue }) => {
  const [current, setCurrent] = useState(initialValue)

  const { classes } = useStyles()
  const { classes: tabsClasses } = useTabsStyles()
  const { classes: singleTabClasses } = useSingleTabStyles()

  const handleChange = (_: React.ChangeEvent<{}>, newValue: number) => {
    setCurrent(newValue)
    onSwitch(!!newValue)
  }

  return (
    <Tabs
      value={current}
      onChange={handleChange}
      variant='scrollable'
      scrollButtons={false}
      TabIndicatorProps={{ children: <span /> }}
      classes={tabsClasses}>
      <Tab
        disableRipple
        label={
          <div>
            <img src={Continuous} className={classes.continuous} />
          </div>
        }
        classes={singleTabClasses}
      />
      <Tab
        disableRipple
        label={
          <div>
            <img src={Discrete} className={classes.discrete} />
          </div>
        }
        classes={singleTabClasses}
      />
    </Tabs>
  )
}

export default PlotTypeSwitch
