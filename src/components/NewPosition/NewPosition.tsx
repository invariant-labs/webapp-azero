import Slippage from '@components/Modals/Slippage/Slippage'
import { NoConnected } from '@components/NoConnected/NoConnected'
import { Percentage, TokenAmount } from '@invariant-labs/a0-sdk'
import { Button, Grid, Typography } from '@mui/material'
import backIcon from '@static/svg/back-arrow.svg'
import settingIcon from '@static/svg/settings.svg'
import { BestTier, PositionOpeningMethod, TokenPriceData } from '@store/consts/static'
import { addressToTicker } from '@store/consts/uiUtiils'
import { PlotTickData, TickPlotPositionData } from '@store/reducers/positions'
import { SwapToken } from '@store/selectors/wallet'
import { blurContent, unblurContent } from '@utils/uiUtils'
import { VariantType } from 'notistack'
import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import ConcentrationTypeSwitch from './ConcentrationTypeSwitch/ConcentrationTypeSwitch'
import DepositSelector from './DepositSelector/DepositSelector'
import MarketIdLabel from './MarketIdLabel/MarketIdLabel'
import PoolInit from './PoolInit/PoolInit'
import RangeSelector from './RangeSelector/RangeSelector'
import useStyles from './style'

export interface INewPosition {
  initialTokenFrom: string
  initialTokenTo: string
  initialFee: string
  poolAddress: string
  calculatePoolAddress: () => Promise<string>
  copyPoolAddressHandler: (message: string, variant: VariantType) => void
  tokens: SwapToken[]
  data: PlotTickData[]
  midPrice: TickPlotPositionData
  setMidPrice: (mid: TickPlotPositionData) => void
  addLiquidityHandler: (
    leftTickIndex: number,
    rightTickIndex: number,
    xAmount: number,
    yAmount: number,
    slippage: Percentage
  ) => void
  onChangePositionTokens: (
    tokenAIndex: number | null,
    tokenBindex: number | null,
    feeTierIndex: number
  ) => void
  isCurrentPoolExisting: boolean
  // calcAmount: (
  //   amount: BN,
  //   leftRangeTickIndex: number,
  //   rightRangeTickIndex: number,
  //   tokenAddress: PublicKey
  // ) => BN
  feeTiers: Array<{
    feeValue: number
  }>
  ticksLoading: boolean
  showNoConnected?: boolean
  // noConnectedBlockerProps: INoConnected
  // progress: ProgressState
  progress: any
  isXtoY: boolean
  xDecimal: number
  yDecimal: number
  tickSpacing: number
  isWaitingForNewPool: boolean
  poolIndex: number | null
  currentPairReversed: boolean | null
  bestTiers: BestTier[]
  initialIsDiscreteValue: boolean
  onDiscreteChange: (val: boolean) => void
  currentPriceSqrt: TokenAmount
  canCreateNewPool: boolean
  canCreateNewPosition: boolean
  handleAddToken: (address: string) => void
  // commonTokens: PublicKey[]
  commonTokens: any[]
  initialOpeningPositionMethod: PositionOpeningMethod
  onPositionOpeningMethodChange: (val: PositionOpeningMethod) => void
  initialHideUnknownTokensValue: boolean
  onHideUnknownTokensChange: (val: boolean) => void
  tokenAPriceData?: TokenPriceData
  tokenBPriceData?: TokenPriceData
  priceALoading?: boolean
  priceBLoading?: boolean
  hasTicksError?: boolean
  reloadHandler: () => void
  plotVolumeRange?: {
    min: number
    max: number
  }
  currentFeeIndex: number
  onSlippageChange: (slippage: string) => void
  initialSlippage: string
}

