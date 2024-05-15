import {
  TESTNET_BTC_ADDRESS,
  TESTNET_ETH_ADDRESS,
  TETSNET_USDC_ADDRESS
} from '@invariant-labs/a0-sdk'
import { Network } from '@invariant-labs/a0-sdk/src'
import { Keyring } from '@polkadot/api'
import { AddressOrPair } from '@polkadot/api/types'

export enum AlephZeroNetworks {
  TEST = 'wss://ws.test.azero.dev',
  DEV = 'wss://ws.dev.azero.dev'
}

export const POSITIONS_PER_PAGE = 5

export const STABLECOIN_ADDRESSES: string[] = []

export const DEFAULT_PUBLICKEY = new Keyring({ type: 'ecdsa' })

export type PositionOpeningMethod = 'range' | 'concentration'

export interface TokenPriceData {
  price: number
}

export interface Token {
  symbol: string
  address: AddressOrPair
  decimals: bigint
  name: string
  logoURI: string
  coingeckoId?: string
  isUnknown?: boolean
}

// TODO - add real data
export const ALL_FEE_TIERS_DATA = []

export const tokensPrices: Record<Network, Record<string, TokenPriceData>> = {
  [Network.Testnet]: { USDC_TEST: { price: 1 }, BTC_TEST: { price: 64572.0 } },
  [Network.Mainnet]: {},
  [Network.Local]: {}
}
export interface BestTier {
  tokenX: AddressOrPair
  tokenY: AddressOrPair
  bestTierIndex: number
}

const mainnetBestTiersCreator = () => {
  const stableTokens = {
    USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
  }

  const unstableTokens = {
    BTC: '9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E'
  }

  const bestTiers: BestTier[] = []

  for (let i = 0; i < 4; i++) {
    const tokenX = Object.values(stableTokens)[i]
    for (let j = i + 1; j < 4; j++) {
      const tokenY = Object.values(stableTokens)[j]

      bestTiers.push({
        tokenX,
        tokenY,
        bestTierIndex: 0
      })
    }
  }

  for (let i = 0; i < 5; i++) {
    const [symbolX, tokenX] = Object.entries(unstableTokens)[i]
    for (let j = i + 1; j < 5; j++) {
      const [symbolY, tokenY] = Object.entries(unstableTokens)[j]

      if (symbolX.slice(-3) === 'SOL' && symbolY.slice(-3) === 'SOL') {
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

  for (let i = 0; i < 4; i++) {
    const tokenX = Object.values(stableTokens)[i]
    for (let j = 0; j < 5; j++) {
      const tokenY = Object.values(unstableTokens)[j]

      bestTiers.push({
        tokenX,
        tokenY,
        bestTierIndex: 2
      })
    }
  }

  return bestTiers
}

export const bestTiers: Record<Network, BestTier[]> = {
  [Network.Testnet]: [],
  [Network.Mainnet]: [],
  [Network.Local]: []
}

export const commonTokensForNetworks: Record<Network, AddressOrPair[]> = {
  [Network.Testnet]: [],
  [Network.Mainnet]: [],
  [Network.Local]: []
}

export const FAUCET_DEPLOYER_MNEMONIC =
  'motion ice subject actress spider rare leg fortune brown similar excess amazing'

export const getFaucetDeployer = () => {
  const keyring = new Keyring({ type: 'sr25519' })
  return keyring.addFromUri(FAUCET_DEPLOYER_MNEMONIC)
}

export const FAUCET_TOKEN_AMOUNT = 1000n

export const TokenAirdropAmount = {
  BTC: 100000n,
  ETH: 20000000000000000n,
  USDC: 50000000n
}

export const TokenList = {
  BTC: TESTNET_BTC_ADDRESS,
  ETH: TESTNET_ETH_ADDRESS,
  USDC: TETSNET_USDC_ADDRESS
}

export const BTC: Token = {
  symbol: 'BTC',
  address: TESTNET_BTC_ADDRESS,
  decimals: 8n,
  name: 'Bitcoin',
  logoURI:
    'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E/logo.png',
  coingeckoId: 'bitcoin'
}

export const ETH: Token = {
  symbol: 'ETH',
  address: TESTNET_ETH_ADDRESS,
  decimals: 18n,
  name: 'Ether',
  logoURI:
    'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/2FPyTwcZLUg1MDrwsyoP4D6s1tM7hAkHYRjkNb5w6Pxk/logo.png',
  coingeckoId: 'ethereum'
}

export const USDC: Token = {
  symbol: 'USDC',
  address: TETSNET_USDC_ADDRESS,
  decimals: 6n,
  name: 'USDC',
  logoURI:
    'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
  coingeckoId: 'usdc'
}
