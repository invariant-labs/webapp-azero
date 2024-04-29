import { Keyring } from '@polkadot/api'

export enum NetworkType {
  DEVNET = 'Devnet',
  TESTNET = 'Testnet',
  LOCALNET = 'Localnet',
  MAINNET = 'Mainnet'
}

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
