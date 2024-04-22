import { makeStyles } from 'tss-react/mui'

const useStyles = makeStyles()(() => {
  return {
    container: {
      display: 'flex',
      minHeight: '70vh',
      marginTop: '65px',
      justifyContent: 'center',
      backgroundColor: 'transparent'
    }
  }
})

export default useStyles
