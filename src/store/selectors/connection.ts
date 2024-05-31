import { IAlephZeroConnectionStore, connectionSliceName } from '@store/reducers/connection'
import { AnyProps, keySelectors } from './helpers'

const store = (s: AnyProps) => s[connectionSliceName] as IAlephZeroConnectionStore

export const { networkType, status, blockNumber, rpcAddress, invariantAddress } = keySelectors(
  store,
  ['networkType', 'status', 'blockNumber', 'rpcAddress', 'invariantAddress']
)

export const alephZeroConnectionSelectors = {
  networkType,
  status,
  blockNumber,
  rpcAddress,
  invariantAddress
}

export default alephZeroConnectionSelectors