export const NewPosition: React.FC<INewPosition> = ({
  initialTokenFrom,
  initialTokenTo,
  initialFee,
  poolAddress,
  calculatePoolAddress,
  copyPoolAddressHandler,
  tokens,
  data,
  midPrice,
  progress = 'progress',
  onChangePositionTokens,
  isCurrentPoolExisting,
  feeTiers,
  ticksLoading,
  showNoConnected,
  isXtoY,
  xDecimal,
  yDecimal,
  tickSpacing,
  isWaitingForNewPool,
  poolIndex,
  currentPairReversed,
  bestTiers,
  initialIsDiscreteValue,
  onDiscreteChange,
  canCreateNewPool,
  canCreateNewPosition,
  handleAddToken,
  commonTokens,
  initialOpeningPositionMethod,
  onPositionOpeningMethodChange,
  initialHideUnknownTokensValue,
  onHideUnknownTokensChange,
  tokenAPriceData,
  tokenBPriceData,
  priceALoading,
  priceBLoading,
  hasTicksError,
  reloadHandler,
  plotVolumeRange,
  currentFeeIndex,
  onSlippageChange,
  initialSlippage
}) => {
  // TODO delete mock data below
  const getMinTick = (a: number) => 145
  const getMaxTick = (a: number) => 52556
  const concentrationArray = [
    2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27,
    28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51,
    52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75,
    76, 77, 78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99,
    100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115, 116, 117, 118,
    119, 120, 121, 122, 123, 124, 125, 126, 127, 128, 129, 130, 131, 132, 133, 134, 135, 136, 137,
    138, 139, 140, 141, 141.35054708823986, 142, 142.34947883030156, 143.36268108534173,
    144.39046185004142, 145.4331380485262, 146.49103585817588, 147.56449104982505,
    148.6538493430759, 149.75946677751372, 150.88171010068865, 152.0209571737027, 153.1775973954089,
    154.35203214616604, 155.5446752522247, 156.75595347191637, 157.98630700477432,
    159.23619002491995, 160.50607124005197, 161.79643447746648, 163.10777929868044,
    164.4406216442826, 165.79549451074587, 167.17294866108585, 168.57355337137307,
    169.99789721516217, 171.44658888818702, 172.92025807568274, 174.41955636498605,
    175.94515820614367, 177.4977619235366, 179.07809078171604, 180.68689410880648,
    182.32494848123096, 183.99305897363345, 185.69206047823712, 187.42281909818539,
    189.1862336197627, 190.98323706872694, 192.8147983564498, 194.68192402192497,
    196.58566007625885, 198.52709395674438, 200.50735659816596, 202.5276246296469,
    204.58912270597978, 206.69312598319462, 208.84096274881784, 211.0340172182762,
    213.2737325097704, 215.56161381111102, 217.89923175305648, 220.2882260050746,
    222.73030911083112, 225.22727058225726, 227.78098127272426, 230.39339805185554,
    233.06656880646017, 235.80263779450277, 238.6038513814639, 241.47256419139453,
    244.41124570806153, 247.42248736505374, 250.50901016763237, 253.67367289346942,
    256.9194809242411, 260.24959576532467, 263.66734531713206, 267.17623496809654,
    270.77995958709107, 274.4824165015807, 278.2877195572063, 282.2002143655592, 286.2244948589016,
    290.36542128441835, 294.6281397861683, 299.0181037406905, 303.54109703222264, 308.2032594762985,
    313.0111146269428, 317.9716002321081, 323.0921016363551, 328.3804884691442, 333.84515500191145,
    339.4950646092151, 345.33979882941395, 351.3896115894971, 357.65548923979424,
    364.14921713798856, 370.8834536311619, 377.8718124133744, 385.1289543859215, 392.6706903246919,
    400.5140958676793, 408.6776405824729, 417.18133316731127, 426.046885188367, 435.29789617410853,
    444.96006338884666, 455.06142021178204, 465.63260777843453, 476.70718542761057,
    488.32198657997344, 500.5175279982779, 513.3384820106897, 526.8342232956461, 541.0594643347168,
    556.0749967741243, 571.9485598766967, 588.7558622304064, 606.5817892216905, 625.5218369103276,
    645.6838234283235, 667.1899426585674, 690.179242812771, 714.8106361327322, 741.2665774146387,
    769.7575914233175, 800.5278868860325, 833.8623739844425, 870.0955124972457, 909.622573071739,
    952.9141160025962, 1000.5348136431164, 1053.1682167369727, 1111.6497761931, 1177.0115196048926,
    1250.5434814639223, 1333.8797054596678, 1429.12110490717, 1539.0150279873687,
    1667.2246056090069, 1818.7450162827427, 2000.5695099245224, 2222.799447524173,
    2500.586870564581, 2857.742129950144, 3333.949143853263, 4000.6389649839957, 5000.6736987617005,
    6667.3982578387395, 10000.847380154431, 20001.194755458677
  ]
  ///////////

  const { classes } = useStyles()
  const navigate = useNavigate()

  const [positionOpeningMethod, setPositionOpeningMethod] = useState<PositionOpeningMethod>(
    initialOpeningPositionMethod
  )

  const [leftRange, setLeftRange] = useState(getMinTick(tickSpacing))
  const [rightRange, setRightRange] = useState(getMaxTick(tickSpacing))

  const [tokenAIndex, setTokenAIndex] = useState<number | null>(null)
  const [tokenBIndex, setTokenBIndex] = useState<number | null>(null)

  const [tokenADeposit, setTokenADeposit] = useState<string>('')
  const [tokenBDeposit, setTokenBDeposit] = useState<string>('')

  const [address, setAddress] = useState<string>(poolAddress)
  const [settings, setSettings] = React.useState<boolean>(false)
  const [slippTolerance, setSlippTolerance] = React.useState<string>(initialSlippage)
  const [anchorEl, setAnchorEl] = React.useState<HTMLButtonElement | null>(null)

  const [concentrationIndex, setConcentrationIndex] = useState(0)

  const [minimumSliderIndex, setMinimumSliderIndex] = useState<number>(0)

  // const concentrationArray = useMemo(
  //   () => getConcentrationArray(tickSpacing, 2, midPrice.index).sort((a, b) => a - b),
  //   [tickSpacing]
  // )

  const setRangeBlockerInfo = () => {
    if (tokenAIndex === null || tokenBIndex === null) {
      return 'Select tokens to set price range.'
    }

    if (tokenAIndex === tokenBIndex) {
      return "Token A can't be the same as token B"
    }

    if (isWaitingForNewPool) {
      return 'Loading pool info...'
    }

    return ''
  }

  const noRangePlaceholderProps = {
    data: Array(100)
      .fill(1)
      .map((_e, index) => ({ x: index, y: index, index })),
    midPrice: {
      x: 50,
      index: 50
    },
    tokenASymbol: 'ABC',
    tokenBSymbol: 'XYZ'
  }

  const getTicksInsideRange = (left: number, right: number, isXtoY: boolean) => {
    const leftMax = isXtoY ? getMinTick(tickSpacing) : getMaxTick(tickSpacing)
    const rightMax = isXtoY ? getMaxTick(tickSpacing) : getMinTick(tickSpacing)

    let leftInRange
    let rightInRange

    if (isXtoY) {
      leftInRange = left < leftMax ? leftMax : left
      rightInRange = right > rightMax ? rightMax : right
    } else {
      leftInRange = left > leftMax ? leftMax : left
      rightInRange = right < rightMax ? rightMax : right
    }

    return { leftInRange, rightInRange }
  }

  const onChangeRange = (left: number, right: number) => {
    let leftRange: number
    let rightRange: number

    if (positionOpeningMethod === 'range') {
      const { leftInRange, rightInRange } = getTicksInsideRange(left, right, isXtoY)
      leftRange = leftInRange
      rightRange = rightInRange
    } else {
      leftRange = left
      rightRange = right
    }

    setLeftRange(leftRange)
    setRightRange(rightRange)

    if (
      tokenAIndex !== null &&
      (isXtoY ? rightRange > midPrice.index : rightRange < midPrice.index)
    ) {
      const deposit = tokenADeposit
      // const amount = getOtherTokenAmount(
      //   printBNtoBN(deposit, tokens[tokenAIndex].decimals),
      //   leftRange,
      //   rightRange,
      //   true
      // )
      const amount = '12345'

      if (tokenBIndex !== null && +deposit !== 0) {
        setTokenADeposit(deposit)
        setTokenBDeposit(amount)

        return
      }
    }

    if (
      tokenBIndex !== null &&
      (isXtoY ? leftRange < midPrice.index : leftRange > midPrice.index)
    ) {
      const deposit = tokenBDeposit
      // const amount = getOtherTokenAmount(
      //   printBNtoBN(deposit, tokens[tokenBIndex].decimals),
      //   leftRange,
      //   rightRange,
      //   false
      // )
      const amount = '54321'
      if (tokenAIndex !== null && +deposit !== 0) {
        setTokenBDeposit(deposit)
        setTokenADeposit(amount)
      }
    }
  }

  // Mocked onChangeMidPrice
  const onChangeMidPrice = (mid: number) => {
    console.log(mid)
  }
  // const bestTierIndex =
  //   tokenAIndex === null || tokenBIndex === null
  //     ? undefined
  //     : bestTiers.find(
  //         tier =>
  //           (tier.tokenX.equals(tokens[tokenAIndex].assetAddress) &&
  //             tier.tokenY.equals(tokens[tokenBIndex].assetAddress)) ||
  //           (tier.tokenX.equals(tokens[tokenBIndex].assetAddress) &&
  //             tier.tokenY.equals(tokens[tokenAIndex].assetAddress))
  //       )?.bestTierIndex ?? undefined

  // const getMinSliderIndex = () => {
  //   let minimumSliderIndex = 0

  //   for (let index = 0; index < concentrationArray.length; index++) {
  //     const value = concentrationArray[index]

  //     const { leftRange, rightRange } = calculateConcentrationRange(
  //       tickSpacing,
  //       value,
  //       2,
  //       midPrice.index,
  //       isXtoY
  //     )

  //     const { leftInRange, rightInRange } = getTicksInsideRange(leftRange, rightRange, isXtoY)

  //     if (leftInRange !== leftRange || rightInRange !== rightRange) {
  //       minimumSliderIndex = index + 1
  //     } else {
  //       break
  //     }
  //   }

  //   return minimumSliderIndex
  // }
  const getMinSliderIndex = () => 0

  useEffect(() => {
    if (positionOpeningMethod === 'concentration') {
      const minimumSliderIndex = getMinSliderIndex()

      setMinimumSliderIndex(minimumSliderIndex)
    }
  }, [poolIndex, positionOpeningMethod, midPrice.index])

  useEffect(() => {
    if (!ticksLoading && positionOpeningMethod === 'range') {
      onChangeRange(leftRange, rightRange)
    }
  }, [midPrice.index])

  useEffect(() => {
    const configurePoolAddress = async () => {
      const configuredAddress = poolAddress === '' ? await calculatePoolAddress() : poolAddress
      setAddress(configuredAddress)
    }
    void configurePoolAddress()
  }, [initialTokenFrom, initialTokenTo, initialFee, poolAddress, address])

  const handleClickSettings = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget)
    blurContent()
    setSettings(true)
  }

  const handleCloseSettings = () => {
    unblurContent()
    setSettings(false)
  }

  const setSlippage = (slippage: string): void => {
    setSlippTolerance(slippage)
    onSlippageChange(slippage)
  }

  const updatePath = (index1: number | null, index2: number | null, fee: number) => {
    // const parsedFee = parseFeeToPathFee(+ALL_FEE_TIERS_DATA[fee].tier.fee)
    const parsedFee = '0.1'

    if (index1 != null && index2 != null) {
      const address1 = addressToTicker(tokens[index1].assetAddress.toString())
      const address2 = addressToTicker(tokens[index2].assetAddress.toString())
      navigate(`/newPosition/${address1}/${address2}/${parsedFee}`, { replace: true })
    } else if (index1 != null) {
      const address = addressToTicker(tokens[index1].assetAddress.toString())
      navigate(`/newPosition/${address}/${parsedFee}`, { replace: true })
    } else if (index2 != null) {
      const address = addressToTicker(tokens[index2].assetAddress.toString())
      navigate(`/newPosition/${address}/${parsedFee}`, { replace: true })
    } else if (fee != null) {
      navigate(`/newPosition/${parsedFee}`, { replace: true })
    }
  }

  return (
    <Grid container className={classes.wrapper} direction='column'>
      <Link to='/pool' style={{ textDecoration: 'none', maxWidth: 'fit-content' }}>
        <Grid className={classes.back} container item alignItems='center'>
          <img className={classes.backIcon} src={backIcon} />
          <Typography className={classes.backText}>Back to Liquidity Positions List</Typography>
        </Grid>
      </Link>

      <Grid container justifyContent='space-between'>
        <Typography className={classes.title}>Add new liquidity position</Typography>
        <Grid container item alignItems='center' className={classes.options}>
          {address !== '' ? (
            <MarketIdLabel
              displayLength={9}
              marketId={address}
              copyPoolAddressHandler={copyPoolAddressHandler}
            />
          ) : null}
          <ConcentrationTypeSwitch
            onSwitch={val => {
              if (val) {
                setPositionOpeningMethod('concentration')
                onPositionOpeningMethodChange('concentration')
              } else {
                setPositionOpeningMethod('range')
                onPositionOpeningMethodChange('range')
              }
            }}
            initialValue={initialOpeningPositionMethod === 'concentration' ? 0 : 1}
            className={classes.switch}
            style={{
              opacity: poolIndex !== null ? 1 : 0
            }}
            disabled={poolIndex === null}
          />
          <Button onClick={handleClickSettings} className={classes.settingsIconBtn} disableRipple>
            <img src={settingIcon} className={classes.settingsIcon} />
          </Button>
        </Grid>
      </Grid>

      <Slippage
        open={settings}
        setSlippage={setSlippage}
        handleClose={handleCloseSettings}
        anchorEl={anchorEl}
        defaultSlippage={'1'}
        initialSlippage={initialSlippage}
        infoText='Slippage tolerance is a pricing difference between the price at the confirmation time and the actual price of the transaction users are willing to accept when initializing position.'
        headerText='Position Transaction Settings'
      />

      <Grid container className={classes.row} alignItems='stretch'>
        {/* {showNoConnected && <NoConnected {...noConnectedBlockerProps} />} */}
        {showNoConnected && <NoConnected onConnect={() => {}} />}
        <DepositSelector
          initialTokenFrom={initialTokenFrom}
          initialTokenTo={initialTokenTo}
          initialFee={initialFee}
          className={classes.deposit}
          tokens={tokens}
          setPositionTokens={(index1, index2, fee) => {
            setTokenAIndex(index1)
            setTokenBIndex(index2)
            onChangePositionTokens(index1, index2, fee)

            updatePath(index1, index2, fee)
          }}
          //Mocked data
          onAddLiquidity={() => {}}
          tokenAInputState={{
            blocked: false,
            blockerInfo: '',
            decimalsLimit: 0,
            setValue: () => {},
            value: ''
          }}
          tokenBInputState={{
            blocked: false,
            blockerInfo: '',
            decimalsLimit: 0,
            setValue: () => {},
            value: ''
          }}
          feeTiers={feeTiers.map(tier => tier.feeValue)}
          progress={progress}
          onReverseTokens={() => {
            if (tokenAIndex === null || tokenBIndex === null) {
              return
            }

            const pom = tokenAIndex
            setTokenAIndex(tokenBIndex)
            setTokenBIndex(pom)
            onChangePositionTokens(tokenBIndex, tokenAIndex, currentFeeIndex)

            updatePath(tokenBIndex, tokenAIndex, currentFeeIndex)
          }}
          poolIndex={poolIndex}
          bestTierIndex={1} // TODO add real data
          canCreateNewPool={canCreateNewPool}
          canCreateNewPosition={canCreateNewPosition}
          handleAddToken={handleAddToken}
          commonTokens={commonTokens}
          initialHideUnknownTokensValue={initialHideUnknownTokensValue}
          onHideUnknownTokensChange={onHideUnknownTokensChange}
          priceA={tokenAPriceData?.price}
          priceB={tokenBPriceData?.price}
          priceALoading={priceALoading}
          priceBLoading={priceBLoading}
          feeTierIndex={currentFeeIndex}
          concentrationArray={concentrationArray}
          concentrationIndex={concentrationIndex}
          minimumSliderIndex={minimumSliderIndex}
          positionOpeningMethod={positionOpeningMethod}
        />

        {isCurrentPoolExisting ||
        tokenAIndex === null ||
        tokenBIndex === null ||
        tokenAIndex === tokenBIndex ||
        isWaitingForNewPool ? (
          <RangeSelector
            poolIndex={poolIndex}
            onChangeRange={onChangeRange}
            blocked={
              tokenAIndex === null ||
              tokenBIndex === null ||
              tokenAIndex === tokenBIndex ||
              data.length === 0 ||
              isWaitingForNewPool
            }
            blockerInfo={setRangeBlockerInfo()}
            {...(tokenAIndex === null ||
            tokenBIndex === null ||
            !isCurrentPoolExisting ||
            data.length === 0 ||
            isWaitingForNewPool
              ? noRangePlaceholderProps
              : {
                  data,
                  midPrice,
                  tokenASymbol: tokens[tokenAIndex].symbol,
                  tokenBSymbol: tokens[tokenBIndex].symbol
                })}
            ticksLoading={ticksLoading}
            isXtoY={isXtoY}
            tickSpacing={tickSpacing}
            xDecimal={xDecimal}
            yDecimal={yDecimal}
            currentPairReversed={currentPairReversed}
            initialIsDiscreteValue={initialIsDiscreteValue}
            onDiscreteChange={onDiscreteChange}
            positionOpeningMethod={positionOpeningMethod}
            hasTicksError={hasTicksError}
            reloadHandler={reloadHandler}
            volumeRange={plotVolumeRange}
            concentrationArray={concentrationArray}
            setConcentrationIndex={setConcentrationIndex}
            concentrationIndex={concentrationIndex}
            minimumSliderIndex={minimumSliderIndex}
            getTicksInsideRange={getTicksInsideRange}
          />
        ) : (
          <PoolInit
            onChangeRange={onChangeRange}
            isXtoY={isXtoY}
            tickSpacing={tickSpacing}
            xDecimal={xDecimal}
            yDecimal={yDecimal}
            tokenASymbol={tokenAIndex !== null ? tokens[tokenAIndex].symbol : 'ABC'}
            tokenBSymbol={tokenBIndex !== null ? tokens[tokenBIndex].symbol : 'XYZ'}
            midPrice={midPrice.index}
            onChangeMidPrice={onChangeMidPrice}
            currentPairReversed={currentPairReversed}
          />
        )}
      </Grid>
    </Grid>
  )
}

export default NewPosition
