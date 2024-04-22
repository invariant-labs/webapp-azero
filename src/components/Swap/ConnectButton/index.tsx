import React from 'react'
export interface StarryButtonProps {
  connected: boolean
  publicKey?: string
  onConnect: () => Promise<void>
  onDisconnect: () => Promise<void>
  onClick?: () => void
}
const ConnectButton: React.FC<StarryButtonProps> = ({
  connected,
  onConnect,
  onDisconnect,
  publicKey
}) => {
  const [connecting, setConnecting] = React.useState(false)
  const [hovering, setHovering] = React.useState(false)
  return (
    <button
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onClick={async () => {
        if (connecting) return
        if (connected) {
          setConnecting(true)
          await onDisconnect()
          setConnecting(false)
        } else {
          setConnecting(true)
          await onConnect()
          setConnecting(false)
        }
      }}>
      <span className='absolute inset-0 flex items-center justify-center z-10'>
        {hovering && connected ? 'Disconnect' : connected ? publicKey?.substring(0, 10) : 'Connect'}
      </span>
    </button>
  )
}

export default ConnectButton
