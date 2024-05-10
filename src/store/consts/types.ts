import { AnyAction, ActionCreator } from 'redux'
import { Network } from '@invariant-labs/a0-sdk'

interface ActionsBasicType {
  [k: string]: ActionCreator<AnyAction>
}

export type PayloadType<actions extends ActionsBasicType> = {
  [k in keyof actions]: Parameters<actions[k]>[0]
}

export interface ISelectNetwork {
  networkType: Network
  rpc: string
  rpcName?: string
}
