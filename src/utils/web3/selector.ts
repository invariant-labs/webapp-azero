import { NightlyConnectAdapter } from '@nightlylabs/wallet-selector-polkadot'

export interface ConnectionOptions {
  disableModal?: boolean
  disableEagerConnect?: boolean
  initOnConnect?: boolean
}

let _adapter: NightlyConnectAdapter | undefined
export const nightlyConnectAdapter = async (
  persisted = true,
  connectionOptions: ConnectionOptions = {}
) => {
  if (_adapter) return _adapter
  _adapter = await NightlyConnectAdapter.build(
    {
      appMetadata: {
        name: 'Invariant',
        description: 'Invariant - AMM DEX provided concentrated liquidity',
        icon: 'https://invariant.app/favicon-192x192.png'
      },
      network: 'AlephZero',
      persistent: persisted
    },
    connectionOptions
  )
  return _adapter
}

export const openWalletSelectorModal = async () => {
  const adapter = await nightlyConnectAdapter()
  try {
    if (adapter.connected) {
      return
    }
    await adapter.connect()
  } catch (error) {
    console.log(error)
    await adapter.disconnect().catch(err => {
      console.log(err)
    })
  }
}
