import type { Meta, StoryObj } from '@storybook/react'
import TokensInfo from './TokensInfo'
import { fn } from '@storybook/test'
import { BTC, ETH } from '@store/consts/static'
import { Provider } from 'react-redux'
import { store } from '@store/index'
import { MemoryRouter } from 'react-router-dom'

const meta = {
  title: 'Components/TokensInfo',
  component: TokensInfo,
  decorators: [
    Story => (
      <Provider store={store}>
        <MemoryRouter>
          <Story />
        </MemoryRouter>
      </Provider>
    )
  ]
} satisfies Meta<typeof TokensInfo>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: {
    copyTokenAddressHandler: fn(),
    tokenFrom: {
      balance: 234234000343400000n as any,
      symbol: BTC.symbol,
      assetAddress: BTC.address,
      name: BTC.name,
      logoURI: BTC.logoURI,
      coingeckoId: BTC.coingeckoId,
      decimals: BTC.decimals,
      isUnknown: false
    },
    tokenTo: {
      balance: 23435345450000400n as any,
      symbol: ETH.symbol,
      assetAddress: ETH.address,
      name: ETH.name,
      logoURI: ETH.logoURI,
      coingeckoId: ETH.coingeckoId,
      decimals: ETH.decimals,
      isUnknown: false
    },
    tokenFromPrice: 53433 as any,
    tokenToPrice: 3243 as any
  },
  render: args => {
    return <TokensInfo {...args} />
  }
}
