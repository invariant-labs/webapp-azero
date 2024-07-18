import { colors, typography } from '@static/theme'
import { makeStyles } from 'tss-react/mui'

export const useStyles = makeStyles()(() => ({
  wrapper: {
    width: 300
  },
  image: {
    height: 75
  },
  title: {
    marginTop: 28,
    ...typography.heading3,
    color: colors.white.main
  },
  desc: {
    maxWidth: 270,
    marginTop: 12,
    color: colors.invariant.textGrey,
    ...typography.heading4,
    fontWeight: 400,
    textAlign: 'center'
  },
  button: {
    height: 40,
    width: 200,
    marginTop: 48,
    color: colors.invariant.componentBcg,
    ...typography.body1,
    textTransform: 'none',
    borderRadius: 14,
    background: colors.invariant.pinkLinearGradientOpacity,

    '&:hover': {
      background: colors.invariant.pinkLinearGradient,
      boxShadow: '0px 0px 16px rgba(239, 132, 245, 0.35)'
    }
  },
  container: {
    width: '100%',
    height: 370,
    borderRadius: 24,
    backgroundColor: colors.invariant.black
  },
  root: {
    width: 'fit-content',
    height: '100%',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  }
}))
