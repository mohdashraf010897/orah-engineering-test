import { useState } from "react"

export const useDebounce = (callback: (value: string) => void, delay: number) => {
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null)

  return (value: string) => {
    if (timer) {
      clearTimeout(timer)
    }

    setTimer(
      setTimeout(() => {
        callback(value)
      }, delay)
    )
  }
}
