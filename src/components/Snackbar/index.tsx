import React from 'react'
import { CustomContentProps, SnackbarProvider } from 'notistack'
import LoadingSnackbar from './LoadingSnackbar'
import { theme } from '@static/theme'
import { useMediaQuery } from '@mui/system'
import { StyledMaterialDesignContent } from './style'

type ExtraVariants = 'pending'

export type SnackbarVariant = ExtraVariants

interface CustomProps {
  txid?: string
}

export interface SnackbarSnackbarProps extends CustomContentProps, CustomProps {}

declare module 'notistack' {
  interface VariantOverrides {
    pending: true
  }
  interface OptionsObject extends CustomProps {}
}

interface ISnackbarProps {
  children: JSX.Element
  maxSnack?: number
}

const Snackbar: React.FC<ISnackbarProps> = ({ maxSnack, children }) => {
  const isExSmall = useMediaQuery(theme.breakpoints.down('xs'))

  return (
    <SnackbarProvider
      dense
      maxSnack={isExSmall ? 5 : maxSnack}
      anchorOrigin={
        isExSmall
          ? { vertical: 'top', horizontal: 'left' }
          : { vertical: 'bottom', horizontal: 'left' }
      }
      Components={{
        success: StyledMaterialDesignContent,
        error: StyledMaterialDesignContent,
        info: StyledMaterialDesignContent,
        warning: StyledMaterialDesignContent,
        pending: LoadingSnackbar
      }}>
      {children}
    </SnackbarProvider>
  )
}
export default Snackbar
