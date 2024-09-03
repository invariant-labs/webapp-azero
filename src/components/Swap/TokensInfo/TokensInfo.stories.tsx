import type { Meta, StoryObj } from '@storybook/react'
import TokensInfo from './TokensInfo'
import { fn } from '@storybook/test'
import { TESTNET_BTC, TESTNET_ETH } from '@store/consts/static'
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
      symbol: TESTNET_BTC.symbol,
      assetAddress: TESTNET_BTC.address,
      name: TESTNET_BTC.name,
      logoURI: TESTNET_BTC.logoURI,
      coingeckoId: TESTNET_BTC.coingeckoId,
      decimals: TESTNET_BTC.decimals,
      isUnknown: false
    },
    tokenTo: {
      balance: 23435345450000400n as any,
      symbol: TESTNET_ETH.symbol,
      assetAddress: TESTNET_ETH.address,
      name: TESTNET_ETH.name,
      logoURI: TESTNET_ETH.logoURI,
      coingeckoId: TESTNET_ETH.coingeckoId,
      decimals: TESTNET_ETH.decimals,
      isUnknown: false
    },
    tokenFromPrice: 53433 as any,
    tokenToPrice: 3243 as any
  },
  render: args => {
    return <TokensInfo {...args} />
  }
}
