import type { Meta, StoryObj } from '@storybook/react'
import LoadingSnackbar from '.'

const meta = {
  title: 'Example/LoadingSnackbar',
  component: LoadingSnackbar,
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  parameters: {
    // More on how to position stories at: https://storybook.js.org/docs/configure/story-layout
    layout: 'fullscreen'
  },
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
