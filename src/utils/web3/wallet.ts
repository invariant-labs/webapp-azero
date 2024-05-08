import { nightlyConnectAdapter } from './selector'

export const getAlephZeroWallet = async () => {
  const adapter = await nightlyConnectAdapter()

  return adapter
}

export const disconnectWallet = async () => {
  const adapter = await nightlyConnectAdapter()

  await adapter.disconnect()
}
