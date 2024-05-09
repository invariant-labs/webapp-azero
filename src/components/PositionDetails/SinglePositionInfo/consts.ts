export interface ILiquidityToken {
  name: string
  icon: string
  decimal: bigint
  liqValue: number
  claimValue: number
  balance: number
  usdValue?: number
}
