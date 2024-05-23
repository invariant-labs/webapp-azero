import {
  Invariant,
  PSP22,
  PoolKey,
  TESTNET_INVARIANT_ADDRESS,
  sendAndDebugTx,
  sendTx
} from '@invariant-labs/a0-sdk'
import { Signer } from '@nightlylabs/nightly-connect-polkadot'
import { PayloadAction } from '@reduxjs/toolkit'
import { DEFAULT_CONTRACT_OPTIONS } from '@store/consts/static'
import { createLoaderKey, poolKeyToString } from '@store/consts/utils'
import { ListType, actions as poolsActions } from '@store/reducers/pools'
import { ClosePositionData, InitPositionData, actions } from '@store/reducers/positions'
import { actions as snackbarsActions } from '@store/reducers/snackbars'
import { networkType } from '@store/selectors/connection'
import { tokens } from '@store/selectors/pools'
import { address } from '@store/selectors/wallet'
import { getAlephZeroWallet } from '@utils/web3/wallet'
import { closeSnackbar } from 'notistack'
import { all, call, put, select, spawn, takeEvery, takeLatest } from 'typed-redux-saga'
import { getConnection } from './connection'
import { fetchAllPoolKeys } from './pools'

function* handleInitPosition(action: PayloadAction<InitPositionData>): Generator {
  const loaderCreatePosition = createLoaderKey()
  const loaderTokenX = createLoaderKey()
  const loaderTokenY = createLoaderKey()
  const loaderSigningPositionTx = createLoaderKey()
  const loaderCreatePool = createLoaderKey()

  const {
    poolKeyData,
    lowerTick,
    upperTick,
    spotSqrtPrice,
    tokenXAmount,
    tokenYAmount,
    liquidityDelta,
    initPool
  } = action.payload

  const slippageTolerance = 0n //TODO delete when sdk will be fixed

  const { tokenX, tokenY } = poolKeyData

  try {
    yield put(
      snackbarsActions.add({
        message: 'Creating position...',
        variant: 'pending',
        persist: true,
        key: loaderCreatePosition
      })
    )

    const api = yield* getConnection()
    const network = yield* select(networkType)
    const walletAddress = yield* select(address)
    const adapter = yield* call(getAlephZeroWallet)
    const tokensList = yield* select(tokens)

    const tokenXName = tokensList[tokenX]?.symbol ?? 'first'
    const tokenYName = tokensList[tokenY]?.symbol ?? 'second'

    const psp22 = yield* call(PSP22.load, api, network, walletAddress, DEFAULT_CONTRACT_OPTIONS)

    yield put(
      snackbarsActions.add({
        message: `Approving ${tokenXName} token for transaction...`,
        variant: 'pending',
        persist: true,
        key: loaderTokenX
      })
    )

    yield* call([psp22, psp22.setContractAddress], tokenX)
    const XTokenTx = yield* call([psp22, psp22.approveTx], TESTNET_INVARIANT_ADDRESS, tokenXAmount)

    const signedXTokenTx = yield* call([XTokenTx, XTokenTx.signAsync], walletAddress, {
      signer: adapter.signer as Signer
    })
    const tokenXtx = yield* call(sendTx, signedXTokenTx)

    closeSnackbar(loaderTokenX)
    yield put(snackbarsActions.remove(loaderTokenX))

    yield put(
      snackbarsActions.add({
        message: `${tokenXName} token successfully approved`,
        variant: 'success',
        persist: false,
        txid: tokenXtx.hash
      })
    )

    yield put(
      snackbarsActions.add({
        message: `Approving ${tokenYName} token for transaction...`,
        variant: 'pending',
        persist: true,
        key: loaderTokenY
      })
    )

    yield* call([psp22, psp22.setContractAddress], tokenY)
    const YTokenTx = yield* call([psp22, psp22.approveTx], TESTNET_INVARIANT_ADDRESS, tokenYAmount)

    const signedYTokenTx = yield* call([YTokenTx, YTokenTx.signAsync], walletAddress, {
      signer: adapter.signer as Signer
    })
    const tokenYtx = yield* call(sendTx, signedYTokenTx)

    closeSnackbar(loaderTokenY)
    yield put(snackbarsActions.remove(loaderTokenY))

    yield put(
      snackbarsActions.add({
        message: `${tokenYName} token successfully approved`,
        variant: 'success',
        persist: false,
        txid: tokenYtx.hash
      })
    )

    const invariant = yield* call(
      [Invariant, Invariant.load],
      api,
      network,
      TESTNET_INVARIANT_ADDRESS,
      DEFAULT_CONTRACT_OPTIONS
    )

    if (initPool) {
      yield put(
        snackbarsActions.add({
          message: 'Creating new pool...',
          variant: 'pending',
          persist: true,
          key: loaderCreatePool
        })
      )
      const createPoolTx = yield* call(
        [invariant, invariant.createPoolTx],
        poolKeyData,
        spotSqrtPrice
      )

      const signedCreatePoolTx = yield* call(
        [createPoolTx, createPoolTx.signAsync],
        walletAddress,
        {
          signer: adapter.signer as Signer
        }
      )

      const createPoolTX = yield* call(sendTx, signedCreatePoolTx)

      closeSnackbar(loaderCreatePool)
      yield put(snackbarsActions.remove(loaderCreatePool))

      yield put(
        snackbarsActions.add({
          message: `Pool successfully created`,
          variant: 'success',
          persist: false,
          txid: createPoolTX.hash
        })
      )

      yield* call(fetchAllPoolKeys)
    }

    const tx = yield* call(
      [invariant, invariant.createPositionTx],
      poolKeyData,
      lowerTick,
      upperTick,
      liquidityDelta,
      spotSqrtPrice,
      slippageTolerance
    )

    yield put(
      snackbarsActions.add({
        message: 'Signing new position transaction...',
        variant: 'pending',
        persist: true,
        key: loaderSigningPositionTx
      })
    )

    const signedTx = yield* call([tx, tx.signAsync], walletAddress, {
      signer: adapter.signer as Signer
    })

    closeSnackbar(loaderSigningPositionTx)
    yield put(snackbarsActions.remove(loaderSigningPositionTx))

    // const txResult = yield* call(sendTx, signedTx)
    const txResult = yield* call(sendAndDebugTx, signedTx, api)

    yield* put(actions.setInitPositionSuccess(true))

    yield put(
      snackbarsActions.add({
        message: 'Position successfully created',
        variant: 'success',
        persist: false,
        txid: txResult.hash
      })
    )

    closeSnackbar(loaderCreatePosition)
    yield put(snackbarsActions.remove(loaderCreatePosition))
  } catch (error) {
    console.log(error)

    yield* put(actions.setInitPositionSuccess(false))
    closeSnackbar(loaderCreatePosition)
    yield put(snackbarsActions.remove(loaderCreatePosition))
    closeSnackbar(loaderTokenX)
    yield put(snackbarsActions.remove(loaderTokenX))
    closeSnackbar(loaderTokenY)
    yield put(snackbarsActions.remove(loaderTokenY))
    closeSnackbar(loaderSigningPositionTx)
    yield put(snackbarsActions.remove(loaderSigningPositionTx))
    closeSnackbar(loaderCreatePool)
    yield put(snackbarsActions.remove(loaderCreatePool))

    yield put(
      snackbarsActions.add({
        message: 'Failed to send. Please try again.',
        variant: 'error',
        persist: false
      })
    )
  }
}

