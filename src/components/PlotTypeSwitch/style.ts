import { colors } from '@static/theme'
import { makeStyles } from 'tss-react/mui'

export const useStyles = makeStyles()(() => ({
  continuous: {
    display: 'block',
    width: 29
  },
  discrete: {
    display: 'block',
    width: 22
  }
}))

export const useTabsStyles = makeStyles()(() => ({
  root: {
    overflow: 'visible',
    height: 26,
    minHeight: 26,
    borderRadius: 9,
    width: 92,
    backgroundColor: colors.invariant.black
  },
  indicator: {
    height: 26,
    borderRadius: 9,
    backgroundColor: colors.invariant.light
  },
  scrollable: {
    overflow: 'hidden'
  },
  flexContainer: {
    justifyContent: 'space-between'
  }
}))

export const useSingleTabStyles = makeStyles()(() => ({
  root: {
    zIndex: 1,
    height: 26,
    minHeight: 26,
    paddingInline: 0,
    minWidth: 46,
    width: 46,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,

    '& img': {
      minHeight: 'auto'
    },

    '&:hover': {
      backgroundColor: `${colors.invariant.light}B0`,
      height: 26,
      borderRadius: 9
    }
  }
}))
