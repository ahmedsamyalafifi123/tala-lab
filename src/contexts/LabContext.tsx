'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface LabContextType {
  labSlug: string | null
  labId: string | null
  userRole: string | null
  setLabContext: (slug: string, id: string, role?: string) => void
  clearLabContext: () => void
}

const LabContext = createContext<LabContextType | undefined>(undefined)

interface LabProviderProps {
  children: ReactNode;
  initialLabId?: string;
  initialLabSlug?: string;
  initialUserRole?: string;
}

export function LabProvider({ children, initialLabId, initialLabSlug, initialUserRole }: LabProviderProps) {
  const [labSlug, setLabSlug] = useState<string | null>(initialLabSlug || null)
  const [labId, setLabId] = useState<string | null>(initialLabId || null)
  const [userRole, setUserRole] = useState<string | null>(initialUserRole || null)

  useEffect(() => {
    // If props are provided, sync them
    if (initialLabId && initialLabSlug) {
        setLabSlug(initialLabSlug);
        setLabId(initialLabId);
        if (initialUserRole) {
            setUserRole(initialUserRole);
            localStorage.setItem('user_role', initialUserRole);
        }
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
    const savedRole = localStorage.getItem('user_role')
    if (savedRole && !userRole) {
        setUserRole(savedRole)
    }
  }, [initialLabId, initialLabSlug, initialUserRole])

  const setLabContext = (slug: string, id: string, role?: string) => {
    setLabSlug(slug)
    setLabId(id)
    localStorage.setItem('lab_slug', slug)
    localStorage.setItem('lab_id', id)
    if (role) {
        setUserRole(role)
        localStorage.setItem('user_role', role)
    }
  }

  const clearLabContext = () => {
    setLabSlug(null)
    setLabId(null)
    setUserRole(null)
    localStorage.removeItem('lab_slug')
    localStorage.removeItem('lab_id')
    localStorage.removeItem('user_role')
  }

  return (
    <LabContext.Provider value={{ labSlug, labId, userRole, setLabContext, clearLabContext }}>
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