export function* handleGetPositionsList() {
  try {
    const connection = yield* getConnection()
    const network = yield* select(networkType)
    const invariant = yield* call(
      Invariant.load,
      connection,
      network,
      TESTNET_INVARIANT_ADDRESS,
      DEFAULT_CONTRACT_OPTIONS
    )
    const walletAddress = yield* select(address)

    const positions = yield* call([invariant, invariant.getPositions], walletAddress)

    const pools: PoolKey[] = []
    const poolSet: Set<string> = new Set()
    for (let i = 0; i < positions.length; i++) {
      const poolKeyString = poolKeyToString(positions[i].poolKey)

      if (!poolSet.has(poolKeyString)) {
        poolSet.add(poolKeyString)
        pools.push(positions[i].poolKey)
      }
    }

    yield* put(
      poolsActions.getPoolsDataForList({
        poolKeys: Array.from(pools),
        listType: ListType.POSITIONS
      })
    )

    yield* put(actions.setPositionsList(positions))
  } catch (e) {
    yield* put(actions.setPositionsList([]))
  }
}

export function* handleGetCurrentPositionTicks(action: PayloadAction<bigint>) {
  const walletAddress = yield* select(address)
  const connection = yield* getConnection()
  const network = yield* select(networkType)
  const invariant = yield* call(Invariant.load, connection, network, TESTNET_INVARIANT_ADDRESS, {
    storageDepositLimit: 10000000000,
    refTime: 10000000000,
    proofSize: 10000000000
  })

  const position = yield* call([invariant, invariant.getPosition], walletAddress, action.payload)

  const [lowerTick, upperTick] = yield* all([
    call([invariant, invariant.getTick], position.poolKey, position.lowerTickIndex),
    call([invariant, invariant.getTick], position.poolKey, position.upperTickIndex)
  ])

  yield put(
    actions.setCurrentPositionTicks({
      lowerTick,
      upperTick
    })
  )
}

