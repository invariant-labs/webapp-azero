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
    background: `linear-gradient(${colors.invariant.component},${colors.invariant.component} ) padding-box,
    linear-gradient(to right, ${colors.invariant.green}, ${colors.invariant.pink}) border-box`,
    backgroundColor: colors.invariant.component,
    borderStyle: 'solid',
    borderRadius: 15,
    border: `0px solid transparent`,
    borderBottomWidth: 2,
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
    background: `linear-gradient(${colors.invariant.component},${colors.invariant.component} ) padding-box,
    linear-gradient(to right, ${colors.invariant.green}, ${colors.invariant.pink}) border-box`,
    backgroundColor: colors.invariant.component,
    borderStyle: 'solid',
    borderRadius: 15,
    border: `0px solid transparent`,
    borderBottomWidth: 2,

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
    background: `linear-gradient(${colors.invariant.component},${colors.invariant.component} ) padding-box,
    linear-gradient(to right, ${colors.invariant.green}, ${colors.invariant.pink}) border-box`,
    backgroundColor: colors.invariant.component,
    borderStyle: 'solid',
    borderRadius: 15,
    border: `0px solid transparent`,
    borderBottomWidth: 2,

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
    background: `linear-gradient(${colors.invariant.component},${colors.invariant.component} ) padding-box,
    linear-gradient(to right, ${colors.invariant.green}, ${colors.invariant.pink}) border-box`,
    backgroundColor: colors.invariant.component,
    borderStyle: 'solid',
    borderRadius: 15,
    border: `0px solid transparent`,
    borderBottomWidth: 2,

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
