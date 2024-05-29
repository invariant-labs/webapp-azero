import { TESTNET_WAZERO_ADDRESS, WrappedAZERO } from '@invariant-labs/a0-sdk'
import { Network } from '@invariant-labs/a0-sdk/src'
import { ApiPromise } from '@polkadot/api'
import { DEFAULT_WAZERO_OPTIONS } from '@store/consts/static'

class SingletonWrappedAZERO {
  private static instance: SingletonWrappedAZERO
  private wrappedAZERO: WrappedAZERO | null = null
  private currentApi: ApiPromise | null = null
  private currentNetwork: Network | null = null

  private constructor() {}

  public static getInstance(): SingletonWrappedAZERO {
    if (!SingletonWrappedAZERO.instance) {
      SingletonWrappedAZERO.instance = new SingletonWrappedAZERO()
    }
    return SingletonWrappedAZERO.instance
  }

  public async loadInstance(api: ApiPromise, network: Network): Promise<WrappedAZERO> {
    if (!this.wrappedAZERO || this.currentApi !== api || this.currentNetwork !== network) {
      this.wrappedAZERO = await WrappedAZERO.load(
        api,
        network,
        TESTNET_WAZERO_ADDRESS,
        DEFAULT_WAZERO_OPTIONS
      )
      this.currentApi = api
      this.currentNetwork = network
    }
    return this.wrappedAZERO
  }
}

export default SingletonWrappedAZERO.getInstance()
