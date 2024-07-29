import { makeStyles } from 'tss-react/mui'
import { colors, typography } from '@static/theme'

const useStyles = makeStyles()(() => {
  return {
    tooltip: {
      color: colors.invariant.textGrey,
      ...typography.caption4,
      lineHeight: '24px',
      background: colors.black.full,
      borderRadius: 12,
      height: 24,
      width: 59,
      padding: 0,
      textAlign: 'center'
    }
  }
})

export default useStyles
