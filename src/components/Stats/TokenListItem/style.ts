import { Theme } from '@mui/material'
import { typography, colors } from '@static/theme'
import { makeStyles } from 'tss-react/mui'

export const useStyles = makeStyles()((theme: Theme) => ({
  container: {
    display: 'grid',
    gridTemplateColumns: '5% 35% 20% 20% 20%',
    padding: '18px 0 ',
    backgroundColor: colors.invariant.component,
    borderBottom: `1px solid ${colors.invariant.light}`,
    whiteSpace: 'nowrap',

    [theme.breakpoints.down('sm')]: {
      gridTemplateColumns: '30% 22.5% 32.5% 15%',
      '& p': {
        ...typography.caption1
      }
    }
  },

  tokenList: {
    color: colors.white.main,
    '& p': {
      ...typography.heading4
    },

    [theme.breakpoints.down('sm')]: {
      '& p': {
        ...typography.caption1
      }
    }
  },

  header: {
    '& p': {
      ...typography.heading4,
      fontWeight: 400,
      display: 'flex',
      justifyContent: 'start',
      alignItems: 'center'
    },
    [theme.breakpoints.down('sm')]: {
      '& p': {
        ...typography.caption2
      }
    }
  },

  tokenName: {
    display: 'flex',
    alignItems: 'center',
    paddingRight: 5,

    '& p': {
      overflow: 'hidden',
      whiteSpace: 'nowrap',
      textOverflow: 'ellipsis'
    },

    '& img': {
      minWidth: 28,
      maxWidth: 28,
      height: 28,
      marginRight: 8,
      borderRadius: '50%'
    }
  },

  tokenSymbol: {
    color: colors.invariant.textGrey,
    fontWeight: 400
  },
  icon: {
    [theme.breakpoints.down('sm')]: {
      marginLeft: -4
    }
  }
}))
