import { useEffect, useState, useTransition } from 'react'
import type { FormEvent } from 'react'
import { formatTime, getYouTubeVideoId, PRESET_VIDEOS } from '../lib/room'
import type { PlaybackAction, PlaybackState } from '../lib/socket'
import {
  AlertCircleIcon,
  CrownIcon,
  PauseIcon,
  PlayIcon,
  RotateCcwIcon,
  RotateCwIcon,
  SparklesIcon,
  UserIcon,
} from './Icons'

type Props = {
  playback: PlaybackState
  canControl: boolean
  enabled: boolean
  onControl: (action: PlaybackAction) => void
  onRequest: (action: PlaybackAction) => void
}

export default function PlaybackControls({ playback, canControl, enabled, onControl, onRequest }: Props) {
  const [currentPosition, setCurrentPosition] = useState<number>(playback.currentTime)
  const [videoUrl, setVideoUrl] = useState('')
  const [customSeek, setCustomSeek] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined

    if (playback.playState === 'playing') {
      interval = setInterval(() => {
        const elapsed = (Date.now() - playback.updatedAt) / 1000
        setCurrentPosition(Math.max(0, playback.currentTime + elapsed))
      }, 500)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [playback.currentTime, playback.playState, playback.updatedAt])

  function submitAction(action: PlaybackAction) {
    setError(null)
    if (!enabled) return
    if (canControl) {
      onControl(action)
    } else {
      onRequest(action)
    }
  }

  function handlePlayToggle() {
    if (playback.playState === 'playing') {
      submitAction({ type: 'pause' })
    } else {
      submitAction({ type: 'play' })
    }
  }

  function handleJump(offsetSeconds: number) {
    const newTime = Math.max(0, Math.floor(currentPosition + offsetSeconds))
    submitAction({ type: 'seek', time: newTime })
  }

  function handleSliderChange(e: React.ChangeEvent<HTMLInputElement>) {
    const targetVal = Number(e.target.value)
    setCurrentPosition(targetVal)
  }

  function handleSliderCommit(e: React.MouseEvent<HTMLInputElement> | React.TouchEvent<HTMLInputElement>) {
    const targetVal = Number((e.target as HTMLInputElement).value)
    startTransition(() => {
      submitAction({ type: 'seek', time: targetVal })
    })
  }

  function handleDirectSeek(e: FormEvent) {
    e.preventDefault()
    if (!customSeek.trim()) return

    let totalSeconds = 0
    if (customSeek.includes(':')) {
      const parts = customSeek.split(':').map(Number)
      if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        totalSeconds = parts[0] * 60 + parts[1]
      } else if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
        totalSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2]
      } else {
        setError('Enter mm:ss (e.g. 1:45)')
        return
      }
    } else {
      totalSeconds = Number(customSeek)
      if (isNaN(totalSeconds) || totalSeconds < 0) {
        setError('Enter seconds')
        return
      }
    }

    setCustomSeek('')
    submitAction({ type: 'seek', time: totalSeconds })
  }

  function handleChangeVideo(e: FormEvent) {
    e.preventDefault()
    const videoId = getYouTubeVideoId(videoUrl)
    if (!videoId) {
      setError('Enter a valid YouTube URL or 11-char ID')
      return
    }
    setVideoUrl('')
    submitAction({ type: 'changeVideo', videoId })
  }

  const isPlaying = playback.playState === 'playing'

  return (
    <div className="watch-dock">
      {/* 1. Timeline Scrubber */}
      <div className="dock-timeline-row">
        <span className="time-stamp-text">{formatTime(currentPosition)}</span>
        <input
          type="range"
          min={0}
          max={Math.max(600, Math.floor(currentPosition) + 300)}
          step={1}
          value={Math.floor(currentPosition)}
          onChange={handleSliderChange}
          onMouseUp={handleSliderCommit}
          onTouchEnd={handleSliderCommit}
          disabled={!enabled}
          className="discord-seek-bar"
          aria-label="Seek track"
        />
        <span className="time-stamp-text" style={{ textAlign: 'right', color: isPlaying ? '#23a55a' : '#949ba4' }}>
          {isPlaying ? 'PLAYING' : 'PAUSED'}
        </span>
      </div>

      {/* 2. Controls Actions Row */}
      <div className="dock-actions-row">
        <div className="playback-controls-group">
          <button
            type="button"
            className={`d-btn ${isPlaying ? 'd-btn-subtle' : 'd-btn-blurple'} d-btn-sm`}
            disabled={!enabled}
            onClick={handlePlayToggle}
          >
            {isPlaying ? <PauseIcon size={16} /> : <PlayIcon size={16} />}
            <span>{isPlaying ? 'Pause' : 'Play'}</span>
          </button>

          <button
            type="button"
            className="d-btn d-btn-subtle d-btn-sm"
            disabled={!enabled}
            onClick={() => handleJump(-10)}
            title="Rewind 10s"
          >
            <RotateCcwIcon size={14} />
            <span>-10s</span>
          </button>

          <button
            type="button"
            className="d-btn d-btn-subtle d-btn-sm"
            disabled={!enabled}
            onClick={() => handleJump(10)}
            title="Forward 10s"
          >
            <RotateCwIcon size={14} />
            <span>+10s</span>
          </button>

          <form onSubmit={handleDirectSeek} style={{ display: 'inline-flex', gap: '4px', marginLeft: '4px' }}>
            <input
              type="text"
              placeholder="1:30"
              value={customSeek}
              onChange={(e) => setCustomSeek(e.target.value)}
              disabled={!enabled}
              className="d-input"
              style={{ width: '56px', height: '28px', padding: '0 6px', fontSize: '12px' }}
            />
            <button type="submit" disabled={!enabled || !customSeek.trim()} className="d-btn d-btn-subtle d-btn-sm">
              Seek
            </button>
          </form>
        </div>

        {/* Discord Notice Bar */}
        <div className={`discord-notice-bar ${canControl ? 'can-control' : 'is-viewer'}`}>
          {canControl ? (
            <>
              <CrownIcon size={13} />
              <span>Full control active</span>
            </>
          ) : (
            <>
              <UserIcon size={13} />
              <span>Viewer (actions send request)</span>
            </>
          )}
        </div>
      </div>

      {/* 3. YouTube Search / URL Bar */}
      <div className="dock-search-row">
        <form onSubmit={handleChangeVideo} style={{ display: 'flex', gap: '8px', flex: 1 }}>
          <input
            id="youtube-url-input"
            type="text"
            placeholder="Paste YouTube video link or ID (e.g. https://youtu.be/...)"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            disabled={!enabled}
            className="dock-search-input"
          />
          <button
            type="submit"
            disabled={!enabled || !videoUrl.trim()}
            className="d-btn d-btn-blurple d-btn-sm"
            style={{ height: '36px' }}
          >
            <SparklesIcon size={14} />
            <span>{canControl ? 'Load Video' : 'Request Video'}</span>
          </button>
        </form>
      </div>

      {/* 4. Quick Watch Presets */}
      <div className="dock-presets-row">
        <span style={{ color: '#949ba4', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>
          Presets:
        </span>
        {PRESET_VIDEOS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className={`dock-preset-btn ${playback.videoId === preset.id ? 'active' : ''}`}
            onClick={() => submitAction({ type: 'changeVideo', videoId: preset.id })}
            disabled={!enabled}
          >
            {preset.tag}
          </button>
        ))}
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f23f43', fontSize: '12px' }}>
          <AlertCircleIcon size={14} />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
