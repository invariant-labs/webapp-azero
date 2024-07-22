import { CircularProgress, Typography } from '@mui/material'
import { styled } from '@mui/system'
import { colors, theme, typography } from '@static/theme'
import { SnackbarContent } from 'notistack'

export const StyledSnackbarContent = styled(SnackbarContent)(({ theme }) => ({
  display: 'flex',
  position: 'relative',
  flexDirection: 'column',
  maxWidth: 330,
  width: 330,
  padding: '7px 16px',
  minWidth: 100,
  background: colors.invariant.component,
  borderRadius: 15,
  ...typography.body2,
  marginBottom: 5,

  '& .MuiCircularProgress-colorPrimary': {
    color: colors.invariant.textGrey
  },

  [theme.breakpoints.down('sm')]: {
    maxWidth: 'calc(100vw - 64px)',
    width: 'auto'
  }
}))

export const StyledBackground = styled('div')({
  position: 'absolute',
  width: '100%',
  height: '100%',
  left: 0,
  top: 2,
  transition: 'opacity 1s ease-in',
  background: `linear-gradient(to right, ${colors.invariant.green}, ${colors.invariant.pink})`,
  borderRadius: 17
})

export const StyledHideContainer = styled('div')({
  visibility: 'hidden',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  width: '100%',
  height: '100%',
  top: 0,
  left: 0,
  minHeight: 30,
  '& div > div': {
    margin: 0
  }
})

export const StyledContainer = styled('div')({
  position: 'absolute',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  background: colors.invariant.component,
  borderRadius: 15,
  width: '100%',
  height: '100%',
  top: 0,
  left: 0,
  minHeight: 30,

  '& div > div': {
    margin: 0
  }
})

export const StyledTitle = styled(Typography)({
  wordWrap: 'break-word',
  marginLeft: 8,
  color: colors.invariant.text,
  ...typography.body2
})

export const StyledCircularProgress = styled(CircularProgress)({
  color: colors.invariant.textGrey,
  display: 'flex',
  alignItems: 'center',

  '& SVG': {
    width: 13,
    height: 13,
    minWidth: 13
  }
})

export const StyledCloseButton = styled('button')({
  backgroundColor: 'transparent',
  border: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',

  width: 'fit-content',
  cursor: 'pointer',
  marginRight: 10,
  '&:hover': {
    '& img': {
      transition: '.2s all ease-in',
      transform: 'scale(1.2)'
    }
  }
})

export const StyledIcon = styled('div')({
  display: 'flex',
  '& svg': {
    maxWidth: 16,
    margin: 0,
    marginInlineEnd: '0 !important'
  }
})

export const StyledDetails = styled('button')({
  height: 30,
  backgroundColor: 'transparent',
  textTransform: 'uppercase',
  borderRadius: 6,
  border: 'none',
  color: colors.invariant.textGrey,
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
  transition: '0.2s all cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  backfaceVisibility: 'hidden',
  fontSmoothing: 'subpixel-antialiased',
  padding: '0 4px',
  '&:hover': {
    transform: 'scale(1.15) translateY(0px)'
  },
  [theme.breakpoints.down('sm')]: {
    width: 36,
    height: 16,
    fontSize: 9,
    lineHeight: '14px',
    marginTop: 2,
    marginRight: 8,
    paddingBottom: 17,
    paddingRight: 36
  },
  display: 'inline-block',
  paddingRight: 40,
  marginLeft: 10,
  '& *': {
    width: 'auto !important'
  }
})
