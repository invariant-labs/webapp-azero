import { Button, Grid, TextField, Typography } from '@mui/material'
import { useState } from 'react'
import ConnectButton from './ConnectButton'
import { AddressOrPair } from '@polkadot/api-base/types'
import { actions as snackbarsActions } from '@store/reducers/snackbars'
import { useDispatch } from 'react-redux'
import { nightlyConnectAdapter } from '@utils/web3/selector'
import { getAlephZeroConnection } from '@utils/web3/connection'
import { AlephZeroNetworks } from '@store/consts/static'

export interface ISwap {}

export const Swap: React.FC<ISwap> = () => {
  const [address, setAddress] = useState<AddressOrPair | undefined>()
  const RECEIVER = '5EnRWxJwqLuexBZtbJVTmfAzzc6Fwpw2Gv9AYs1gYHsgvzfH'
  const dispatch = useDispatch()
  const [receiverAddress, setReceiverAddress] = useState<string>(RECEIVER)

  const signTransaction = async () => {
    try {
      const api = await getAlephZeroConnection(AlephZeroNetworks.TEST)

      const adapter = await nightlyConnectAdapter()

      const tx = api.tx.balances.transferAllowDeath(receiverAddress, 5_000_000_000)

      if (!address) {
        return
      }
      const signedTx = await tx.signAsync(address, {
        signer: adapter.signer as any
      })
      const txId = await signedTx.send()

      dispatch(
        snackbarsActions.add({
          message: 'Successful send transaction',
          variant: 'success',
          persist: false,
          txid: txId.toString()
        })
      )
    } catch (error) {
      console.log(error)
      dispatch(
        snackbarsActions.add({
          message: 'Failed to send transaction',
          variant: 'error',
          persist: false
        })
      )
    }
  }

  return (
    <Grid container justifyContent='center' alignItems='center' my={10}>
      <Grid container justifyContent='center' alignItems='center' direction='column' gap={5}>
        <Typography color='white' variant='h1'>
          Test transaction
        </Typography>
        <ConnectButton
          connected={address !== undefined}
          onConnect={async () => {
            const adapter = await nightlyConnectAdapter()
            try {
              await adapter.connect()
              const publicKey = await adapter.accounts.get()
              if (publicKey.length > 0) {
                setAddress(publicKey[0].address)
              }
            } catch (error) {
              await adapter.disconnect().catch(() => {})
              console.log(error)
            }
          }}
          onDisconnect={async () => {
            try {
              const adapter = await nightlyConnectAdapter()
              await adapter.disconnect()
              setAddress(undefined)
            } catch (error) {
              console.log(error)
            }
          }}
          publicKey={address?.toString()}
        />
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

        <Button variant='contained' onClick={signTransaction}>
          Send Testnet Transaction
        </Button>
      </Grid>
    </Grid>
  )
}
export default Swap
