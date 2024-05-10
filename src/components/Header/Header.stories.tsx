import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import Header from './Header'
import { MemoryRouter } from 'react-router-dom'
import { Network } from '@invariant-labs/a0-sdk/src'

const meta = {
  title: 'Layout/Header',
  component: Header,
  args: {},
  decorators: [
    Story => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
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
    onFaucet: fn()
  }
}
