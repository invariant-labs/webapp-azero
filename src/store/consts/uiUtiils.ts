import { PERCENTAGE_SCALE } from '@invariant-labs/a0-sdk/src/consts'
import { STABLECOIN_ADDRESSES, TokenList } from './static'

export const tickerToAddress = (ticker: string): string => {
  return addressTickerMap[ticker] || ticker
}

export const addressToTicker = (address: string): string => {
  return reversedAddressTickerMap[address] || address
}

export const addressTickerMap: { [key: string]: string } = TokenList

export const reversedAddressTickerMap = Object.fromEntries(
  Object.entries(addressTickerMap).map(([key, value]) => [value, key])
)

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
