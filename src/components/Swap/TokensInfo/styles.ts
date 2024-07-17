import { colors, typography } from '@static/theme'
import { makeStyles } from 'tss-react/mui'

export const useStyles = makeStyles()(theme => ({
  wrapper: {
    margin: '0px 0 24px',
    borderRadius: 16,
    border: `1px solid ${colors.invariant.light}`,
    padding: '8px 12px',

    [theme.breakpoints.down('sm')]: {
      flexDirection: 'column'
    }
  },
  token: {
    display: 'flex',
    justifyContent: 'flex-start',
    flex: 1,
    width: '100%'
  },
  divider: {
    width: 1,
    height: '100%',
    backgroundColor: colors.invariant.light,
    margin: '0 24px',
    [theme.breakpoints.down('sm')]: {
      height: 1,
      width: '100%',
      margin: '8px 0'
    }
  },
  tokenIcon: {
    minWidth: 30,
    maxWidth: 30,
    height: 30,
    marginRight: 8,
    borderRadius: '50%',
    boxShadow: '0px 0px 10px rgba(216, 255, 181, 0.5)'
  },
  tokenName: {
    color: colors.white.main,
    ...typography.body1,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  tokenAddress: {
    backgroundColor: colors.invariant.newDark,
    borderRadius: 4,
    padding: '2px 4px',
    display: 'flex',
    flexWrap: 'nowrap',
    alignItems: 'center',

    '& p': {
      color: colors.invariant.textGrey,
      ...typography.caption4
    }
  },
  tokenDescription: {
    color: colors.invariant.textGrey,
    ...typography.caption4,
    lineHeight: '16px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  price: {
    color: colors.invariant.text,
    ...typography.body1,
    whiteSpace: 'nowrap'
  },
  rightItems: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-end'
  },
  clipboardIcon: {
    display: 'inline-block',
    width: 15,
    height: 13,
    marginLeft: 2,
    color: colors.invariant.textGrey,
    cursor: 'pointer',
    '&:hover': {
      filter: 'brightness(1.2)'
    }
  },
  link: {
    transform: 'translateY(-2px)',
    '&:hover': {
      filter: 'brightness(1.2)'
    }
  }
}))
