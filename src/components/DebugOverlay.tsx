import { useEffect, useState } from 'react'

export default function DebugOverlay({ wrapperEl }: { wrapperEl: HTMLElement | null }) {
  const [info, setInfo] = useState('')

  useEffect(() => {
    function update() {
      const vv = window.visualViewport
      const wrapperRect = wrapperEl?.getBoundingClientRect()
      const appVh = getComputedStyle(document.documentElement).getPropertyValue('--app-vh')
      const lines = [
        `innerH: ${window.innerHeight}`,
        `docEl.clientH: ${document.documentElement.clientHeight}`,
        `body.clientH: ${document.body.clientHeight}`,
        `screen.h: ${window.screen.height} avail: ${window.screen.availHeight}`,
        `vv.h: ${vv ? vv.height : 'n/a'} vv.offTop: ${vv ? vv.offsetTop : 'n/a'}`,
        `dpr: ${window.devicePixelRatio}`,
        `--app-vh: ${appVh.trim()}`,
        `wrapper h: ${wrapperRect ? wrapperRect.height.toFixed(1) : 'n/a'} bottom: ${wrapperRect ? wrapperRect.bottom.toFixed(1) : 'n/a'}`,
        `standalone: ${window.matchMedia('(display-mode: standalone)').matches}`,
      ]
      setInfo(lines.join('\n'))
    }
    update()
    const interval = setInterval(update, 500)
    window.addEventListener('resize', update)
    window.visualViewport?.addEventListener('resize', update)
    return () => {
      clearInterval(interval)
      window.removeEventListener('resize', update)
      window.visualViewport?.removeEventListener('resize', update)
    }
  }, [wrapperEl])

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 99999,
        background: 'rgba(255,0,0,0.85)',
        color: '#fff',
        fontSize: '10px',
        lineHeight: 1.3,
        padding: '4px 6px',
        whiteSpace: 'pre',
        direction: 'ltr',
        textAlign: 'left',
        pointerEvents: 'none',
        fontFamily: 'monospace',
      }}
    >
      {info}
    </div>
  )
}
