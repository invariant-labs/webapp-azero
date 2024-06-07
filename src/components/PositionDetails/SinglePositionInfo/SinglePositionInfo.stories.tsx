import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import { MemoryRouter } from 'react-router-dom'
import SinglePositionInfo from './SinglePositionInfo'

const meta = {
  title: 'Components/SinglePositionInfo',
  component: SinglePositionInfo,
  decorators: [
    Story => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    )
  ]
} satisfies Meta<typeof SinglePositionInfo>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: {
    closePosition: fn(),
    fee: 1 as any,
    onClickClaimFee: fn(),
    swapHandler: fn(),
    tokenX: {
      name: 'BTC',
      icon: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E/logo.png',
      decimal: 9 as any,
      liqValue: 10000.23532,
      claimValue: 21.37,
      balance: 9.11
    },
    tokenY: {
      name: 'ETH',
      icon: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E/logo.png',
      decimal: 12 as any,
      liqValue: 10000.23532,
      claimValue: 21.37,
      balance: 9.11
    },
    xToY: true,
    showFeesLoader: false
  },
  render: args => {
    return (
      <SinglePositionInfo
        {...args}
        fee={1}
        tokenX={{
          name: 'BTC',
          icon: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E/logo.png',
          decimal: 9n,
          liqValue: 10000.23532,
          claimValue: 21.37,
          balance: 9.11
        }}
        tokenY={{
          name: 'ETH',
          icon: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/9n4nbM75f5Ui33ZbPYXn59EwSgE8CGsHtAeTH5YFeJ9E/logo.png',
          decimal: 12n,
          liqValue: 10000.23532,
          claimValue: 21.37,
          balance: 9.11
        }}
        xToY={true}
        closePosition={fn()}
        onClickClaimFee={fn()}
      />
    )
  }
}
