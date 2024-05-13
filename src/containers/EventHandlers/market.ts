import { useDispatch, useSelector } from 'react-redux'
import { useEffect, useState } from 'react'
import { poolTicks, poolsArraySortedByFees, tickMaps } from '@store/selectors/pools'
import { networkType, rpcAddress, status } from '@store/selectors/connection'
import { swap } from '@store/selectors/swap'
import { getCurrentAlephZeroConnection } from '@utils/web3/connection'
import { Status } from '@store/reducers/connection'
import { getNetworkTokensList } from '@store/consts/utils'
import { Token } from '@store/consts/static'
import { action } from '@storybook/addon-actions'
import { actions } from '@store/reducers/pools'

const MarketEvents = () => {
  const dispatch = useDispatch()
  const network = useSelector(networkType)
  const rpc = useSelector(rpcAddress)
  const networkStatus = useSelector(status)
  const tickmaps = useSelector(tickMaps)
  const allPools = useSelector(poolsArraySortedByFees)

  const poolTicksArray = useSelector(poolTicks)
  const [subscribedTick, _setSubscribeTick] = useState<Set<string>>(new Set())
  const [subscribedTickmap, _setSubscribedTickmap] = useState<Set<string>>(new Set())

  useEffect(() => {
    console.log('MarketEvents')
    const connection = getCurrentAlephZeroConnection()
    console.log(networkStatus !== Status.Initialized)
    console.log(connection)

    const connectEvents = () => {
      let tokens = getNetworkTokensList(network)
      console.log(tokens)

      const currentListStr = localStorage.getItem(`CUSTOM_TOKENS_${network}`)
      const currentList: [] =
        currentListStr !== null
          ? JSON.parse(currentListStr)
              .filter((address: string) => !tokens[address])
              .map((address: string) => address)
          : []

      const lastTokenFrom = localStorage.getItem(`INVARIANT_LAST_TOKEN_FROM_${network}`)
      const lastTokenTo = localStorage.getItem(`INVARIANT_LAST_TOKEN_FROM_${network}`)

      //   if (
      //     lastTokenFrom !== null &&
      //     !tokens[lastTokenFrom] &&
      //     !currentList.find(addr => addr.toString() === lastTokenFrom)
      //   ) {
      //     currentList.push(new PublicKey(lastTokenFrom))
      //   }

      //   if (
      //     lastTokenTo !== null &&
      //     !tokens[lastTokenTo] &&
      //     !currentList.find(addr => addr.toString() === lastTokenTo)
      //   ) {
      //     currentList.push(new PublicKey(lastTokenTo))
      //   }

      //   getFullNewTokensData(currentList, connection)
      //     .then(data => {
      //       tokens = {
      //         ...tokens,
      //         ...data
      //       }
      //     })
      //     .finally(() => {
      //       dispatch(actions.addTokens(tokens))
      //     })
      //   getPoolsVolumeRanges(networkType.toLowerCase())
      //     .then(ranges => {
      //       dispatch(actions.setVolumeRanges(ranges))
      //     })
      //     .catch(error => {
      //       console.log(error)
      //     })

      dispatch(actions.addTokens(tokens))
    }

    connectEvents()
  }, [dispatch, networkStatus])

  //   useEffect(() => {
  //     if (networkStatus !== Status.Initialized || !marketProgram) {
  //       return
  //     }

  //     const connectEvents = () => {
  //       allPools.forEach(pool => {
  //         // eslint-disable-next-line @typescript-eslint/no-floating-promises
  //         marketProgram.onPoolChange(pool.tokenX, pool.tokenY, { fee: pool.fee.v }, poolStructure => {
  //           dispatch(
  //             actions.updatePool({
  //               address: pool.address,
  //               poolStructure
  //             })
  //           )
  //         })
  //       })
  //     }

  //     connectEvents()
  //   }, [dispatch, allPools.length, networkStatus, marketProgram])

  //   useEffect(() => {
  //     if (networkStatus !== Status.Initialized || !marketProgram || allPools.length === 0) {
  //       return
  //     }
  //     const connectEvents = async () => {
  //       if (tokenFrom && tokenTo) {
  //         Object.keys(poolTicksArray).forEach(address => {
  //           if (subscribedTick.has(address)) {
  //             return
  //           }
  //           subscribedTick.add(address)
  //           const pool = allPools.find(pool => {
  //             return pool.address.toString() === address
  //           })
  //           if (typeof pool === 'undefined') {
  //             return
  //           }
  //           poolTicksArray[address].forEach(singleTick => {
  //             marketProgram
  //               .onTickChange(
  //                 new Pair(pool.tokenX, pool.tokenY, {
  //                   fee: pool.fee.v,
  //                   tickSpacing: pool.tickSpacing
  //                 }),
  //                 singleTick.index,
  //                 tickObject => {
  //                   dispatch(
  //                     actions.updateTicks({
  //                       address: address,
  //                       index: singleTick.index,
  //                       tick: tickObject
  //                     })
  //                   )
  //                 }
  //               )
  //               .then(() => {})
  //               .catch(() => {})
  //           })
  //         })
  //       }
  //     }
  //     // eslint-disable-next-line @typescript-eslint/no-floating-promises
  //     connectEvents()
  //   }, [networkStatus, marketProgram, Object.values(poolTicksArray).length])

  //   useEffect(() => {
  //     if (
  //       networkStatus !== Status.Initialized ||
  //       !marketProgram ||
  //       Object.values(allPools).length === 0
  //     ) {
  //       return
  //     }
  //     const connectEvents = async () => {
  //       if (tokenFrom && tokenTo) {
  //         Object.keys(tickmaps).forEach(address => {
  //           if (subscribedTickmap.has(address)) {
  //             return
  //           }
  //           subscribedTickmap.add(address)
  //           const pool = allPools.find(pool => {
  //             return pool.tickmap.toString() === address
  //           })
  //           if (typeof pool === 'undefined') {
  //             return
  //           }
  //           // trunk-ignore(eslint/@typescript-eslint/no-floating-promises)
  //           marketProgram.onTickmapChange(new PublicKey(address), tickmap => {
  //             const changes = findTickmapChanges(
  //               tickmaps[address].bitmap,
  //               tickmap.bitmap,
  //               pool.tickSpacing
  //             )

  //             for (const [index, info] of Object.entries(changes)) {
  //               if (info === 'added') {
  //                 try {
  //                   // trunk-ignore(eslint/@typescript-eslint/no-floating-promises)
  //                   marketProgram.onTickChange(
  //                     new Pair(pool.tokenX, pool.tokenY, {
  //                       fee: pool.fee.v,
  //                       tickSpacing: pool.tickSpacing
  //                     }),
  //                     +index,
  //                     tickObject => {
  //                       dispatch(
  //                         actions.updateTicks({
  //                           address: pool.address.toString(),
  //                           index: +index,
  //                           tick: tickObject
  //                         })
  //                       )
  //                     }
  //                   )
  //                 } catch (err) {
  //                   console.log(err)
  //                 }
  //               }
  //             }
  //             dispatch(
  //               actions.updateTickmap({
  //                 address: address,
  //                 bitmap: tickmap.bitmap
  //               })
  //             )
  //           })
  //         })
  //       }
  //     }
  //     // eslint-disable-next-line @typescript-eslint/no-floating-promises
  //     connectEvents()
  //   }, [networkStatus, marketProgram, Object.values(tickmaps).length])

  //   useEffect(() => {
  //     if (tokenFrom && tokenTo) {
  //       dispatch(actions.getNearestTicksForPair({ tokenFrom, tokenTo, allPools }))
  //       dispatch(actions.getTicksAndTickMaps({ tokenFrom, tokenTo, allPools }))
  //     }
  //   }, [tokenFrom, tokenTo])

  return null
}

export default MarketEvents
