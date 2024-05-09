import TransactionDetailsBox from './TransactionDetailsBox'
import type { Meta, StoryObj } from '@storybook/react'

const meta = {
  title: 'Components/TransactionDetailsBox',
  component: TransactionDetailsBox
} satisfies Meta<typeof TransactionDetailsBox>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: {
    exchangeRate: { val: 123, symbol: 'ABC', decimal: 12 },
    slippage: 0.5,
    priceImpact: 1 as any,
    fee: { v: 2 as any },
    open: true,
    isLoadingRate: false
  },
  render: args => {
    return <TransactionDetailsBox {...args} priceImpact={1n} fee={{ v: 2n }} />
  }
}
