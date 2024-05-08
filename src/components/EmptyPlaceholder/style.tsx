import { colors, typography } from '@static/theme'
import { makeStyles } from 'tss-react/mui'

export const useStyles = makeStyles()(() => ({
  wrapper: {
    width: 300
  },
  image: {
    width: 160,
    height: 180
  },
  title: {
    ...typography.heading2,
    marginBlock: 24,
    color: colors.invariant.textGrey,
    opacity: 0.7
  },
  desc: {
    color: colors.invariant.textGrey,
    opacity: 0.7,
    ...typography.heading4,
    fontWeight: 400,
    textAlign: 'center'
  }
}))
