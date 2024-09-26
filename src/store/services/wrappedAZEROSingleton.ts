import { Network, WrappedAZERO } from '@invariant-labs/a0-sdk'
import { ApiPromise } from '@polkadot/api'
import { DEFAULT_WAZERO_OPTIONS, WAZERO_ADDRESS } from '@store/consts/static'

class SingletonWrappedAZERO {
  static wrappedAZERO: WrappedAZERO | null = null
  static api: ApiPromise | null = null
  static network: Network | null = null

  static getInstance(): WrappedAZERO | null {
    return this.wrappedAZERO
  }

  static async loadInstance(
    api: ApiPromise,
    network: Network,
    address: string
  ): Promise<WrappedAZERO> {
    if (
      !this.wrappedAZERO ||
      api !== this.api ||
      network !== this.network ||
      address !== this.wrappedAZERO.contract.address.toString()
    ) {
      this.wrappedAZERO = await WrappedAZERO.load(
        api,
        network,
        WAZERO_ADDRESS[network],
        DEFAULT_WAZERO_OPTIONS
      )
      this.api = api
      this.network = network
    }

    return this.wrappedAZERO
  }
}

export default SingletonWrappedAZERO
