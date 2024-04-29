export interface PlotTickData {
  x: number
  y: number
  index: number
}

export interface PlotTicks {
  data: PlotTickData[]
  loading: boolean
  hasError?: boolean
}

export interface InitPositionStore {
  inProgress: boolean
  success: boolean
}

export interface GetCurrentTicksData {
  poolIndex: number
  isXtoY: boolean
  disableLoading?: boolean
}

export interface ClosePositionData {
  positionIndex: number
  claimFarmRewards?: boolean
  onSuccess: () => void
}
