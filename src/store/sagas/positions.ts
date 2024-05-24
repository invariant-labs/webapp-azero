import {
  Invariant,
  PSP22,
  PoolKey,
  TESTNET_INVARIANT_ADDRESS,
  TESTNET_WAZERO_ADDRESS,
  WrappedAZERO,
  sendTx
} from '@invariant-labs/a0-sdk'
import { Signer } from '@polkadot/api/types'
import { PayloadAction } from '@reduxjs/toolkit'
import { DEFAULT_CONTRACT_OPTIONS } from '@store/consts/static'
import { createLoaderKey, poolKeyToString } from '@store/consts/utils'
import { ListType, actions as poolsActions } from '@store/reducers/pools'
import { InitPositionData, actions } from '@store/reducers/positions'
import { actions as snackbarsActions } from '@store/reducers/snackbars'
import { networkType } from '@store/selectors/connection'
import { address } from '@store/selectors/wallet'
import { getAlephZeroWallet } from '@utils/web3/wallet'
import { closeSnackbar } from 'notistack'
import { all, call, put, select, spawn, takeEvery, takeLatest } from 'typed-redux-saga'
import { getConnection } from './connection'
import { fetchAllPoolKeys } from './pools'

function* handleInitPosition(action: PayloadAction<InitPositionData>): Generator {
  const loaderCreatePosition = createLoaderKey()

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

  if (
    (tokenX === TESTNET_WAZERO_ADDRESS && tokenXAmount !== 0n) ||
    (tokenY === TESTNET_WAZERO_ADDRESS && tokenYAmount !== 0n)
  ) {
    return yield* call(handleInitPositionWithAZERO, action)
  }

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

    const txs = []

    const psp22 = yield* call(PSP22.load, api, network, walletAddress, {
      storageDepositLimit: 10000000000,
      refTime: 10000000000,
      proofSize: 10000000000
    })

    yield* call([psp22, psp22.setContractAddress], tokenX)
    const XTokenTx = yield* call([psp22, psp22.approveTx], TESTNET_INVARIANT_ADDRESS, tokenXAmount)
    txs.push(XTokenTx)

    yield* call([psp22, psp22.setContractAddress], tokenY)
    const YTokenTx = yield* call([psp22, psp22.approveTx], TESTNET_INVARIANT_ADDRESS, tokenYAmount)
    txs.push(YTokenTx)

    const invariant = yield* call(
      [Invariant, Invariant.load],
      api,
      network,
      TESTNET_INVARIANT_ADDRESS,
      DEFAULT_CONTRACT_OPTIONS
    )

    if (initPool) {
      const createPoolTx = yield* call(
        [invariant, invariant.createPoolTx],
        poolKeyData,
        spotSqrtPrice
      )
      txs.push(createPoolTx)

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
    txs.push(tx)

    const batchedTx = api.tx.utility.batchAll(txs)
    const signedBatchedTx = yield* call([batchedTx, batchedTx.signAsync], walletAddress, {
      signer: adapter.signer as Signer
    })
    const txResult = yield* call(sendTx, signedBatchedTx)

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

    yield put(
      snackbarsActions.add({
        message: 'Failed to send. Please try again.',
        variant: 'error',
        persist: false
      })
    )
  }
}

function* handleInitPositionWithAZERO(action: PayloadAction<InitPositionData>): Generator {
  const loaderCreatePosition = createLoaderKey()

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

    const txs = []

    const wazero = yield* call(WrappedAZERO.load, api, network, TESTNET_WAZERO_ADDRESS, {
      storageDepositLimit: 10000000000,
      refTime: 10000000000,
      proofSize: 10000000000
    })

    const depositTx = yield* call(
      [wazero, wazero.depositTx],
      tokenX === TESTNET_WAZERO_ADDRESS ? tokenXAmount : tokenYAmount
    )
    txs.push(depositTx)

    const psp22 = yield* call(PSP22.load, api, network, walletAddress, {
      storageDepositLimit: 10000000000,
      refTime: 10000000000,
      proofSize: 10000000000
    })

    yield* call([psp22, psp22.setContractAddress], tokenX)
    const XTokenTx = yield* call([psp22, psp22.approveTx], TESTNET_INVARIANT_ADDRESS, tokenXAmount)
    txs.push(XTokenTx)

    yield* call([psp22, psp22.setContractAddress], tokenY)
    const YTokenTx = yield* call([psp22, psp22.approveTx], TESTNET_INVARIANT_ADDRESS, tokenYAmount)
    txs.push(YTokenTx)

    const invariant = yield* call(
      [Invariant, Invariant.load],
      api,
      network,
      TESTNET_INVARIANT_ADDRESS,
      DEFAULT_CONTRACT_OPTIONS
    )

    if (initPool) {
      const createPoolTx = yield* call(
        [invariant, invariant.createPoolTx],
        poolKeyData,
        spotSqrtPrice
      )
      txs.push(createPoolTx)

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
    txs.push(tx)

    const batchedTx = api.tx.utility.batchAll(txs)
    const signedBatchedTx = yield* call([batchedTx, batchedTx.signAsync], walletAddress, {
      signer: adapter.signer as Signer
    })
    const txResult = yield* call(sendTx, signedBatchedTx)

    closeSnackbar(loaderCreatePosition)
    yield put(snackbarsActions.remove(loaderCreatePosition))

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

export function* handleGetCurrentPositionTicks(action: PayloadAction<number>) {
  const walletAddress = yield* select(address)
  const connection = yield* getConnection()
  const network = yield* select(networkType)
  const invariant = yield* call(Invariant.load, connection, network, TESTNET_INVARIANT_ADDRESS, {
    storageDepositLimit: 10000000000,
    refTime: 10000000000,
    proofSize: 10000000000
  })

  const position = yield* call([invariant, invariant.getPosition], walletAddress, 0n)

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

export function* initPositionHandler(): Generator {
  yield* takeEvery(actions.initPosition, handleInitPosition)
}

export function* getPositionsListHandler(): Generator {
  yield* takeLatest(actions.getPositionsList, handleGetPositionsList)
}

export function* getCurrentPositionTicksHandler(): Generator {
  yield* takeEvery(actions.getCurrentPositionTicks, handleGetCurrentPositionTicks)
}

export function* positionsSaga(): Generator {
  yield all(
    [initPositionHandler, getPositionsListHandler, getCurrentPositionTicksHandler].map(spawn)
  )
}
