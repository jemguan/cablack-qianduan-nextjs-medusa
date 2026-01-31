"use client"

import { useEffect, useState } from "react"

interface AgeVerificationProps {
  config: {
    enabled?: boolean
    title?: string
    text?: string
  }
}

const STORAGE_KEY = "age_verified"

export default function AgeVerification({ config }: AgeVerificationProps) {
  const [show, setShow] = useState(false)
  const [denied, setDenied] = useState(false)

  useEffect(() => {
    if (!config.enabled) return
    const isDev = process.env.NODE_ENV === "development"
    const verified = !isDev && localStorage.getItem(STORAGE_KEY)
    if (!verified) {
      setShow(true)
    }
  }, [config.enabled])

  if (!show) return null

  const isDev = process.env.NODE_ENV === "development"

  const handleConfirm = () => {
    if (!isDev) {
      localStorage.setItem(STORAGE_KEY, "1")
    }
    setShow(false)
  }

  if (denied) {
    return (
      <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black">
        <div className="max-w-md w-full mx-4 text-center">
          <h2 className="text-2xl font-semibold mb-4 text-white">
            Access Denied
          </h2>
          <p className="text-gray-400">
            You do not meet the age requirement to view this website.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl max-w-md w-full mx-4 p-8 text-center">
        {config.title && (
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            {config.title}
          </h2>
        )}
        {config.text && (
          <p className="text-gray-600 dark:text-gray-300 mb-6 whitespace-pre-line">
            {config.text}
          </p>
        )}
        <div className="flex gap-3">
          <button
            onClick={() => setDenied(true)}
            className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium py-3 px-6 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 bg-black dark:bg-white text-white dark:text-black font-medium py-3 px-6 rounded-md hover:opacity-90 transition-opacity"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  )
}
