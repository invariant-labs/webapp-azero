import AnimatedButton, { ProgressState } from '@components/AnimatedButton/AnimatedButton'
import DepositAmountInput from '@components/Inputs/DepositAmountInput/DepositAmountInput'
import Select from '@components/Inputs/Select/Select'
import { Grid, Typography } from '@mui/material'
import SwapList from '@static/svg/swap-list.svg'
import { ALL_FEE_TIERS_DATA } from '@store/consts/static'
import {
  convertBalanceToBigint,
  getScaleFromString,
  parsePathFeeToFeeString,
  printBigint,
  tickerToAddress
} from '@utils/utils'
import classNames from 'classnames'
import React, { useCallback, useEffect, useState } from 'react'
import FeeSwitch from '../FeeSwitch/FeeSwitch'
import { useStyles } from './style'
import { PositionOpeningMethod } from '@store/consts/types'
import { SwapToken } from '@store/selectors/wallet'
import { TooltipHover } from '@components/TooltipHover/TooltipHover'
export interface InputState {
  value: string
  setValue: (value: string) => void
  blocked: boolean
  blockerInfo?: string
  decimalsLimit: number
}

export interface IDepositSelector {
  initialTokenFrom: string
  initialTokenTo: string
  initialFee: string
  tokens: Record<string, SwapToken>
  setPositionTokens: (
    tokenAAddress: string | null,
    tokenBAddress: string | null,
    feeTierIndex: number
  ) => void
  onAddLiquidity: () => void
  tokenAInputState: InputState
  tokenBInputState: InputState
  feeTiers: number[]
  className?: string
  progress: ProgressState
  priceA?: number
  priceB?: number
  onReverseTokens: () => void
  poolIndex: number | null
  bestTierIndex?: number
  handleAddToken: (address: string) => void
  commonTokens: string[]
  initialHideUnknownTokensValue: boolean
  onHideUnknownTokensChange: (val: boolean) => void
  priceALoading?: boolean
  priceBLoading?: boolean
  feeTierIndex: number
  concentrationArray: number[]
  concentrationIndex: number
  minimumSliderIndex: number
  positionOpeningMethod: PositionOpeningMethod
  isBalanceLoading: boolean
  isGetLiquidityError: boolean
  ticksLoading: boolean
}

