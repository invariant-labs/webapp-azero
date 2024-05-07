import type { Meta, StoryObj } from '@storybook/react'
import SelectTokenModal from './SelectTokenModal'
import { NetworkType } from '@store/consts/static'
import { fn } from '@storybook/test'
import { SwapToken } from '@store/selectors/wallet'

const tokens: SwapToken[] = [
  {
    balance: 111n,
    decimals: 6,
    symbol: 'SOL',
    assetAddress: 'So11111111111111111111111111111111111111112',
    name: 'Wrapped Solana',
    logoURI:
      'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png'
  },
  {
    balance: 1000n,
    decimals: 6,
    symbol: 'BTC',
    assetAddress: '9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E',
    name: 'BTC',
    logoURI:
      'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E/logo.png'
  },
  {
    balance: 222n,
    decimals: 6,
    symbol: 'USDC',
    assetAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    name: 'USD coin',
    logoURI:
      'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png'
  }
]

const meta = {
  title: 'Modals/SelectTokenModal',
  component: SelectTokenModal
} satisfies Meta<typeof SelectTokenModal>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: {
    anchorEl: null,
    handleClose: () => {},
    onSelect: () => {},
    open: true,
    commonTokens: [],
    handleAddToken: fn(),
    initialHideUnknownTokensValue: false,
    onHideUnknownTokensChange: fn(),
    tokens: tokens
  }
}
