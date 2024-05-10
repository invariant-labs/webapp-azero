import ExchangeRate from './ExchangeRate'
import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'

const meta = {
  title: 'Components/ExchangeRate',
  component: ExchangeRate
} satisfies Meta<typeof ExchangeRate>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: {
    amount: 100,
    loading: false,
    onClick: fn(),
    tokenFromSymbol: 'ETH',
    tokenToDecimals: 14,
    tokenToSymbol: 'USDC'
  }
}
