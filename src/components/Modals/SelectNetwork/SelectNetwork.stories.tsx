import type { Meta, StoryObj } from '@storybook/react'
import SelectNetwork from './SelectNetwork'
import { NetworkType } from '@store/consts/static'

const meta = {
  title: 'Modals/SelectNetwork',
  component: SelectNetwork,
  args: {
    activeNetwork: NetworkType.TESTNET,
    anchorEl: null,
    handleClose: () => {},
    networks: [
      {
        networkType: NetworkType.TESTNET,
        rpc: 'https://testnet-mock.com',
        rpcName: 'Testnet'
      },
      {
        networkType: NetworkType.DEVNET,
        rpc: 'https://devnet-mock.com',
        rpcName: 'Devnet'
      }
    ],
    onSelect: () => {},
    open: true
  }
} satisfies Meta<typeof SelectNetwork>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {}
