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

/** The Hall of Fame fanfare: a rising major arpeggio landing on a held chord. */
export function playFanfare() {
  const ac = audio()
  if (!ac) return
  const t = ac.currentTime + 0.05
  const notes: [number, number, number][] = [
    [523.25, 0, 0.16], [659.25, 0.16, 0.16], [783.99, 0.32, 0.16], [1046.5, 0.48, 0.5],
    [783.99, 1.0, 0.16], [1046.5, 1.16, 0.9],
  ]
  for (const [f, at, dur] of notes) {
    tone(ac, f, t + at, dur, 'square', 0.05)
    tone(ac, f / 2, t + at, dur, 'triangle', 0.1)
  }
  for (const f of [523.25, 659.25, 783.99]) tone(ac, f, t + 1.16, 1.4, 'triangle', 0.06)
}

/** A short bright chime as each champion steps into the spotlight. */
export function playChime(step: number) {
  const ac = audio()
  if (!ac) return
  const base = [523.25, 587.33, 659.25, 698.46, 783.99, 880][step % 6]
  const t = ac.currentTime + 0.02
  tone(ac, base, t, 0.35, 'triangle', 0.12)
  tone(ac, base * 2, t + 0.06, 0.3, 'square', 0.03)
}
