import { Theme } from '@mui/material'
import { colors } from '@static/theme'
import { makeStyles } from 'tss-react/mui'

const useStyles = makeStyles()((theme: Theme) => {
  return {
    root: {
      margin: 'auto',
      maxWidth: 1920,
      paddingInline: 150,
      height: 70,

      [theme.breakpoints.down('xl')]: {
        paddingInline: 32
      },

      [theme.breakpoints.down('lg')]: {
        paddingInline: 24
      },

      [theme.breakpoints.down('sm')]: {
        paddingInline: 16
      }
    },
    logo: {
      minWidth: 150,
      height: 40,

      '&:hover': {
        cursor: 'pointer'
      }
    },
    logoShort: {
      minWidth: 40,
      height: 30,
      marginRight: 8,

      '&:hover': {
        cursor: 'pointer'
      }
    },
    routers: {
      backgroundColor: colors.invariant.black,
      borderRadius: '10px',
      transition: 'left 300ms',
      width: 'fit-content',
      margin: '0 10px 0 10px'
    },
    connectedWalletIcon: {
      minWidth: 21,
      height: 21,
      marginRight: 0,
      color: colors.invariant.green,
      '& >circle': {
        boxShadow: '0px 0px 10px rgba(157, 212, 109, 0.5)'
      }
    },
    buttons: {
      justifyContent: 'flex-end',
      flex: '1 1 0%',

      [theme.breakpoints.up('lg')]: {
        minWidth: 350
      },

      [theme.breakpoints.only('md')]: {
        minWidth: 350
      },

      [theme.breakpoints.down('md')]: {
        marginLeft: 0
      },

      [theme.breakpoints.down('md')]: {
        justifyContent: 'center'
      }
    },
    buttonsLgConnected: {
      [theme.breakpoints.up('lg')]: {
        minWidth: 433
      }
    },
    link: {
      textDecoration: 'none',
      minWidth: 'fit-content'
    },
    menu: {
      width: 40,
      height: 25,
      transition: 'filter 300ms'
    },
    menuButton: {
      borderRadius: 10,
      paddingInline: 6,
      paddingBlock: 1,
      height: 45,
      transition: 'background 300ms',
      marginLeft: 8,
      '&:hover': {
        background: 'transparent'
      },
      '&:hover $menu': {
        filter: 'brightness(2)'
      }
    },
    leftSide: {
      flex: '1 1 0%'
    }
  }
})

export default useStyles
