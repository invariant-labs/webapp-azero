import type { Meta, StoryObj } from '@storybook/react'
import SelectMainnetRPC from './SelectMainnetRPC'
import { NetworkType } from '@store/consts/static'

const meta = {
  title: 'Modals/SelectRPC',
  component: SelectMainnetRPC,
  args: {
    activeRPC: 'https://testnet-mock.com',
    anchorEl: null,
    handleClose: () => {},
    networks: [
      {
        networkType: NetworkType.TESTNET,
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
