import { ApiPromise, WsProvider } from '@polkadot/api'

let _alephZero: ApiPromise | undefined
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

// const networkTypetoProgramNetwork = (type: NetworkType): Network => {
//   switch (type) {
//     case NetworkType.DEVNET:
//       return Network.DEV
//     case NetworkType.LOCALNET:
//       return Network.LOCAL
//     // case SolanaNetworks.TEST:
//     //   return StakerNetwork.TEST
//     case NetworkType.MAINNET:
//       return Network.MAIN
//     default:
//       return Network.DEV
//   }
// }

// const networkTypetoStakerNetwork = (type: NetworkType): StakerNetwork => {
//   switch (type) {
//     case NetworkType.DEVNET:
//       return StakerNetwork.DEV
//     case NetworkType.LOCALNET:
//       return StakerNetwork.LOCAL
//     // case SolanaNetworks.TEST:
//     //   return StakerNetwork.TEST
//     case NetworkType.MAINNET:
//       return StakerNetwork.MAIN
//     default:
//       return StakerNetwork.DEV
//   }
// }

// const networkTypetoBondsNetwork = (type: NetworkType): BondsNetwork => {
//   switch (type) {
//     case NetworkType.DEVNET:
//       return BondsNetwork.DEV
//     case NetworkType.LOCALNET:
//       return BondsNetwork.LOCAL
//     // case SolanaNetworks.TEST:
//     //   return StakerNetwork.TEST
//     // case NetworkType.MAINNET:
//     //   return BondsNetwork.MAIN
//     default:
//       return BondsNetwork.DEV
//   }
// }

const getCurrentAlephZeroConnection = (): ApiPromise | undefined => {
  return _alephZero
}

export {
  getAlephZeroConnection,
  //   SolanaNetworks,
  getCurrentAlephZeroConnection
  //   networkTypetoStakerNetwork,
  //   networkTypetoProgramNetwork,
  //   networkTypetoBondsNetwork
}
