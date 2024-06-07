import type { Meta, StoryObj } from '@storybook/react'
import { BrowserRouter } from 'react-router-dom'
import { PositionsList } from './PositionsList'

const meta = {
  title: 'PositionsList',
  component: PositionsList,
  decorators: [
    Story => (
      <BrowserRouter>
        <Story />
      </BrowserRouter>
    )
  ]
} satisfies Meta<typeof PositionsList>

export default meta
type Story = StoryObj<typeof meta>

const data = [
  {
    tokenXName: 'BTC',
    tokenYName: 'AZERO',
    tokenXIcon: '',
    tokenYIcon: '',
    tokenXLiq: 5000,
    tokenYLiq: 300.2,
    min: 2149.6,
    max: 149.6,
    fee: 0.05,
    valueX: 10000.45,
    valueY: 2137.4,
    id: 1,
    address: '0x123132423423'
  },
  {
    tokenXName: 'BTC',
    tokenYName: 'AZERO',
    tokenXIcon: '',
    tokenYIcon: '',
    tokenXLiq: 5000,
    tokenYLiq: 300.2,
    min: 2149.6,
    max: 149.6,
    fee: 0.05,
    valueX: 10000.45,
    valueY: 2137.4,
    id: 2,
    address: '0x123132423423'
  },
  {
    tokenXName: 'BTC',
    tokenYName: 'AZERO',
    tokenXIcon: '',
    tokenYIcon: '',
    tokenXLiq: 5000,
    tokenYLiq: 300.2,
    min: 2149.6,
    max: 149.6,
    fee: 0.05,
    valueX: 10000.45,
    valueY: 2137.4,
    id: 3,
    address: '0x123132423423'
  },
  {
    tokenXName: 'BTC',
    tokenYName: 'AZERO',
    tokenXIcon: '',
    tokenYIcon: '',
    tokenXLiq: 5000,
    tokenYLiq: 300.2,
    min: 2149.6,
    max: 149.6,
    fee: 0.05,
    valueX: 10000.45,
    valueY: 2137.4,
    id: 4,
    address: '0x123132423423'
  }
]

const handleClick = () => {
  console.log('actionButton add Position')
}

export const Primary: Story = {
  args: {
    data,
    onAddPositionClick: handleClick,
    itemsPerPage: 5,
    noConnectedBlockerProps: {
      onConnect: () => {}
    },
    searchValue: '',
    searchSetValue: () => {},
    handleRefresh: () => {},
    initialPage: 1,
    setLastPage: () => {}
  }
}
