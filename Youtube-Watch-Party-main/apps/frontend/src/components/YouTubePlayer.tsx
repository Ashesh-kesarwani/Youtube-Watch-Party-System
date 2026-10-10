import { useEffect, useRef, useState } from 'react'
import type { PlaybackState } from '../lib/socket'
import { TvIcon } from './Icons'

type YTPlayer = {
  getCurrentTime: () => number
  getPlayerState?: () => number
  cueVideoById: (videoId: string) => void
  seekTo: (seconds: number, allowSeekAhead: boolean) => void
  playVideo: () => void
  pauseVideo: () => void
  destroy: () => void
}

declare global {
  interface Window {
    YT?: {
      Player: new (
        element: HTMLElement,
        options: {
          videoId: string
          playerVars: Record<string, number | string>
          events: {
            onReady: (event: { target: YTPlayer }) => void
          }
        }
      ) => YTPlayer
    }
    onYouTubeIframeAPIReady?: () => void
  }
}

let apiPromise: Promise<void> | undefined
function loadYouTubeApi(): Promise<void> {
  if (window.YT?.Player) return Promise.resolve()
  if (!apiPromise) {
    apiPromise = new Promise((resolve) => {
      const prev = window.onYouTubeIframeAPIReady
      window.onYouTubeIframeAPIReady = () => {
        prev?.()
        resolve()
      }
      if (!document.querySelector('script[data-youtube-iframe-api]')) {
        const script = document.createElement('script')
        script.src = 'https://www.youtube.com/iframe_api'
        script.dataset.youtubeIframeApi = 'true'
        document.head.appendChild(script)
      }
    })
  }
  return apiPromise
}

type Props = {
  playback: PlaybackState
}

export default function YouTubePlayer({ playback }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<YTPlayer | null>(null)
  const currentVideoIdRef = useRef<string>(playback.videoId)
  const [isReady, setIsReady] = useState(false)

  const playbackRef = useRef(playback)
  useEffect(() => {
    playbackRef.current = playback
  }, [playback])

  useEffect(() => {
    let disposed = false

    void loadYouTubeApi().then(() => {
      if (disposed || !containerRef.current || !window.YT) return

      try {
        const initialPlayback = playbackRef.current
        playerRef.current = new window.YT.Player(containerRef.current, {
          videoId: initialPlayback.videoId,
          playerVars: {
            autoplay: initialPlayback.playState === 'playing' ? 1 : 0,
            controls: 0,
            disablekb: 1,
            playsinline: 1,
            rel: 0,
            modestbranding: 1,
            iv_load_policy: 3,
          },
          events: {
            onReady: ({ target }) => {
              if (disposed) return
              currentVideoIdRef.current = playbackRef.current.videoId
              setIsReady(true)
              syncPlayer(target, playbackRef.current)
            },
          },
        })
      } catch (err) {
        console.error('Failed to initialize YouTube player:', err)
      }
    })

    return () => {
      disposed = true
      playerRef.current?.destroy()
      playerRef.current = null
    }
  }, [])

  useEffect(() => {
    const player = playerRef.current
    if (!player || !isReady) return

    if (currentVideoIdRef.current !== playback.videoId) {
      currentVideoIdRef.current = playback.videoId
      player.cueVideoById(playback.videoId)
      setTimeout(() => {
        if (playerRef.current) syncPlayer(playerRef.current, playback)
      }, 300)
      return
    }

    syncPlayer(player, playback)

    const interval = setInterval(() => {
      if (playerRef.current) syncPlayer(playerRef.current, playbackRef.current)
    }, 1000)

    return () => clearInterval(interval)
  }, [playback, isReady])

  return (
    <div className="video-screen-frame">
      {!isReady && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#1e1f22',
            color: '#949ba4',
            gap: '8px',
            fontSize: '13px',
          }}
        >
          <TvIcon size={18} />
          <span>Connecting to watch stream…</span>
        </div>
      )}
      <div ref={containerRef} style={{ width: '100%', height: '100%', pointerEvents: 'none' }} />
    </div>
  )
}

function syncPlayer(player: YTPlayer, playback: PlaybackState) {
  try {
    const elapsed = playback.playState === 'playing'
      ? Math.max(0, (Date.now() - playback.updatedAt) / 1000)
      : 0
    const targetTime = playback.currentTime + elapsed
    const currentTime = player.getCurrentTime()
    const state = player.getPlayerState?.()

    if (Math.abs(currentTime - targetTime) > 1.5) {
      player.seekTo(targetTime, true)
    }

    if (playback.playState === 'playing') {
      if (state !== 1 && state !== 3) {
        player.playVideo()
      }
    } else {
      if (state !== 2) {
        player.pauseVideo()
      }
    }
  } catch (err) {
    console.warn('SyncPlayer error:', err)
  }
}
