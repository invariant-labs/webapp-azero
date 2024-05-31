import AnimatedNumber from '@components/AnimatedNumber'
import RangeInput from '@components/Inputs/RangeInput/RangeInput'
import SimpleInput from '@components/Inputs/SimpleInput/SimpleInput'
import { Price, getMaxTick, getMinTick } from '@invariant-labs/a0-sdk/src'
import { Button, Grid, Typography } from '@mui/material'
import {
  calcPrice,
  calculateTickFromBalance,
  formatNumbers,
  nearestTickIndex,
  showPrefix,
  toMaxNumericPlaces
} from '@store/consts/utils'
import React, { useEffect, useMemo, useState } from 'react'
import useStyles from './style'

export interface IPoolInit {
  tokenASymbol: string
  tokenBSymbol: string
  onChangeRange: (leftIndex: bigint, rightIndex: bigint) => void
  isXtoY: boolean
  xDecimal: bigint
  yDecimal: bigint
  tickSpacing: bigint
  midPrice: bigint
  onChangeMidPrice: (mid: Price) => void
  currentPairReversed: boolean | null
}

export const PoolInit: React.FC<IPoolInit> = ({
  tokenASymbol,
  tokenBSymbol,
  onChangeRange,
  isXtoY,
  xDecimal,
  yDecimal,
  tickSpacing,
  midPrice,
  onChangeMidPrice,
  currentPairReversed
}) => {
  const { classes } = useStyles()

  const [leftRange, setLeftRange] = useState(tickSpacing * 10n * (isXtoY ? -1n : 1n))
  const [rightRange, setRightRange] = useState(tickSpacing * 10n * (isXtoY ? 1n : -1n))

  const [leftInput, setLeftInput] = useState(
    calcPrice(leftRange, isXtoY, xDecimal, yDecimal).toString()
  )
  const [rightInput, setRightInput] = useState(
    calcPrice(rightRange, isXtoY, xDecimal, yDecimal).toString()
  )

  const [leftInputRounded, setLeftInputRounded] = useState((+leftInput).toFixed(12))
  const [rightInputRounded, setRightInputRounded] = useState((+rightInput).toFixed(12))

  const [midPriceInput, setMidPriceInput] = useState(
    calcPrice(midPrice, isXtoY, xDecimal, yDecimal).toString()
  )

  useEffect(() => {
    const tickIndex = calculateTickFromBalance(
      +midPriceInput,
      tickSpacing,
      isXtoY,
      xDecimal,
      yDecimal
    )

    onChangeMidPrice(BigInt(tickIndex))
  }, [midPriceInput])

  const setLeftInputValues = (val: string) => {
    setLeftInput(val)
    setLeftInputRounded(toMaxNumericPlaces(+val, 5))
  }

  const setRightInputValues = (val: string) => {
    setRightInput(val)
    setRightInputRounded(toMaxNumericPlaces(+val, 5))
  }

  const onLeftInputChange = (val: string) => {
    setLeftInput(val)
    setLeftInputRounded(val)
  }

  const onRightInputChange = (val: string) => {
    setRightInput(val)
    setRightInputRounded(val)
  }

  const changeRangeHandler = (left: bigint, right: bigint) => {
    setLeftRange(left)
    setRightRange(right)

    setLeftInputValues(calcPrice(left, isXtoY, xDecimal, yDecimal).toString())
    setRightInputValues(calcPrice(right, isXtoY, xDecimal, yDecimal).toString())

    onChangeRange(left, right)
  }

  const resetRange = () => {
    changeRangeHandler(
      tickSpacing * 10n * (isXtoY ? -1n : 1n),
      tickSpacing * 10n * (isXtoY ? 1n : -1n)
    )
  }

  useEffect(() => {
    changeRangeHandler(leftRange, rightRange)
  }, [midPrice])

  const validateMidPriceInput = (midPriceInput: string) => {
    const minTick = getMinTick(tickSpacing)
    const maxTick = getMaxTick(tickSpacing)
    const minPrice = isXtoY
      ? calcPrice(minTick, isXtoY, xDecimal, yDecimal)
      : calcPrice(maxTick, isXtoY, xDecimal, yDecimal)
    const maxPrice = isXtoY
      ? calcPrice(maxTick, isXtoY, xDecimal, yDecimal)
      : calcPrice(minTick, isXtoY, xDecimal, yDecimal)
    const numericMidPriceInput = parseFloat(midPriceInput)
    const validatedMidPrice = Math.min(Math.max(numericMidPriceInput, minPrice), maxPrice)
    return toMaxNumericPlaces(validatedMidPrice, 5)
  }

  useEffect(() => {
    if (currentPairReversed !== null) {
      const validatedMidPrice = validateMidPriceInput((1 / +midPriceInput).toString())

      setMidPriceInput(validatedMidPrice)
      changeRangeHandler(rightRange, leftRange)
    }
  }, [currentPairReversed])

  const price = useMemo(
    () => calcPrice(midPrice, isXtoY, xDecimal, yDecimal),
    [midPrice, isXtoY, xDecimal, yDecimal]
  )

  return (
    <Grid container direction='column' className={classes.wrapper}>
      <Grid
        container
        className={classes.innerWrapper}
        direction='column'
        justifyContent='flex-start'>
        <Grid className={classes.topInnerWrapper}>
          <Typography className={classes.header}>Starting price</Typography>
          <Grid className={classes.infoWrapper}>
            <Typography className={classes.info}>
              This pool does not exist yet. To create it, select the fee tier, initial price, and
              enter the amount of tokens. The estimated cost of creating a pool is 0.003 AZERO.
            </Typography>
          </Grid>

          <SimpleInput
            setValue={setMidPriceInput}
            value={midPriceInput}
            decimal={isXtoY ? xDecimal : yDecimal}
            className={classes.midPrice}
            placeholder='0.0'
            onBlur={e => {
              setMidPriceInput(validateMidPriceInput(e.target.value || '0'))
            }}
          />

          <Grid
            className={classes.priceWrapper}
            container
            justifyContent='space-between'
            alignItems='center'>
            <Typography className={classes.priceLabel}>{tokenASymbol} starting price: </Typography>
            <Typography className={classes.priceValue}>
              <AnimatedNumber
                value={price.toFixed(isXtoY ? Number(xDecimal) : Number(yDecimal))}
                duration={300}
                formatValue={formatNumbers()}
              />
              {showPrefix(price)} {tokenBSymbol}
            </Typography>
          </Grid>
        </Grid>
        <Typography className={classes.subheader}>Set price range</Typography>
        <Grid container className={classes.inputs}>
          <RangeInput
            className={classes.input}
            label='Min price'
            tokenFromSymbol={tokenASymbol}
            tokenToSymbol={tokenBSymbol}
            currentValue={leftInputRounded}
            setValue={onLeftInputChange}
            decreaseValue={() => {
              const newLeft = isXtoY
                ? Math.max(Number(getMinTick(tickSpacing)), Number(leftRange - tickSpacing))
                : Math.min(Number(getMaxTick(tickSpacing)), Number(leftRange + tickSpacing))
              changeRangeHandler(BigInt(newLeft), rightRange)
            }}
            increaseValue={() => {
              const newLeft = isXtoY
                ? Math.min(Number(rightRange - tickSpacing), Number(leftRange + tickSpacing))
                : Math.max(Number(rightRange + tickSpacing), Number(leftRange - tickSpacing))
              changeRangeHandler(BigInt(newLeft), rightRange)
            }}
            onBlur={() => {
              const newLeft = isXtoY
                ? Math.min(
                    Number(rightRange - tickSpacing),
                    Number(nearestTickIndex(+leftInput, tickSpacing, isXtoY, xDecimal, yDecimal))
                  )
                : Math.max(
                    Number(rightRange + tickSpacing),
                    Number(nearestTickIndex(+leftInput, tickSpacing, isXtoY, xDecimal, yDecimal))
                  )
              changeRangeHandler(BigInt(newLeft), rightRange)
            }}
            diffLabel='Min - Current price'
            percentDiff={((+leftInput - price) / price) * 100}
          />
          <RangeInput
            className={classes.input}
            label='Max price'
            tokenFromSymbol={tokenASymbol}
            tokenToSymbol={tokenBSymbol}
            currentValue={rightInputRounded}
            setValue={onRightInputChange}
            decreaseValue={() => {
              const newRight = isXtoY
                ? Math.max(Number(rightRange - tickSpacing), Number(leftRange + tickSpacing))
                : Math.min(Number(rightRange + tickSpacing), Number(leftRange - tickSpacing))
              changeRangeHandler(leftRange, BigInt(newRight))
            }}
            increaseValue={() => {
              const newRight = isXtoY
                ? Math.min(Number(getMaxTick(tickSpacing)), Number(rightRange + tickSpacing))
                : Math.max(Number(getMinTick(tickSpacing)), Number(rightRange - tickSpacing))
              changeRangeHandler(leftRange, BigInt(newRight))
            }}
            onBlur={() => {
              const newRight = isXtoY
                ? Math.max(
                    Number(leftRange + tickSpacing),
                    Number(nearestTickIndex(+rightInput, tickSpacing, isXtoY, xDecimal, yDecimal))
                  )
                : Math.min(
                    Number(leftRange - tickSpacing),
                    Number(nearestTickIndex(+rightInput, tickSpacing, isXtoY, xDecimal, yDecimal))
                  )

              changeRangeHandler(leftRange, BigInt(newRight))
            }}
            diffLabel='Max - Current price'
            percentDiff={((+rightInput - price) / price) * 100}
          />
        </Grid>
        <Grid container className={classes.buttons}>
          <Button className={classes.button} onClick={resetRange}>
            Reset range
          </Button>
          <Button
            className={classes.button}
            onClick={() => {
              changeRangeHandler(
                isXtoY ? getMinTick(tickSpacing) : getMaxTick(tickSpacing),
                isXtoY ? getMaxTick(tickSpacing) : getMinTick(tickSpacing)
              )
            }}>
            Set full range
          </Button>
        </Grid>
      </Grid>
    </Grid>
  )
}

export default PoolInit
