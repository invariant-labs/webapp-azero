import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import ChangeWalletButton from './ChangeWalletButton'
import SelectNetworkButton from './SelectNetworkButton'
import SelectRPCButton from './SelectRPCButton'
import { AlephZeroNetworks, NetworkType } from '@store/consts/static'
import { MemoryRouter } from 'react-router-dom'
import { on } from 'events'
import { Typography } from '@mui/material'
import { toBlur } from '@utils/uiUtils'

import { action } from '@storybook/addon-actions'

const meta = {
  title: 'Buttons/HeaderButtons',
  argTypes: {
    onConnect: { action: 'connect' },
    onDisconnect: { action: 'disconnect' },
    onSelect: { action: 'select' },
    onRPC: { action: 'rpc' },
    onNetworkSelect: { action: 'network' },
    onFaucet: { action: 'faucet' },
    onLanding: { action: 'landing' }
  }
}

export default meta
type Story = StoryObj<typeof meta>

export const ConnectWallet: Story = {
  render: () => (
    <div style={{ padding: '100px' }}>
      <ChangeWalletButton
        name='Connect Wallet'
        connected={false}
        onConnect={action('connect')}
        onDisconnect={fn}
        className=''
        hideArrow
      />
    </div>
  )
}

export const WalletConnected: Story = {
  render: () => (
    <div style={{ padding: '100px' }}>
      <ChangeWalletButton
        name='Connected'
        connected={true}
        onConnect={fn}
        onDisconnect={action('disconnect')}
        className=''
        hideArrow
      />
    </div>
  )
}

export const SelectNetwork: Story = {
  render: () => (
    <div style={{ padding: '100px' }}>
      <SelectNetworkButton
        name={NetworkType.TESTNET}
        networks={[
          { networkType: NetworkType.DEVNET, rpc: AlephZeroNetworks.DEV },
          { networkType: NetworkType.MAINNET, rpc: AlephZeroNetworks.TEST }
        ]}
        onSelect={(networkType, rpc) => action('chosen: ' + networkType + ' ' + rpc)()}
      />
    </div>
  )
}

export const SelectRPC: Story = {
  render: () => (
    <div style={{ padding: '100px' }}>
      <SelectRPCButton
        rpc={AlephZeroNetworks.TEST}
        networks={[
          {
            networkType: NetworkType.TESTNET,
            rpc: AlephZeroNetworks.TEST,
            rpcName: 'Testnet'
          },
          { networkType: NetworkType.DEVNET, rpc: AlephZeroNetworks.DEV, rpcName: 'Devnet' }
        ]}
        onSelect={(networkType, rpc) => action('chosen: ' + networkType + ' ' + rpc)()}
      />
    </div>
  )
}
