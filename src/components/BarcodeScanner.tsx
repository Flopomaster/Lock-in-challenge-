import { BrowserMultiFormatReader } from '@zxing/browser'
import type { IScannerControls } from '@zxing/browser'
import { useEffect, useRef, useState } from 'react'

export default function BarcodeScanner({
  onDetect,
  onClose,
}: {
  onDetect: (code: string) => void
  onClose: () => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const controlsRef = useRef<IScannerControls | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const reader = new BrowserMultiFormatReader()
    let cancelled = false

    reader
      .decodeFromVideoDevice(undefined, videoRef.current!, (result, err) => {
        if (cancelled) return
        if (result) {
          onDetect(result.getText())
        }
        // NotFoundException fires continuously while no barcode is in frame — not a real error.
        if (err && err.name !== 'NotFoundException') {
          // keep scanning; ignore transient decode errors
        }
      })
      .then((controls) => {
        if (cancelled) {
          controls.stop()
        } else {
          controlsRef.current = controls
        }
      })
      .catch(() => {
        if (!cancelled) setError('לא ניתן לגשת למצלמה. ודא שנתת הרשאת מצלמה לאתר.')
      })

    return () => {
      cancelled = true
      controlsRef.current?.stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="flex items-center justify-between p-4">
        <span className="text-sm font-medium text-white">סרוק ברקוד של מוצר</span>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg bg-white/10 px-3 py-1.5 text-sm text-white"
        >
          סגור
        </button>
      </div>
      <div className="relative flex-1 overflow-hidden">
        <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
        <div className="pointer-events-none absolute inset-x-8 top-1/2 h-24 -translate-y-1/2 rounded-2xl border-2 border-primary" />
        {error && (
          <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 rounded-xl bg-surface p-4 text-center text-sm text-text">
            {error}
          </div>
        )}
      </div>
      <p className="p-4 text-center text-xs text-white/60">כוון את הברקוד לתוך המסגרת</p>
    </div>
  )
}
