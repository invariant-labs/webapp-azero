import { Network, PSP22 } from '@invariant-labs/a0-sdk'
import { NightlyConnectAdapter } from '@nightlylabs/wallet-selector-polkadot'
import { AddressOrPair, SubmittableExtrinsic } from '@polkadot/api/types'
import { SignerOptions } from '@polkadot/api/types/submittable'
import { PayloadAction } from '@reduxjs/toolkit'
import { TokenAirdropAmount, TokenList, getFaucetDeployer } from '@store/consts/static'
import { createLoaderKey } from '@store/consts/utils'
import { actions as snackbarsActions } from '@store/reducers/snackbars'
import { Status, actions, actions as walletActions } from '@store/reducers/wallet'
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

  const connection = yield* getConnection()
  const faucetDeployer = getFaucetDeployer()
  const data = connection.createType('Vec<u8>', [])
  const notAirdroppedTokens = []

  const psp22 = yield* call(PSP22.load, connection, Network.Testnet, '')

  for (const ticker in TokenList) {
    const address = TokenList[ticker as keyof typeof TokenList]
    const airdropAmount = TokenAirdropAmount[ticker as keyof typeof TokenList]

    yield* call([psp22, psp22.setContractAddress], address)
    const balance = yield* call([psp22, psp22.balanceOf], faucetDeployer, address)
    yield* put(walletActions.setTokenAccount({ address, balance: String(balance) }))
    const faucetAmount = BigInt(airdropAmount)
    if (balance < faucetAmount) {
      yield* call(psp22.mint, faucetDeployer, faucetAmount)
      yield* call(psp22.transfer, faucetDeployer, address, faucetAmount, data)

      yield* put(
        snackbarsActions.add({
          message: `Airdropped ${ticker} tokens`,
          variant: 'success',
          persist: false
        })
      )
    } else {
      notAirdroppedTokens.push(ticker)
    }
  }

  if (notAirdroppedTokens.length > 0) {
    yield* put(
      snackbarsActions.add({
        message: `Didn't airdrop ${notAirdroppedTokens.join(', ')} ${notAirdroppedTokens.length === 1 ? 'token' : 'tokens'} due to high balance`,
        variant: 'error',
        persist: false
      })
    )
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

export function* testTransaction(
  action: PayloadAction<{ receiverAddress: AddressOrPair; amount: number }>
): Generator {
  const loaderKey = createLoaderKey()

  try {
    const { amount, receiverAddress } = action.payload
    const walletAddress = yield* select(address)
    console.log(walletAddress)
    if (!walletAddress) {
      yield put(
        snackbarsActions.add({
          message: 'Please connect your wallet first.',
          variant: 'error',
          persist: false
        })
      )
      return
    }
    yield put(
      snackbarsActions.add({
        message: 'Processing transaction...',
        variant: 'pending',
        persist: true,
        key: loaderKey
      })
    )

    const walletAdapter = yield* call(getWallet)
    const connection = yield* call(getConnection)

    const tx = connection.tx.balances.transferAllowDeath(receiverAddress, amount)
    const signedTx = yield* call(signAndSend, walletAdapter, tx, walletAddress)

    closeSnackbar(loaderKey)
    yield put(snackbarsActions.remove(loaderKey))

    yield put(
      snackbarsActions.add({
        message: 'Successful send transaction',
        variant: 'success',
        persist: false,
        txid: signedTx
      })
    )
  } catch (error) {
    console.log(error)
    closeSnackbar(loaderKey)
    yield put(snackbarsActions.remove(loaderKey))
  }
}

export function* signAndSend(
  walletAdapter: NightlyConnectAdapter,
  tx: SubmittableExtrinsic<'promise', any>,
  address: AddressOrPair
): SagaGenerator<string> {
  const signedTx = yield* call([tx, tx.signAsync], address, {
    signer: walletAdapter.signer
  } as SignerOptions)

  const txId = yield* call([signedTx, signedTx.send])
  return txId.toString()
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
    // // yield* call(fetchTokensAccounts)
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

    // yield* put(positionsActions.setPositionsList([]))
    // yield* put(
    //   positionsActions.setCurrentPositionRangeTicks({
    //     lowerTick: undefined,
    //     upperTick: undefined
    //   })
    // )
  } catch (error) {
    console.log(error)
  }
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
export function* handleTestTransaction(): Generator {
  yield takeLeading(actions.initTestTransaction, testTransaction)
}
export function* walletSaga(): Generator {
  yield all(
    [initSaga, airdropSaga, connectHandler, disconnectHandler, handleTestTransaction].map(spawn)
  )
}
