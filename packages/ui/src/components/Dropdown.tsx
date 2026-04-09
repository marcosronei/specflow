import React, { useState, useRef, useEffect } from 'react'

export interface DropdownItemProps {
  onClick?: () => void
  children: React.ReactNode
  disabled?: boolean
}

export function DropdownItem({ onClick, children, disabled = false }: DropdownItemProps) {
  return (
    <button
      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

export interface DropdownProps {
  trigger: React.ReactNode
  children: React.ReactNode
  align?: 'left' | 'right'
}

export function Dropdown({ trigger, children, align = 'left' }: DropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative inline-block" ref={ref}>
      <div onClick={() => setOpen(!open)}>{trigger}</div>
      {open && (
        <div
          className={`absolute z-50 mt-1 min-w-40 rounded-md border border-gray-200 bg-white shadow-lg ${align === 'right' ? 'right-0' : 'left-0'}`}
        >
          {children}
        </div>
      )}
    </div>
  )
}
