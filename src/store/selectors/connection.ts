import { IAlephZeroConnectionStore, connectionSliceName } from '@store/reducers/connection'
import { keySelectors, AnyProps } from './helpers'

const store = (s: AnyProps) => s[connectionSliceName] as IAlephZeroConnectionStore

export const { networkType, status, blockNumber, rpcAddress } = keySelectors(store, [
  'networkType',
  'status',
  'blockNumber',
  'rpcAddress'
])

export const alephZeroConnectionSelectors = { networkType, status, blockNumber, rpcAddress }

export default alephZeroConnectionSelectors
