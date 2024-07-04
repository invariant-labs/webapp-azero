import { Pagination, useMediaQuery } from '@mui/material'
import { theme } from '@static/theme'
import { useStyles } from './style'
import { useEffect, useState } from 'react'

export interface IPaginationList {
  pages: number
  defaultPage: number
  handleChangePage: (page: number) => void
  variant: string
  changePage: number
}

export const PaginationList: React.FC<IPaginationList> = ({
  pages,
  defaultPage,
  handleChangePage,
  variant,
  changePage
}) => {
  const { classes } = useStyles()
  const position = useMediaQuery(theme.breakpoints.down('sm'))
  const matches = useMediaQuery(theme.breakpoints.down('xs'))

  return (
    <div className={classes.root} style={{ justifyContent: position ? 'center' : `${variant}` }}>
      <Pagination
        count={pages}
        shape='rounded'
        defaultPage={defaultPage}
        onChange={(_e, page) => handleChangePage(page)}
        siblingCount={matches ? 0 : 1}
        page={changePage}
      />
    </div>
  )
}
