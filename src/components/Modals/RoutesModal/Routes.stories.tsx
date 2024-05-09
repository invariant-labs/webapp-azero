import type { Meta, StoryObj } from '@storybook/react'
import Routes from '.'
import { MemoryRouter } from 'react-router-dom'
import { fn } from '@storybook/test'
const meta = {
  title: 'Modals/Routes',
  component: Routes,
  args: {
    anchorEl: null
  },
  decorators: [
    Story => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    )
  ]
} satisfies Meta<typeof Routes>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: {
    anchorEl: null,
    handleClose: fn(),
    open: true,
    onSelect: fn(),
    routes: ['swap', 'pool'],
    current: 'swap',
    onRPC: fn(),
    onFaucet: fn()
  }
}
