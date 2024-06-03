import { Invariant } from '@invariant-labs/a0-sdk'
import { Network } from '@invariant-labs/a0-sdk/src'
import { ApiPromise } from '@polkadot/api'
import { DEFAULT_INVARIANT_OPTIONS } from '@store/consts/static'

class SingletonInvariant {
  private static instance: SingletonInvariant
  private invariant: Invariant | null = null
  private currentApi: ApiPromise | null = null
  private currentNetwork: Network | null = null

  private constructor() {}

  public static getInstance(): SingletonInvariant {
    if (!SingletonInvariant.instance) {
      SingletonInvariant.instance = new SingletonInvariant()
    }
    return SingletonInvariant.instance
  }

  public async loadInstance(
    api: ApiPromise,
    network: Network,
    address: string
  ): Promise<Invariant> {
    if (
      !this.invariant ||
      this.currentApi !== api ||
      this.currentNetwork !== network ||
      address !== this.invariant.contract.address.toString()
    ) {
      this.invariant = await Invariant.load(api, network, address, DEFAULT_INVARIANT_OPTIONS)
      this.currentApi = api
      this.currentNetwork = network
    }
    return this.invariant
  }
}

export default SingletonInvariant.getInstance()
