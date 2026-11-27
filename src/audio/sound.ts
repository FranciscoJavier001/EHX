let audio: AudioContext | undefined
export function sound(kind: 'boot' | 'terminal' | 'alert' | 'ambient' | 'omega', volume: number) {
  if (volume <= 0 || !window.AudioContext) return
  audio ??= new AudioContext()
  if (audio.state !== 'running') void audio.resume().catch(() => undefined)
  const now = audio.currentTime
  const tone = audio.createOscillator()
  const gain = audio.createGain()
  const duration = kind === 'ambient' ? 2.6 : kind === 'boot' ? .65 : .18
  tone.type = kind === 'alert' ? 'triangle' : 'sine'
  tone.frequency.value = { terminal: 510, alert: 320, boot: 130, ambient: 55, omega: 190 }[kind]
  tone.frequency.exponentialRampToValueAtTime(tone.frequency.value * (kind === 'boot' ? 2.8 : 1.18), now + duration)
  gain.gain.setValueAtTime(.0001, now)
  gain.gain.exponentialRampToValueAtTime(Math.max(.0001, volume * .13), now + .035)
  gain.gain.exponentialRampToValueAtTime(.0001, now + duration)
  tone.connect(gain).connect(audio.destination)
  tone.start(now)
  tone.stop(now + duration)
  tone.onended = () => { tone.disconnect(); gain.disconnect() }
}
