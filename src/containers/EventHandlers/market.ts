import { getNetworkTokensList, getTokenDataByAddresses } from '@store/consts/utils'
import { actions } from '@store/reducers/pools'
import { actions as walletActions } from '@store/reducers/wallet'
import { networkType, rpcAddress, status } from '@store/selectors/connection'
import { poolsArraySortedByFees } from '@store/selectors/pools'
import { swap } from '@store/selectors/swap'
import { address } from '@store/selectors/wallet'
import apiSingleton from '@store/services/apiSingleton'
import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'

const MarketEvents = () => {
  const dispatch = useDispatch()
  const network = useSelector(networkType)
  const networkStatus = useSelector(status)
  const { tokenFrom, tokenTo } = useSelector(swap)
  const allPools = useSelector(poolsArraySortedByFees)
  const rpc = useSelector(rpcAddress)
  const walletAddress = useSelector(address)

  useEffect(() => {
    const connectEvents = async () => {
      const api = await apiSingleton.loadInstance(network, rpc)
      let tokens = getNetworkTokensList(network)

      const currentListStr = localStorage.getItem(`CUSTOM_TOKENS_${network}`)
      const currentList: string[] =
        currentListStr !== null
          ? JSON.parse(currentListStr)
              .filter((address: string) => !tokens[address])
              .map((address: string) => address)
          : []

      const lastTokenFrom = localStorage.getItem(`INVARIANT_LAST_TOKEN_FROM_${network}`)
      const lastTokenTo = localStorage.getItem(`INVARIANT_LAST_TOKEN_FROM_${network}`)

      // if (
      //   lastTokenFrom !== null &&
      //   !tokens[lastTokenFrom] &&
      //   !currentList.find(addr => addr.toString() === lastTokenFrom)
      // ) {
      //   currentList.push(new PublicKey(lastTokenFrom))
      // }

      // if (
      //   lastTokenTo !== null &&
      //   !tokens[lastTokenTo] &&
      //   !currentList.find(addr => addr.toString() === lastTokenTo)
      // ) {
      //   currentList.push(new PublicKey(lastTokenTo))
      // }

      getTokenDataByAddresses(currentList, api, network, walletAddress)
        .then(data => {
          tokens = {
            ...tokens,
            ...data
          }
        })
        .finally(() => {
          dispatch(actions.addTokens(tokens))
        })

      dispatch(walletActions.getSelectedTokens(currentList))
    }

    connectEvents()
  }, [dispatch, networkStatus, walletAddress])

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

  useEffect(() => {
    if (tokenFrom && tokenTo) {
      // dispatch(actions.getNearestTicksForPair({ tokenFrom, tokenTo, allPools }))
      dispatch(actions.getTicksAndTickMaps({ tokenFrom, tokenTo, allPools }))
    }
  }, [tokenFrom, tokenTo])

  return null
}

export default MarketEvents
