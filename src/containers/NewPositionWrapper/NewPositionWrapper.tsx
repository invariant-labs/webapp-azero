import NewPosition from '@components/NewPosition/NewPosition'
import React from 'react'

export interface IProps {
  initialTokenFrom: string
  initialTokenTo: string
  initialFee: string
}

export const NewPositionWrapper: React.FC<IProps> = ({
  initialTokenFrom,
  initialTokenTo,
  initialFee
}) => {
  return (
    <NewPosition
      initialTokenFrom={initialTokenFrom}
      initialTokenTo={initialTokenTo}
      initialFee={initialFee}
      poolAddress='0x1234567890ABCDEF'
      calculatePoolAddress={async () => '0x0987654321FEDCBA'}
      copyPoolAddressHandler={(message, variant) => console.log(message, variant)}
      tokens={[
        {
          symbol: 'ETH',
          assetAddress: '123',
          balance: '1000',
          decimals: 12,
          logoURI: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png?1595348880',
          name: 'Ethereum'
        },
        {
          symbol: 'ETH',
          assetAddress: '123',
          balance: '1000',
          decimals: 12,
          logoURI: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png?1595348880',
          name: 'Ethereum'
        }
      ]}
      data={[]}
      midPrice={{ timestamp: 1631574593, price: 3000 }}
      setMidPrice={mid => console.log(mid)}
      onChangePositionTokens={(tokenAIndex, tokenBindex, feeTierIndex) =>
        console.log(tokenAIndex, tokenBindex, feeTierIndex)
      }
      isCurrentPoolExisting={true}
      feeTiers={[{ feeValue: 0.3 }, { feeValue: 0.5 }, { feeValue: 1 }]}
      ticksLoading={false}
      isXtoY={true}
      xDecimal={18}
      yDecimal={6}
      tickSpacing={10}
      isWaitingForNewPool={false}
      poolIndex={null}
      currentPairReversed={null}
      bestTiers={[]}
      initialIsDiscreteValue={false}
      onDiscreteChange={val => console.log(val)}
      currentPriceSqrt='1.732'
      canCreateNewPool={true}
      canCreateNewPosition={true}
      handleAddToken={address => console.log(address)}
      commonTokens={[]}
      initialOpeningPositionMethod={'concentration'}
      onPositionOpeningMethodChange={val => console.log(val)}
      initialHideUnknownTokensValue={false}
      onHideUnknownTokensChange={val => console.log(val)}
      tokenAPriceData={{ price: 123456 }}
      tokenBPriceData={{ price: 11 }}
      priceALoading={false}
      priceBLoading={false}
      hasTicksError={false}
      reloadHandler={() => console.log('Reloading data')}
      plotVolumeRange={{ min: 0, max: 1000 }}
      currentFeeIndex={0}
      onSlippageChange={slippage => console.log(slippage)}
      initialSlippage='0.5'
      globalPrice={3500}
      progress={'none'}
    />
  )
}

export default NewPositionWrapper
