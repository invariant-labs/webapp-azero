import type { Meta, StoryObj } from '@storybook/react'
import SelectNetworkButton from './SelectNetworkButton'
import { Network } from '@invariant-labs/a0-sdk'
import { RPC } from '@store/consts/static'
import { action } from '@storybook/addon-actions'

const meta = {
  title: 'Buttons/SelectNetworkButton',
  component: SelectNetworkButton
} satisfies Meta<typeof SelectNetworkButton>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: {
    name: Network.Testnet,
    networks: [{ networkType: Network.Testnet, rpc: RPC.TEST }],
    onSelect: (networkType, rpc) => action('chosen: ' + networkType + ' ' + rpc)()
  }
}
