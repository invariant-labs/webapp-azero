import React from 'react'
import { CustomContentProps } from 'notistack'

import {
  StyledCircularProgress,
  StyledContainer,
  StyledSnackbarContent,
  StyledTitle
} from './style'
import { Grid } from '@mui/material'
import { Box } from '@mui/system'

const LoadingSnackbar = React.forwardRef<HTMLDivElement, CustomContentProps>(({ message }, ref) => {
  return (
    <StyledSnackbarContent ref={ref} role='alert'>
      <StyledContainer>
        <Grid container alignItems='center'>
          <Box ml={1}>
            <StyledCircularProgress size={13} />
          </Box>
          <StyledTitle>{message}</StyledTitle>
        </Grid>
      </StyledContainer>
    </StyledSnackbarContent>
  )
})

export default LoadingSnackbar
