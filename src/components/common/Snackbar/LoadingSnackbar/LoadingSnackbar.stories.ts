import type { Meta, StoryObj } from '@storybook/react'
import LoadingSnackbar from '.'

const meta = {
  title: 'Snackbar/LoadingSnackbar',
  component: LoadingSnackbar,
  args: {
    variant: 'pending',
    hideIconVariant: false,
    iconVariant: {},
    message: 'Loading...',
    id: '12345',
    persist: true,
    style: {}
  }
} satisfies Meta<typeof LoadingSnackbar>

export default meta
type Story = StoryObj<typeof meta>

export const TopRight: Story = {
  args: {
    anchorOrigin: {
      vertical: 'top',
      horizontal: 'right'
    }
  }
}
