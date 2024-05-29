import { PSP22 } from '@invariant-labs/a0-sdk'
import { Network } from '@invariant-labs/a0-sdk/src'
import { ApiPromise } from '@polkadot/api'
import { DEFAULT_PSP22_OPTIONS } from '@store/consts/static'

class SingletonPSP22 {
  private static instance: SingletonPSP22
  private psp22: PSP22 | null = null
  private currentApi: ApiPromise | null = null
  private currentNetwork: Network | null = null

  private constructor() {}

  public static getInstance(): SingletonPSP22 {
    if (!SingletonPSP22.instance) {
      SingletonPSP22.instance = new SingletonPSP22()
    }
    return SingletonPSP22.instance
  }

  public async loadInstance(api: ApiPromise, network: Network): Promise<PSP22> {
    if (!this.psp22 || this.currentApi !== api || this.currentNetwork !== network) {
      this.psp22 = await PSP22.load(api, network, DEFAULT_PSP22_OPTIONS)
      this.currentApi = api
      this.currentNetwork = network
    }
    return this.psp22
  }
}

export default SingletonPSP22.getInstance()
