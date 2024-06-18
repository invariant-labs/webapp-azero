import { ApiPromise, WsProvider } from '@polkadot/api'

let _alephZero: ApiPromise | null = null
let _network: string

const getAlephZeroConnection = async (url: string) => {
  if (_alephZero && _network === url) return _alephZero

  const provider = new WsProvider(url)
  _alephZero = await ApiPromise.create({
    provider
  })
  _network = url

  return _alephZero
}

const getCurrentAlephZeroConnection = (): ApiPromise | null => {
  return _alephZero
}

export { getAlephZeroConnection, getCurrentAlephZeroConnection }
