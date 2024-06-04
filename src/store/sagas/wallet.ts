import { Network, sendTx } from '@invariant-labs/a0-sdk'
import { NightlyConnectAdapter } from '@nightlylabs/wallet-selector-polkadot'
import { AddressOrPair, Signer } from '@polkadot/api/types'
import { PayloadAction } from '@reduxjs/toolkit'
import { FaucetTokenList, TokenAirdropAmount } from '@store/consts/static'
import { createLoaderKey, getTokenBalances } from '@store/consts/utils'
import { actions as positionsActions } from '@store/reducers/positions'
import { actions as snackbarsActions } from '@store/reducers/snackbars'
import { ITokenBalance, Status, actions, actions as walletActions } from '@store/reducers/wallet'
import { networkType } from '@store/selectors/connection'
import { address, status } from '@store/selectors/wallet'
import psp22Singleton from '@store/services/psp22Singleton'
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
import { getConnection } from './connection'

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
export function* getBalance(walletAddress: AddressOrPair): SagaGenerator<string> {
  const connection = yield* call(getConnection)
  const accountInfoResponse = yield* call(
    [connection.query.system.account, connection.query.system.account],
    walletAddress
  ) as any

  const accountInfo = accountInfoResponse.toPrimitive() as FrameSystemAccountInfo

  return accountInfo.data.free
}

export function* handleBalance(): Generator {
  // const wallet = yield* call(getWallet)
  // yield* put(actions.setAddress(wallet.))
  // yield* put(actions.setIsBalanceLoading(true))
  // const balance = yield* call(getBalance, wallet.address)
  // yield* put(actions.setBalance(balance))
  // // yield* call(fetchTokensAccounts)
  // yield* put(actions.setIsBalanceLoading(false))
}

// export function* fetchTokensAccounts(): Generator {
//   const connection = yield* call(getConnection)
//   const wallet = yield* call(getWallet)
//   const tokensAccounts = yield* call(
//     [connection, connection.getParsedTokenAccountsByOwner],
//     wallet.publicKey,
//     {
//       programId: TOKEN_PROGRAM_ID
//     }
//   )
//   const allTokens = yield* select(tokens)
//   const newAccounts: ITokenAccount[] = []
//   const unknownTokens: Record<string, StoreToken> = {}
//   for (const account of tokensAccounts.value) {
//     const info: IparsedTokenInfo = account.account.data.parsed.info
//     newAccounts.push({
//       programId: new PublicKey(info.mint),
//       balance: new BN(info.tokenAmount.amount),
//       address: account.pubkey,
//       decimals: info.tokenAmount.decimals
//     })

//     if (!allTokens[info.mint]) {
//       unknownTokens[info.mint] = {
//         name: info.mint,
//         symbol: `${info.mint.slice(0, 4)}...${info.mint.slice(-4)}`,
//         decimals: info.tokenAmount.decimals,
//         address: new PublicKey(info.mint),
//         logoURI: '/unknownToken.svg',
//         isUnknown: true
//       }
//     }
//   }

//   yield* put(actions.addTokenAccounts(newAccounts))
//   yield* put(poolsActions.addTokens(unknownTokens))
// }

// export function* getToken(tokenAddress: PublicKey): SagaGenerator<Token> {
//   const connection = yield* call(getConnection)
//   const token = new Token(connection, tokenAddress, TOKEN_PROGRAM_ID, new Account())
//   return token
// }

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

  try {
    yield put(
      snackbarsActions.add({
        message: 'Airdrop in progress...',
        variant: 'pending',
        persist: true,
        key: loaderAirdrop
      })
    )

    const connection = yield* getConnection()
    const adapter = yield* call(getAlephZeroWallet)
    const data = connection.createType('Vec<u8>', [])

    const psp22 = yield* call(
      [psp22Singleton, psp22Singleton.loadInstance],
      connection,
      Network.Testnet
    )

    const txs = []

    for (const ticker in FaucetTokenList) {
      const address = FaucetTokenList[ticker as keyof typeof FaucetTokenList]
      const airdropAmount = TokenAirdropAmount[ticker as keyof typeof FaucetTokenList]

      const mintTx = psp22.mintTx(airdropAmount, address)

      txs.push(mintTx)

      const transferTx = psp22.transferTx(walletAddress, airdropAmount, data, address)
      txs.push(transferTx)
    }

    const batchedTx = connection.tx.utility.batchAll(txs)

    const signedBatchedTx = yield* call([batchedTx, batchedTx.signAsync], walletAddress, {
      signer: adapter.signer as Signer
    })

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

    closeSnackbar(loaderAirdrop)
    yield put(snackbarsActions.remove(loaderAirdrop))
  }
}

