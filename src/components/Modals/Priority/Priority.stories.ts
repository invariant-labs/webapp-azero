import type { Meta, StoryObj } from '@storybook/react'
import Priority from '.'

const meta = {
  title: 'Modals/Priority',
  component: Priority,
  args: {
    anchorEl: null,
    handleClose: () => {},
    onPrioritySave: () => {},
    open: true,
    recentPriorityFee: '0.000005'
  }
} satisfies Meta<typeof Priority>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  argTypes: {
    recentPriorityFee: { defaultValue: '0.000005', type: 'string' }
  }
}
