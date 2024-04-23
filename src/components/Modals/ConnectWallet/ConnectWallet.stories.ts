import type { Meta, StoryObj } from '@storybook/react'
import ConnectWallet from '.'

const meta = {
  title: 'Modals/ConnectWallet',
  component: ConnectWallet,
  args: {
    anchorEl: null,
    callDisconect: () => {},
    handleClose: () => {},
    open: true
  }
} satisfies Meta<typeof ConnectWallet>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {}
