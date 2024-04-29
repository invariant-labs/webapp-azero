import { NetworkType } from './static'

export const createLoaderKey = () => (new Date().getMilliseconds() + Math.random()).toString()

export const getInvariantAddress = (network: NetworkType): string | null => {
  switch (network) {
    case NetworkType.TESTNET:
      return '5FiTccBSAH9obLA4Q33hYrL3coPm2SE276rFPVttFPFnaxnC'
    default:
      return null
  }
}

export interface PrefixConfig {
  B?: number
  M?: number
  K?: number
}

const defaultPrefixConfig: PrefixConfig = {
  B: 1000000000,
  M: 1000000,
  K: 10000
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

export interface FormatNumberThreshold {
  value: number
  decimals: number
  divider?: number
}

export const defaultThresholds: FormatNumberThreshold[] = [
  {
    value: 10,
    decimals: 4
  },
  {
    value: 1000,
    decimals: 2
  },
  {
    value: 10000,
    decimals: 1
  },
  {
    value: 1000000,
    decimals: 2,
    divider: 1000
  },
  {
    value: 1000000000,
    decimals: 2,
    divider: 1000000
  },
  {
    value: Infinity,
    decimals: 2,
    divider: 1000000000
  }
]

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

export const printAmount = (amount: string, decimals: number): string => {
  const isNegative = amount.length > 0 && amount[0] === '-'

  const balanceString = isNegative ? amount.slice(1) : amount

  if (balanceString.length <= decimals) {
    return (
      // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
      (isNegative ? '-' : '') + '0.' + '0'.repeat(decimals - balanceString.length) + balanceString
    )
  } else {
    return (
      (isNegative ? '-' : '') +
      trimZeros(
        // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
        balanceString.substring(0, balanceString.length - decimals) +
          '.' +
          balanceString.substring(balanceString.length - decimals)
      )
    )
  }
}

export const trimZeros = (numStr: string): string => {
  numStr = numStr.replace(/(\.\d*?)0+$/, '$1')

  return numStr
}

export const PRICE_DECIMAL = 24

export const calcYPerXPrice = (sqrtPrice: string, xDecimal: number, yDecimal: number): number => {
  const sqrt = +printAmount(sqrtPrice, PRICE_DECIMAL)
  const proportion = sqrt * sqrt

  return proportion / 10 ** (yDecimal - xDecimal)
}
