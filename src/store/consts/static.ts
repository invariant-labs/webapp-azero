import {
  FEE_TIERS,
  TESTNET_BTC_ADDRESS,
  TESTNET_ETH_ADDRESS,
  TESTNET_USDC_ADDRESS,
  TESTNET_WAZERO_ADDRESS
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
  balance?: bigint
  coingeckoId?: string
  isUnknown?: boolean
}

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

// const mainnetBestTiersCreator = () => {
//   const stableTokens = {
//     USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
//   }

//   const unstableTokens = {
//     BTC: '9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E'
//   }

//   const bestTiers: BestTier[] = []

//   for (let i = 0; i < 4; i++) {
//     const tokenX = Object.values(stableTokens)[i]
//     for (let j = i + 1; j < 4; j++) {
//       const tokenY = Object.values(stableTokens)[j]

//       bestTiers.push({
//         tokenX,
//         tokenY,
//         bestTierIndex: 0
//       })
//     }
//   }

//   for (let i = 0; i < 5; i++) {
//     const [symbolX, tokenX] = Object.entries(unstableTokens)[i]
//     for (let j = i + 1; j < 5; j++) {
//       const [symbolY, tokenY] = Object.entries(unstableTokens)[j]

//       if (symbolX.slice(-3) === 'SOL' && symbolY.slice(-3) === 'SOL') {
//         bestTiers.push({
//           tokenX,
//           tokenY,
//           bestTierIndex: 0
//         })
//       } else {
//         bestTiers.push({
//           tokenX,
//           tokenY,
//           bestTierIndex: 2
//         })
//       }
//     }
//   }

//   for (let i = 0; i < 4; i++) {
//     const tokenX = Object.values(stableTokens)[i]
//     for (let j = 0; j < 5; j++) {
//       const tokenY = Object.values(unstableTokens)[j]

//       bestTiers.push({
//         tokenX,
//         tokenY,
//         bestTierIndex: 2
//       })
//     }
//   }

//   return bestTiers
// }

export const bestTiers: Record<Network, BestTier[]> = {
  //TODO add best Tiers
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

export const FaucetTokenList = {
  BTC: TESTNET_BTC_ADDRESS,
  ETH: TESTNET_ETH_ADDRESS,
  USDC: TESTNET_USDC_ADDRESS
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
  address: TESTNET_USDC_ADDRESS,
  decimals: 6n,
  name: 'USDC',
  logoURI:
    'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
  coingeckoId: 'usdc'
}

export const AZERO: Token = {
  symbol: 'AZERO',
  address: TESTNET_WAZERO_ADDRESS,
  decimals: 12n,
  name: 'Aleph Zero',
  logoURI: 'https://assets.coingecko.com/coins/images/17212/standard/azero-logo_coingecko.png',
  coingeckoId: 'aleph-zero'
}

export const DEFAULT_INVARIANT_OPTIONS = {
  storageDepositLimit: null,
  refTime: 100000000000,
  proofSize: 100000000000
}

export const DEFAULT_PSP22_OPTIONS = {
  storageDepositLimit: null,
  refTime: 5000000000,
  proofSize: 5000000000
}

export const DEFAULT_WAZERO_OPTIONS = {
  storageDepositLimit: null,
  refTime: 5000000000,
  proofSize: 5000000000
}

export const INVARIANT_SWAP_OPTIONS = {
  storageDepositLimit: null,
  refTime: 250000000000,
  proofSize: 500000
}

export const INVARIANT_WITHDRAW_ALL_WAZERO = {
  storageDepositLimit: null,
  refTime: 25000000000,
  proofSize: 250000
}

export const INVARIANT_CREATE_POOL_OPTIONS = {
  storageDepositLimit: null,
  refTime: 10000000000,
  proofSize: 250000
}

export const INVARIANT_CREATE_POSITION_OPTIONS = {
  storageDepositLimit: null,
  refTime: 25000000000,
  proofSize: 500000
}

export const INVARIANT_CLAIM_FEE_OPTIONS = {
  storageDepositLimit: null,
  refTime: 25000000000,
  proofSize: 500000
}

export const INVARIANT_REMOVE_POSITION_OPTIONS = {
  storageDepositLimit: null,
  refTime: 25000000000,
  proofSize: 250000
}

export const PSP22_APPROVE_OPTIONS = {
  storageDepositLimit: null,
  refTime: 2500000000,
  proofSize: 50000
}

export const WAZERO_DEPOSIT_OPTIONS = {
  storageDepositLimit: null,
  refTime: 2500000000,
  proofSize: 50000
}

export const WAZERO_WITHDRAW_OPTIONS = {
  storageDepositLimit: null,
  refTime: 2500000000,
  proofSize: 50000
}

export const ALL_FEE_TIERS_DATA = FEE_TIERS.map((tier, index) => ({
  tier,
  primaryIndex: index
}))

export const U128MAX = 2n ** 128n - 1n

export const SWAP_SAFE_TRANSACTION_FEE = BigInt(Math.ceil(0.05 * 10 ** 12))
export const POOL_SAFE_TRANSACTION_FEE = BigInt(Math.ceil(0.05 * 10 ** 12))
