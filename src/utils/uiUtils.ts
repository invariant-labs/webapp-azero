export const toBlur = 'global-blur'

export const blurContent = () => {
  const el = document.getElementById(toBlur)
  if (!el) return
  el.style.backdropFilter = 'blur(4px) brightness(0.4)'
}
export const unblurContent = () => {
  const el = document.getElementById(toBlur)
  if (!el) return
  el.style.backdropFilter = 'none'
}
