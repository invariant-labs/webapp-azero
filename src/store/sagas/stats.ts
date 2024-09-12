import { PoolKey } from '@invariant-labs/a0-sdk'
import { actions, PoolStatsData, TimeData, TokenStatsData } from '@store/reducers/stats'
import { actions as poolsActions } from '@store/reducers/pools'
import { networkType } from '@store/selectors/connection'
import { tokens } from '@store/selectors/pools'
import { address } from '@store/selectors/wallet'
import {
  getCoingeckoPricesData,
  getNetworkStats,
  getTokenDataByAddresses,
  printBigint
} from '@utils/utils'
import { call, put, select, takeEvery } from 'typed-redux-saga'
import { getPSP22 } from './connection'

export function* getStats(): Generator {
  try {
    const currentNetwork = yield* select(networkType)
    const walletAddress = yield* select(address)
    const psp22 = yield* getPSP22()

    const data = yield* call(getNetworkStats, currentNetwork.toLowerCase())

    const volume24 = {
      value: 0,
      change: 0
    }
    const tvl24 = {
      value: 0,
      change: 0
    }
    const fees24 = {
      value: 0,
      change: 0
    }

    const tokensDataObject: Record<string, TokenStatsData> = {}
    let poolsData: PoolStatsData[] = []

    const volumeForTimestamps: Record<string, number> = {}
    const liquidityForTimestamps: Record<string, number> = {}
    const feesForTimestamps: Record<string, number> = {}

    const lastTimestamp = Math.max(
      ...Object.values(data)
        .filter(snaps => snaps.length > 0)
        .map(snaps => +snaps[snaps.length - 1].timestamp)
    )

    Object.entries(data).forEach(([poolKey, snapshots]) => {
      const parsedPoolKey: PoolKey = JSON.parse(poolKey)

      if (!tokensDataObject[parsedPoolKey.tokenX]) {
        tokensDataObject[parsedPoolKey.tokenX] = {
          address: parsedPoolKey.tokenX,
          price: 0,
          volume24: 0,
          tvl: 0
        }
      }

      if (!tokensDataObject[parsedPoolKey.tokenY]) {
        tokensDataObject[parsedPoolKey.tokenY] = {
          address: parsedPoolKey.tokenY,
          price: 0,
          volume24: 0,
          tvl: 0
        }
      }

      if (!snapshots.length) {
        poolsData.push({
          volume24: 0,
          tvl: 0,
          tokenX: parsedPoolKey.tokenX,
          tokenY: parsedPoolKey.tokenY,
          fee: +printBigint(parsedPoolKey.feeTier.fee, 10n)
          // apy: poolsApy[address] ?? 0,
        })
        return
      }

      const tokenX = parsedPoolKey.tokenX
      const tokenY = parsedPoolKey.tokenY

      const lastSnapshot = snapshots[snapshots.length - 1]

      tokensDataObject[tokenX].volume24 +=
        lastSnapshot.timestamp === lastTimestamp ? lastSnapshot.volumeX.usdValue24 : 0
      tokensDataObject[tokenY].volume24 +=
        lastSnapshot.timestamp === lastTimestamp ? lastSnapshot.volumeY.usdValue24 : 0
      tokensDataObject[tokenX].tvl += lastSnapshot.liquidityX.usdValue24
      tokensDataObject[tokenY].tvl += lastSnapshot.liquidityY.usdValue24

      poolsData.push({
        volume24:
          lastSnapshot.timestamp === lastTimestamp
            ? lastSnapshot.volumeX.usdValue24 + lastSnapshot.volumeY.usdValue24
            : 0,
        tvl:
          lastSnapshot.timestamp === lastTimestamp
            ? lastSnapshot.liquidityX.usdValue24 + lastSnapshot.liquidityY.usdValue24
            : 0,
        tokenX: parsedPoolKey.tokenX,
        tokenY: parsedPoolKey.tokenY,
        fee: +printBigint(parsedPoolKey.feeTier.fee, 10n)
        // apy: poolsApy[address] ?? 0,
      })

      snapshots.slice(-30).forEach(snapshot => {
        const timestamp = snapshot.timestamp.toString()

        if (!volumeForTimestamps[timestamp]) {
          volumeForTimestamps[timestamp] = 0
        }

        if (!liquidityForTimestamps[timestamp]) {
          liquidityForTimestamps[timestamp] = 0
        }

        if (!feesForTimestamps[timestamp]) {
          feesForTimestamps[timestamp] = 0
        }

        volumeForTimestamps[timestamp] += snapshot.volumeX.usdValue24 + snapshot.volumeY.usdValue24
        liquidityForTimestamps[timestamp] +=
          snapshot.liquidityX.usdValue24 + snapshot.liquidityY.usdValue24
        feesForTimestamps[timestamp] += snapshot.feeX.usdValue24 + snapshot.feeY.usdValue24
      })
    })

    const tokensPricesData = yield* call(getCoingeckoPricesData)
    const allTokens = yield* select(tokens)

    tokensPricesData.forEach(token => {
      Object.entries(allTokens).forEach(([address, tokenData]) => {
        if (tokenData.coingeckoId === token.id) {
          tokensDataObject[address].price = token.current_price
        }
      })
    })

    const volumePlot: TimeData[] = Object.entries(volumeForTimestamps)
      .map(([timestamp, value]) => ({
        timestamp: +timestamp,
        value
      }))
      .sort((a, b) => a.timestamp - b.timestamp)
    const liquidityPlot: TimeData[] = Object.entries(liquidityForTimestamps)
      .map(([timestamp, value]) => ({
        timestamp: +timestamp,
        value
      }))
      .sort((a, b) => a.timestamp - b.timestamp)
    const feePlot: TimeData[] = Object.entries(feesForTimestamps)
      .map(([timestamp, value]) => ({
        timestamp: +timestamp,
        value
      }))
      .sort((a, b) => a.timestamp - b.timestamp)

    const tiersToOmit = [0.001, 0.003]

    poolsData = poolsData.filter(pool => !tiersToOmit.includes(pool.fee))

    volume24.value = volumePlot.length ? volumePlot[volumePlot.length - 1].value : 0
    tvl24.value = liquidityPlot.length ? liquidityPlot[liquidityPlot.length - 1].value : 0
    fees24.value = feePlot.length ? feePlot[feePlot.length - 1].value : 0

    const prevVolume24 = volumePlot.length > 1 ? volumePlot[volumePlot.length - 2].value : 0
    const prevTvl24 = liquidityPlot.length > 1 ? liquidityPlot[liquidityPlot.length - 2].value : 0
    const prevFees24 = feePlot.length > 1 ? feePlot[feePlot.length - 2].value : 0

    volume24.change = prevVolume24 ? ((volume24.value - prevVolume24) / prevVolume24) * 100 : 0
    tvl24.change = prevTvl24 ? ((tvl24.value - prevTvl24) / prevTvl24) * 100 : 0
    fees24.change = prevFees24 ? ((fees24.value - prevFees24) / prevFees24) * 100 : 0

    yield* put(
      actions.setCurrentStats({
        volume24,
        tvl24,
        fees24,
        tokensData: Object.values(tokensDataObject),
        poolsData,
        volumePlot,
        liquidityPlot
      })
    )

    const unknownTokens = new Set<string>()

    Object.keys(data).forEach(poolKey => {
      const parsedPoolKey: PoolKey = JSON.parse(poolKey)

      if (!allTokens[parsedPoolKey.tokenX]) {
        unknownTokens.add(parsedPoolKey.tokenX)
      }

      if (!allTokens[parsedPoolKey.tokenY]) {
        unknownTokens.add(parsedPoolKey.tokenY)
      }
    })

    const unknownTokensData = yield* call(
      getTokenDataByAddresses,
      [...unknownTokens],
      psp22,
      walletAddress
    )
    yield* put(poolsActions.addTokens(unknownTokensData))
  } catch (error) {
    console.log(error)
  }
}

export function* statsHandler(): Generator {
  yield* takeEvery(actions.getCurrentStats, getStats)
}
