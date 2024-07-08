import { EmptyPlaceholder } from '@components/EmptyPlaceholder/EmptyPlaceholder'
import { INoConnected, NoConnected } from '@components/NoConnected/NoConnected'
import { PaginationList } from '@components/PaginationList/PaginationList'
import { Button, Grid, InputAdornment, InputBase, Typography } from '@mui/material'
import loader from '@static/gif/loader.gif'
import SearchIcon from '@static/svg/lupaDark.svg'
import refreshIcon from '@static/svg/refresh.svg'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IPositionItem, PositionItem } from './PositionItem/PositionItem'
import { useStyles } from './style'
import { useDispatch, useSelector } from 'react-redux'
import { actions } from '@store/reducers/positions'
import { positionsList } from '@store/selectors/positions'
import { POSITIONS_PER_QUERY } from '@store/consts/static'

interface IProps {
  initialPage: number
  setLastPage: (page: number) => void
  data: IPositionItem[]
  onAddPositionClick: () => void
  loading?: boolean
  showNoConnected?: boolean
  noConnectedBlockerProps: INoConnected
  itemsPerPage: number
  searchValue: string
  searchSetValue: (value: string) => void
  handleRefresh: () => void
  pageChanged: (page: number) => void
}

export const PositionsList: React.FC<IProps> = ({
  initialPage,
  setLastPage,
  data,
  onAddPositionClick,
  loading = false,
  showNoConnected = false,
  noConnectedBlockerProps,
  itemsPerPage,
  searchValue,
  searchSetValue,
  handleRefresh,
  pageChanged
}) => {
  const { classes } = useStyles()
  const navigate = useNavigate()
  const [defaultPage] = useState(initialPage)
  const [page, setPage] = useState(initialPage)
  const dispatch = useDispatch()
  const { length, loadedPages } = useSelector(positionsList)

  const handleChangeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (Object.keys(loadedPages).length * POSITIONS_PER_QUERY < Number(length)) {
      dispatch(actions.getRemainingPositions())
    }

    searchSetValue(e.target.value.toLowerCase())
  }

  const handleChangePagination = (page: number): void => {
    setLastPage(page)
    setPage(page)
  }

  const paginator = (currentPage: number) => {
    const page = currentPage || 1
    const perPage = itemsPerPage || 10
    const offset = (page - 1) * perPage
    const paginatedItems = data.slice(offset).slice(0, itemsPerPage)
    const totalPages = Math.ceil(data.length / perPage)

    return {
      page: page,
      totalPages: totalPages,
      data: paginatedItems
    }
  }

  useEffect(() => {
    setPage(1)
  }, [searchValue])

  useEffect(() => {
    setPage(initialPage)
  }, [])

  useEffect(() => {
    handleChangePagination(initialPage)
  }, [initialPage])

  useEffect(() => {
    pageChanged(page)
  }, [page])

  return (
    <Grid container direction='column' className={classes.root}>
      <Grid
        className={classes.header}
        container
        direction='row'
        justifyContent='space-between'
        alignItems='center'>
        <Grid className={classes.searchRoot}>
          <Grid className={classes.titleBar}>
            <Typography className={classes.title}>Your Liquidity Positions</Typography>
            <Typography className={classes.positionsNumber}>{data.length}</Typography>
          </Grid>
          <Grid className={classes.searchWrapper}>
            <InputBase
              type={'text'}
              className={classes.searchBar}
              placeholder='Search position'
              endAdornment={
                <InputAdornment position='end'>
                  <img src={SearchIcon} className={classes.searchIcon} alt='Search' />
                </InputAdornment>
              }
              onChange={handleChangeInput}
              value={searchValue}
            />
            <Grid rowGap={1} justifyContent='space-between'>
              <Button
                disabled={showNoConnected}
                onClick={showNoConnected ? () => {} : handleRefresh}
                className={classes.refreshIconBtn}>
                <img src={refreshIcon} className={classes.refreshIcon} alt='Refresh' />
              </Button>
              <Button
                className={showNoConnected ? classes.buttonSelectDisabled : classes.button}
                variant='contained'
                onClick={showNoConnected ? () => {} : onAddPositionClick}>
                <span className={classes.buttonText}>+ Add Position</span>
              </Button>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
      <Grid container direction='column' className={classes.list} justifyContent='flex-start'>
        {data.length > 0 && !loading ? (
          paginator(page).data.map((element, index) => (
            <Grid
              onClick={() => {
                navigate(`/position/${element.address}/${element.id}`)
              }}
              key={element.address + element.id}
              className={classes.itemLink}>
              <PositionItem key={index} {...element} />
            </Grid>
          ))
        ) : showNoConnected ? (
          <NoConnected {...noConnectedBlockerProps} />
        ) : loading ? (
          <Grid container style={{ flex: 1 }}>
            <img src={loader} className={classes.loading} alt='Loader' />
          </Grid>
        ) : (
          <EmptyPlaceholder
            desc='Add your first position by pressing the button and start earning!'
            className={classes.placeholder}
          />
        )}
      </Grid>
      {paginator(page).totalPages > 1 ? (
        <PaginationList
          pages={paginator(page).totalPages}
          defaultPage={defaultPage}
          handleChangePage={handleChangePagination}
          variant='end'
          page={page}
        />
      ) : null}
    </Grid>
  )
}
