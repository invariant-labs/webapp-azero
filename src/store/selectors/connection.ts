import { ISolanaConnectionStore, connectionSliceName } from '@store/reducers/connection'
import { keySelectors, AnyProps } from './helpers'

const store = (s: AnyProps) => s[connectionSliceName] as ISolanaConnectionStore

export const { network, status, slot, rpcAddress } = keySelectors(store, [
  'network',
  'status',
  'slot',
  'rpcAddress'
])

export const solanaConnectionSelectors = { network, status, slot, rpcAddress }

export default solanaConnectionSelectors
