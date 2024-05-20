import { call, put, takeEvery, take, select, all, spawn, takeLatest } from 'typed-redux-saga'
import { actions as snackbarsActions } from '@store/reducers/snackbars'
import { PayloadAction } from '@reduxjs/toolkit'
import {
  ClosePositionData,
  GetCurrentTicksData,
  InitPositionData,
  actions
} from '@store/reducers/positions'
import { ListType, actions as poolsActions } from '@store/reducers/pools'
import { createLoaderKey, stringifyPoolKey } from '@store/consts/utils'
import { closeSnackbar } from 'notistack'
import {
  Invariant,
  PSP22,
  PoolKey,
  TESTNET_INVARIANT_ADDRESS,
  newPoolKey,
  sendAndDebugTx,
  sendTx,
  toSqrtPrice
} from '@invariant-labs/a0-sdk'
import { getConnection } from './connection'
import { networkType } from '@store/selectors/connection'
import { address } from '@store/selectors/wallet'
import { getAlephZeroWallet } from '@utils/web3/wallet'
import { DEFAULT_CONTRACT_OPTIONS, TokenList } from '@store/consts/static'
import { Signer } from '@polkadot/api/types'
import { fetchAllPoolKeys } from './pools'
import { tokens } from '@store/selectors/pools'

function* handleInitPosition(action: PayloadAction<InitPositionData>): Generator {
  const loaderCreatePosition = createLoaderKey()
  const loaderTokenX = createLoaderKey()
  const loaderTokenY = createLoaderKey()
  const loaderSigningTx = createLoaderKey()

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

  const { tokenX, tokenY, feeTier } = poolKeyData

  const poolKey = newPoolKey(tokenX, tokenY, feeTier)

  try {
    yield put(
      snackbarsActions.add({
        message: 'Creating position',
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
    yield* call(sendTx, signedXTokenTx)

    closeSnackbar(loaderTokenX)
    yield put(snackbarsActions.remove(loaderTokenX))

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
    yield* call(sendTx, signedYTokenTx)

    closeSnackbar(loaderTokenY)
    yield put(snackbarsActions.remove(loaderTokenY))

    const invariant = yield* call(
      [Invariant, Invariant.load],
      api,
      network,
      TESTNET_INVARIANT_ADDRESS,
      DEFAULT_CONTRACT_OPTIONS
    )

    yield put(
      snackbarsActions.add({
        message: 'Signing transaction...',
        variant: 'pending',
        persist: true,
        key: loaderSigningTx
      })
    )

    if (initPool) {
      const createPoolTx = yield* call([invariant, invariant.createPoolTx], poolKey, spotSqrtPrice)

      const signedCreatePoolTx = yield* call(
        [createPoolTx, createPoolTx.signAsync],
        walletAddress,
        {
          signer: adapter.signer as Signer
        }
      )

      yield* call(sendTx, signedCreatePoolTx)

      yield* call(fetchAllPoolKeys)
    }

    const tx = yield* call(
      [invariant, invariant.createPositionTx],
      poolKey,
      lowerTick,
      upperTick,
      liquidityDelta,
      spotSqrtPrice,
      slippageTolerance
    )

    const signedTx = yield* call([tx, tx.signAsync], walletAddress, {
      signer: adapter.signer as Signer
    })

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

    closeSnackbar(loaderSigningTx)
    yield put(snackbarsActions.remove(loaderSigningTx))
    closeSnackbar(loaderCreatePosition)
    yield put(snackbarsActions.remove(loaderCreatePosition))
  } catch (error) {
    console.log(error)

    yield* put(actions.setInitPositionSuccess(false))

    closeSnackbar(loaderSigningTx)
    yield put(snackbarsActions.remove(loaderSigningTx))
    closeSnackbar(loaderCreatePosition)
    yield put(snackbarsActions.remove(loaderCreatePosition))
    closeSnackbar(loaderTokenX)
    yield put(snackbarsActions.remove(loaderTokenX))
    closeSnackbar(loaderTokenY)
    yield put(snackbarsActions.remove(loaderTokenY))

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
      const poolKeyString = stringifyPoolKey(positions[i].poolKey)

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

export function* handleGetCurrentPlotTicks(action: PayloadAction<GetCurrentTicksData>): Generator {}

export function* handleClaimFee(action: PayloadAction<number>) {}

export function* handleClosePosition(action: PayloadAction<ClosePositionData>) {}

export function* handleGetSinglePosition(action: PayloadAction<number>) {}

export function* handleGetCurrentPositionRangeTicks(action: PayloadAction<string>) {}

export function* initPositionHandler(): Generator {
  yield* takeEvery(actions.initPosition, handleInitPosition)
}
// export function* getCurrentPlotTicksHandler(): Generator {
//   yield* takeLatest(actions.getCurrentPlotTicks, handleGetCurrentPlotTicks)
// }
export function* getPositionsListHandler(): Generator {
  yield* takeLatest(actions.getPositionsList, handleGetPositionsList)
}
// export function* claimFeeHandler(): Generator {
//   yield* takeEvery(actions.claimFee, handleClaimFee)
// }
// export function* closePositionHandler(): Generator {
//   yield* takeEvery(actions.closePosition, handleClosePosition)
// }
// export function* getSinglePositionHandler(): Generator {
//   yield* takeEvery(actions.getSinglePosition, handleGetSinglePosition)
// }
// export function* getCurrentPositionRangeTicksHandler(): Generator {
//   yield* takeEvery(actions.getCurrentPositionRangeTicks, handleGetCurrentPositionRangeTicks)
// }

export function* positionsSaga(): Generator {
  yield all(
    [
      initPositionHandler,
      // getCurrentPlotTicksHandler,
      getPositionsListHandler
      // claimFeeHandler,
      // closePositionHandler,
      // getSinglePositionHandler,
      // getCurrentPositionRangeTicksHandler
    ].map(spawn)
  )
}
