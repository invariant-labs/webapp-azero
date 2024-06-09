import { PoolKey, TESTNET_WAZERO_ADDRESS, sendTx } from '@invariant-labs/a0-sdk'
import { calculateTokenAmountsWithSlippage } from '@invariant-labs/a0-sdk/src/utils'
import { Signer } from '@polkadot/api/types'
import { PayloadAction } from '@reduxjs/toolkit'
import {
  INVARIANT_CLAIM_FEE_OPTIONS,
  INVARIANT_CREATE_POOL_OPTIONS,
  INVARIANT_CREATE_POSITION_OPTIONS,
  INVARIANT_REMOVE_POSITION_OPTIONS,
  INVARIANT_WITHDRAW_ALL_WAZERO,
  PSP22_APPROVE_OPTIONS,
  U128MAX,
  WAZERO_DEPOSIT_OPTIONS
} from '@store/consts/static'
import {
  createLiquidityPlot,
  createLoaderKey,
  createPlaceholderLiquidityPlot,
  deserializeTickmap,
  poolKeyToString
} from '@store/consts/utils'
import { FetchTicksAndTickMaps, ListType, actions as poolsActions } from '@store/reducers/pools'
import {
  ClosePositionData,
  GetPositionTicks,
  HandleClaimFee,
  InitPositionData,
  actions
} from '@store/reducers/positions'
import { actions as snackbarsActions } from '@store/reducers/snackbars'
import { actions as walletActions } from '@store/reducers/wallet'
import { invariantAddress, networkType } from '@store/selectors/connection'
import { poolsArraySortedByFees, tickMaps, tokens } from '@store/selectors/pools'
import { address } from '@store/selectors/wallet'
import invariantSingleton from '@store/services/invariantSingleton'
import psp22Singleton from '@store/services/psp22Singleton'
import wrappedAZEROSingleton from '@store/services/wrappedAZEROSingleton'
import { getAlephZeroWallet } from '@utils/web3/wallet'
import { closeSnackbar } from 'notistack'
import { all, call, fork, join, put, select, spawn, takeEvery, takeLatest } from 'typed-redux-saga'
import { getConnection } from './connection'
import { fetchAllPoolKeys, fetchTicksAndTickMaps } from './pools'
import { fetchBalances } from './wallet'

