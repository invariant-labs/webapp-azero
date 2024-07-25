import {
  Invariant,
  LiquidityTick,
  Network,
  PSP22,
  PoolKey,
  Position,
  Tick,
  Tickmap,
  calculateSqrtPrice,
  calculateTickDelta,
  getMaxTick,
  getMinTick,
  positionToTick,
  sqrtPriceToPrice
} from '@invariant-labs/a0-sdk'
import {
  CHUNK_SIZE,
  PERCENTAGE_DENOMINATOR,
  PERCENTAGE_SCALE,
  PRICE_SCALE,
  SQRT_PRICE_SCALE,
  TESTNET_BTC_ADDRESS,
  TESTNET_ETH_ADDRESS,
  TESTNET_USDC_ADDRESS,
  TESTNET_WAZERO_ADDRESS
} from '@invariant-labs/a0-sdk/target/consts'
import {
  calculateLiquidityBreakpoints,
  priceToSqrtPrice
} from '@invariant-labs/a0-sdk/target/utils'
import { Keyring } from '@polkadot/api'
import { PoolWithPoolKey } from '@store/reducers/pools'
import { PlotTickData } from '@store/reducers/positions'
import axios from 'axios'
import {
  BTC,
  COINGECKO_QUERY_COOLDOWN,
  DEFAULT_TOKENS,
  ETH,
  ErrorMessage,
  FAUCET_DEPLOYER_MNEMONIC,
  FormatConfig,
  LIQUIDITY_PLOT_DECIMAL,
  POSITIONS_PER_PAGE,
  POSITIONS_PER_QUERY,
  PositionTokenBlock,
  STABLECOIN_ADDRESSES,
  USDC,
  addressTickerMap,
  defaultPrefixConfig,
  defaultThresholds,
  reversedAddressTickerMap,
  subNumbers,
  tokensPrices
} from '@store/consts/static'
import { sleep } from '@store/sagas/wallet'
import {
  BestTier,
  CoinGeckoAPIData,
  FormatNumberThreshold,
  PrefixConfig,
  Token,
  TokenPriceData
} from '@store/consts/types'
import icons from '@static/icons'

export const createLoaderKey = () => (new Date().getMilliseconds() + Math.random()).toString()

export const getInvariantAddress = (network: Network): string | null => {
  switch (network) {
    case Network.Testnet:
      return '5FiTccBSAH9obLA4Q33hYrL3coPm2SE276rFPVttFPFnaxnC'
    default:
      return null
  }
}

export const showPrefix = (nr: number, config: PrefixConfig = defaultPrefixConfig): string => {
  const abs = Math.abs(nr)

  if (typeof config.B !== 'undefined' && abs >= config.B) {
    return 'B'
  }

  if (typeof config.M !== 'undefined' && abs >= config.M) {
    return 'M'
  }

  if (typeof config.K !== 'undefined' && abs >= config.K) {
    return 'K'
  }

  return ''
}

export const formatNumbers =
  (thresholds: FormatNumberThreshold[] = defaultThresholds) =>
  (value: string) => {
    const num = Number(value)
    const abs = Math.abs(num)
    const threshold = thresholds.sort((a, b) => a.value - b.value).find(thr => abs < thr.value)

    const formatted = threshold
      ? (abs / (threshold.divider ?? 1)).toFixed(threshold.decimals)
      : value

    return num < 0 && threshold ? '-' + formatted : formatted
  }

export const trimZeros = (numStr: string): string => {
  return numStr
    .replace(/(\.\d*?)0+$/, '$1')
    .replace(/^0+(\d)|(\d)0+$/gm, '$1$2')
    .replace(/\.$/, '')
}

export const calcYPerXPriceByTickIndex = (
  tickIndex: bigint,
  xDecimal: bigint,
  yDecimal: bigint
): number => {
  const sqrt = +printBigint(calculateSqrtPrice(tickIndex), PRICE_SCALE)

  const proportion = sqrt * sqrt

  return proportion / 10 ** Number(yDecimal - xDecimal)
}

export const calcYPerXPriceBySqrtPrice = (
  sqrtPrice: bigint,
  xDecimal: bigint,
  yDecimal: bigint
): number => {
  const sqrt = +printBigint(sqrtPrice, PRICE_SCALE)

  const proportion = sqrt * sqrt

  return proportion / 10 ** Number(yDecimal - xDecimal)
}

export const trimLeadingZeros = (amount: string): string => {
  const amountParts = amount.split('.')

  if (!amountParts.length) {
    return '0'
  }

  if (amountParts.length === 1) {
    return amountParts[0]
  }

  const reversedDec = Array.from(amountParts[1]).reverse()
  const firstNonZero = reversedDec.findIndex(char => char !== '0')

  if (firstNonZero === -1) {
    return amountParts[0]
  }

  const trimmed = reversedDec.slice(firstNonZero, reversedDec.length).reverse().join('')

  return `${amountParts[0]}.${trimmed}`
}

