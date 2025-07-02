// 재사용 가능한 카드 컴포넌트
// 목적: 일관된 카드 레이아웃 제공

import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
  shadow?: 'none' | 'sm' | 'md' | 'lg'
}

export default function Card({
  children,
  className = '',
  padding = 'md',
  shadow = 'md'
}: CardProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6'
  }
  
  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg'
  }
  
  const classes = `bg-white rounded-lg border ${paddingClasses[padding]} ${shadowClasses[shadow]} ${className}`

  return (
    <div className={classes}>
      {children}
    </div>
  )
} 