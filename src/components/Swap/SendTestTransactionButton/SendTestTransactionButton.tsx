import { Network, PSP22, initPolkadotApi, sendTx } from '@invariant-labs/a0-sdk'
import { Button } from '@mui/material'
import { AlephZeroNetworks, TokenList, getFaucetDeployer } from '@store/consts/static'
import { actions as snackbarsActions } from '@store/reducers/snackbars'
import { address } from '@store/selectors/wallet'
import { getAlephZeroWallet } from '@utils/web3/wallet'
import { useDispatch, useSelector } from 'react-redux'

export const SendTestTransactionButton: React.FC = () => {
  const walletAddress = useSelector(address)

  const dispatch = useDispatch()

  async function sendTestTransaction() {
    if (!walletAddress) {
      dispatch(
        snackbarsActions.add({
          message: 'Wallet not connected',
          variant: 'error',
          persist: false
        })
      )
    }

    const api = await initPolkadotApi(Network.Testnet, AlephZeroNetworks.TEST)
    const psp22 = await PSP22.load(api, Network.Testnet, TokenList.BTC, {
      storageDepositLimit: 10000000000,
      refTime: 10000000000,
      proofSize: 10000000000
    })

    const adapter = await getAlephZeroWallet()

    const data = api.createType('Vec<u8>', [])
    const tx = psp22.transferTx(getFaucetDeployer().address, 1000n, data)

    const faucetDeployer = getFaucetDeployer()
    console.log(await psp22.balanceOf(faucetDeployer.address, walletAddress))

    const signedTx = await tx.signAsync(walletAddress, { signer: adapter.signer })

    dispatch(
      snackbarsActions.add({
        message: 'Transaction sent',
        variant: 'pending',
        persist: false
      })
    )

    try {
      await sendTx(signedTx)

      dispatch(
        snackbarsActions.add({
          message: 'Transaction confirmed',
          variant: 'success',
          persist: false
        })
      )
    } catch (e) {
      dispatch(
        snackbarsActions.add({
          message: 'Transaction failed',
          variant: 'error',
          persist: false
        })
      )
    }

    console.log(await psp22.balanceOf(walletAddress, walletAddress))
  }

  return (
    <Button variant='contained' onClick={sendTestTransaction}>
      Send test transaction
    </Button>
  )
}

export default SendTestTransactionButton