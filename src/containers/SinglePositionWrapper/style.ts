import { colors, typography } from '@static/theme'
import { makeStyles } from 'tss-react/mui'

const useStyles = makeStyles()(() => {
  return {
    placeholderText: {
      ...typography.heading1,
      textAlign: 'center',
      color: colors.white.main
    },
    loading: {
      width: 150,
      height: 150,
      margin: 'auto'
    },
    fullHeightContainer: {
      height: '100%'
    }
  }
})

export default useStyles
