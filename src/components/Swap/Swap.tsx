import AnimatedButton, { ProgressState } from '@components/AnimatedButton/AnimatedButton'
import ChangeWalletButton from '@components/Header/HeaderButton/ChangeWalletButton'
import ExchangeAmountInput from '@components/Inputs/ExchangeAmountInput/ExchangeAmountInput'
import Slippage from '@components/Modals/Slippage/Slippage'
import Refresher from '@components/Refresher/Refresher'
import { Network, PoolKey, Price } from '@invariant-labs/a0-sdk'
import { PERCENTAGE_DENOMINATOR } from '@invariant-labs/a0-sdk/target/consts'
import { Box, Button, Grid, Typography } from '@mui/material'
import refreshIcon from '@static/svg/refresh.svg'
import settingIcon from '@static/svg/settings.svg'
import SwapArrows from '@static/svg/swap-arrows.svg'
import {
  DEFAULT_TOKEN_DECIMAL,
  REFRESHER_INTERVAL,
  SWAP_SAFE_TRANSACTION_FEE
} from '@store/consts/static'
import {
  addressToTicker,
  convertBalanceToBigint,
  printBigint,
  stringToFixed,
  trimLeadingZeros
} from '@utils/utils'
import { PoolWithPoolKey } from '@store/reducers/pools'
import { Swap as SwapData } from '@store/reducers/swap'
import { Status } from '@store/reducers/wallet'
import { SwapError } from '@store/sagas/swap'
import { SwapToken } from '@store/selectors/wallet'
import { blurContent, unblurContent } from '@utils/uiUtils'
import classNames from 'classnames'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Simulate } from '@store/reducers/swap'
import ExchangeRate from './ExchangeRate/ExchangeRate'
import TransactionDetailsBox from './TransactionDetailsBox/TransactionDetailsBox'
import useStyles from './style'
import { SimulateResult, TokenPriceData } from '@store/consts/types'
import TokensInfo from './TokensInfo/TokensInfo'
import { VariantType } from 'notistack'
import { useNavigate } from 'react-router-dom'
import { TooltipHover } from '@components/TooltipHover/TooltipHover'

export interface Pools {
  tokenX: string
  tokenY: string
  tokenXReserve: string
  tokenYReserve: string
  tickSpacing: number
  sqrtPrice: {
    v: bigint
    scale: number
  }
  fee: {
    val: bigint
    scale: number
  }
  exchangeRate: {
    val: bigint
    scale: number
  }
}

export interface ISwap {
  isFetchingNewPool: boolean
  onRefresh: (tokenFromAddress: string | null, tokenToAddress: string | null) => void
  walletStatus: Status
  swapData: SwapData
  tokens: Record<string, SwapToken>
  pools: PoolWithPoolKey[]
  tickmap: { [x: string]: string }
  onSwap: (
    poolKey: PoolKey,
    slippage: bigint,
    knownPrice: Price,
    tokenFrom: string,
    tokenTo: string,
    amountIn: bigint,
    amountOut: bigint,
    byAmountIn: boolean
  ) => void
  onSetPair: (tokenFrom: string | null, tokenTo: string | null) => void
  progress: ProgressState
  isWaitingForNewPool: boolean
  onConnectWallet: () => void
  onDisconnectWallet: () => void
  initialTokenFrom: string | null
  initialTokenTo: string | null
  handleAddToken: (address: string) => void
  commonTokens: string[]
  initialHideUnknownTokensValue: boolean
  onHideUnknownTokensChange: (val: boolean) => void
  tokenFromPriceData?: TokenPriceData
  tokenToPriceData?: TokenPriceData
  priceFromLoading?: boolean
  priceToLoading?: boolean
  onSlippageChange: (slippage: string) => void
  initialSlippage: string
  isBalanceLoading: boolean
  simulateResult: SimulateResult
  simulateSwap: (simulate: Simulate) => void
  copyTokenAddressHandler: (message: string, variant: VariantType) => void
  network: Network
  azeroBalance: bigint
}

