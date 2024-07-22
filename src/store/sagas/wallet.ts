import { sendTx } from '@invariant-labs/a0-sdk'
import { NightlyConnectAdapter } from '@nightlylabs/wallet-selector-polkadot'
import { PayloadAction } from '@reduxjs/toolkit'
import { FaucetTokenList, TokenAirdropAmount } from '@store/consts/static'
import { createLoaderKey, getTokenBalances } from '@utils/utils'
import { actions as positionsActions } from '@store/reducers/positions'
import { actions as snackbarsActions } from '@store/reducers/snackbars'
import { Status, actions, actions as walletActions } from '@store/reducers/wallet'
import { tokens } from '@store/selectors/pools'
import { address, status } from '@store/selectors/wallet'
import { disconnectWallet, getAlephZeroWallet } from '@utils/web3/wallet'
import { closeSnackbar } from 'notistack'
import {
  SagaGenerator,
  all,
  call,
  put,
  select,
  spawn,
  takeLatest,
  takeLeading
} from 'typed-redux-saga'
import { Signer } from '@polkadot/api/types'
import { positionsList } from '@store/selectors/positions'
import { getApi, getPSP22 } from './connection'
import { openWalletSelectorModal } from '@utils/web3/selector'

export function* getWallet(): SagaGenerator<NightlyConnectAdapter> {
  const wallet = yield* call(getAlephZeroWallet)
  return wallet
}

type FrameSystemAccountInfo = {
  data: {
    free: string
    reserved: string
    miscFrozen: string
    feeFrozen: string
  }
  nonce: number
  consumers: number
  providers: number
  sufficients: number
}
export function* getBalance(walletAddress: string): SagaGenerator<string> {
  const connection = yield* getApi()
  const accountInfoResponse = yield* call(
    [connection.query.system.account, connection.query.system.account],
    walletAddress
  ) as any

  const accountInfo = accountInfoResponse.toPrimitive() as FrameSystemAccountInfo

  return accountInfo.data.free
}

export function* handleAirdrop(): Generator {
  const walletAddress = yield* select(address)

  if (!walletAddress) {
    return yield* put(
      snackbarsActions.add({
        message: 'You have to connect your wallet before claiming the faucet',
        variant: 'error',
        persist: false
      })
    )
  }

  const loaderAirdrop = createLoaderKey()
  const loaderSigningTx = createLoaderKey()

  try {
    yield put(
      snackbarsActions.add({
        message: 'Airdrop in progress...',
        variant: 'pending',
        persist: true,
        key: loaderAirdrop
      })
    )

    const connection = yield* getApi()
    const adapter = yield* call(getAlephZeroWallet)

    const psp22 = yield* getPSP22()

    const txs = []

    for (const ticker in FaucetTokenList) {
      const address = FaucetTokenList[ticker as keyof typeof FaucetTokenList]
      const airdropAmount = TokenAirdropAmount[ticker as keyof typeof FaucetTokenList]

      const mintTx = psp22.mintTx(airdropAmount, address)
      txs.push(mintTx)
    }

    const batchedTx = connection.tx.utility.batchAll(txs)

    yield put(
      snackbarsActions.add({
        message: 'Signing transaction...',
        variant: 'pending',
        persist: true,
        key: loaderSigningTx
      })
    )

    const signedBatchedTx = yield* call([batchedTx, batchedTx.signAsync], walletAddress, {
      signer: adapter.signer as Signer
    })

    closeSnackbar(loaderSigningTx)
    yield put(snackbarsActions.remove(loaderSigningTx))

    const txResult = yield* call(sendTx, signedBatchedTx)

    closeSnackbar(loaderAirdrop)
    yield put(snackbarsActions.remove(loaderAirdrop))

    const tokenNames = Object.keys(FaucetTokenList).join(', ')

    yield* put(
      snackbarsActions.add({
        message: `Airdropped ${tokenNames} tokens`,
        variant: 'success',
        persist: false,
        txid: txResult.hash
      })
    )

    yield* call(fetchBalances, [...Object.values(FaucetTokenList)])
  } catch (error) {
    console.log(error)

    closeSnackbar(loaderSigningTx)
    yield put(snackbarsActions.remove(loaderSigningTx))
    closeSnackbar(loaderAirdrop)
    yield put(snackbarsActions.remove(loaderAirdrop))
  }
}

export function* init(): Generator {
  try {
    yield* put(actions.setStatus(Status.Init))

    const walletAdapter = yield* call(getWallet)
    yield* call([walletAdapter, walletAdapter.connect])
    const accounts = yield* call([walletAdapter.accounts, walletAdapter.accounts.get])

    yield* put(actions.setAddress(accounts[0].address))

    const allTokens = yield* select(tokens)
    yield* call(fetchBalances, Object.keys(allTokens))

    yield* put(actions.setStatus(Status.Initialized))
  } catch (error) {
    console.log(error)
  }
}

export const sleep = (ms: number) => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function* handleConnect(): Generator {
  const walletStatus = yield* select(status)
  if (walletStatus === Status.Initialized) {
    yield* put(
      snackbarsActions.add({
        message: 'Wallet already connected.',
        variant: 'info',
        persist: false
      })
    )
    return
  }
  yield* call(init)
}

export function* handleDisconnect(): Generator {
  try {
    const { loadedPages } = yield* select(positionsList)

    yield* call(disconnectWallet)
    yield* put(actions.resetState())

    yield* put(positionsActions.setPositionsList([]))
    yield* put(positionsActions.setPositionsListLength(0n))
    yield* put(
      positionsActions.setPositionsListLoadedStatus({
        indexes: Object.keys(loadedPages).map(key => Number(key)),
        isLoaded: false
      })
    )

    yield* put(
      positionsActions.setCurrentPositionTicks({
        lowerTick: undefined,
        upperTick: undefined
      })
    )
  } catch (error) {
    console.log(error)
  }
}

export function* fetchBalances(tokens: string[]): Generator {
  const walletAddress = yield* select(address)
  const psp22 = yield* getPSP22()

  yield* put(walletActions.setIsBalanceLoading(true))

  const balance = yield* call(getBalance, walletAddress)
  yield* put(walletActions.setBalance(BigInt(balance)))

  const tokenBalances = yield* call(getTokenBalances, tokens, psp22, walletAddress)
  yield* put(
    walletActions.addTokenBalances(
      tokenBalances.map(([address, balance]) => {
        return {
          address,
          balance
        }
      })
    )
  )

  yield* put(walletActions.setIsBalanceLoading(false))
}

export function* handleReconnect(): Generator {
  yield* call(handleDisconnect)
  yield* call(openWalletSelectorModal)
}

export function* handleGetBalances(action: PayloadAction<string[]>): Generator {
  yield* call(fetchBalances, action.payload)
}

export function* connectHandler(): Generator {
  yield takeLatest(actions.connect, handleConnect)
}

export function* disconnectHandler(): Generator {
  yield takeLatest(actions.disconnect, handleDisconnect)
}

export function* airdropSaga(): Generator {
  yield takeLeading(actions.airdrop, handleAirdrop)
}

export function* initSaga(): Generator {
  yield takeLeading(actions.initWallet, init)
}

export function* getBalancesHandler(): Generator {
  yield takeLeading(actions.getBalances, handleGetBalances)
}

export function* reconnecthandler(): Generator {
  yield takeLatest(actions.reconnect, handleReconnect)
}

export function* walletSaga(): Generator {
  yield all(
    [
      initSaga,
      airdropSaga,
      connectHandler,
      disconnectHandler,
      getBalancesHandler,
      reconnecthandler
    ].map(spawn)
  )
}
