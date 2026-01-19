"use client"

import { memo } from 'react'

/**
 * 音量图标
 */
export const Volume2Icon = memo(() => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 14.142M6.343 6.343l4.243 4.243m0 0l4.243 4.243m-4.243-4.243L6.343 17.657m4.243-4.243l4.243-4.243" />
  </svg>
))
Volume2Icon.displayName = 'Volume2Icon'

/**
 * 静音图标
 */
export const VolumeXIcon = memo(() => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
))
VolumeXIcon.displayName = 'VolumeXIcon'

/**
 * 播放图标
 */
export const PlayIcon = memo(() => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M8 5v14l11-7z" />
  </svg>
))
PlayIcon.displayName = 'PlayIcon'

/**
 * 暂停图标
 */
export const PauseIcon = memo(() => (
  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
  </svg>
))
PauseIcon.displayName = 'PauseIcon'
