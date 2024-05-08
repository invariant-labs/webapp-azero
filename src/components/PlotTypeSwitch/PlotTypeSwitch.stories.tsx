import { fn } from '@storybook/test'
import { PlotTypeSwitch } from './PlotTypeSwitch'
import type { Meta, StoryObj } from '@storybook/react'

const meta = {
  title: 'Components/PlotTypeSwitch',
  component: PlotTypeSwitch
} satisfies Meta<typeof PlotTypeSwitch>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: {
    initialValue: 0,
    onSwitch: fn()
  }
}
