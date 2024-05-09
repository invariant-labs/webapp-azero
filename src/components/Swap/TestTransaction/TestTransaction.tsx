import { Button, Grid, TextField, Typography } from '@mui/material'
import { useState } from 'react'
import { actions as walletActions } from '@store/reducers/wallet'
import { useDispatch } from 'react-redux'

export const TestTransaction: React.FC = () => {
  const RECEIVER = '5EnRWxJwqLuexBZtbJVTmfAzzc6Fwpw2Gv9AYs1gYHsgvzfH'
  const dispatch = useDispatch()
  const [receiverAddress, setReceiverAddress] = useState<string>(RECEIVER)

  return (
    <Grid container justifyContent='center' alignItems='center' my={10}>
      <Grid container justifyContent='center' alignItems='center' direction='column' gap={5}>
        <Typography color='white' variant='h1'>
          Test transaction
        </Typography>
      </Grid>

      <Grid container justifyContent='center' alignItems='center' direction='column' gap={5} mt={5}>
        <div>
          <Button variant='outlined' onClick={() => setReceiverAddress(RECEIVER)}>
            Reset example address
          </Button>
        </div>
        <TextField
          variant='outlined'
          type='text'
          id='first_name'
          placeholder='Receiver Address'
          required
          value={receiverAddress}
          onChange={e => setReceiverAddress(e.target.value)}
        />

        <Button
          variant='contained'
          onClick={() => {
            dispatch(walletActions.initTestTransaction({ receiverAddress, amount: 5_000_000_000 }))
          }}>
          Send Testnet Transaction
        </Button>
      </Grid>
    </Grid>
  )
}
export default TestTransaction
