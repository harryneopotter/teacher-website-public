'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="w-10 h-10 p-0 bg-white/80 backdrop-blur-md border-purple-200 hover:bg-white/90"
      >
        <div className="w-4 h-4" />
      </Button>
    )
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="w-10 h-10 p-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-purple-200 dark:border-purple-600 hover:bg-white/90 dark:hover:bg-gray-700/90 transition-all duration-300"
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? (
        <Sun className="w-4 h-4 text-yellow-500 transition-transform duration-300 rotate-0 scale-100" />
      ) : (
        <Moon className="w-4 h-4 text-purple-600 transition-transform duration-300 rotate-0 scale-100" />
      )}
    </Button>
  )
}
