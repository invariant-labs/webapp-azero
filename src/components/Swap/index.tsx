import { Button, Grid, TextField, Typography } from '@mui/material'
import { useEffect, useState } from 'react'
import ConnectButton from './ConnectButton'
import { AddressOrPair } from '@polkadot/api-base/types'
import { getAdapter, getAlephZero } from '@utils/web3'
import { actions as snackbarsActions } from '@store/reducers/snackbars'
import { useDispatch } from 'react-redux'

export interface ISwap {}

export const Swap: React.FC<ISwap> = () => {
  const [address, setAddress] = useState<AddressOrPair | undefined>()
  const RECEIVER = '5EnRWxJwqLuexBZtbJVTmfAzzc6Fwpw2Gv9AYs1gYHsgvzfH'
  const dispatch = useDispatch()
  const [receiverAddress, setReceiverAddress] = useState<string>(RECEIVER)

  useEffect(() => {
    const init = async () => {
      const adapter = await getAdapter()
      // Eager connect
      if (await adapter.canEagerConnect()) {
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
      }
    }
    if (!address) init()

    // Try eagerly connect
  }, [address])

  const signTransaction = async () => {
    try {
      if (!address) {
        return
      }
      const api = await getAlephZero()
      const adapter = await getAdapter()

      const tx = await api.tx.balances.transferAllowDeath(receiverAddress, 5_000_000_000)

      const signedTx = await tx.signAsync(address, {
        signer: adapter.signer as any
      })
      const txId = await signedTx.send()

      console.log(
        `Transaction successful,  https://alephzero-testnet.subscan.io/extrinsic/${txId.toString()}`
      )
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
            const adapter = await getAdapter()
            try {
              await adapter.connect()
              const publicKey = await adapter.accounts.get()
              if (publicKey.length > 0) {
                setAddress(publicKey[0].address)
                console.log(publicKey[0].address)
              }
            } catch (error) {
              await adapter.disconnect().catch(() => {})
              console.log(error)
            }
          }}
          onDisconnect={async () => {
            try {
              const adapter = await getAdapter()
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
