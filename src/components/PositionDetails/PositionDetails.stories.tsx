import { fn } from '@storybook/test'
import PositionDetails from './PositionDetails'
import type { Meta, StoryObj } from '@storybook/react'
import { MemoryRouter } from 'react-router-dom'

const meta = {
  title: 'Components/PositionDetails',
  component: PositionDetails,
  decorators: [
    Story => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    )
  ]
} satisfies Meta<typeof PositionDetails>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: {
    currentPrice: 10000 as any,
    initialIsDiscreteValue: false,
    leftRange: {
      index: 2 as any,
      x: 23 as any
    },
    rightRange: {
      index: 2 as any,
      x: 45354 as any
    },
    max: 100,
    min: 0,
    midPrice: {
      index: 2 as any,
      x: 45354 as any
    },
    onDiscreteChange: fn(),
    reloadHandler: fn(),
    ticksLoading: false,
    tickSpacing: 0,
    closePosition: fn(),
    tokenX: {
      name: 'BTC',
      balance: 10000,
      claimValue: 10000,
      decimal: 9 as any,
      icon: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png?1547033579',
      liqValue: 10000,
      usdValue: 123
    },
    tokenY: {
      name: 'ETH',
      balance: 432,
      claimValue: 21,
      decimal: 9 as any,
      icon: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png?1547033579',
      liqValue: 321,
      usdValue: 3246
    },
    hasTicksError: false,
    copyPoolAddressHandler: fn(),
    detailsData: [
      {
        x: 12 as any,
        y: 1234 as any,
        index: 1 as any
      },
      {
        x: 123 as any,
        y: 432 as any,
        index: 2 as any
      }
    ],
    fee: 1 as any,
    onClickClaimFee: fn(),
    poolAddress: '0x1234567890',
    tokenXAddress: '0x1234567890',
    tokenYAddress: '0x1234567890'
  },
  render: args => {
    return (
      <PositionDetails
        {...args}
        currentPrice={1000n}
        leftRange={{
          index: 2n,
          x: 23n
        }}
        rightRange={{
          index: 2n,
          x: 45354n
        }}
        midPrice={{
          index: 32n,
          x: 4535n
        }}
        tokenX={{
          name: 'BTC',
          balance: 10000,
          claimValue: 10000,
          decimal: 9n,
          icon: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png?1547033579',
          liqValue: 10000,
          usdValue: 123
        }}
        tokenY={{
          name: 'ETH',
          balance: 432,
          claimValue: 21,
          decimal: 9n,
          icon: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png?1547033579',
          liqValue: 321,
          usdValue: 3246
        }}
        detailsData={[
          {
            x: 12n,
            y: 1234n,
            index: 1n
          },
          {
            x: 123n,
            y: 432n,
            index: 2n
          }
        ]}
        fee={1n}
      />
    )
  }
}
