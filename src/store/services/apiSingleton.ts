import { Network, initPolkadotApi } from '@invariant-labs/a0-sdk'
import { ApiPromise } from '@polkadot/api'

class SingletonAPI {
  private static instance: SingletonAPI
  private api: ApiPromise | null = null
  private currentRpc: string | null = null
  private currentNetwork: Network | null = null

  private constructor() {}

  public static getInstance(): SingletonAPI {
    if (!SingletonAPI.instance) {
      SingletonAPI.instance = new SingletonAPI()
    }
    return SingletonAPI.instance
  }

  public async loadInstance(network: Network, rpc: string): Promise<ApiPromise> {
    if (!this.api || this.currentRpc !== rpc || this.currentNetwork !== network) {
      const newApi = await initPolkadotApi(network, rpc)
      this.currentRpc = rpc
      this.currentNetwork = network
      this.api = newApi

      return newApi
    }

    return this.api
  }
}

export default SingletonAPI.getInstance()
