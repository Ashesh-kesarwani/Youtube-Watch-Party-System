export function normalizeRoomCode(code: string): string {
  return code.trim().toUpperCase()
}

export function getYouTubeVideoId(value: string): string | null {
  const trimmed = value.trim()
  if (/^[\w-]{11}$/.test(trimmed)) return trimmed
  try {
    const url = new URL(trimmed)
    if (url.hostname === 'youtu.be') return url.pathname.slice(1).match(/^[\w-]{11}$/)?.[0] ?? null
    if (url.hostname === 'youtube.com' || url.hostname.endsWith('.youtube.com')) {
      const id = url.searchParams.get('v')
        ?? url.pathname.match(/\/(?:embed|shorts)\/([\w-]{11})/)?.[1]
      return id && /^[\w-]{11}$/.test(id) ? id : null
    }
  } catch {
    return null
  }
  return null
}

export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '00:00'
  const total = Math.floor(seconds)
  const mins = Math.floor(total / 60)
  const secs = total % 60
  const hours = Math.floor(mins / 60)
  if (hours > 0) {
    const remMins = mins % 60
    return `${hours}:${remMins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

export type VideoPreset = {
  id: string
  title: string
  tag: string
}

export const PRESET_VIDEOS: VideoPreset[] = [
  { id: 'aqz-KE-bpKQ', title: 'Big Buck Bunny (4K Animation)', tag: 'Animation' },
  { id: '4xDzrJKXOOY', title: 'Synthwave Radio — Chill Beats', tag: 'Retro Synth' },
  { id: 'M7lc1UVf-VE', title: 'YouTube Developers Showcase', tag: 'Tech' },
]
