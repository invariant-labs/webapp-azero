import { makeStyles } from 'tss-react/mui'

export const useStyles = makeStyles<{ disabled?: boolean }>()((_theme, { disabled }) => ({
  ring: {
    cursor: disabled ? 'default' : 'pointer'
  },
  innerCircle: {
    transition: '0.35s stroke-dashoffset',
    transform: 'rotate(-90deg)',
    transformOrigin: '50% 50%'
  }
}))
