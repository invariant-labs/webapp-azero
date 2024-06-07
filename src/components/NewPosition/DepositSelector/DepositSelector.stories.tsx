import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import { useState } from 'react'
import DepositSelector from './DepositSelector'

const tokens: any[] = [
  {
    balance: 111, // change type number
    decimals: 6,
    symbol: 'SOL',
    assetAddress: 'So11111111111111111111111111111111111111112',
    name: 'Wrapped Solana',
    logoURI:
      'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png'
  },
  {
    balance: 1000, // change type number
    decimals: 6,
    symbol: 'BTC',
    assetAddress: '9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E',
    name: 'BTC',
    logoURI:
      'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E/logo.png'
  },
  {
    balance: 222, // change type number
    decimals: 6,
    symbol: 'USDC',
    assetAddress: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    name: 'USD coin',
    logoURI:
      'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png'
  }
]

const meta = {
  title: 'Components/DepositSelector',
  component: DepositSelector
} satisfies Meta<typeof DepositSelector>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: {
    canCreateNewPool: true,
    canCreateNewPosition: true,
    commonTokens: [
      'So11111111111111111111111111111111111111112',
      '9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E',
      'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
    ],
    concentrationArray: [
      2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26,
      27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49,
      50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72,
      73, 74, 75, 76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95,
      96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114,
      115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130, 131, 132, 133,
      134, 135, 136, 137, 138, 139, 140, 141
    ],
    concentrationIndex: 0,
    feeTiers: [0.02, 0.04, 0.1, 0.3, 1, 2, 5],
    handleAddToken: fn(),
    initialFee: '0.02',
    initialHideUnknownTokensValue: false,
    initialTokenFrom: 'USDC',
    initialTokenTo: 'BTC',
    minimumSliderIndex: 0,
    onAddLiquidity: fn(),
    onHideUnknownTokensChange: fn(),
    onReverseTokens: fn(),
    poolIndex: 0 as any,
    positionOpeningMethod: 'range',
    progress: 'success',
    setPositionTokens: fn(),
    tokens: tokens,
    feeTierIndex: 0,
    tokenAInputState: {
      value: '1234',
      setValue: fn(),
      blocked: false,
      blockerInfo: '',
      decimalsLimit: 12
    },
    tokenBInputState: {
      value: '11',
      setValue: fn(),
      blocked: false,
      blockerInfo: '',
      decimalsLimit: 12
    },
    bestTierIndex: 2,
    priceA: 1111,
    priceB: 2222
  },
  render: args => {
    const [feeTierIndex, setFeeTierIndex] = useState<number>(0)
    return (
      <DepositSelector
        {...args}
        setPositionTokens={(_a, _b, fee) => {
          setFeeTierIndex(fee)
        }}
        feeTierIndex={feeTierIndex}
        poolIndex={0}
      />
    )
  }
}
