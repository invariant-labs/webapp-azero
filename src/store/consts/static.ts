import {
  FEE_TIERS,
  Network,
  Position,
  BTC_ADDRESS as BTC_ADDRESS_SDK,
  ETH_ADDRESS as ETH_ADDRESS_SDK,
  USDC_ADDRESS as USDC_ADDRESS_SDK,
  WAZERO_ADDRESS as WAZERO_ADDRESS_SDK
} from '@invariant-labs/a0-sdk'
import { Keyring } from '@polkadot/api'
import {
  BestTier,
  Chain,
  FormatNumberThreshold,
  PrefixConfig,
  Token,
  TokenPriceData
} from './types'
import { bestTiersCreator } from '@utils/utils'
import { POSITIONS_ENTRIES_LIMIT } from '@invariant-labs/a0-sdk/target/consts'
import mainnetListJson from '@store/consts/tokenLists/mainnet.json'

export const mainnetList = mainnetListJson as unknown as Record<string, Token>

export const WAZERO_ADDRESS = {
  ...WAZERO_ADDRESS_SDK,
  [Network.Mainnet]: '5CtuFVgEUz13SFPVY6s2cZrnLDEkxQXc19aXrNARwEBeCXgg'
}

export const BTC_ADDRESS = {
  ...BTC_ADDRESS_SDK,
  [Network.Mainnet]: '5EEtCdKLyyhQnNQWWWPM1fMDx1WdVuiaoR9cA6CWttgyxtuJ'
}
export const ETH_ADDRESS = {
  ...ETH_ADDRESS_SDK,
  [Network.Mainnet]: '5EoFQd36196Duo6fPTz2MWHXRzwTJcyETHyCyaB3rb61Xo2u'
}
export const USDC_ADDRESS = {
  ...USDC_ADDRESS_SDK,
  [Network.Mainnet]: '5FYFojNCJVFR2bBNKfAePZCa72ZcVX5yeTv8K9bzeUo8D83Z'
}

export enum RPC {
  TEST = 'wss://ws.test.azero.dev',
  MAIN = 'wss://ws.azero.dev'
}

export const POSITIONS_PER_PAGE = 5

export const STABLECOIN_ADDRESSES: string[] = []

export const DEFAULT_PUBLICKEY = new Keyring({ type: 'ecdsa' })

export const tokensPrices: Record<Network, Record<string, TokenPriceData>> = {
  [Network.Testnet]: { USDC_TEST: { price: 1 }, BTC_TEST: { price: 64572.0 } },
  [Network.Mainnet]: {},
  [Network.Local]: {}
}

export const FAUCET_DEPLOYER_MNEMONIC =
  'motion ice subject actress spider rare leg fortune brown similar excess amazing'

export const FAUCET_TOKEN_AMOUNT = 1000n

export const TokenAirdropAmount = {
  BTC: 100000n,
  ETH: 20000000000000000n,
  USDC: 50000000n
}

export const getFaucetTokenList = (network: Network) => {
  return {
    BTC: BTC_ADDRESS[network],
    ETH: ETH_ADDRESS[network],
    USDC: USDC_ADDRESS[network]
  }
}

export const TESTNET_BTC: Token = {
  symbol: 'BTC',
  address: BTC_ADDRESS[Network.Testnet],
  decimals: 8n,
  name: 'Bitcoin',
  logoURI:
    'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E/logo.png',
  coingeckoId: 'bitcoin'
}

export const TESTNET_ETH: Token = {
  symbol: 'ETH',
  address: ETH_ADDRESS[Network.Testnet],
  decimals: 18n,
  name: 'Ether',
  logoURI:
    'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/2FPyTwcZLUg1MDrwsyoP4D6s1tM7hAkHYRjkNb5w6Pxk/logo.png',
  coingeckoId: 'ethereum'
}

export const TESTNET_USDC: Token = {
  symbol: 'USDC',
  address: USDC_ADDRESS[Network.Testnet],
  decimals: 6n,
  name: 'USDC',
  logoURI:
    'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
  coingeckoId: 'usd-coin'
}

export const TESTNET_AZERO: Token = {
  symbol: 'AZERO',
  address: WAZERO_ADDRESS[Network.Testnet],
  decimals: 12n,
  name: 'Aleph Zero',
  logoURI: 'https://assets.coingecko.com/coins/images/17212/standard/azero-logo_coingecko.png',
  coingeckoId: 'aleph-zero'
}

export const DEFAULT_TOKENS = ['bitcoin', 'ethereum', 'usd-coin', 'aleph-zero']

export const bestTiers: Record<Network, BestTier[]> = {
  [Network.Testnet]: bestTiersCreator(Network.Testnet),
  [Network.Mainnet]: [],
  [Network.Local]: bestTiersCreator(Network.Local)
}

