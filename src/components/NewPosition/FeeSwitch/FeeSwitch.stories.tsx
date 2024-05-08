import type { Meta, StoryObj } from '@storybook/react'
import FeeSwitch from './FeeSwitch'
import { fn } from '@storybook/test'
import { useState } from 'react'

const meta = {
  title: 'Components/FeeSwitch',
  component: FeeSwitch
} satisfies Meta<typeof FeeSwitch>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: {
    currentValue: 0,
    feeTiers: [0.02, 0.04, 0.1, 0.3, 1],
    onSelect: fn(),
    bestTierIndex: 2
  },
  render: args => {
    const [currentTier, setCurrentTier] = useState(0)
    return (
      <FeeSwitch
        {...args}
        currentValue={currentTier}
        onSelect={a => {
          setCurrentTier(a)
        }}
        showOnlyPercents
      />
    )
  }
}
