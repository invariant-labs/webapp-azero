import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import Header from './Header'
import { MemoryRouter } from 'react-router-dom'
import { Network } from '@invariant-labs/a0-sdk'
import { Chain } from '@store/consts/types'
import { Provider } from 'react-redux'
import { store } from '@store/index'

const meta = {
  title: 'Layout/Header',
  component: Header,
  args: {},
  decorators: [
    Story => (
      <Provider store={store}>
        <MemoryRouter>
          <Story />
        </MemoryRouter>
      </Provider>
    )
  ]
} satisfies Meta<typeof Header>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: {
    address: '0x1234567890123456789012345678901234567890',
    defaultTestnetRPC: 'https://rpc.testnet.moonbeam.network',
    landing: '',
    onConnectWallet: fn(),
    onDisconnectWallet: fn(),
    onNetworkSelect: fn(),
    rpc: 'https://rpc.testnet.moonbeam.network',
    typeOfNetwork: Network.Testnet,
    walletConnected: true,
    onFaucet: fn(),
    onCopyAddress: fn(),
    onChangeWallet: fn(),
    activeChain: {
      name: Chain.AlephZero,
      address: 'https://azero.invariant.app/swap'
    },
    onChainSelect: fn(),
    network: Network.Testnet,
    defaultMainnetRPC: 'https://rpc.moonbeam.network'
  }
}
