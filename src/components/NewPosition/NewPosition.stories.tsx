import type { Meta, StoryObj } from '@storybook/react'
import NewPosition from './NewPosition'
import { fn } from '@storybook/test'
import { MemoryRouter } from 'react-router-dom'

const meta = {
  title: 'PageComponent/NewPosition',
  component: NewPosition,
  decorators: [
    Story => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    )
  ]
} satisfies Meta<typeof NewPosition>

export default meta
type Story = StoryObj<typeof meta>

export const Primary: Story = {
  args: {
    currentPairReversed: false,
    isXtoY: true,
    addLiquidityHandler: fn(),
    midPrice: { x: 1234, index: 23 } as any,
    bestTiers: [],
    calculatePoolAddress: fn(),
    canCreateNewPool: true,
    canCreateNewPosition: true,
    commonTokens: [],
    copyPoolAddressHandler: fn(),
    currentFeeIndex: 0,
    currentPriceSqrt: 123 as any,
    data: [],
    feeTiers: [
      { feeValue: 0.1 },
      { feeValue: 0.2 },
      { feeValue: 0.3 },
      { feeValue: 0.4 },
      { feeValue: 0.5 }
    ],
    handleAddToken: fn(),
    initialIsDiscreteValue: false,
    initialFee: '0.05',
    initialHideUnknownTokensValue: false,
    initialOpeningPositionMethod: 'concentration',
    initialSlippage: '0.01',
    initialTokenFrom: 'BTC',
    initialTokenTo: 'ETH',
    isCurrentPoolExisting: true,
    isWaitingForNewPool: false,
    onChangePositionTokens: fn(),
    onDiscreteChange: fn(),
    onHideUnknownTokensChange: fn(),
    onPositionOpeningMethodChange: fn(),
    onSlippageChange: fn(),
    poolAddress: '0x1233242343242',
    poolIndex: 0n,
    progress: 'progress',
    reloadHandler: fn(),
    setMidPrice: fn(),
    ticksLoading: false,
    tickSpacing: 0 as any,
    tokens: [],
    xDecimal: 9 as any,
    yDecimal: 12 as any,
    hasTicksError: false
  },
  render: () => {
    return (
      <NewPosition
        midPrice={{ x: 1234n, index: 23n }}
        currentPriceSqrt={123n}
        tickSpacing={0n}
        xDecimal={9n}
        yDecimal={12n}
        commonTokens={[]}
        handleAddToken={fn()}
        onChangePositionTokens={fn()}
        onPositionOpeningMethodChange={fn()}
        onSlippageChange={fn()}
        onHideUnknownTokensChange={fn()}
        onDiscreteChange={fn()}
        copyPoolAddressHandler={fn()}
        calculatePoolAddress={fn()}
        reloadHandler={fn()}
        setMidPrice={fn()}
        ticksLoading={false}
        hasTicksError={false}
        progress='progress'
        isCurrentPoolExisting={true}
        isWaitingForNewPool={false}
        poolAddress='0x1233242343242'
        poolIndex={0n}
        tokens={[]}
        bestTiers={[]}
        currentPairReversed={false}
        isXtoY={true}
        initialTokenFrom='BTC'
        initialTokenTo='ETH'
        initialFee='0.05'
        initialSlippage='0.01'
        initialOpeningPositionMethod='concentration'
        initialIsDiscreteValue={false}
        initialHideUnknownTokensValue={false}
        data={[]}
        currentFeeIndex={0}
        feeTiers={[
          { feeValue: 0.1 },
          { feeValue: 0.2 },
          { feeValue: 0.3 },
          { feeValue: 0.4 },
          { feeValue: 0.5 }
        ]}
        addLiquidityHandler={fn()}
        canCreateNewPool={true}
        canCreateNewPosition={true}
      />
    )
  }
}