export const commonTokensForNetworks: Record<Network, string[]> = {
  [Network.Testnet]: [
    TESTNET_BTC.address,
    TESTNET_ETH.address,
    TESTNET_USDC.address,
    TESTNET_AZERO.address
  ],
  [Network.Mainnet]: [
    WAZERO_ADDRESS[Network.Mainnet],
    BTC_ADDRESS[Network.Mainnet],
    ETH_ADDRESS[Network.Mainnet],
    USDC_ADDRESS[Network.Mainnet]
  ],
  [Network.Local]: []
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

export const SWAP_SAFE_TRANSACTION_FEE = BigInt(Math.ceil(0.1 * 10 ** 12))
export const POOL_SAFE_TRANSACTION_FEE = BigInt(Math.ceil(0.2 * 10 ** 12))
export const FAUCET_SAFE_TRANSACTION_FEE = BigInt(Math.ceil(0.001 * 10 ** 12))

export enum ErrorMessage {
  TRANSACTION_SIGNING_ERROR = 'Error while signing transaction.'
}

export const REFRESHER_INTERVAL = 20

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

export const COINGECKO_QUERY_COOLDOWN = 20 * 60 * 1000

export const FormatConfig = {
  B: 1000000000,
  M: 1000000,
  K: 1000,
  BDecimals: 9,
  MDecimals: 6,
  KDecimals: 3,
  DecimalsAfterDot: 2
}

export enum PositionTokenBlock {
  None,
  A,
  B
}

export const subNumbers = ['₀', '₁', '₂', '₃', '₄', '₅', '₆', '₇', '₈', '₉']

export const defaultPrefixConfig: PrefixConfig = {
  B: 1000000000,
  M: 1000000,
  K: 10000
}

export const getAddressTickerMap = (network: Network): { [k: string]: string } => {
  if (network !== Network.Mainnet) {
    return {
      BTC: BTC_ADDRESS[network],
      ETH: ETH_ADDRESS[network],
      USDC: USDC_ADDRESS[network],
      AZERO: WAZERO_ADDRESS[network]
    }
  } else {
    const parsedMainnetList = mainnetList as unknown as Record<string, Token>
    const result: { [k: string]: string } = {}

    Object.keys(parsedMainnetList).forEach((key: string) => {
      const token = parsedMainnetList[key]
      result[token.symbol] = token.address
    })

    return result
  }
}

export const getReversedAddressTickerMap = (network: Network) => {
  return Object.fromEntries(
    Object.entries(getAddressTickerMap(network)).map(([key, value]) => [value, key])
  )
}

export const LIQUIDITY_PLOT_DECIMAL = 12n

export const DEFAULT_TOKEN_DECIMAL = 12n

export const EMPTY_POSITION: Position = {
  poolKey: {
    tokenX: TESTNET_BTC.address,
    tokenY: TESTNET_ETH.address,
    feeTier: { fee: 0n, tickSpacing: 1n }
  },
  liquidity: 0n,
  lowerTickIndex: 0n,
  upperTickIndex: 0n,
  feeGrowthInsideX: 0n,
  feeGrowthInsideY: 0n,
  lastBlockNumber: 0n,
  tokensOwedX: 0n,
  tokensOwedY: 0n,
  secondsPerLiquidityInside: 0n,
  createdAt: 0n
}

export const POSITIONS_PER_QUERY =
  Number(POSITIONS_ENTRIES_LIMIT) - (Number(POSITIONS_ENTRIES_LIMIT) % POSITIONS_PER_PAGE)

export const MINIMAL_POOL_INIT_PRICE = 0.00000001

export const DEFAULT_SWAP_SLIPPAGE = '0.50'
export const DEFAULT_NEW_POSITION_SLIPPAGE = '0.50'

export const CHAINS = [
  { name: Chain.Solana, address: 'https://invariant.app/swap' },
  { name: Chain.AlephZero, address: 'https://azero.invariant.app/exchange' },
  { name: Chain.Eclipse, address: 'https://eclipse.invariant.app/swap' },
  { name: Chain.Vara, address: 'https://vara.invariant.app/exchange' }
]

export const enum SortTypePoolList {
  NAME_ASC,
  NAME_DESC,
  FEE_ASC,
  FEE_DESC,
  VOLUME_ASC,
  VOLUME_DESC,
  TVL_ASC,
  TVL_DESC
  // APY_ASC,
  // APY_DESC
}

export const enum SortTypeTokenList {
  NAME_ASC,
  NAME_DESC,
  PRICE_ASC,
  PRICE_DESC,
  // CHANGE_ASC,
  // CHANGE_DESC,
  VOLUME_ASC,
  VOLUME_DESC,
  TVL_ASC,
  TVL_DESC
}
