import { colors, typography } from '@static/theme'
import { makeStyles } from 'tss-react/mui'

export const useTabsStyles = makeStyles<{ value: number }>()((_theme, { value }) => ({
  root: {
    overflow: 'visible',
    height: 28,
    minHeight: 28,
    borderRadius: 9,
    width: 160,
    backgroundColor: colors.invariant.black,

    [_theme.breakpoints.down('xs')]: {
      width: 90
    }
  },
  indicator: {
    height: 28,
    borderRadius: 9,
    background:
      value === 0 ? colors.invariant.greenLinearGradient : colors.invariant.pinkLinearGradient
  },
  scrollable: {
    overflow: 'hidden'
  },
  flexContainer: {
    justifyContent: 'space-between'
  }
}))

export const useSingleTabStyles = makeStyles()(theme => {
  return {
    root: {
      textTransform: 'none',
      zIndex: 1,
      height: 28,
      minHeight: 28,
      paddingInline: 0,
      minWidth: 80,
      width: 80,
      ...typography.caption2,
      color: colors.invariant.light,
      transition: 'color 300ms',

      '&:hover': {
        color: colors.invariant.lightHover
      },

      [theme.breakpoints.down('xs')]: {
        minWidth: 45,
        width: 45
      }
    },
    selected: {
      ...typography.caption1,
      color: colors.invariant.black + ' !important',

      '&:hover': {
        color: colors.invariant.black
      }
    }
  }
})
