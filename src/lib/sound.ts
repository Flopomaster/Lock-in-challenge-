let ctx: AudioContext | null = null

function audio(): AudioContext | null {
  try {
    ctx ??= new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

function tone(ac: AudioContext, freq: number, start: number, dur: number, type: OscillatorType, vol: number, glideTo?: number) {
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, start)
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, start + dur)
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(vol, start + 0.03)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur)
  osc.connect(gain).connect(ac.destination)
  osc.start(start)
  osc.stop(start + dur + 0.05)
}

/** A falling "faint" cry followed by a slow, sad minor phrase. */
export function playDeathSound() {
  const ac = audio()
  if (!ac) return
  const t = ac.currentTime + 0.05
  tone(ac, 520, t, 0.9, 'square', 0.06, 70)
  const notes = [440, 349.23, 293.66, 220]
  notes.forEach((f, i) => tone(ac, f, t + 1.1 + i * 0.55, i === notes.length - 1 ? 1.8 : 0.6, 'triangle', 0.16))
}

/** A short, bright chime for catches. */
export function playCatchSound() {
  const ac = audio()
  if (!ac) return
  const t = ac.currentTime + 0.02
  ;[659.25, 830.61, 987.77].forEach((f, i) => tone(ac, f, t + i * 0.09, 0.22, 'square', 0.04))
}
