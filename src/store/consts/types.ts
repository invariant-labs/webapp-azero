import { AnyAction, ActionCreator } from 'redux'
import { NetworkType } from './static'

interface ActionsBasicType {
  [k: string]: ActionCreator<AnyAction>
}

export type PayloadType<actions extends ActionsBasicType> = {
  [k in keyof actions]: Parameters<actions[k]>[0]
}

export interface ISelectNetwork {
  networkType: NetworkType
  rpc: string
  rpcName?: string
}
