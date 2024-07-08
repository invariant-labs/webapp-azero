import React from 'react'
import useStyles from './style'
import { Box, Button, Grid, Input, Popover, Typography } from '@mui/material'

interface Props {
  open: boolean
  setSlippage: (slippage: string) => void
  handleClose: () => void
  anchorEl: HTMLButtonElement | null
  defaultSlippage: string
  initialSlippage: string
  infoText?: string
  headerText?: string
}

const Slippage: React.FC<Props> = ({
  open,
  setSlippage,
  handleClose,
  anchorEl,
  defaultSlippage,
  initialSlippage,
  infoText,
  headerText
}) => {
  const { classes } = useStyles()
  const [slippTolerance, setSlippTolerance] = React.useState<string>(initialSlippage)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const dummyDivRef = React.useRef<HTMLInputElement>(null)

  const allowOnlyDigitsAndTrimUnnecessaryZeros: React.ChangeEventHandler<
    HTMLInputElement | HTMLTextAreaElement
  > = e => {
    const value = e.target.value

    const regex = /^\d*\.?\d*$/
    if (value === '' || regex.test(value)) {
      const startValue = value
      const caretPosition = e.target.selectionStart

      let parsed = value
      const zerosRegex = /^0+\d+\.?\d*$/
      if (zerosRegex.test(parsed)) {
        parsed = parsed.replace(/^0+/, '')
      }
      const dotRegex = /^\.\d*$/
      if (dotRegex.test(parsed)) {
        parsed = `0${parsed}`
      }

      const diff = startValue.length - parsed.length

      setSlippTolerance(parsed)
      if (caretPosition !== null && parsed !== startValue) {
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.selectionStart = Math.max(caretPosition - diff, 0)
            inputRef.current.selectionEnd = Math.max(caretPosition - diff, 0)
          }
        }, 0)
      }
    } else if (!regex.test(value)) {
      setSlippTolerance('')
    }
  }

  const checkSlippage = (value: string): string => {
    if (Number(value) > 50) {
      setSlippTolerance('50.00')
      return '50.00'
    } else if (Number(value) < 0 || isNaN(Number(value))) {
      setSlippTolerance('00.00')
      return '00.00'
    } else {
      const onlyTwoDigits = '^\\d*\\.?\\d{0,2}$'
      const regex = new RegExp(onlyTwoDigits, 'g')
      if (regex.test(value)) {
        setSlippTolerance(value)
        return value
      } else {
        setSlippTolerance(Number(value).toFixed(2))
        return Number(value).toFixed(2)
      }
    }
  }

  return (
    <Popover
      open={open}
      onClose={handleClose}
      classes={{ paper: classes.paper }}
      anchorEl={anchorEl}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right'
      }}>
      <Grid container className={classes.detailsWrapper}>
        <Grid container justifyContent='space-between' style={{ marginBottom: 6 }}>
          <Typography component='h2'>{headerText ?? 'Swap Transaction Settings'}</Typography>
          <Button className={classes.selectTokenClose} onClick={handleClose} />
        </Grid>
        <Typography className={classes.label}>Slippage tolerance:</Typography>
        <Box>
          <div className={classes.dummyDiv} ref={dummyDivRef}>
            00.00
          </div>
          <Input
            disableUnderline
            placeholder='1.00'
            className={classes.detailsInfoForm}
            type={'text'}
            value={slippTolerance}
            onChange={e => {
              allowOnlyDigitsAndTrimUnnecessaryZeros(e)
              const result = checkSlippage(e.target.value)

              if (dummyDivRef.current && inputRef.current) {
                dummyDivRef.current.textContent = result

                const input = inputRef.current.querySelector('input')
                if (input) {
                  input.style.width = `${dummyDivRef.current.offsetWidth}px`
                }
              }
            }}
            ref={inputRef}
            onBlur={() => {
              setSlippTolerance(Number(slippTolerance).toFixed(2))
              setSlippage(slippTolerance)
            }}
            endAdornment={
              <>
                %
                <button
                  className={classes.detailsInfoBtn}
                  onClick={() => {
                    setSlippTolerance(defaultSlippage)
                    setSlippage(defaultSlippage)

                    if (dummyDivRef.current && inputRef.current) {
                      dummyDivRef.current.textContent = defaultSlippage

                      const input = inputRef.current.querySelector('input')
                      if (input) {
                        input.style.width = `${dummyDivRef.current.offsetWidth}px`
                      }
                    }
                  }}>
                  Auto
                </button>
              </>
            }
            classes={{
              input: classes.innerInput
            }}
          />
        </Box>
        <Typography className={classes.info}>
          {infoText ??
            'Slippage tolerance is a pricing difference between the price at the confirmation time and the actual price of the transaction users are willing to accept when swapping.'}
        </Typography>
      </Grid>
    </Popover>
  )
}
export default Slippage
