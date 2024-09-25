import { IAlephZeroConnectionStore, connectionSliceName } from '@store/reducers/connection'
import { AnyProps, keySelectors } from './helpers'

const store = (s: AnyProps) => s[connectionSliceName] as IAlephZeroConnectionStore

export const {
  networkType,
  status,
  blockNumber,
  rpcAddress,
  invariantAddress,
  wrappedAZEROAddress,
  rpcStatus
} = keySelectors(store, [
  'networkType',
  'status',
  'blockNumber',
  'rpcAddress',
  'invariantAddress',
  'wrappedAZEROAddress',
  'rpcStatus'
])

export const alephZeroConnectionSelectors = {
  networkType,
  status,
  blockNumber,
  rpcAddress,
  invariantAddress,
  wrappedAZEROAddress,
  rpcStatus
}

export default alephZeroConnectionSelectors
