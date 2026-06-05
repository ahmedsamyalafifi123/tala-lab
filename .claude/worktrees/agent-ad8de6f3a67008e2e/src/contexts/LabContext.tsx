'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface LabContextType {
  labSlug: string | null
  labName: string | null
  labId: string | null
  userRole: string | null
  setLabContext: (slug: string, id: string, role?: string, name?: string) => void
  clearLabContext: () => void
}

const LabContext = createContext<LabContextType | undefined>(undefined)

interface LabProviderProps {
  children: ReactNode;
  initialLabId?: string;
  initialLabSlug?: string;
  initialLabName?: string;
  initialUserRole?: string;
}

export function LabProvider({ children, initialLabId, initialLabSlug, initialLabName, initialUserRole }: LabProviderProps) {
  const [labSlug, setLabSlug] = useState<string | null>(initialLabSlug || null)
  const [labName, setLabName] = useState<string | null>(initialLabName || null)
  const [labId, setLabId] = useState<string | null>(initialLabId || null)
  const [userRole, setUserRole] = useState<string | null>(initialUserRole || null)

  useEffect(() => {
    // If props are provided, sync them
    if (initialLabId && initialLabSlug) {
        setLabSlug(initialLabSlug);
        setLabName(initialLabName || initialLabSlug);
        setLabId(initialLabId);
        if (initialUserRole) {
            setUserRole(initialUserRole);
            localStorage.setItem('user_role', initialUserRole);
        }
        localStorage.setItem('lab_slug', initialLabSlug);
        localStorage.setItem('lab_name', initialLabName || initialLabSlug);
        localStorage.setItem('lab_id', initialLabId);
        return;
    }

    // Fallback: Load lab context from localStorage on mount if not provided via props
    const savedSlug = localStorage.getItem('lab_slug')
    const savedName = localStorage.getItem('lab_name')
    const savedId = localStorage.getItem('lab_id')
    if (savedSlug && savedId && !labId) {
      setLabSlug(savedSlug)
      setLabName(savedName || savedSlug)
      setLabId(savedId)
    }
    const savedRole = localStorage.getItem('user_role')
    if (savedRole && !userRole) {
        setUserRole(savedRole)
    }
  }, [initialLabId, initialLabSlug, initialLabName, initialUserRole])

  const setLabContext = (slug: string, id: string, role?: string, name?: string) => {
    setLabSlug(slug)
    setLabName(name || slug)
    setLabId(id)
    localStorage.setItem('lab_slug', slug)
    localStorage.setItem('lab_name', name || slug)
    localStorage.setItem('lab_id', id)
    if (role) {
        setUserRole(role)
        localStorage.setItem('user_role', role)
    }
  }

  const clearLabContext = () => {
    setLabSlug(null)
    setLabName(null)
    setLabId(null)
    setUserRole(null)
    localStorage.removeItem('lab_slug')
    localStorage.removeItem('lab_name')
    localStorage.removeItem('lab_id')
    localStorage.removeItem('user_role')
  }

  return (
    <LabContext.Provider value={{ labSlug, labName, labId, userRole, setLabContext, clearLabContext }}>
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
