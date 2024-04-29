import { IAlephZeroConnectionStore, connectionSliceName } from '@store/reducers/connection'
import { keySelectors, AnyProps } from './helpers'

const store = (s: AnyProps) => s[connectionSliceName] as IAlephZeroConnectionStore

export const { network, status, blockNumber, rpcAddress } = keySelectors(store, [
  'network',
  'status',
  'blockNumber',
  'rpcAddress'
])

export const alephZeroConnectionSelectors = { network, status, blockNumber, rpcAddress }

export default alephZeroConnectionSelectors
