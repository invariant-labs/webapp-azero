import type { Meta, StoryObj } from '@storybook/react'
import SelectMainnetRPC from './SelectMainnetRPC'
import { Network } from '@invariant-labs/a0-sdk'

const meta = {
  title: 'Modals/SelectRPC',
  component: SelectMainnetRPC,
  args: {
    activeRPC: 'https://testnet-mock.com',
    anchorEl: null,
    handleClose: () => {},
    networks: [
      {
        networkType: Network.Testnet,
        rpc: 'https://testnet-mock.com',
        rpcName: 'Testnet'
      }
    ],
    onSelect: () => {},
    open: true
  }
} satisfies Meta<typeof SelectMainnetRPC>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {}
