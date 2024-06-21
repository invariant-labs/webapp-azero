import { newPoolKey } from '@invariant-labs/a0-sdk'
import { Status } from '@store/reducers/wallet'
import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import Swap from './Swap'

const meta = {
  title: 'Components/Swap',
  component: Swap
} satisfies Meta<typeof Swap>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: {
    commonTokens: [],
    handleAddToken: fn(),
    initialHideUnknownTokensValue: false,
    onSwap: fn(),
    initialSlippage: '0.5',
    initialTokenFromIndex: 0,
    initialTokenToIndex: 1,
    isBalanceLoading: false,
    isFetchingNewPool: false,
    isWaitingForNewPool: false,
    onConnectWallet: fn(),
    onDisconnectWallet: fn(),
    onHideUnknownTokensChange: fn(),
    onRefresh: fn(),
    onSetPair: fn(),
    onSlippageChange: fn(),
    pools: [],
    progress: 'none',
    swapData: {
      slippage: 1 as any,
      estimatedPriceAfterSwap: 123 as any,
      tokenFrom: '0x123132423423',
      tokenTo: '0x123132423423',
      amountIn: 123 as any,
      byAmountIn: false,
      amountOut: 1114 as any,
      poolKey: newPoolKey('0x123132423423', '0x123132423423', { fee: 1n, tickSpacing: 1n })
    },
    tickmap: {},
    tokens: [],
    walletStatus: Status.Initialized,
    simulateResult: {
      poolKey: newPoolKey('0x123132423423', '0x123132423423', { fee: 1n, tickSpacing: 1n }),
      amountOut: 1000000000000n,
      priceImpact: 1.23,
      targetSqrtPrice: 1000000000000000000000000n,
      errors: []
    }
  },
  render: args => {
    return (
      <Swap
        {...args}
        swapData={{
          slippage: 1n,
          estimatedPriceAfterSwap: 123n,
          tokenFrom: '0x123132423423',
          tokenTo: '0x123132423423',
          amountIn: 123n,
          byAmountIn: false,
          amountOut: 1114n,
          poolKey: newPoolKey('0x123132423423', '0x123132423423', { fee: 1n, tickSpacing: 1n })
        }}
      />
    )
  }
}
