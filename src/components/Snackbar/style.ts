import { styled } from '@mui/material'
import { colors, typography } from '@static/theme'

import { MaterialDesignContent } from 'notistack'

export const StyledMaterialDesignContent = styled(MaterialDesignContent)(({ theme }) => ({
  '&.notistack-MuiContent-success': {
    borderColor: colors.invariant.component,
    ...typography.body2,
    maxWidth: '100vw',
    width: 330,
    padding: '4px 16px',
    minWidth: 100,
    marginBottom: 3,
    position: 'relative',
    overflow: 'hidden',
    background: colors.invariant.component,
    borderRadius: 15,

    '&::after': {
      content: '""',
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 2,
      // borderBottomLeftRadius: 15,
      // borderBottomRightRadius: 15,
      background: `linear-gradient(to right, ${colors.invariant.green}, ${colors.invariant.pink})`
    },

    '& > div:first-of-type': {
      flex: 1
    },

    '& SVG': {
      fontSize: '16px !important',
      color: colors.invariant.green,
      marginTop: -2,
      [theme.breakpoints.down('sm')]: {
        marginTop: 2
      }
    },
    [theme.breakpoints.down('sm')]: {
      maxWidth: 'calc(100vw - 64px)',
      width: 'auto'
    }
  },
  '&.notistack-MuiContent-error': {
    borderColor: colors.invariant.component,
    ...typography.body2,
    maxWidth: '100vw',
    width: 330,
    padding: '4px 16px',
    minWidth: 100,
    marginBottom: 3,
    position: 'relative',
    overflow: 'hidden',
    background: colors.invariant.component,
    borderRadius: 15,

    '&::after': {
      content: '""',
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 2,
      // borderBottomLeftRadius: 15,
      // borderBottomRightRadius: 15,
      background: `linear-gradient(to right, ${colors.invariant.green}, ${colors.invariant.pink})`
    },

    '& > div:first-of-type': {
      flex: 1
    },

    '& SVG': {
      fontSize: '16px !important',
      color: colors.invariant.Error,
      marginTop: -2,
      [theme.breakpoints.down('sm')]: {
        marginTop: 2
      }
    },
    [theme.breakpoints.down('sm')]: {
      maxWidth: 'calc(100vw - 64px)',
      width: 'auto'
    }
  },
  '&.notistack-MuiContent-info': {
    borderColor: colors.invariant.component,
    ...typography.body2,
    maxWidth: '100vw',
    width: 330,
    padding: '4px 16px',
    minWidth: 100,
    marginBottom: 3,
    position: 'relative',
    overflow: 'hidden',
    background: colors.invariant.component,
    borderRadius: 15,

    '&::after': {
      content: '""',
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 2,
      // borderBottomLeftRadius: 15,
      // borderBottomRightRadius: 15,
      background: `linear-gradient(to right, ${colors.invariant.green}, ${colors.invariant.pink})`
    },

    '& > div:first-of-type': {
      flex: 1
    },

    '& SVG': {
      fontSize: '16px !important',
      color: colors.invariant.textGrey,
      marginTop: -2,
      [theme.breakpoints.down('sm')]: {
        marginTop: 2
      }
    },
    [theme.breakpoints.down('sm')]: {
      maxWidth: 'calc(100vw - 64px)',
      width: 'auto'
    }
  },
  '&.notistack-MuiContent-warning': {
    borderColor: colors.invariant.component,
    ...typography.body2,
    maxWidth: '100vw',
    width: 330,
    padding: '4px 16px',
    minWidth: 100,
    marginBottom: 3,
    position: 'relative',
    overflow: 'hidden',
    background: colors.invariant.component,
    borderRadius: 15,

    '&::after': {
      content: '""',
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 2,
      // borderBottomLeftRadius: 15,
      // borderBottomRightRadius: 15,
      background: `linear-gradient(to right, ${colors.invariant.green}, ${colors.invariant.pink})`
    },

    '& > div:first-of-type': {
      flex: 1
    },

    '& SVG': {
      fontSize: '16px !important',
      color: colors.invariant.warning,
      marginTop: -2,
      [theme.breakpoints.down('sm')]: {
        marginTop: 2
      }
    },
    [theme.breakpoints.down('sm')]: {
      maxWidth: 'calc(100vw - 64px)',
      width: 'auto'
    }
  }
}))
