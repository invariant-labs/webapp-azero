import React from 'react'
import { theme } from '@static/theme'
import { useSingleTabStyles, useTabsStyles } from './style'
import { Tab, Tabs, useMediaQuery } from '@mui/material'

export interface IProps {
  onSwitch: (isConcentrated: boolean) => void
  className?: string
  style?: React.CSSProperties
  disabled?: boolean
  currentValue: number
}

export const ConcentrationTypeSwitch: React.FC<IProps> = ({
  onSwitch,
  className,
  style,
  disabled = false,
  currentValue
}) => {
  const isXs = useMediaQuery(theme.breakpoints.down('sm'))

  const { classes: tabsClasses } = useTabsStyles({ value: currentValue })
  const { classes: singleTabClasses } = useSingleTabStyles()

  const handleChange = (_: React.SyntheticEvent, newValue: number) => {
    onSwitch(!newValue)
  }

  return (
    <Tabs
      className={className}
      style={style}
      value={currentValue}
      onChange={!disabled ? handleChange : undefined}
      variant='scrollable'
      scrollButtons={false}
      classes={tabsClasses}>
      <Tab
        disableRipple
        label={isXs ? 'Conc.' : 'Concentr.'}
        classes={singleTabClasses}
        style={{ cursor: !disabled ? 'pointer' : 'default' }}
      />
      <Tab
        disableRipple
        label='Range'
        classes={singleTabClasses}
        style={{ cursor: !disabled ? 'pointer' : 'default' }}
      />
    </Tabs>
  )
}

export default ConcentrationTypeSwitch
