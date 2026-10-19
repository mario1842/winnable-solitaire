/** Lightweight synthesized SFX via Web Audio API (no audio files). */

let ctx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AC) return null
  if (!ctx) ctx = new AC()
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

function tone(
  audio: AudioContext,
  {
    frequency,
    duration,
    type = 'sine',
    gain = 0.12,
    fadeIn = 0.005,
    fadeOut,
    delay = 0,
  }: {
    frequency: number
    duration: number
    type?: OscillatorType
    gain?: number
    fadeIn?: number
    fadeOut?: number
    delay?: number
  },
): void {
  const start = audio.currentTime + delay
  const end = start + duration
  const out = fadeOut ?? Math.min(0.08, duration * 0.45)

  const osc = audio.createOscillator()
  const amp = audio.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(frequency, start)

  amp.gain.setValueAtTime(0.0001, start)
  amp.gain.exponentialRampToValueAtTime(gain, start + fadeIn)
  amp.gain.exponentialRampToValueAtTime(0.0001, end)

  osc.connect(amp)
  amp.connect(audio.destination)
  osc.start(start)
  osc.stop(end + out)
}

function noiseBurst(
  audio: AudioContext,
  {
    duration,
    gain = 0.06,
    delay = 0,
    bandHz = 1800,
  }: { duration: number; gain?: number; delay?: number; bandHz?: number },
): void {
  const start = audio.currentTime + delay
  const frames = Math.max(1, Math.floor(audio.sampleRate * duration))
  const buffer = audio.createBuffer(1, frames, audio.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < frames; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / frames)
  }

  const src = audio.createBufferSource()
  src.buffer = buffer
  const filter = audio.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.value = bandHz
  filter.Q.value = 0.8
  const amp = audio.createGain()
  amp.gain.setValueAtTime(gain, start)
  amp.gain.exponentialRampToValueAtTime(0.0001, start + duration)

  src.connect(filter)
  filter.connect(amp)
  amp.connect(audio.destination)
  src.start(start)
  src.stop(start + duration + 0.02)
}

export function playUiClick(): void {
  const audio = getCtx()
  if (!audio) return
  tone(audio, { frequency: 620, duration: 0.045, type: 'triangle', gain: 0.07 })
  tone(audio, { frequency: 920, duration: 0.03, type: 'sine', gain: 0.04, delay: 0.012 })
}

export function playCardSelect(): void {
  const audio = getCtx()
  if (!audio) return
  tone(audio, { frequency: 480, duration: 0.04, type: 'triangle', gain: 0.06 })
  noiseBurst(audio, { duration: 0.025, gain: 0.035, bandHz: 2400 })
}

export function playCardPlace(): void {
  const audio = getCtx()
  if (!audio) return
  noiseBurst(audio, { duration: 0.04, gain: 0.08, bandHz: 900 })
  tone(audio, { frequency: 200, duration: 0.06, type: 'triangle', gain: 0.08 })
}

export function playDraw(): void {
  const audio = getCtx()
  if (!audio) return
  tone(audio, { frequency: 340, duration: 0.05, type: 'triangle', gain: 0.05 })
  noiseBurst(audio, { duration: 0.03, gain: 0.04, bandHz: 1600 })
}

/** Soft riffling when waste is recycled back into the stock. */
export function playShuffle(): void {
  const audio = getCtx()
  if (!audio) return

  // Fluttering paper/card noise in a quick cascade
  for (let i = 0; i < 8; i++) {
    const delay = i * 0.038
    noiseBurst(audio, {
      duration: 0.055,
      gain: 0.055 + (i % 2) * 0.02,
      delay,
      bandHz: 1100 + i * 180,
    })
    tone(audio, {
      frequency: 160 + i * 18,
      duration: 0.04,
      type: 'triangle',
      gain: 0.035,
      delay,
    })
  }

  // Final tap as the pile settles
  noiseBurst(audio, { duration: 0.08, gain: 0.09, delay: 0.32, bandHz: 700 })
  tone(audio, {
    frequency: 220,
    duration: 0.1,
    type: 'triangle',
    gain: 0.07,
    delay: 0.34,
  })
}

export function playFoundation(): void {
  const audio = getCtx()
  if (!audio) return
  tone(audio, { frequency: 523.25, duration: 0.12, type: 'sine', gain: 0.08 })
  tone(audio, { frequency: 659.25, duration: 0.16, type: 'sine', gain: 0.07, delay: 0.04 })
}

export function playWin(): void {
  const audio = getCtx()
  if (!audio) return
  const notes = [523.25, 659.25, 783.99, 1046.5]
  notes.forEach((frequency, i) => {
    tone(audio, {
      frequency,
      duration: 0.22,
      type: 'triangle',
      gain: 0.08,
      delay: i * 0.07,
    })
  })
}
