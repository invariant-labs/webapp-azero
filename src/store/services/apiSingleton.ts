import { Network } from '@invariant-labs/a0-sdk'
import { ApiPromise, WsProvider } from '@polkadot/api'
import { actions as connectionActions } from '@store/reducers/connection'
import { store } from '..'
import { RECOMMENDED_RPC_ADDRESS } from '@store/consts/static'

class SingletonApi {
  static api: ApiPromise | null = null
  static rpc: string | null = null
  static network: Network | null = null

  static getInstance(): ApiPromise | null {
    return this.api
  }

  static async loadInstance(network: Network, rpc: string): Promise<ApiPromise> {
    if (!this.api || network !== this.network || rpc !== this.rpc) {
      this.api = await initPolkadotApi(network, rpc)
      this.network = network
      this.rpc = rpc
    }

    return this.api
  }
}

const initPolkadotApi = async (network: Network, ws?: string): Promise<ApiPromise> => {
  const wsProvider = new WsProvider(ws ?? RECOMMENDED_RPC_ADDRESS[network], false)

  const unsubscribe = wsProvider.on('error', () => {
    store.dispatch(connectionActions.handleRpcError())
  })

  try {
    await wsProvider.connect()
  } catch (e) {
    unsubscribe()
  }

  const api = await ApiPromise.create({ provider: wsProvider })
  await api.isReady
  return api
}

export default SingletonApi
