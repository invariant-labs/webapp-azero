import { makeStyles } from 'tss-react/mui'

export const useStyles = makeStyles()(() => ({
  container: {
    display: 'flex',
    minHeight: '70vh',
    marginTop: '65px',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingInline: 94
  },
  workInProgress: {
    height: 231,
    width: 799
  }
}))
