import type { Meta, StoryObj } from '@storybook/react'
import SelectMainnetRPC from './SelectMainnetRPC'
import { Network } from '@invariant-labs/a0-sdk'
import { RpcStatus } from '@store/reducers/connection'

const meta = {
  title: 'Modals/SelectRPC',
  component: SelectMainnetRPC,
  args: {
    activeRPC: 'https://mainnet-mock.com',
    anchorEl: null,
    handleClose: () => {},
    networks: [
      {
        networkType: Network.Mainnet,
        rpc: 'https://mainnet-mock.com',
        rpcName: 'Mainnet'
      }
    ],
    onSelect: () => {},
    open: true,
    rpcStatus: RpcStatus.Uninitialized
  }
} satisfies Meta<typeof SelectMainnetRPC>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {}
