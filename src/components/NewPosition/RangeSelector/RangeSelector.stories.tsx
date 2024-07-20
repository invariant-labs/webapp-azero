import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import { useState } from 'react'
import RangeSelector from './RangeSelector'

const meta = {
  title: 'Components/RangeSelector',
  component: RangeSelector
} satisfies Meta<typeof RangeSelector>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: {
    currentPairReversed: false,
    isXtoY: true,
    midPrice: { x: 1, index: 1 as any },
    concentrationArray: [0.1, 0.2, 0.3, 0.4, 0.5],
    concentrationIndex: 2,
    data: [{ x: 0, y: 0, index: 0 as any }],
    getTicksInsideRange: fn(),
    minimumSliderIndex: 0,
    onChangeRange: fn(),
    poolIndex: 0,
    reloadHandler: fn(),
    setConcentrationIndex: fn(),
    ticksLoading: false,
    tickSpacing: 1 as any,
    tokenASymbol: 'BTC',
    tokenBSymbol: 'ETH',
    xDecimal: 9 as any,
    yDecimal: 12 as any,
    poolKey: '',
    setShouldReversePlot: fn(),
    shouldReversePlot: false,
    shouldNotUpdatePriceRange: false,
    unblockUpdatePriceRange: fn()
  },
  render: args => {
    const [concentrationIndex, setConcentrationIndex] = useState(2)
    return (
      <RangeSelector
        {...args}
        concentrationIndex={concentrationIndex}
        setConcentrationIndex={setConcentrationIndex}
        tickSpacing={1n}
        xDecimal={9n}
        yDecimal={12n}
        midPrice={{ x: 1, index: 1n }}
        data={[{ x: 0, y: 0, index: 0n }]}
      />
    )
  }
}
