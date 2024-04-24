import type { Meta, StoryObj } from '@storybook/react'
import Routes from '.'

const meta = {
  title: 'Modals/Routes',
  component: Routes,
  args: {
    anchorEl: null,
    handleClose: () => {},
    open: true,
    current: 'swap',
    onFaucet: () => {},
    onPriority: () => {},
    onRPC: () => {},
    onSelect: () => {},
    routes: ['swap', 'pool']
  }
} satisfies Meta<typeof Routes>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {}
