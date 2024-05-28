import { Invariant, TESTNET_INVARIANT_ADDRESS } from '@invariant-labs/a0-sdk'
import { Network } from '@invariant-labs/a0-sdk/src'
import { ApiPromise } from '@polkadot/api'
import { DEFAULT_INVARIANT_OPTIONS } from '@store/consts/static'

class SingletonInvariant {
  private static instance: SingletonInvariant
  private invariant: Invariant | null = null

  private constructor() {}

  public static getInstance(): SingletonInvariant {
    if (!SingletonInvariant.instance) {
      SingletonInvariant.instance = new SingletonInvariant()
    }
    return SingletonInvariant.instance
  }

  public async loadInstance(api: ApiPromise, network: Network): Promise<Invariant> {
    if (!this.invariant) {
      this.invariant = await Invariant.load(
        api,
        network,
        TESTNET_INVARIANT_ADDRESS,
        DEFAULT_INVARIANT_OPTIONS
      )
    }
    return this.invariant
  }
}

export default SingletonInvariant.getInstance()
