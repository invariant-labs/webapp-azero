import { colors, typography } from '@static/theme'
import { makeStyles } from 'tss-react/mui'

export const useThumbStyles = makeStyles()(() => {
  return {
    root: {
      width: 60,
      position: 'absolute',
      top: -26,
      transform: 'translateX(-30px)',
      outline: 'none'
    },
    labelWrapper: {
      width: 60,
      height: 20,
      borderRadius: 7,
      background: colors.invariant.light,
      marginBottom: 8
    },
    label: {
      color: colors.invariant.text,
      ...typography.caption1,
      textAlign: 'center'
    },
    outerCircle: {
      background: colors.invariant.pinkLinearGradient,
      width: 28,
      height: 28,
      borderRadius: '100%',
      padding: 6,
      boxSizing: 'border-box'
    },
    innerCircle: {
      background: 'linear-gradient(180deg, #FFFFFF 0%, #A2A2A2 100%)',
      width: 16,
      height: 16,
      borderRadius: '100%'
    }
  }
})

export const useSliderStyles = makeStyles<{ valuesLength: number; disabledRange: number }>()(
  (_theme, { disabledRange, valuesLength }) => ({
    root: {
      width: '100%',
      paddingBlock: 13
    },
    rail: {
      background:
        disabledRange > 0
          ? `linear-gradient(90deg, ${colors.invariant.lightGrey} 0%, ${
              colors.invariant.lightGrey
            } ${disabledRange}%, ${colors.invariant.green} ${disabledRange + 1}%, ${
              colors.invariant.green
            } 100%)`
          : colors.invariant.green,
      height: 6,
      opacity: 1
    },
    track: {
      background: colors.invariant.lightGrey,
      height: 6
    },
    markLabel: {
      color: colors.invariant.text,
      ...typography.body1,
      marginTop: 10,
      top: 26,

      '&[data-index="0"]': {
        transform: 'translateX(-30%)'
      },

      [`&[data-index="${valuesLength - 1}"]`]: {
        transform: 'translateX(-90%)'
      }
    },
    mark: {
      display: 'none',

      [`&[data-index="${valuesLength - 1}"], &[data-index="0"]`]: {
        display: 'block',
        width: 14,
        height: 14,
        borderRadius: '100%',
        transform: 'translate(-6px, -4px)'
      },

      '&[data-index="0"]': {
        background: disabledRange > 0 ? colors.invariant.lightGrey : colors.invariant.green
      },

      [`&[data-index="${valuesLength - 1}"]`]: {
        background: colors.invariant.green
      }
    }
  })
)