export const getScaleFromString = (value: string): number => {
  const parts = value.split('.')

  if ((parts?.length ?? 0) < 2) {
    return 0
  }

  return parts[1]?.length ?? 0
}

export const toMaxNumericPlaces = (num: number, places: number): string => {
  const log = Math.floor(Math.log10(num))

  if (log >= places) {
    return num.toFixed(0)
  }

  if (log >= 0) {
    return num.toFixed(places - log - 1)
  }

  return num.toFixed(places + Math.abs(log) - 1)
}

export const calcPriceByTickIndex = (
  amountTickIndex: bigint,
  isXtoY: boolean,
  xDecimal: bigint,
  yDecimal: bigint
): number => {
  const price = calcYPerXPriceByTickIndex(amountTickIndex, xDecimal, yDecimal)

  if (isXtoY) {
    return price
  }

  return price === 0 ? Number.MAX_SAFE_INTEGER : 1 / price
}

export const calcPriceBySqrtPrice = (
  sqrtPrice: bigint,
  isXtoY: boolean,
  xDecimal: bigint,
  yDecimal: bigint
): number => {
  const price = calcYPerXPriceBySqrtPrice(sqrtPrice, xDecimal, yDecimal) ** (isXtoY ? 1 : -1)

  return price
}
export const createPlaceholderLiquidityPlot = (
  isXtoY: boolean,
  yValueToFill: number,
  tickSpacing: bigint,
  tokenXDecimal: bigint,
  tokenYDecimal: bigint
) => {
  const ticksData: PlotTickData[] = []

  const min = getMinTick(tickSpacing)
  const max = getMaxTick(tickSpacing)

  const minPrice = calcPriceByTickIndex(min, isXtoY, tokenXDecimal, tokenYDecimal)

  ticksData.push({
    x: minPrice,
    y: yValueToFill,
    index: min
  })

  const maxPrice = calcPriceByTickIndex(max, isXtoY, tokenXDecimal, tokenYDecimal)

  ticksData.push({
    x: maxPrice,
    y: yValueToFill,
    index: max
  })

  return isXtoY ? ticksData : ticksData.reverse()
}

let isCoinGeckoQueryRunning = false