export const DepositSelector: React.FC<IDepositSelector> = ({
  initialTokenFrom,
  initialTokenTo,
  initialFee,
  tokens,
  setPositionTokens,
  onAddLiquidity,
  tokenAInputState,
  tokenBInputState,
  feeTiers,
  className,
  progress,
  priceA,
  priceB,
  onReverseTokens,
  poolIndex,
  bestTierIndex,
  handleAddToken,
  commonTokens,
  initialHideUnknownTokensValue,
  onHideUnknownTokensChange,
  priceALoading,
  priceBLoading,
  feeTierIndex,
  concentrationArray,
  concentrationIndex,
  minimumSliderIndex,
  positionOpeningMethod,
  isBalanceLoading,
  isGetLiquidityError,
  ticksLoading
}) => {
  const { classes } = useStyles()

  const [tokenA, setTokenA] = useState<string | null>(null)
  const [tokenB, setTokenB] = useState<string | null>(null)

  const [hideUnknownTokens, setHideUnknownTokens] = useState<boolean>(initialHideUnknownTokensValue)

  const [isLoaded, setIsLoaded] = useState<boolean>(false)

  useEffect(() => {
    if (isLoaded || Object.keys(tokens).length === 0 || ALL_FEE_TIERS_DATA.length === 0) {
      return
    }

    const tokenAFromPath = tokens[tickerToAddress(initialTokenFrom)]?.assetAddress || null
    const tokenBFromPath = tokens[tickerToAddress(initialTokenTo)]?.assetAddress || null
    let feeTierIndexFromPath = 0

    const parsedFee = parsePathFeeToFeeString(initialFee)

    ALL_FEE_TIERS_DATA.forEach((feeTierData, index) => {
      if (feeTierData.tier.fee.toString() === parsedFee) {
        feeTierIndexFromPath = index
      }
    })

    setTokenA(tokenAFromPath)
    setTokenB(tokenBFromPath)
    setPositionTokens(tokenAFromPath, tokenBFromPath, feeTierIndexFromPath)

    setIsLoaded(true)
  }, [Object.keys(tokens).length])

  const getButtonMessage = useCallback(() => {
    if (tokenA === null || tokenB === null) {
      return 'Select tokens'
    }

    if (tokenA === tokenB) {
      return 'Select different tokens'
    }

    if (positionOpeningMethod === 'concentration' && concentrationIndex < minimumSliderIndex) {
      return concentrationArray[minimumSliderIndex]
        ? `Set concentration to at least ${concentrationArray[minimumSliderIndex].toFixed(0)}x`
        : 'Set higher fee tier'
    }

    if (isGetLiquidityError) {
      return 'Provide a smaller amount'
    }

    if (
      !tokenAInputState.blocked &&
      convertBalanceToBigint(tokenAInputState.value, tokens[tokenA].decimals) >
        tokens[tokenA].balance
    ) {
      return `Not enough ${tokens[tokenA].symbol}`
    }

    if (
      !tokenBInputState.blocked &&
      convertBalanceToBigint(tokenBInputState.value, tokens[tokenB].decimals) >
        tokens[tokenB].balance
    ) {
      return `Not enough ${tokens[tokenB].symbol}`
    }

    if (
      (!tokenAInputState.blocked && +tokenAInputState.value === 0) ||
      (!tokenBInputState.blocked && +tokenBInputState.value === 0)
    ) {
      return !tokenAInputState.blocked && !tokenBInputState.blocked
        ? 'Enter token amounts'
        : 'Enter token amount'
    }

    return 'Add Position'
  }, [
    tokenA,
    tokenB,
    tokenAInputState,
    tokenBInputState,
    tokens,
    positionOpeningMethod,
    concentrationIndex,
    feeTierIndex,
    minimumSliderIndex
  ])

  const [wasRunTokenA, setWasRunTokenA] = useState(false)
  const [wasRunTokenB, setWasRunTokenB] = useState(false)

  useEffect(() => {
    if (!wasRunTokenA && tokens[tickerToAddress(initialTokenFrom)]) {
      setTokenA(tickerToAddress(initialTokenFrom))
      setWasRunTokenA(true)
    }

    if (!wasRunTokenB && tokens[tickerToAddress(initialTokenTo)]) {
      setTokenB(tickerToAddress(initialTokenTo))
      setWasRunTokenB(true)
    }
  }, [wasRunTokenA, wasRunTokenB, tokens])

  useEffect(() => {
    if (tokenA !== null) {
      if (getScaleFromString(tokenAInputState.value) > Number(tokens[tokenA].decimals)) {
        const parts = tokenAInputState.value.split('.')

        tokenAInputState.setValue(
          parts[0] + '.' + parts[1].slice(0, Number(tokens[tokenA].decimals))
        )
      }
    }

    if (tokenB !== null) {
      if (getScaleFromString(tokenBInputState.value) > Number(tokens[tokenB].decimals)) {
        const parts = tokenBInputState.value.split('.')

        tokenAInputState.setValue(
          parts[0] + '.' + parts[1].slice(0, Number(tokens[tokenB].decimals))
        )
      }
    }
  }, [poolIndex])

  return (
    <Grid container direction='column' className={classNames(classes.wrapper, className)}>
      <Typography className={classes.sectionTitle}>Tokens</Typography>

      <Grid container className={classes.sectionWrapper} style={{ marginBottom: 40 }}>
        <Grid container className={classes.selects} direction='row' justifyContent='space-between'>
          <Grid className={classes.selectWrapper}>
            <Select
              tokens={tokens}
              current={tokenA !== null ? tokens[tokenA] : null}
              onSelect={address => {
                setTokenA(address)
                setPositionTokens(address, tokenB, feeTierIndex)
              }}
              centered
              className={classes.customSelect}
              handleAddToken={handleAddToken}
              sliceName
              commonTokens={commonTokens}
              initialHideUnknownTokensValue={initialHideUnknownTokensValue}
              onHideUnknownTokensChange={e => {
                onHideUnknownTokensChange(e)
                setHideUnknownTokens(e)
              }}
              hiddenUnknownTokens={hideUnknownTokens}
            />
          </Grid>

          <TooltipHover text='Reverse tokens'>
            <img
              className={classes.arrows}
              src={SwapList}
              alt='Arrow'
              onClick={() => {
                if (ticksLoading) {
                  return
                }

                if (!tokenBInputState.blocked) {
                  tokenAInputState.setValue(tokenBInputState.value)
                } else {
                  tokenBInputState.setValue(tokenAInputState.value)
                }
                const pom = tokenA
                setTokenA(tokenB)
                setTokenB(pom)
                onReverseTokens()
              }}
            />
          </TooltipHover>

          <Grid className={classes.selectWrapper}>
            <Select
              tokens={tokens}
              current={tokenB !== null ? tokens[tokenB] : null}
              onSelect={index => {
                setTokenB(index)
                setPositionTokens(tokenA, index, feeTierIndex)
              }}
              centered
              className={classes.customSelect}
              handleAddToken={handleAddToken}
              sliceName
              commonTokens={commonTokens}
              initialHideUnknownTokensValue={initialHideUnknownTokensValue}
              onHideUnknownTokensChange={e => {
                onHideUnknownTokensChange(e)
                setHideUnknownTokens(e)
              }}
              hiddenUnknownTokens={hideUnknownTokens}
            />
          </Grid>
        </Grid>

        <FeeSwitch
          onSelect={fee => {
            setPositionTokens(tokenA, tokenB, fee)
          }}
          feeTiers={feeTiers}
          showOnlyPercents
          bestTierIndex={bestTierIndex}
          currentValue={feeTierIndex}
        />
      </Grid>

      <Typography className={classes.sectionTitle}>Deposit Amount</Typography>
      <Grid container className={classes.sectionWrapper}>
        <DepositAmountInput
          tokenPrice={priceA}
          currency={tokenA !== null ? tokens[tokenA].symbol : null}
          currencyIconSrc={tokenA !== null ? tokens[tokenA].logoURI : undefined}
          placeholder='0.0'
          onMaxClick={() => {
            if (tokenA === null) {
              return
            }

            tokenAInputState.setValue(printBigint(tokens[tokenA].balance, tokens[tokenA].decimals))
          }}
          balanceValue={
            tokenA !== null ? printBigint(tokens[tokenA].balance, tokens[tokenA].decimals) : ''
          }
          style={{
            marginBottom: 10
          }}
          onBlur={() => {
            if (tokenA !== null && tokenB !== null && tokenAInputState.value.length === 0) {
              tokenAInputState.setValue('0.0')
            }
          }}
          {...tokenAInputState}
          priceLoading={priceALoading}
          isBalanceLoading={isBalanceLoading}
        />

        <DepositAmountInput
          tokenPrice={priceB}
          currency={tokenB !== null ? tokens[tokenB].symbol : null}
          currencyIconSrc={tokenB !== null ? tokens[tokenB].logoURI : undefined}
          placeholder='0.0'
          onMaxClick={() => {
            if (tokenB === null) {
              return
            }

            tokenBInputState.setValue(printBigint(tokens[tokenB].balance, tokens[tokenB].decimals))
          }}
          balanceValue={
            tokenB !== null ? printBigint(tokens[tokenB].balance, tokens[tokenB].decimals) : ''
          }
          onBlur={() => {
            if (tokenA !== null && tokenB !== null && tokenBInputState.value.length === 0) {
              tokenBInputState.setValue('0.0')
            }
          }}
          {...tokenBInputState}
          priceLoading={priceBLoading}
          isBalanceLoading={isBalanceLoading}
        />
      </Grid>

      <AnimatedButton
        className={classNames(
          classes.addButton,
          progress === 'none' ? classes.hoverButton : undefined
        )}
        onClick={() => {
          if (progress === 'none') {
            onAddLiquidity()
          }
        }}
        disabled={getButtonMessage() !== 'Add Position'}
        content={getButtonMessage()}
        progress={progress}
      />
    </Grid>
  )
}

export default DepositSelector