function* handleInitPosition(action: PayloadAction<InitPositionData>): Generator {
  const {
    poolKeyData,
    lowerTick,
    upperTick,
    spotSqrtPrice,
    tokenXAmount,
    tokenYAmount,
    liquidityDelta,
    initPool,
    slippageTolerance
  } = action.payload

  const { tokenX, tokenY, feeTier } = poolKeyData

  if (
    (tokenX === TESTNET_WAZERO_ADDRESS && tokenXAmount !== 0n) ||
    (tokenY === TESTNET_WAZERO_ADDRESS && tokenYAmount !== 0n)
  ) {
    return yield* call(handleInitPositionWithAZERO, action)
  }

  const loaderCreatePosition = createLoaderKey()
  const loaderSigningTx = createLoaderKey()

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
    const invAddress = yield* select(invariantAddress)

    const txs = []

    const psp22 = yield* call([psp22Singleton, psp22Singleton.loadInstance], api, network)

    const [xAmountWithSlippage, yAmountWithSlippage] = calculateTokenAmountsWithSlippage(
      feeTier.tickSpacing,
      spotSqrtPrice,
      liquidityDelta,
      lowerTick,
      upperTick,
      slippageTolerance,
      true
    )

    const XTokenTx = psp22.approveTx(invAddress, xAmountWithSlippage, tokenX, PSP22_APPROVE_OPTIONS)
    txs.push(XTokenTx)

    const YTokenTx = psp22.approveTx(invAddress, yAmountWithSlippage, tokenY, PSP22_APPROVE_OPTIONS)
    txs.push(YTokenTx)

    const invariant = yield* call(
      [invariantSingleton, invariantSingleton.loadInstance],
      api,
      network,
      invAddress
    )

    if (initPool) {
      const createPoolTx = invariant.createPoolTx(
        poolKeyData,
        spotSqrtPrice,
        INVARIANT_CREATE_POOL_OPTIONS
      )
      txs.push(createPoolTx)

      yield* call(fetchAllPoolKeys)
    }

    const tx = invariant.createPositionTx(
      poolKeyData,
      lowerTick,
      upperTick,
      liquidityDelta,
      spotSqrtPrice,
      slippageTolerance,
      INVARIANT_CREATE_POSITION_OPTIONS
    )
    txs.push(tx)

    const batchedTx = api.tx.utility.batchAll(txs)

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

    yield* put(actions.setInitPositionSuccess(true))

    closeSnackbar(loaderCreatePosition)
    yield put(snackbarsActions.remove(loaderCreatePosition))

    yield put(
      snackbarsActions.add({
        message: 'Position successfully created',
        variant: 'success',
        persist: false,
        txid: txResult.hash
      })
    )

    yield put(actions.getPositionsList())

    yield* call(fetchBalances, [tokenX, tokenY])
  } catch (error) {
    console.log(error)

    yield* put(actions.setInitPositionSuccess(false))

    closeSnackbar(loaderCreatePosition)
    yield put(snackbarsActions.remove(loaderCreatePosition))
    closeSnackbar(loaderSigningTx)
    yield put(snackbarsActions.remove(loaderSigningTx))

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
  const loaderSigningTx = createLoaderKey()

  const {
    poolKeyData,
    lowerTick,
    upperTick,
    spotSqrtPrice,
    tokenXAmount,
    tokenYAmount,
    liquidityDelta,
    initPool,
    slippageTolerance
  } = action.payload

  const { tokenX, tokenY, feeTier } = poolKeyData

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
    const invAddress = yield* select(invariantAddress)

    const txs = []

    const wazero = yield* call(
      [wrappedAZEROSingleton, wrappedAZEROSingleton.loadInstance],
      api,
      network
    )

    const depositTx = wazero.depositTx(
      tokenX === TESTNET_WAZERO_ADDRESS ? tokenXAmount : tokenYAmount,
      WAZERO_DEPOSIT_OPTIONS
    )
    txs.push(depositTx)

    const psp22 = yield* call([psp22Singleton, psp22Singleton.loadInstance], api, network)

    const [xAmountWithSlippage, yAmountWithSlippage] = calculateTokenAmountsWithSlippage(
      feeTier.tickSpacing,
      spotSqrtPrice,
      liquidityDelta,
      lowerTick,
      upperTick,
      slippageTolerance,
      true
    )

    const XTokenTx = psp22.approveTx(invAddress, xAmountWithSlippage, tokenX, PSP22_APPROVE_OPTIONS)
    txs.push(XTokenTx)

    const YTokenTx = psp22.approveTx(invAddress, yAmountWithSlippage, tokenY, PSP22_APPROVE_OPTIONS)
    txs.push(YTokenTx)

    const invariant = yield* call(
      [invariantSingleton, invariantSingleton.loadInstance],
      api,
      network,
      invAddress
    )

    if (initPool) {
      const createPoolTx = invariant.createPoolTx(
        poolKeyData,
        spotSqrtPrice,
        INVARIANT_CREATE_POOL_OPTIONS
      )
      txs.push(createPoolTx)

      yield* call(fetchAllPoolKeys)
    }

    const tx = invariant.createPositionTx(
      poolKeyData,
      lowerTick,
      upperTick,
      liquidityDelta,
      spotSqrtPrice,
      slippageTolerance,
      INVARIANT_CREATE_POSITION_OPTIONS
    )
    txs.push(tx)

    const approveTx = psp22.approveTx(
      invAddress,
      U128MAX,
      TESTNET_WAZERO_ADDRESS,
      PSP22_APPROVE_OPTIONS
    )
    txs.push(approveTx)

    const unwrapTx = invariant.withdrawAllWAZEROTx(
      TESTNET_WAZERO_ADDRESS,
      INVARIANT_WITHDRAW_ALL_WAZERO
    )
    txs.push(unwrapTx)

    const resetApproveTx = psp22.approveTx(
      invAddress,
      0n,
      TESTNET_WAZERO_ADDRESS,
      PSP22_APPROVE_OPTIONS
    )
    txs.push(resetApproveTx)

    const batchedTx = api.tx.utility.batchAll(txs)

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

    yield* put(actions.setInitPositionSuccess(true))

    closeSnackbar(loaderCreatePosition)
    yield put(snackbarsActions.remove(loaderCreatePosition))

    yield put(
      snackbarsActions.add({
        message: 'Position successfully created',
        variant: 'success',
        persist: false,
        txid: txResult.hash
      })
    )

    yield put(walletActions.getSelectedTokens([tokenX, tokenY]))

    yield put(actions.getPositionsList())

    yield* call(fetchBalances, [tokenX === TESTNET_WAZERO_ADDRESS ? tokenY : tokenX])
  } catch (error) {
    console.log(error)

    yield* put(actions.setInitPositionSuccess(false))

    closeSnackbar(loaderCreatePosition)
    yield put(snackbarsActions.remove(loaderCreatePosition))
    closeSnackbar(loaderSigningTx)
    yield put(snackbarsActions.remove(loaderSigningTx))

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
    const api = yield* getConnection()
    const network = yield* select(networkType)
    const invAddress = yield* select(invariantAddress)
    const invariant = yield* call(
      [invariantSingleton, invariantSingleton.loadInstance],
      api,
      network,
      invAddress
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

export function* handleGetCurrentPositionTicks(action: PayloadAction<GetPositionTicks>) {
  const { poolKey, lowerTickIndex, upperTickIndex } = action.payload
  const api = yield* getConnection()
  const network = yield* select(networkType)
  const invAddress = yield* select(invariantAddress)

  const invariant = yield* call(
    [invariantSingleton, invariantSingleton.loadInstance],
    api,
    network,
    invAddress
  )

  const [lowerTick, upperTick] = yield* all([
    call([invariant, invariant.getTick], poolKey, lowerTickIndex),
    call([invariant, invariant.getTick], poolKey, upperTickIndex)
  ])

  yield put(
    actions.setCurrentPositionTicks({
      lowerTick,
      upperTick
    })
  )
}

export function* handleGetCurrentPlotTicks(
  action: PayloadAction<{ poolKey: PoolKey; isXtoY: boolean }>
): Generator {
  const { poolKey, isXtoY } = action.payload
  const api = yield* getConnection()
  const network = yield* select(networkType)
  const invAddress = yield* select(invariantAddress)
  let allTickmaps = yield* select(tickMaps)
  const allTokens = yield* select(tokens)
  const allPools = yield* select(poolsArraySortedByFees)

  const xDecimal = allTokens[poolKey.tokenX].decimals
  const yDecimal = allTokens[poolKey.tokenY].decimals

  try {
    const invariant = yield* call(
      [invariantSingleton, invariantSingleton.loadInstance],
      api,
      network,
      invAddress
    )

    if (!allTickmaps[poolKeyToString(poolKey)]) {
      const fetchTicksAndTickMapsAction: PayloadAction<FetchTicksAndTickMaps> = {
        type: poolsActions.getTicksAndTickMaps.type,
        payload: {
          tokenFrom: allTokens[poolKey.tokenX].address,
          tokenTo: allTokens[poolKey.tokenY].address,
          allPools
        }
      }

      const fetchTask = yield* fork(fetchTicksAndTickMaps, fetchTicksAndTickMapsAction)

      yield* join(fetchTask)
      allTickmaps = yield* select(tickMaps)
    }

    const rawTicks = yield* call(
      [invariant, invariant.getAllLiquidityTicks],
      poolKey,
      deserializeTickmap(allTickmaps[poolKeyToString(poolKey)])
    )
    if (rawTicks.length === 0) {
      const data = createPlaceholderLiquidityPlot(
        action.payload.isXtoY,
        0,
        poolKey.feeTier.tickSpacing,
        xDecimal,
        yDecimal
      )
      yield* put(actions.setPlotTicks(data))
      return
    }

    const ticksData = createLiquidityPlot(
      rawTicks,
      poolKey.feeTier.tickSpacing,
      isXtoY,
      xDecimal,
      yDecimal
    )
    yield put(actions.setPlotTicks(ticksData))
  } catch (error) {
    console.log(error)
    const data = createPlaceholderLiquidityPlot(
      action.payload.isXtoY,
      10,
      poolKey.feeTier.tickSpacing,
      xDecimal,
      yDecimal
    )
    yield* put(actions.setErrorPlotTicks(data))
  }
}

export function* handleClaimFee(action: PayloadAction<HandleClaimFee>) {
  const { index, addressTokenX, addressTokenY } = action.payload

  if (addressTokenX === TESTNET_WAZERO_ADDRESS || addressTokenY === TESTNET_WAZERO_ADDRESS) {
    yield* call(handleClaimFeeWithAZERO, action)
    return
  }

  const loaderKey = createLoaderKey()
  const loaderSigningTx = createLoaderKey()
  try {
    yield put(
      snackbarsActions.add({
        message: 'Claiming fee...',
        variant: 'pending',
        persist: true,
        key: loaderKey
      })
    )
    const walletAddress = yield* select(address)
    const api = yield* getConnection()
    const network = yield* select(networkType)
    const invAddress = yield* select(invariantAddress)

    const invariant = yield* call(
      [invariantSingleton, invariantSingleton.loadInstance],
      api,
      network,
      invAddress
    )

    const adapter = yield* call(getAlephZeroWallet)

    const tx = invariant.claimFeeTx(index, INVARIANT_CLAIM_FEE_OPTIONS)

    yield put(
      snackbarsActions.add({
        message: 'Signing transaction...',
        variant: 'pending',
        persist: true,
        key: loaderSigningTx
      })
    )

    const signedTx = yield* call([tx, tx.signAsync], walletAddress, {
      signer: adapter.signer as Signer
    })

    closeSnackbar(loaderSigningTx)
    yield put(snackbarsActions.remove(loaderSigningTx))

    const txResult = yield* call(sendTx, signedTx)

    closeSnackbar(loaderKey)
    yield put(snackbarsActions.remove(loaderKey))
    yield put(
      snackbarsActions.add({
        message: 'Fee successfully claimed',
        variant: 'success',
        persist: false,
        txid: txResult.hash
      })
    )

    yield put(actions.getSinglePosition(index))

    yield* call(fetchBalances, [
      addressTokenX === TESTNET_WAZERO_ADDRESS ? addressTokenY : addressTokenX
    ])
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

export function* handleClaimFeeWithAZERO(action: PayloadAction<HandleClaimFee>) {
  const loaderKey = createLoaderKey()
  const loaderSigningTx = createLoaderKey()

  try {
    yield put(
      snackbarsActions.add({
        message: 'Claiming fee...',
        variant: 'pending',
        persist: true,
        key: loaderKey
      })
    )

    const walletAddress = yield* select(address)
    const api = yield* getConnection()
    const network = yield* select(networkType)
    const invAddress = yield* select(invariantAddress)
    const { index, addressTokenX, addressTokenY } = action.payload

    const invariant = yield* call(
      [invariantSingleton, invariantSingleton.loadInstance],
      api,
      network,
      invAddress
    )
    const psp22 = yield* call([psp22Singleton, psp22Singleton.loadInstance], api, network)
    const adapter = yield* call(getAlephZeroWallet)

    const txs = []
    const claimTx = invariant.claimFeeTx(index, INVARIANT_CLAIM_FEE_OPTIONS)
    txs.push(claimTx)

    const approveTx = psp22.approveTx(
      invAddress,
      U128MAX,
      TESTNET_WAZERO_ADDRESS,
      PSP22_APPROVE_OPTIONS
    )
    txs.push(approveTx)

    const unwrapTx = invariant.withdrawAllWAZEROTx(
      TESTNET_WAZERO_ADDRESS,
      INVARIANT_WITHDRAW_ALL_WAZERO
    )
    txs.push(unwrapTx)

    const resetApproveTx = psp22.approveTx(
      invAddress,
      0n,
      TESTNET_WAZERO_ADDRESS,
      PSP22_APPROVE_OPTIONS
    )
    txs.push(resetApproveTx)

    const batchedTx = api.tx.utility.batchAll(txs)

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

    yield put(actions.getSinglePosition(index))

    yield* call(fetchBalances, [addressTokenX, addressTokenY])
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
  const api = yield* getConnection()
  const network = yield* select(networkType)
  const invAddress = yield* select(invariantAddress)
  const invariant = yield* call(
    [invariantSingleton, invariantSingleton.loadInstance],
    api,
    network,
    invAddress
  )
  const position = yield* call([invariant, invariant.getPosition], walletAddress, action.payload)
  yield* put(
    actions.setSinglePosition({
      index: action.payload,
      position
    })
  )
  yield* put(
    actions.getCurrentPositionTicks({
      poolKey: position.poolKey,
      lowerTickIndex: position.lowerTickIndex,
      upperTickIndex: position.upperTickIndex
    })
  )
  yield* put(
    poolsActions.getPoolsDataForList({ poolKeys: [position.poolKey], listType: ListType.POSITIONS })
  )
}

export function* handleClosePosition(action: PayloadAction<ClosePositionData>) {
  const { addressTokenX, addressTokenY, onSuccess, positionIndex } = action.payload

  if (addressTokenX === TESTNET_WAZERO_ADDRESS || addressTokenY === TESTNET_WAZERO_ADDRESS) {
    yield* call(handleClosePositionWithAZERO, action)
    return
  }

  const loaderKey = createLoaderKey()
  const loaderSigningTx = createLoaderKey()

  try {
    yield put(
      snackbarsActions.add({
        message: 'Removing position...',
        variant: 'pending',
        persist: true,
        key: loaderKey
      })
    )

    const walletAddress = yield* select(address)
    const api = yield* getConnection()
    const network = yield* select(networkType)
    const invAddress = yield* select(invariantAddress)

    const invariant = yield* call(
      [invariantSingleton, invariantSingleton.loadInstance],
      api,
      network,
      invAddress
    )
    const adapter = yield* call(getAlephZeroWallet)

    const tx = invariant.removePositionTx(positionIndex, INVARIANT_REMOVE_POSITION_OPTIONS)

    yield put(
      snackbarsActions.add({
        message: 'Signing transaction...',
        variant: 'pending',
        persist: true,
        key: loaderSigningTx
      })
    )

    const signedTx = yield* call([tx, tx.signAsync], walletAddress, {
      signer: adapter.signer as Signer
    })

    closeSnackbar(loaderSigningTx)
    yield put(snackbarsActions.remove(loaderSigningTx))

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
    onSuccess()

    yield* call(fetchBalances, [addressTokenX, addressTokenY])
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

export function* handleClosePositionWithAZERO(action: PayloadAction<ClosePositionData>) {
  const loaderSigningTx = createLoaderKey()
  const loaderKey = createLoaderKey()

  try {
    yield put(
      snackbarsActions.add({
        message: 'Removing position...',
        variant: 'pending',
        persist: true,
        key: loaderKey
      })
    )

    const { addressTokenX, addressTokenY, positionIndex, onSuccess } = action.payload
    const walletAddress = yield* select(address)
    const api = yield* getConnection()
    const network = yield* select(networkType)
    const invAddress = yield* select(invariantAddress)
    const invariant = yield* call(
      [invariantSingleton, invariantSingleton.loadInstance],
      api,
      network,
      invAddress
    )
    const psp22 = yield* call([psp22Singleton, psp22Singleton.loadInstance], api, network)
    const adapter = yield* call(getAlephZeroWallet)

    const txs = []

    const removePositionTx = invariant.removePositionTx(positionIndex)
    txs.push(removePositionTx)

    const approveTx = psp22.approveTx(invAddress, U128MAX, TESTNET_WAZERO_ADDRESS)
    txs.push(approveTx)

    const unwrapTx = invariant.withdrawAllWAZEROTx(TESTNET_WAZERO_ADDRESS)
    txs.push(unwrapTx)

    const resetApproveTx = psp22.approveTx(invAddress, 0n, TESTNET_WAZERO_ADDRESS)
    txs.push(resetApproveTx)

    const batchedTx = api.tx.utility.batchAll(txs)

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
    onSuccess()

    yield* call(fetchBalances, [addressTokenX, addressTokenY])
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

export function* getCurrentPlotTicksHandler(): Generator {
  yield* takeLatest(actions.getCurrentPlotTicks, handleGetCurrentPlotTicks)
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
      initPositionHandler,
      getPositionsListHandler,
      getCurrentPositionTicksHandler,
      getCurrentPlotTicksHandler,
      claimFeeHandler,
      getSinglePositionHandler,
      closePositionHandler
    ].map(spawn)
  )
}
