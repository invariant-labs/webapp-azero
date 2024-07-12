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

      dispatch(walletActions.getBalances(currentList))
    }

    connectEvents()
  }, [dispatch, networkStatus, walletAddress])

  useEffect(() => {
    if (tokenFrom && tokenTo) {
      dispatch(actions.getTicksAndTickMaps({ tokenFrom, tokenTo, allPools }))
    }
  }, [tokenFrom, tokenTo])

  return null
}

export default MarketEvents
