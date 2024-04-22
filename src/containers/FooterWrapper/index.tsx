import React from 'react'
import Footer from '@components/Footer'

export interface IPriorityFeeOptions {
  label: string
  value: number
  saveValue: number
  description: string
}

export const FooterWrapper: React.FC = () => {
  return <Footer />
}

export default FooterWrapper