export function* handleClaimFee(action: PayloadAction<bigint>) {
  const loaderSigningTx = createLoaderKey()
  const loaderKey = createLoaderKey()

  try {
    const walletAddress = yield* select(address)
    const connection = yield* getConnection()
    const network = yield* select(networkType)
    const invariant = yield* call(
      Invariant.load,
      connection,
      network,
      TESTNET_INVARIANT_ADDRESS,
      DEFAULT_CONTRACT_OPTIONS
    )
    const adapter = yield* call(getAlephZeroWallet)

    yield put(
      snackbarsActions.add({
        message: 'Signing transaction...',
        variant: 'pending',
        persist: true,
        key: loaderSigningTx
      })
    )

    const tx = yield* call([invariant, invariant.claimFeeTx], action.payload)
    const signedTx = yield* call([tx, tx.signAsync], walletAddress, {
      signer: adapter.signer as Signer
    })

    closeSnackbar(loaderSigningTx)
    yield put(snackbarsActions.remove(loaderSigningTx))
    yield put(
      snackbarsActions.add({
        message: 'Claiming fee...',
        variant: 'pending',
        persist: true,
        key: loaderKey
      })
    )

    const txResult = yield* call(sendTx, signedTx)

    closeSnackbar(loaderKey)
    yield put(snackbarsActions.remove(loaderKey))
    yield put(
      snackbarsActions.add({
        message: 'Fee successfully created',
        variant: 'success',
        persist: false,
        txid: txResult.hash
      })
    )

    yield put(actions.getSinglePosition(action.payload))
  } catch (e) {
    closeSnackbar(loaderSigningTx)
    yield put(snackbarsActions.remove(loaderSigningTx))
    closeSnackbar(loaderKey)
    yield put(snackbarsActions.remove(loaderKey))

    yield put(
      snackbarsActions.add({
        message: 'Failed to claim fee. Please try again.',
        variant: 'error',
        persist: false
      })
    )

    console.log(e)
  }
}

export function* handleGetSinglePosition(action: PayloadAction<bigint>) {
  const walletAddress = yield* select(address)
  const connection = yield* getConnection()
  const network = yield* select(networkType)
  const invariant = yield* call(
    Invariant.load,
    connection,
    network,
    TESTNET_INVARIANT_ADDRESS,
    DEFAULT_CONTRACT_OPTIONS
  )

  const position = yield* call([invariant, invariant.getPosition], walletAddress, action.payload)
  yield put(
    actions.setSinglePosition({
      index: action.payload,
      position
    })
  )

  yield put(actions.getCurrentPositionTicks(action.payload))
}

export function* handleClosePosition(action: PayloadAction<ClosePositionData>) {
  const loaderSigningTx = createLoaderKey()
  const loaderKey = createLoaderKey()

  try {
    const walletAddress = yield* select(address)
    const connection = yield* getConnection()
    const network = yield* select(networkType)
    const invariant = yield* call(
      Invariant.load,
      connection,
      network,
      TESTNET_INVARIANT_ADDRESS,
      DEFAULT_CONTRACT_OPTIONS
    )
    const adapter = yield* call(getAlephZeroWallet)

    yield put(
      snackbarsActions.add({
        message: 'Signing transaction...',
        variant: 'pending',
        persist: true,
        key: loaderSigningTx
      })
    )

    const tx = yield* call([invariant, invariant.removePositionTx], action.payload.positionIndex)
    const signedTx = yield* call([tx, tx.signAsync], walletAddress, {
      signer: adapter.signer as Signer
    })

    closeSnackbar(loaderSigningTx)
    yield put(snackbarsActions.remove(loaderSigningTx))
    const loaderKey = createLoaderKey()
    yield put(
      snackbarsActions.add({
        message: 'Removing position...',
        variant: 'pending',
        persist: true,
        key: loaderKey
      })
    )

    const txResult = yield* call(sendTx, signedTx)

    closeSnackbar(loaderKey)
    yield put(snackbarsActions.remove(loaderKey))
    yield put(
      snackbarsActions.add({
        message: 'Position successfully removed',
        variant: 'success',
        persist: false,
        txid: txResult.hash
      })
    )

    yield* put(actions.getPositionsList())
    action.payload.onSuccess()
  } catch (e) {
    closeSnackbar(loaderSigningTx)
    yield put(snackbarsActions.remove(loaderSigningTx))
    closeSnackbar(loaderKey)
    yield put(snackbarsActions.remove(loaderKey))

    yield put(
      snackbarsActions.add({
        message: 'Failed to close position. Please try again.',
        variant: 'error',
        persist: false
      })
    )

    console.log(e)
  }
}

export function* initPositionHandler(): Generator {
  yield* takeEvery(actions.initPosition, handleInitPosition)
}

export function* getPositionsListHandler(): Generator {
  yield* takeLatest(actions.getPositionsList, handleGetPositionsList)
}

export function* getCurrentPositionTicksHandler(): Generator {
  yield* takeEvery(actions.getCurrentPositionTicks, handleGetCurrentPositionTicks)
}

export function* claimFeeHandler(): Generator {
  yield* takeEvery(actions.claimFee, handleClaimFee)
}

export function* getSinglePositionHandler(): Generator {
  yield* takeEvery(actions.getSinglePosition, handleGetSinglePosition)
}

export function* closePositionHandler(): Generator {
  yield* takeEvery(actions.closePosition, handleClosePosition)
}

export function* positionsSaga(): Generator {
  yield all(
    [
      getPositionsListHandler,
      getCurrentPositionTicksHandler,
      claimFeeHandler,
      getSinglePositionHandler,
      closePositionHandler
    ].map(spawn)
  )
}
