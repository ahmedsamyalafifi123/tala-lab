'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface LabContextType {
  labSlug: string | null
  labId: string | null
  setLabContext: (slug: string, id: string) => void
  clearLabContext: () => void
}

const LabContext = createContext<LabContextType | undefined>(undefined)

interface LabProviderProps {
  children: ReactNode;
  initialLabId?: string;
  initialLabSlug?: string;
}

export function LabProvider({ children, initialLabId, initialLabSlug }: LabProviderProps) {
  const [labSlug, setLabSlug] = useState<string | null>(initialLabSlug || null)
  const [labId, setLabId] = useState<string | null>(initialLabId || null)

  useEffect(() => {
    // If props are provided, sync them
    if (initialLabId && initialLabSlug) {
        setLabSlug(initialLabSlug);
        setLabId(initialLabId);
        localStorage.setItem('lab_slug', initialLabSlug);
        localStorage.setItem('lab_id', initialLabId);
        return;
    }

    // Fallback: Load lab context from localStorage on mount if not provided via props
    const savedSlug = localStorage.getItem('lab_slug')
    const savedId = localStorage.getItem('lab_id')
    if (savedSlug && savedId && !labId) {
      setLabSlug(savedSlug)
      setLabId(savedId)
    }
  }, [initialLabId, initialLabSlug])

  const setLabContext = (slug: string, id: string) => {
    setLabSlug(slug)
    setLabId(id)
    localStorage.setItem('lab_slug', slug)
    localStorage.setItem('lab_id', id)
  }

  const clearLabContext = () => {
    setLabSlug(null)
    setLabId(null)
    localStorage.removeItem('lab_slug')
    localStorage.removeItem('lab_id')
  }

  return (
    <LabContext.Provider value={{ labSlug, labId, setLabContext, clearLabContext }}>
      {children}
    </LabContext.Provider>
  )
}

export function useLabContext() {
  const context = useContext(LabContext)
  if (context === undefined) {
    throw new Error('useLabContext must be used within a LabProvider')
  }
  return context
}