export const getCoinGeckoTokenPrice = async (id: string): Promise<number | undefined> => {
  while (isCoinGeckoQueryRunning) {
    await sleep(100)
  }
  isCoinGeckoQueryRunning = true

  const cachedLastQueryTimestamp = localStorage.getItem('COINGECKO_LAST_QUERY_TIMESTAMP')
  let lastQueryTimestamp = 0
  if (cachedLastQueryTimestamp) {
    lastQueryTimestamp = Number(cachedLastQueryTimestamp)
  }

  const cachedPriceData = localStorage.getItem('COINGECKO_PRICE_DATA')
  let priceData: CoinGeckoAPIData = []
  if (cachedPriceData && Number(lastQueryTimestamp) + COINGECKO_QUERY_COOLDOWN > Date.now()) {
    priceData = JSON.parse(cachedPriceData)
  } else {
    try {
      const { data } = await axios.get<CoinGeckoAPIData>(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${DEFAULT_TOKENS.map(token => token.coingeckoId)}`
      )
      priceData = data
      localStorage.setItem('COINGECKO_PRICE_DATA', JSON.stringify(priceData))
      localStorage.setItem('COINGECKO_LAST_QUERY_TIMESTAMP', String(Date.now()))
    } catch (e) {
      localStorage.removeItem('COINGECKO_LAST_QUERY_TIMESTAMP')
      localStorage.removeItem('COINGECKO_PRICE_DATA')
      console.log(e)
    }
  }

  isCoinGeckoQueryRunning = false
  return priceData.find(entry => entry.id === id)?.current_price
}

export const getMockedTokenPrice = (symbol: string, network: Network): TokenPriceData => {
  const sufix = network === Network.Testnet ? '_TEST' : '_DEV'
  const prices = tokensPrices[network]
  switch (symbol) {
    case 'BTC':
      return prices[symbol + sufix]
    case 'ETH':
      return prices['W' + symbol + sufix]
    case 'USDC':
      return prices[symbol + sufix]
    default:
      return { price: 0 }
  }
}

export const printBigint = (amount: bigint, decimals: bigint): string => {
  const parsedDecimals = Number(decimals)
  const amountString = amount.toString()
  const isNegative = amountString.length > 0 && amountString[0] === '-'

  const balanceString = isNegative ? amountString.slice(1) : amountString

  if (balanceString.length <= parsedDecimals) {
    return (
      (isNegative ? '-' : '') +
      '0.' +
      '0'.repeat(parsedDecimals - balanceString.length) +
      balanceString
    )
  } else {
    return (
      (isNegative ? '-' : '') +
      trimZeros(
        balanceString.substring(0, balanceString.length - parsedDecimals) +
          '.' +
          balanceString.substring(balanceString.length - parsedDecimals)
      )
    )
  }
}

export const newPrintBigInt = (amount: bigint, decimals: bigint): string => {
  const parsedDecimals = Number(decimals)
  const amountString = amount.toString()
  const isNegative = amountString.length > 0 && amountString[0] === '-'

  const balanceString = isNegative ? amountString.slice(1) : amountString

  if (balanceString.length <= parsedDecimals) {
    const diff = parsedDecimals - balanceString.length

    return (
      (isNegative ? '-' : '') +
      trimZeros('0.' + (diff > 3 ? '0' + printSubNumber(diff) : '0'.repeat(diff)) + balanceString)
    )
  } else {
    return (
      (isNegative ? '-' : '') +
      trimZeros(
        balanceString.substring(0, balanceString.length - parsedDecimals) +
          '.' +
          balanceString.substring(balanceString.length - parsedDecimals)
      )
    )
  }
}

export const printSubNumber = (amount: number): string => {
  return Array.from(String(amount))
    .map(char => subNumbers[+char])
    .join('')
}

export const parseFeeToPathFee = (fee: bigint): string => {
  const parsedFee = (fee / BigInt(Math.pow(10, 8))).toString().padStart(3, '0')
  return parsedFee.slice(0, parsedFee.length - 2) + '_' + parsedFee.slice(parsedFee.length - 2)
}

export const getTokenDataByAddresses = async (
  tokens: string[],
  psp22: PSP22,
  address: string
): Promise<Record<string, Token>> => {
  const promises = tokens.flatMap(token => {
    return [
      psp22.tokenSymbol(token),
      psp22.tokenName(token),
      psp22.tokenDecimals(token),
      psp22.balanceOf(address, token)
    ]
  })
  const results = await Promise.all(promises)

  const newTokens: Record<string, Token> = {}
  tokens.forEach((token, index) => {
    const baseIndex = index * 4
    newTokens[token] = {
      symbol: results[baseIndex] ? (results[baseIndex] as string) : 'UNKNOWN',
      address: token,
      name: results[baseIndex + 1] ? (results[baseIndex + 1] as string) : '',
      decimals: results[baseIndex + 2] as bigint,
      balance: results[baseIndex + 3] as bigint,
      logoURI: icons.unknownToken,
      isUnknown: true
    }
  })
  return newTokens
}

export const getTokenBalances = async (
  tokens: string[],
  psp22: PSP22,
  address: string
): Promise<[string, bigint][]> => {
  const promises: Promise<bigint>[] = []
  tokens.map(token => {
    promises.push(psp22.balanceOf(address, token))
  })
  const results = await Promise.all(promises)

  const tokenBalances: [string, bigint][] = []
  tokens.map((token, index) => {
    tokenBalances.push([token, results[index]])
  })
  return tokenBalances
}

export const getPoolsByPoolKeys = async (
  invariant: Invariant,
  poolKeys: PoolKey[]
): Promise<PoolWithPoolKey[]> => {
  const promises = poolKeys.map(({ tokenX, tokenY, feeTier }) =>
    invariant.getPool(tokenX, tokenY, feeTier)
  )
  const pools = await Promise.all(promises)

  return pools.map((pool, index) => ({
    ...pool,
    poolKey: poolKeys[index]
  }))
}

export const poolKeyToString = (poolKey: PoolKey): string => {
  return (
    poolKey.tokenX +
    '-' +
    poolKey.tokenY +
    '-' +
    poolKey.feeTier.fee +
    '-' +
    poolKey.feeTier.tickSpacing
  )
}

export const getNetworkTokensList = (networkType: Network): Record<string, Token> => {
  switch (networkType) {
    case Network.Mainnet: {
      return {}
    }
    case Network.Testnet:
      return {
        [USDC.address.toString()]: USDC,
        [BTC.address.toString()]: BTC,
        [ETH.address.toString()]: ETH
      }
    default:
      return {}
  }
}

export const getPrimaryUnitsPrice = (
  price: number,
  isXtoY: boolean,
  xDecimal: number,
  yDecimal: number
) => {
  const xToYPrice = isXtoY ? price : 1 / price

  return xToYPrice * 10 ** (yDecimal - xDecimal)
}

export const logBase = (x: number, b: number): number => Math.log(x) / Math.log(b)

export const adjustToSpacing = (baseTick: number, spacing: number, isGreater: boolean): number => {
  const remainder = baseTick % spacing

  if (Math.abs(remainder) === 0) {
    return baseTick
  }

  let adjustment: number
  if (isGreater) {
    if (baseTick >= 0) {
      adjustment = spacing - remainder
    } else {
      adjustment = Math.abs(remainder)
    }
  } else {
    if (baseTick >= 0) {
      adjustment = -remainder
    } else {
      adjustment = -(spacing - Math.abs(remainder))
    }
  }

  return baseTick + adjustment
}

export const spacingMultiplicityLte = (arg: number, spacing: number): number => {
  return adjustToSpacing(arg, spacing, false)
}

export const spacingMultiplicityGte = (arg: number, spacing: number): number => {
  return adjustToSpacing(arg, spacing, true)
}

export const nearestSpacingMultiplicity = (centerTick: number, spacing: number) => {
  const greaterTick = spacingMultiplicityGte(centerTick, spacing)
  const lowerTick = spacingMultiplicityLte(centerTick, spacing)

  const nearestTick =
    Math.abs(greaterTick - centerTick) < Math.abs(lowerTick - centerTick) ? greaterTick : lowerTick

  return Math.max(
    Math.min(nearestTick, Number(getMaxTick(BigInt(spacing)))),
    Number(getMinTick(BigInt(spacing)))
  )
}

export const calculateSqrtPriceFromBalance = (
  price: number,
  spacing: bigint,
  isXtoY: boolean,
  xDecimal: bigint,
  yDecimal: bigint
) => {
  const minTick = getMinTick(spacing)
  const maxTick = getMaxTick(spacing)

  const basePrice = Math.min(
    Math.max(
      price,
      Number(calcPriceByTickIndex(isXtoY ? minTick : maxTick, isXtoY, xDecimal, yDecimal))
    ),
    Number(calcPriceByTickIndex(isXtoY ? maxTick : minTick, isXtoY, xDecimal, yDecimal))
  )

  const primaryUnitsPrice = getPrimaryUnitsPrice(
    basePrice,
    isXtoY,
    Number(xDecimal),
    Number(yDecimal)
  )

  const parsedPrimaryUnits =
    primaryUnitsPrice > 1 && Number.isInteger(primaryUnitsPrice)
      ? primaryUnitsPrice.toString()
      : primaryUnitsPrice.toFixed(24)

  const bigintPrice = convertBalanceToBigint(parsedPrimaryUnits, SQRT_PRICE_SCALE)
  const sqrtPrice = priceToSqrtPrice(bigintPrice)

  const minSqrtPrice = calculateSqrtPrice(minTick)
  const maxSqrtPrice = calculateSqrtPrice(maxTick)

  let validatedSqrtPrice = sqrtPrice
  if (sqrtPrice < minSqrtPrice) {
    validatedSqrtPrice = minSqrtPrice
  } else if (sqrtPrice > maxSqrtPrice) {
    validatedSqrtPrice = maxSqrtPrice
  }

  return validatedSqrtPrice
}

export const calculateTickFromBalance = (
  price: number,
  spacing: bigint,
  isXtoY: boolean,
  xDecimal: bigint,
  yDecimal: bigint
) => {
  const minTick = getMinTick(spacing)
  const maxTick = getMaxTick(spacing)

  const basePrice = Math.max(
    price,
    Number(calcPriceByTickIndex(isXtoY ? minTick : maxTick, isXtoY, xDecimal, yDecimal))
  )
  const primaryUnitsPrice = getPrimaryUnitsPrice(
    basePrice,
    isXtoY,
    Number(xDecimal),
    Number(yDecimal)
  )
  const tick = Math.round(logBase(primaryUnitsPrice, 1.0001))

  return Math.max(
    Math.min(tick, Number(getMaxTick(BigInt(spacing)))),
    Number(getMinTick(BigInt(spacing)))
  )
}

export const nearestTickIndex = (
  price: number,
  spacing: bigint,
  isXtoY: boolean,
  xDecimal: bigint,
  yDecimal: bigint
) => {
  const tick = calculateTickFromBalance(price, spacing, isXtoY, xDecimal, yDecimal)

  return BigInt(nearestSpacingMultiplicity(tick, Number(spacing)))
}

export const convertBalanceToBigint = (amount: string, decimals: bigint | number): bigint => {
  const balanceString = amount.split('.')
  if (balanceString.length !== 2) {
    return BigInt(balanceString[0] + '0'.repeat(Number(decimals)))
  }

  if (balanceString[1].length <= decimals) {
    return BigInt(
      balanceString[0] + balanceString[1] + '0'.repeat(Number(decimals) - balanceString[1].length)
    )
  }
  return 0n
}

export const determinePositionTokenBlock = (
  currentSqrtPrice: bigint,
  lowerTick: bigint,
  upperTick: bigint,
  isXtoY: boolean
) => {
  const lowerPrice = calculateSqrtPrice(lowerTick)
  const upperPrice = calculateSqrtPrice(upperTick)

  const isBelowLowerPrice = lowerPrice >= currentSqrtPrice
  const isAboveUpperPrice = upperPrice <= currentSqrtPrice

  if (isBelowLowerPrice) {
    return isXtoY ? PositionTokenBlock.B : PositionTokenBlock.A
  }
  if (isAboveUpperPrice) {
    return isXtoY ? PositionTokenBlock.A : PositionTokenBlock.B
  }

  return PositionTokenBlock.None
}

export const findPairs = (tokenFrom: string, tokenTo: string, pairs: PoolWithPoolKey[]) => {
  return pairs.filter(
    pool =>
      (tokenFrom === pool.poolKey.tokenX && tokenTo === pool.poolKey.tokenY) ||
      (tokenFrom === pool.poolKey.tokenY && tokenTo === pool.poolKey.tokenX)
  )
}

export const findPairsByPoolKeys = (tokenFrom: string, tokenTo: string, poolKeys: PoolKey[]) => {
  return poolKeys.filter(
    poolKey =>
      (tokenFrom === poolKey.tokenX && tokenTo === poolKey.tokenY) ||
      (tokenFrom === poolKey.tokenY && tokenTo === poolKey.tokenX)
  )
}

export const getPools = async (
  invariant: Invariant,
  poolKeys: PoolKey[]
): Promise<PoolWithPoolKey[]> => {
  const promises = poolKeys.map(poolKey =>
    invariant.getPool(poolKey.tokenX, poolKey.tokenY, poolKey.feeTier)
  )

  const pools = await Promise.all(promises)
  return pools.map((pool, index) => {
    return { ...pool, poolKey: poolKeys[index] }
  })
}

export const calculateConcentrationRange = (
  tickSpacing: bigint,
  concentration: number,
  minimumRange: number,
  currentTick: bigint,
  isXToY: boolean
) => {
  const parsedTickSpacing = Number(tickSpacing)
  const parsedCurrentTick = Number(currentTick)
  const tickDelta = calculateTickDelta(parsedTickSpacing, minimumRange, concentration)
  const lowerTick = parsedCurrentTick - (minimumRange / 2 + tickDelta) * parsedTickSpacing
  const upperTick = parsedCurrentTick + (minimumRange / 2 + tickDelta) * parsedTickSpacing

  return {
    leftRange: BigInt(isXToY ? lowerTick : upperTick),
    rightRange: BigInt(isXToY ? upperTick : lowerTick)
  }
}

export const calcTicksAmountInRange = (
  min: number,
  max: number,
  tickSpacing: number,
  isXtoY: boolean,
  xDecimal: number,
  yDecimal: number
): number => {
  const primaryUnitsMin = getPrimaryUnitsPrice(min, isXtoY, xDecimal, yDecimal)
  const primaryUnitsMax = getPrimaryUnitsPrice(max, isXtoY, xDecimal, yDecimal)
  const minIndex = logBase(primaryUnitsMin, 1.0001)
  const maxIndex = logBase(primaryUnitsMax, 1.0001)

  return Math.ceil(Math.abs(maxIndex - minIndex) / tickSpacing)
}

export const getAllTicks = (
  invariant: Invariant,
  poolKey: PoolKey,
  ticks: bigint[]
): Promise<Tick[]> => {
  const promises: Promise<Tick>[] = []

  for (const tick of ticks) {
    promises.push(invariant.getTick(poolKey, tick))
  }

  return Promise.all(promises)
}

export const tickmapToArray = (tickmap: Tickmap, tickSpacing: bigint): bigint[] => {
  const ticks = []

  for (const [chunkIndex, chunk] of tickmap.bitmap.entries()) {
    for (let bit = 0n; bit < CHUNK_SIZE; bit++) {
      const checkedBit = chunk & (1n << bit)
      if (checkedBit) {
        ticks.push(positionToTick(chunkIndex, bit, tickSpacing))
      }
    }
  }

  return ticks
}

export const deserializeTickmap = (serializedTickmap: string): Tickmap => {
  const deserializedMap: Map<string, string> = new Map(JSON.parse(serializedTickmap))

  const parsedMap = new Map()
  for (const [key, value] of deserializedMap) {
    parsedMap.set(BigInt(key), BigInt(value))
  }

  return { bitmap: parsedMap }
}

export const calculateAmountInWithSlippage = (
  amountOut: bigint,
  sqrtPriceLimit: bigint,
  xToY: boolean,
  fee: bigint
): bigint => {
  const price = +printBigint(sqrtPriceToPrice(sqrtPriceLimit), PRICE_SCALE)
  const amountIn = xToY
    ? Math.ceil(Number(amountOut) / price)
    : Math.ceil(Number(amountOut) * price)

  const amountInWithFee = BigInt(
    Math.ceil(
      Number(amountIn) *
        (Number(PERCENTAGE_DENOMINATOR) / (Number(PERCENTAGE_DENOMINATOR) - Number(fee)))
    )
  )

  return amountInWithFee
}

export const createLiquidityPlot = (
  rawTicks: LiquidityTick[],
  tickSpacing: bigint,
  isXtoY: boolean,
  tokenXDecimal: bigint,
  tokenYDecimal: bigint
): PlotTickData[] => {
  const sortedTicks = rawTicks.sort((a, b) => Number(a.index - b.index))
  const parsedTicks = rawTicks.length ? calculateLiquidityBreakpoints(sortedTicks) : []

  const ticks = rawTicks.map((raw, index) => ({
    ...raw,
    liqudity: parsedTicks[index].liquidity
  }))

  const ticksData: PlotTickData[] = []

  const min = getMinTick(tickSpacing)
  const max = getMaxTick(tickSpacing)

  if (!ticks.length || ticks[0].index > min) {
    const minPrice = calcPriceByTickIndex(min, isXtoY, tokenXDecimal, tokenYDecimal)

    ticksData.push({
      x: minPrice,
      y: 0,
      index: min
    })
  }

  ticks.forEach((tick, i) => {
    if (i === 0 && tick.index - tickSpacing > min) {
      const price = calcPriceByTickIndex(
        tick.index - tickSpacing,
        isXtoY,
        tokenXDecimal,
        tokenYDecimal
      )
      ticksData.push({
        x: price,
        y: 0,
        index: tick.index - tickSpacing
      })
    } else if (i > 0 && tick.index - tickSpacing > ticks[i - 1].index) {
      const price = calcPriceByTickIndex(
        tick.index - tickSpacing,
        isXtoY,
        tokenXDecimal,
        tokenYDecimal
      )
      ticksData.push({
        x: price,
        y: +printBigint(ticks[i - 1].liqudity, LIQUIDITY_PLOT_DECIMAL),
        index: tick.index - tickSpacing
      })
    }

    const price = calcPriceByTickIndex(tick.index, isXtoY, tokenXDecimal, tokenYDecimal)
    ticksData.push({
      x: price,
      y: +printBigint(ticks[i].liqudity, LIQUIDITY_PLOT_DECIMAL),
      index: tick.index
    })
  })
  const lastTick = ticks[ticks.length - 1].index
  if (!ticks.length) {
    const maxPrice = calcPriceByTickIndex(max, isXtoY, tokenXDecimal, tokenYDecimal)

    ticksData.push({
      x: maxPrice,
      y: 0,
      index: max
    })
  } else if (lastTick < max) {
    if (max - lastTick > tickSpacing) {
      const price = calcPriceByTickIndex(
        lastTick + tickSpacing,
        isXtoY,
        tokenXDecimal,
        tokenYDecimal
      )
      ticksData.push({
        x: price,
        y: 0,
        index: lastTick + tickSpacing
      })
    }

    const maxPrice = calcPriceByTickIndex(max, isXtoY, tokenXDecimal, tokenYDecimal)

    ticksData.push({
      x: maxPrice,
      y: 0,
      index: max
    })
  }

  return isXtoY ? ticksData : ticksData.reverse()
}

export const formatNumber = (number: number | bigint | string, noDecimals?: boolean): string => {
  const numberAsNumber = Number(number)
  const isNegative = numberAsNumber < 0
  const absNumberAsString = numberToString(Math.abs(numberAsNumber))

  if (containsOnlyZeroes(absNumberAsString)) {
    return '0'
  }

  const [beforeDot, afterDot] = absNumberAsString.split('.')

  let formattedNumber

  if (Math.abs(numberAsNumber) > FormatConfig.B) {
    const formattedDecimals = noDecimals
      ? ''
      : (FormatConfig.DecimalsAfterDot ? '.' : '') +
        (beforeDot.slice(-FormatConfig.BDecimals) + (afterDot ? afterDot : '')).slice(
          0,
          FormatConfig.DecimalsAfterDot
        )
    formattedNumber =
      beforeDot.slice(0, -FormatConfig.BDecimals) + !noDecimals ? formattedDecimals : '' + 'B'
  } else if (Math.abs(numberAsNumber) > FormatConfig.M) {
    const formattedDecimals = noDecimals
      ? ''
      : (FormatConfig.DecimalsAfterDot ? '.' : '') +
        (beforeDot.slice(-FormatConfig.MDecimals) + (afterDot ? afterDot : '')).slice(
          0,
          FormatConfig.DecimalsAfterDot
        )

    formattedNumber = beforeDot.slice(0, -FormatConfig.MDecimals) + formattedDecimals + 'M'
  } else if (Math.abs(numberAsNumber) > FormatConfig.K) {
    const formattedDecimals = noDecimals
      ? ''
      : (FormatConfig.DecimalsAfterDot ? '.' : '') +
        (beforeDot.slice(-FormatConfig.KDecimals) + (afterDot ? afterDot : '')).slice(
          0,
          FormatConfig.DecimalsAfterDot
        )
    formattedNumber = beforeDot.slice(0, -FormatConfig.KDecimals) + formattedDecimals + 'K'
  } else if (afterDot && countLeadingZeros(afterDot) <= 3) {
    const roundedNumber = numberAsNumber.toFixed(countLeadingZeros(afterDot) + 4).slice(0, -1)
    formattedNumber = trimZeros(roundedNumber)
  } else {
    const leadingZeros = afterDot ? countLeadingZeros(afterDot) : 0

    const parsedAfterDot =
      String(parseInt(afterDot)).length > 3 ? String(parseInt(afterDot)).slice(0, 3) : afterDot
    formattedNumber = trimZeros(
      beforeDot +
        '.' +
        (parsedAfterDot
          ? leadingZeros > 3
            ? '0' + printSubNumber(leadingZeros) + parseInt(parsedAfterDot)
            : parsedAfterDot
          : '')
    )
  }

  return isNegative ? '-' + formattedNumber : formattedNumber
}

export const formatBalance = (number: number | bigint | string): string => {
  const numberAsString = numberToString(number)

  const [beforeDot, afterDot] = numberAsString.split('.')

  return beforeDot.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (afterDot ? '.' + afterDot : '')
}

export const countLeadingZeros = (str: string): number => {
  return (str.match(/^0+/) || [''])[0].length
}

export const isErrorMessage = (message: string): boolean => {
  for (const value of Object.values(ErrorMessage)) {
    if (message === value) {
      return true
    }
  }
  return false
}

export const getNewTokenOrThrow = async (
  address: string,
  psp22: PSP22,
  walletAddress: string
): Promise<Record<string, Token>> => {
  const tokenData = await getTokenDataByAddresses([address], psp22, walletAddress)

  if (tokenData) {
    return tokenData
  } else {
    throw new Error('Failed to fetch token information')
  }
}

export const addNewTokenToLocalStorage = (address: string, network: Network) => {
  const currentListStr = localStorage.getItem(`CUSTOM_TOKENS_${network}`)

  const currentList = currentListStr !== null ? JSON.parse(currentListStr) : []

  currentList.push(address)

  localStorage.setItem(`CUSTOM_TOKENS_${network}`, JSON.stringify([...new Set(currentList)]))
}

export const numberToString = (number: number | bigint | string): string => {
  return String(number).includes('e-')
    ? Number(number).toFixed(parseInt(String(number).split('e-')[1]))
    : String(number)
}

export const containsOnlyZeroes = (string: string): boolean => {
  return /^(?!.*[1-9]).*$/.test(string)
}

export const stringToFixed = (string: string, numbersAfterDot: number): string => {
  return string.includes('.') ? string.slice(0, string.indexOf('.') + 1 + numbersAfterDot) : string
}

export const tickerToAddress = (ticker: string): string => {
  return addressTickerMap[ticker] || ticker
}

export const addressToTicker = (address: string): string => {
  return reversedAddressTickerMap[address] || address
}

export const initialXtoY = (tokenXAddress?: string, tokenYAddress?: string) => {
  if (!tokenXAddress || !tokenYAddress) {
    return true
  }

  const isTokeXStablecoin = STABLECOIN_ADDRESSES.includes(tokenXAddress)
  const isTokenYStablecoin = STABLECOIN_ADDRESSES.includes(tokenYAddress)

  return isTokeXStablecoin === isTokenYStablecoin || (!isTokeXStablecoin && !isTokenYStablecoin)
}

export const parsePathFeeToFeeString = (pathFee: string): string => {
  return (+pathFee.replace('_', '') * Math.pow(10, Number(PERCENTAGE_SCALE) - 4)).toString()
}

export const ensureError = (value: unknown): Error => {
  if (value instanceof Error) return value

  let stringified = '[Unable to stringify the thrown value]'

  stringified = JSON.stringify(value)

  const error = new Error(stringified)
  return error
}

export const getFaucetDeployer = () => {
  const keyring = new Keyring({ type: 'sr25519' })
  return keyring.addFromUri(FAUCET_DEPLOYER_MNEMONIC)
}

export function testnetBestTiersCreator() {
  const stableTokens = {
    USDC: TESTNET_USDC_ADDRESS
  }

  const unstableTokens = {
    BTC: TESTNET_BTC_ADDRESS,
    ETH: TESTNET_ETH_ADDRESS,
    AZERO: TESTNET_WAZERO_ADDRESS
  }

  const bestTiers: BestTier[] = []

  const stableTokensValues = Object.values(stableTokens)
  for (let i = 0; i < stableTokensValues.length; i++) {
    const tokenX = stableTokensValues[i]
    for (let j = i + 1; j < stableTokensValues.length; j++) {
      const tokenY = stableTokensValues[j]

      bestTiers.push({
        tokenX,
        tokenY,
        bestTierIndex: 0
      })
    }
  }

  const unstableTokensEntries = Object.entries(unstableTokens)
  for (let i = 0; i < unstableTokensEntries.length; i++) {
    const [symbolX, tokenX] = unstableTokensEntries[i]
    for (let j = i + 1; j < unstableTokensEntries.length; j++) {
      const [symbolY, tokenY] = unstableTokensEntries[j]

      if (symbolX.slice(-5) === 'AZERO' && symbolY.slice(-5) === 'AZERO') {
        bestTiers.push({
          tokenX,
          tokenY,
          bestTierIndex: 0
        })
      } else {
        bestTiers.push({
          tokenX,
          tokenY,
          bestTierIndex: 2
        })
      }
    }
  }

  const unstableTokensValues = Object.values(unstableTokens)
  for (let i = 0; i < stableTokensValues.length; i++) {
    const tokenX = stableTokensValues[i]
    for (let j = 0; j < unstableTokensValues.length; j++) {
      const tokenY = unstableTokensValues[j]

      bestTiers.push({
        tokenX,
        tokenY,
        bestTierIndex: 2
      })
    }
  }

  return bestTiers
}

export const positionListPageToQueryPage = (page: number): number => {
  return Math.max(Math.ceil((page * POSITIONS_PER_PAGE) / POSITIONS_PER_QUERY) - 1, 0)
}

export const validConcentrationMidPriceTick = (
  midPriceTick: bigint,
  isXtoY: boolean,
  tickSpacing: bigint
) => {
  const minTick = getMinTick(tickSpacing)
  const maxTick = getMaxTick(tickSpacing)

  const parsedTickSpacing = Number(tickSpacing)
  const tickDelta = BigInt(calculateTickDelta(parsedTickSpacing, 2, 2))

  const minTickLimit = minTick + (2n + tickDelta) * tickSpacing
  const maxTickLimit = maxTick - (2n + tickDelta) * tickSpacing

  if (isXtoY) {
    if (midPriceTick < minTickLimit) {
      return minTickLimit
    } else if (midPriceTick > maxTickLimit) {
      return maxTickLimit
    }
  } else {
    if (midPriceTick > maxTickLimit) {
      return maxTickLimit
    } else if (midPriceTick < minTickLimit) {
      return minTickLimit
    }
  }

  return midPriceTick
}

export const getLiquidityTicksByPositionsList = (
  poolKey: PoolKey,
  positions: Position[]
): LiquidityTick[] => {
  const liquidityChanges: Record<number, bigint> = {}

  positions.forEach(position => {
    if (poolKeyToString(position.poolKey) === poolKeyToString(poolKey)) {
      const lowerTickIndex = Number(position.lowerTickIndex)
      const upperTickIndex = Number(position.upperTickIndex)

      liquidityChanges[lowerTickIndex] =
        (liquidityChanges[lowerTickIndex] ?? 0n) + position.liquidity
      liquidityChanges[upperTickIndex] =
        (liquidityChanges[upperTickIndex] ?? 0n) - position.liquidity
    }
  })

  const ticks: LiquidityTick[] = []

  Object.entries(liquidityChanges).forEach(([tickIndex, liquidityChangeTotal]) => {
    const index = BigInt(tickIndex)
    const [liquidityChange, sign] =
      liquidityChangeTotal > 0n ? [liquidityChangeTotal, true] : [-liquidityChangeTotal, false]

    if (liquidityChange !== 0n) {
      ticks.push({ index, liquidityChange, sign })
    }
  })

  return ticks
}