// export function* setEmptyAccounts(collateralsAddresses: PublicKey[]): Generator {
//   const tokensAccounts = yield* select(accounts)
//   const acc: PublicKey[] = []
//   for (const collateral of collateralsAddresses) {
//     const collateralTokenProgram = yield* call(getToken, collateral)
//     const accountAddress = tokensAccounts[collateral.toString()]
//       ? tokensAccounts[collateral.toString()].address
//       : null
//     if (accountAddress == null) {
//       acc.push(collateralTokenProgram.publicKey)
//     }
//   }
//   if (acc.length !== 0) {
//     yield* call(createMultipleAccounts, acc)
//   }
// }

// export function* getCollateralTokenAirdrop(
//   collateralsAddresses: PublicKey[],
//   collateralsQuantities: number[]
// ): Generator {
//   const wallet = yield* call(getWallet)
//   const instructions: TransactionInstruction[] = []
//   yield* call(setEmptyAccounts, collateralsAddresses)
//   const tokensAccounts = yield* select(accounts)
//   for (const [index, collateral] of collateralsAddresses.entries()) {
//     instructions.push(
//       Token.createMintToInstruction(
//         TOKEN_PROGRAM_ID,
//         collateral,
//         tokensAccounts[collateral.toString()].address,
//         airdropAdmin.publicKey,
//         [],
//         collateralsQuantities[index]
//       )
//     )
//   }
//   const tx = instructions.reduce((tx, ix) => tx.add(ix), new Transaction())
//   const connection = yield* call(getConnection)
//   const blockhash = yield* call([connection, connection.getRecentBlockhash])
//   tx.feePayer = wallet.publicKey
//   tx.recentBlockhash = blockhash.blockhash
//   const signedTx = yield* call([wallet, wallet.signTransaction], tx)
//   signedTx.partialSign(airdropAdmin)
//   yield* call([connection, connection.sendRawTransaction], signedTx.serialize(), {
//     skipPreflight: true
//   })
// }
// export function* getTokenProgram(pubKey: PublicKey): SagaGenerator<number> {
//   const connection = yield* call(getConnection)
//   const balance = yield* call(, pubKey)
//   return balance
// }

export function* fetchSelectedTokensBalances(action: PayloadAction<string[]>): Generator {
  const api = yield* getConnection()
  const network = yield* select(networkType)
  const walletAddress = yield* select(address)

  const tokens = action.payload
  const balances = yield* call(getTokenBalances, tokens, api, network, walletAddress)

  const convertedBalances: ITokenBalance[] = balances.map(balance => ({
    address: balance[0],
    balance: balance[1]
  }))

  yield* put(actions.addTokenBalances(convertedBalances))
}

export function* fetchTokensBalances(): Generator {
  const api = yield* getConnection()
  const network = yield* select(networkType)
  const walletAddress = yield* select(address)

  const tokens = Object.values(FaucetTokenList)
  const balances = yield* call(getTokenBalances, tokens, api, network, walletAddress)

  const convertedBalances: ITokenBalance[] = balances.map(balance => ({
    address: balance[0],
    balance: balance[1]
  }))

  yield* put(actions.addTokenBalances(convertedBalances))
}

export function* init(): Generator {
  try {
    yield* put(actions.setStatus(Status.Init))

    const walletAdapter = yield* call(getWallet)
    yield* call([walletAdapter, walletAdapter.connect])
    const accounts = yield* call([walletAdapter.accounts, walletAdapter.accounts.get])

    yield* put(actions.setAddress(accounts[0].address))
    yield* put(actions.setIsBalanceLoading(true))

    const balance = yield* call(getBalance, accounts[0].address)

    yield* put(actions.setBalance(BigInt(balance)))
    yield* put(actions.setStatus(Status.Initialized))
    yield* call(fetchTokensBalances)
    yield* put(actions.setIsBalanceLoading(false))
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
    yield* call(disconnectWallet)
    yield* put(actions.resetState())

    yield* put(positionsActions.setPositionsList([]))
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
  const api = yield* getConnection()
  const network = yield* select(networkType)

  const balance = yield* call(getBalance, walletAddress)
  yield* put(walletActions.setBalance(BigInt(balance)))

  const tokenBalances = yield* call(getTokenBalances, tokens, api, network, walletAddress)
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

// export function* handleBalanceSaga(): Generator {
//   yield takeLeading(actions.getBalance, handleBalance)
// }

export function* handleFetchTokensBalances(): Generator {
  yield takeLeading(actions.getTokens, fetchTokensBalances)
}

export function* handleFetchSelectedTokensBalances(): Generator {
  yield takeLeading(actions.getSelectedTokens, fetchSelectedTokensBalances)
}

export function* walletSaga(): Generator {
  yield all(
    [
      initSaga,
      airdropSaga,
      connectHandler,
      disconnectHandler,
      handleFetchTokensBalances,
      handleFetchSelectedTokensBalances
    ].map(spawn)
  )
}
