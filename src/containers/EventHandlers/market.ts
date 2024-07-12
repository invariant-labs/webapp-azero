import { getNetworkTokensList, getTokenDataByAddresses } from '@utils/utils'
import { actions } from '@store/reducers/pools'
import { actions as walletActions } from '@store/reducers/wallet'
import {
  invariantAddress,
  networkType,
  rpcAddress,
  status,
  wrappedAZEROAddress
} from '@store/selectors/connection'
import { poolsArraySortedByFees } from '@store/selectors/pools'
import { swap } from '@store/selectors/swap'
import { address } from '@store/selectors/wallet'
import apiSingleton from '@store/services/apiSingleton'
import invariantSingleton from '@store/services/invariantSingleton'
import psp22Singleton from '@store/services/psp22Singleton'
import wrappedAZEROSingleton from '@store/services/wrappedAZEROSingleton'
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
  const invariantAddr = useSelector(invariantAddress)
  const wrappedAZEROAddr = useSelector(wrappedAZEROAddress)

  useEffect(() => {
    const connectEvents = async () => {
      const api = await apiSingleton.loadInstance(network, rpc)
      const psp22 = await psp22Singleton.loadInstance(api, network)
      let tokens = getNetworkTokensList(network)

      const currentListStr = localStorage.getItem(`CUSTOM_TOKENS_${network}`)
      const currentList: string[] =
        currentListStr !== null
          ? JSON.parse(currentListStr)
              .filter((address: string) => !tokens[address])
              .map((address: string) => address)
          : []

      getTokenDataByAddresses(currentList, psp22, walletAddress)
        .then(data => {
          tokens = {
            ...tokens,
            ...data
          }
        })
        .finally(() => {
          dispatch(actions.addTokens(tokens))
        })

      dispatch(walletActions.getBalances(currentList))
    }

    connectEvents()
  }, [dispatch, networkStatus, walletAddress])

  useEffect(() => {
    if (tokenFrom && tokenTo) {
      // dispatch(actions.getNearestTicksForPair({ tokenFrom, tokenTo, allPools }))
      dispatch(actions.getTicksAndTickMaps({ tokenFrom, tokenTo, allPools }))
    }
  }, [tokenFrom, tokenTo])

  useEffect(() => {
    const loadInstances = async () => {
      const api = await apiSingleton.loadInstance(network, rpc)

      if (api) {
        invariantSingleton.loadInstance(api, network, invariantAddr)
        psp22Singleton.loadInstance(api, network)
        wrappedAZEROSingleton.loadInstance(api, network, wrappedAZEROAddr)
      }
    }

    loadInstances()
  }, [network, rpc, invariantAddr, wrappedAZEROAddr])

  return null
}

export default MarketEvents