export const Swap: React.FC<ISwap> = ({
  isFetchingNewPool,
  onRefresh,
  walletStatus,
  tokens,
  pools,
  tickmap,
  onSwap,
  onSetPair,
  progress,
  isWaitingForNewPool,
  onConnectWallet,
  onDisconnectWallet,
  initialTokenFrom,
  initialTokenTo,
  handleAddToken,
  commonTokens,
  initialHideUnknownTokensValue,
  onHideUnknownTokensChange,
  tokenFromPriceData,
  tokenToPriceData,
  priceFromLoading,
  priceToLoading,
  onSlippageChange,
  initialSlippage,
  isBalanceLoading,
  swapData,
  simulateResult,
  simulateSwap,
  copyTokenAddressHandler,
  network,
  azeroBalance
}) => {
  const { classes } = useStyles()
  enum inputTarget {
    DEFAULT = 'default',
    FROM = 'from',
    TO = 'to'
  }
  const [tokenFrom, setTokenFrom] = React.useState<string | null>(null)
  const [tokenTo, setTokenTo] = React.useState<string | null>(null)
  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null)
  const [lockAnimation, setLockAnimation] = React.useState<boolean>(false)
  const [amountFrom, setAmountFrom] = React.useState<string>('')
  const [amountTo, setAmountTo] = React.useState<string>('')
  const [swap, setSwap] = React.useState<boolean | null>(null)
  const [rotates, setRotates] = React.useState<number>(0)
  const [slippTolerance, setSlippTolerance] = React.useState<string>(initialSlippage)
  const [throttle, setThrottle] = React.useState<boolean>(false)
  const [settings, setSettings] = React.useState<boolean>(false)
  const [detailsOpen, setDetailsOpen] = React.useState<boolean>(false)
  const [inputRef, setInputRef] = React.useState<string>(inputTarget.DEFAULT)
  const [rateReversed, setRateReversed] = React.useState<boolean>(false)
  const [refresherTime, setRefresherTime] = React.useState<number>(REFRESHER_INTERVAL)
  const [hideUnknownTokens, setHideUnknownTokens] = React.useState<boolean>(
    initialHideUnknownTokensValue
  )

  const timeoutRef = useRef<number>(0)

  const navigate = useNavigate()

  useEffect(() => {
    navigate(
      `/exchange/${tokenFrom ? addressToTicker(network, tokenFrom) : '-'}/${tokenTo ? addressToTicker(network, tokenTo) : '-'}`,
      {
        replace: true
      }
    )
  }, [tokenTo, tokenFrom])

  useEffect(() => {
    if (Object.keys(tokens).length && tokenFrom === null && tokenTo === null) {
      const firstCommonToken = commonTokens[0] || null

      setTokenFrom(initialTokenFrom !== null ? initialTokenFrom : firstCommonToken)
      setTokenTo(initialTokenTo)
    }
  }, [Object.keys(tokens).length])

  useEffect(() => {
    onSetPair(tokenFrom, tokenTo)
  }, [tokenFrom, tokenTo])

  useEffect(() => {
    if (inputRef === inputTarget.FROM && !(amountFrom === '' && amountTo === '')) {
      simulateWithTimeout()
    }
  }, [amountFrom, tokenTo, tokenFrom, slippTolerance, Object.keys(tickmap).length])

  useEffect(() => {
    if (inputRef === inputTarget.TO && !(amountFrom === '' && amountTo === '')) {
      simulateWithTimeout()
    }
  }, [amountTo, tokenTo, tokenFrom, slippTolerance, Object.keys(tickmap).length])

  useEffect(() => {
    if (progress === 'none' && !(amountFrom === '' && amountTo === '')) {
      simulateWithTimeout()
    }
  }, [progress])

  const simulateWithTimeout = () => {
    setThrottle(true)

    clearTimeout(timeoutRef.current)
    const timeout = setTimeout(() => {
      setSimulateAmount().finally(() => {
        setThrottle(false)
      })
    }, 500)
    timeoutRef.current = timeout as unknown as number
  }

  useEffect(() => {
    if (tokenFrom !== null && tokenTo !== null) {
      if (inputRef === inputTarget.FROM && tokens[tokenTo]) {
        const amount = getAmountOut(tokens[tokenTo])
        setAmountTo(+amount === 0 ? '' : trimLeadingZeros(amount))
      } else if (tokens[tokenFrom]) {
        const amount = getAmountOut(tokens[tokenFrom])
        setAmountFrom(+amount === 0 ? '' : trimLeadingZeros(amount))
      } else if (!tokens[tokenTo]) {
        setAmountTo('')
      } else if (!tokens[tokenFrom]) {
        setAmountFrom('')
      }
    }
  }, [simulateResult])

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (refresherTime > 0 && tokenFrom !== null && tokenTo !== null) {
        setRefresherTime(refresherTime - 1)
      } else {
        handleRefresh()
      }
    }, 1000)

    return () => clearTimeout(timeout)
  }, [refresherTime, tokenFrom, tokenTo])

  useEffect(() => {
    if (inputRef !== inputTarget.DEFAULT) {
      const temp: string = amountFrom
      setAmountFrom(amountTo)
      setAmountTo(temp)
      setInputRef(inputRef === inputTarget.FROM ? inputTarget.TO : inputTarget.FROM)
    }
  }, [swap])

  useEffect(() => {
    setRateReversed(false)
  }, [tokenFrom, tokenTo])

  const getAmountOut = (assetFor: SwapToken) => {
    const amountOut = printBigint(simulateResult.amountOut, assetFor.decimals)

    return stringToFixed(amountOut, Number(assetFor.decimals))
  }

  const setSimulateAmount = async () => {
    if (tokenFrom !== null && tokenTo !== null && tokenFrom !== tokenTo && swapData) {
      if (inputRef === inputTarget.FROM) {
        simulateSwap({
          fromToken: tokenFrom,
          toToken: tokenTo,
          amount: convertBalanceToBigint(amountFrom, Number(tokens[tokenFrom].decimals)),
          byAmountIn: true
        })
      } else {
        simulateSwap({
          fromToken: tokenFrom,
          toToken: tokenTo,
          amount: convertBalanceToBigint(amountTo, Number(tokens[tokenTo].decimals)),
          byAmountIn: false
        })
      }
    }
  }

  const getIsXToY = (fromToken: string, toToken: string) => {
    const swapPool = pools.find(
      pool =>
        (fromToken === pool.poolKey.tokenX && toToken === pool.poolKey.tokenY) ||
        (fromToken === pool.poolKey.tokenY && toToken === pool.poolKey.tokenX)
    )
    return !!swapPool
  }

  const isError = (error: SwapError): boolean => {
    if (simulateResult.errors) {
      return simulateResult.errors.some(err => err === error)
    }
    return false
  }

  const isInsufficientLiquidityError = useMemo(
    () =>
      simulateResult.poolKey === null &&
      (isError(SwapError.InsufficientLiquidity) || isError(SwapError.MaxSwapStepsReached)),
    [simulateResult]
  )

  const getStateMessage = () => {
    if ((tokenFrom !== null && tokenTo !== null && throttle) || isWaitingForNewPool) {
      return 'Loading'
    }

    if (walletStatus !== Status.Initialized) {
      return 'Connect a wallet'
    }

    if (tokenFrom === null || tokenTo === null) {
      return 'Select a token'
    }

    if (tokenFrom === tokenTo) {
      return 'Select different tokens'
    }

    if (!getIsXToY(tokenFrom, tokenTo)) {
      return "Pool doesn't exist."
    }

    if (isInsufficientLiquidityError) {
      return 'Insufficient liquidity'
    }

    if (
      convertBalanceToBigint(amountFrom, Number(tokens[tokenFrom]?.decimals) ?? 0n) >
        tokens[tokenFrom]?.balance ||
      0n
    ) {
      return 'Insufficient balance'
    }

    if (azeroBalance < SWAP_SAFE_TRANSACTION_FEE) {
      return `Insufficient AZERO`
    }

    if (
      convertBalanceToBigint(amountFrom, Number(tokens[tokenFrom]?.decimals ?? 0n)) === 0n ||
      (simulateResult.poolKey === null && isError(SwapError.AmountIsZero))
    ) {
      return 'Insufficient volume'
    }

    if (
      tokenFrom !== null &&
      convertBalanceToBigint(amountFrom, Number(tokens[tokenFrom]?.decimals ?? 0n)) !== 0n &&
      isError(SwapError.Unknown)
    ) {
      return 'Not enough liquidity'
    }

    return 'Exchange'
  }
  const hasShowRateMessage = () => {
    return (
      getStateMessage() === 'Insufficient balance' ||
      getStateMessage() === 'Exchange' ||
      getStateMessage() === 'Loading' ||
      getStateMessage() === 'Connect a wallet' ||
      getStateMessage() === 'Insufficient liquidity'
    )
  }
  const setSlippage = (slippage: string): void => {
    setSlippTolerance(slippage)
    onSlippageChange(slippage)
  }

  const handleClickSettings = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
    blurContent()
    setSettings(true)
  }

  const handleCloseSettings = () => {
    unblurContent()
    setSettings(false)
  }

  const handleOpenTransactionDetails = () => {
    setDetailsOpen(!detailsOpen)
  }

  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    if (lockAnimation) {
      timeoutId = setTimeout(() => setLockAnimation(false), 300)
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [lockAnimation])

  const swapRate =
    tokenFrom === null || tokenTo === null || amountFrom === '' || amountTo === ''
      ? 0
      : +amountTo / +amountFrom

  const canShowDetails =
    tokenFrom !== null &&
    tokenTo !== null &&
    hasShowRateMessage() &&
    (getStateMessage() === 'Loading' ||
      (swapRate !== 0 && swapRate !== Infinity && !isNaN(swapRate))) &&
    amountFrom !== '' &&
    amountTo !== ''

  const [prevOpenState, setPrevOpenState] = useState(detailsOpen && canShowDetails)

  useEffect(() => {
    if (getStateMessage() !== 'Loading') {
      setPrevOpenState(detailsOpen && canShowDetails)
    }
  }, [detailsOpen, canShowDetails])

  const handleRefresh = async () => {
    onRefresh(tokenFrom, tokenTo)
    setRefresherTime(REFRESHER_INTERVAL)
  }

  useEffect(() => {
    void setSimulateAmount()
  }, [isFetchingNewPool])

  useEffect(() => {
    setRefresherTime(REFRESHER_INTERVAL)

    if (tokenFrom === tokenTo) {
      setAmountFrom('')
      setAmountTo('')
    }
  }, [tokenFrom, tokenTo])

  return (
    <Grid container className={classes.swapWrapper} alignItems='center'>
      <Grid container className={classes.header}>
        <Typography component='h1'>Exchange tokens</Typography>
        <Box className={classes.swapControls}>
          <Button className={classes.slippageButton} onClick={e => handleClickSettings(e)}>
            <p>
              Slippage: <span className={classes.slippageAmount}>{slippTolerance}%</span>
            </p>
          </Button>
          <TooltipHover text='Refresh'>
            <Grid display='flex' alignItems='center'>
              <Button
                onClick={handleRefresh}
                className={classes.refreshIconBtn}
                disabled={
                  priceFromLoading ||
                  priceToLoading ||
                  isBalanceLoading ||
                  getStateMessage() === 'Loading' ||
                  tokenFrom === null ||
                  tokenTo === null ||
                  tokenFrom === tokenTo
                }>
                <img src={refreshIcon} className={classes.refreshIcon} alt='Refresh' />
              </Button>
            </Grid>
          </TooltipHover>
          <TooltipHover text='Settings'>
            <Button onClick={handleClickSettings} className={classes.settingsIconBtn}>
              <img src={settingIcon} className={classes.settingsIcon} alt='Settings' />
            </Button>
          </TooltipHover>
        </Box>
        <Grid className={classes.slippage}>
          <Slippage
            open={settings}
            setSlippage={setSlippage}
            handleClose={handleCloseSettings}
            anchorEl={anchorEl}
            initialSlippage={initialSlippage}
          />
        </Grid>
      </Grid>
      <Grid container className={classes.root} direction='column'>
        <Typography className={classes.swapLabel}>Pay</Typography>
        <Box
          className={classNames(
            classes.exchangeRoot,
            lockAnimation ? classes.amountInputDown : undefined
          )}>
          <ExchangeAmountInput
            value={amountFrom}
            balance={
              tokenFrom !== null && tokens[tokenFrom]
                ? printBigint(tokens[tokenFrom].balance || 0n, tokens[tokenFrom].decimals)
                : '- -'
            }
            decimal={
              tokenFrom !== null && tokens[tokenFrom]
                ? tokens[tokenFrom].decimals
                : DEFAULT_TOKEN_DECIMAL
            }
            className={classes.amountInput}
            setValue={value => {
              if (value.match(/^\d*\.?\d*$/)) {
                setAmountFrom(value)
                setInputRef(inputTarget.FROM)
              }
            }}
            placeholder={`0.${'0'.repeat(6)}`}
            onMaxClick={() => {
              if (tokenFrom !== null) {
                setInputRef(inputTarget.FROM)
                setAmountFrom(printBigint(tokens[tokenFrom].balance, tokens[tokenFrom].decimals))
              }
            }}
            tokens={tokens}
            current={tokenFrom !== null ? tokens[tokenFrom] : null}
            onSelect={setTokenFrom}
            disabled={tokenFrom === tokenTo || tokenFrom === null}
            hideBalances={walletStatus !== Status.Initialized}
            handleAddToken={handleAddToken}
            commonTokens={commonTokens}
            limit={1e14}
            initialHideUnknownTokensValue={initialHideUnknownTokensValue}
            onHideUnknownTokensChange={e => {
              onHideUnknownTokensChange(e)
              setHideUnknownTokens(e)
            }}
            tokenPrice={tokenFromPriceData?.price}
            priceLoading={priceFromLoading}
            isBalanceLoading={isBalanceLoading}
            showMaxButton={true}
            showBlur={
              lockAnimation ||
              (getStateMessage() === 'Loading' &&
                (inputRef === inputTarget.TO || inputRef === inputTarget.DEFAULT))
            }
            hiddenUnknownTokens={hideUnknownTokens}
          />
        </Box>
        <Box className={classes.tokenComponentTextContainer}>
          <Box
            className={classes.swapArrowBox}
            onClick={() => {
              if (lockAnimation) return
              setLockAnimation(!lockAnimation)
              setRotates(rotates + 1)
              swap !== null ? setSwap(!swap) : setSwap(true)
              setTimeout(() => {
                const tmpAmount = amountTo

                const tmp = tokenFrom
                setTokenFrom(tokenTo)
                setTokenTo(tmp)

                setInputRef(inputTarget.FROM)
                setAmountFrom(tmpAmount)
              }, 50)
            }}>
            <Box className={classes.swapImgRoot}>
              <img
                src={SwapArrows}
                style={{
                  transform: `rotate(${-rotates * 180}deg)`
                }}
                className={classes.swapArrows}
                alt='Invert tokens'
              />
            </Box>
          </Box>
        </Box>
        <Typography className={classes.swapLabel} mt={1.5}>
          Receive
        </Typography>
        <Box
          className={classNames(
            classes.exchangeRoot,
            classes.transactionBottom,
            lockAnimation ? classes.amountInputUp : undefined
          )}>
          <ExchangeAmountInput
            value={amountTo}
            balance={
              tokenTo !== null && tokens[tokenTo]
                ? printBigint(tokens[tokenTo]?.balance || 0n, tokens[tokenTo]?.decimals)
                : '- -'
            }
            className={classes.amountInput}
            decimal={
              tokenTo !== null && tokens[tokenTo] ? tokens[tokenTo].decimals : DEFAULT_TOKEN_DECIMAL
            }
            setValue={value => {
              if (value.match(/^\d*\.?\d*$/)) {
                setAmountTo(value)
                setInputRef(inputTarget.TO)
              }
            }}
            placeholder={`0.${'0'.repeat(6)}`}
            onMaxClick={() => {
              if (tokenFrom !== null) {
                setInputRef(inputTarget.FROM)
                setAmountFrom(printBigint(tokens[tokenFrom].balance, tokens[tokenFrom].decimals))
              }
            }}
            tokens={tokens}
            current={tokenTo !== null ? tokens[tokenTo] : null}
            onSelect={setTokenTo}
            disabled={tokenFrom === tokenTo || tokenTo === null}
            hideBalances={walletStatus !== Status.Initialized}
            handleAddToken={handleAddToken}
            commonTokens={commonTokens}
            limit={1e14}
            initialHideUnknownTokensValue={initialHideUnknownTokensValue}
            onHideUnknownTokensChange={e => {
              onHideUnknownTokensChange(e)
              setHideUnknownTokens(e)
            }}
            tokenPrice={tokenToPriceData?.price}
            priceLoading={priceToLoading}
            isBalanceLoading={isBalanceLoading}
            showMaxButton={false}
            showBlur={
              lockAnimation ||
              (getStateMessage() === 'Loading' &&
                (inputRef === inputTarget.FROM || inputRef === inputTarget.DEFAULT))
            }
            hiddenUnknownTokens={hideUnknownTokens}
          />
        </Box>
        <Box className={classes.transactionDetails}>
          <Box className={classes.transactionDetailsInner}>
            <button
              onClick={
                tokenFrom !== null &&
                tokenTo !== null &&
                hasShowRateMessage() &&
                amountFrom !== '' &&
                amountTo !== ''
                  ? handleOpenTransactionDetails
                  : undefined
              }
              className={classNames(
                tokenFrom !== null &&
                  tokenTo !== null &&
                  hasShowRateMessage() &&
                  amountFrom !== '' &&
                  amountTo !== ''
                  ? classes.HiddenTransactionButton
                  : classes.transactionDetailDisabled,
                classes.transactionDetailsButton
              )}>
              <Grid className={classes.transactionDetailsWrapper}>
                <Typography className={classes.transactionDetailsHeader}>
                  {detailsOpen && canShowDetails ? 'Hide' : 'Show'} transaction details
                </Typography>
              </Grid>
            </button>
            {tokenFrom !== null && tokenTo !== null && tokenFrom !== tokenTo && (
              <TooltipHover text='Refresh'>
                <Grid
                  container
                  alignItems='center'
                  justifyContent='center'
                  width={20}
                  height={34}
                  minWidth='fit-content'
                  ml={1}>
                  <Refresher
                    currentIndex={refresherTime}
                    maxIndex={REFRESHER_INTERVAL}
                    onClick={handleRefresh}
                  />
                </Grid>
              </TooltipHover>
            )}
          </Box>
          {canShowDetails ? (
            <Box className={classes.exchangeRateWrapper}>
              <ExchangeRate
                onClick={() => setRateReversed(!rateReversed)}
                tokenFromSymbol={tokens[rateReversed ? tokenTo : tokenFrom].symbol}
                tokenToSymbol={tokens[rateReversed ? tokenFrom : tokenTo].symbol}
                amount={rateReversed ? 1 / swapRate : swapRate}
                tokenToDecimals={Number(tokens[rateReversed ? tokenFrom : tokenTo].decimals)}
                loading={getStateMessage() === 'Loading'}
              />
            </Box>
          ) : null}
        </Box>
        <TransactionDetailsBox
          open={getStateMessage() !== 'Loading' ? detailsOpen && canShowDetails : prevOpenState}
          fee={
            isInsufficientLiquidityError
              ? simulateResult.fee
              : simulateResult.poolKey?.feeTier.fee ?? 0n
          }
          exchangeRate={{
            val: rateReversed ? 1 / swapRate : swapRate,
            symbol: canShowDetails ? tokens[rateReversed ? tokenFrom : tokenTo].symbol : '',
            decimal: canShowDetails
              ? Number(tokens[rateReversed ? tokenFrom : tokenTo].decimals)
              : 0
          }}
          priceImpact={isInsufficientLiquidityError ? 1 : simulateResult.priceImpact}
          slippage={+slippTolerance}
          isLoadingRate={getStateMessage() === 'Loading'}
        />
        <TokensInfo
          tokenFrom={tokenFrom ? tokens[tokenFrom] : undefined}
          tokenTo={tokenTo ? tokens[tokenTo] : undefined}
          tokenToPrice={tokenToPriceData?.price}
          tokenFromPrice={tokenFromPriceData?.price}
          copyTokenAddressHandler={copyTokenAddressHandler}
        />
        {walletStatus !== Status.Initialized && getStateMessage() !== 'Loading' ? (
          <ChangeWalletButton
            name='Connect wallet'
            onConnect={onConnectWallet}
            connected={false}
            onDisconnect={onDisconnectWallet}
            className={classes.connectWalletButton}
          />
        ) : getStateMessage() === 'Insufficient AZERO' ? (
          <TooltipHover
            text='AZERO is required to pay for transaction fees. Get more AZERO to proceed.'
            top={-45}>
            <div>
              <AnimatedButton
                content={getStateMessage()}
                className={
                  getStateMessage() === 'Connect a wallet'
                    ? `${classes.swapButton}`
                    : getStateMessage() === 'Exchange' && progress === 'none'
                      ? `${classes.swapButton} ${classes.ButtonSwapActive}`
                      : classes.swapButton
                }
                disabled={getStateMessage() !== 'Exchange' || progress !== 'none'}
                onClick={() => {
                  if (simulateResult.poolKey === null || tokenFrom === null || tokenTo === null)
                    return

                  onSwap(
                    simulateResult.poolKey,
                    BigInt((+slippTolerance * Number(PERCENTAGE_DENOMINATOR)) / 100),
                    simulateResult.targetSqrtPrice,
                    tokenFrom,
                    tokenTo,
                    convertBalanceToBigint(amountFrom, tokens[tokenFrom].decimals),
                    convertBalanceToBigint(amountTo, tokens[tokenTo].decimals),
                    inputRef === inputTarget.FROM
                  )
                }}
                progress={progress}
              />
            </div>
          </TooltipHover>
        ) : (
          <AnimatedButton
            content={getStateMessage()}
            className={
              getStateMessage() === 'Connect a wallet'
                ? `${classes.swapButton}`
                : getStateMessage() === 'Exchange' && progress === 'none'
                  ? `${classes.swapButton} ${classes.ButtonSwapActive}`
                  : classes.swapButton
            }
            disabled={getStateMessage() !== 'Exchange' || progress !== 'none'}
            onClick={() => {
              if (simulateResult.poolKey === null || tokenFrom === null || tokenTo === null) return

              onSwap(
                simulateResult.poolKey,
                BigInt((+slippTolerance * Number(PERCENTAGE_DENOMINATOR)) / 100),
                simulateResult.targetSqrtPrice,
                tokenFrom,
                tokenTo,
                convertBalanceToBigint(amountFrom, tokens[tokenFrom].decimals),
                convertBalanceToBigint(amountTo, tokens[tokenTo].decimals),
                inputRef === inputTarget.FROM
              )
            }}
            progress={progress}
          />
        )}
      </Grid>
    </Grid>
  )
}

export default Swap
