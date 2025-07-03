// 색상 선택 컴포넌트
// 목적: 시간표 색상 설정을 위한 파스텔톤 색상 팔레트

'use client'

import { useState } from 'react'

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  disabled?: boolean
}

// 연한 파스텔톤 색상 프리셋 (10가지)
const COLOR_PRESETS = [
  { name: '파란색', value: '#BFDBFE', bg: 'bg-blue-200', hover: 'hover:bg-blue-300' },
  { name: '보라색', value: '#DDD6FE', bg: 'bg-violet-200', hover: 'hover:bg-violet-300' },
  { name: '분홍색', value: '#FBCFE8', bg: 'bg-pink-200', hover: 'hover:bg-pink-300' },
  { name: '빨간색', value: '#FECACA', bg: 'bg-red-200', hover: 'hover:bg-red-300' },
  { name: '주황색', value: '#FED7AA', bg: 'bg-orange-200', hover: 'hover:bg-orange-300' },
  { name: '노란색', value: '#FEF3C7', bg: 'bg-yellow-200', hover: 'hover:bg-yellow-300' },
  { name: '초록색', value: '#BBF7D0', bg: 'bg-green-200', hover: 'hover:bg-green-300' },
  { name: '청록색', value: '#A7F3D0', bg: 'bg-emerald-200', hover: 'hover:bg-emerald-300' },
  { name: '남색', value: '#C7D2FE', bg: 'bg-indigo-200', hover: 'hover:bg-indigo-300' },
  { name: '회색', value: '#E5E7EB', bg: 'bg-gray-200', hover: 'hover:bg-gray-300' }
]

export default function ColorPicker({ value, onChange, disabled = false }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false)

  const selectedColor = COLOR_PRESETS.find(color => color.value === value) || COLOR_PRESETS[0]

  const handleColorSelect = (colorValue: string) => {
    onChange(colorValue)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      {/* 선택된 색상 표시 버튼 */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full h-10 px-3 py-2 border border-gray-300 rounded-md
          flex items-center justify-between
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:border-gray-400 cursor-pointer'}
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
        `}
      >
        <div className="flex items-center gap-2">
          <div 
            className="w-5 h-5 rounded border border-gray-300"
            style={{ backgroundColor: value }}
          />
          <span className="text-sm text-gray-700">{selectedColor.name}</span>
        </div>
        <svg 
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* 색상 팔레트 드롭다운 */}
      {isOpen && !disabled && (
        <>
          {/* 배경 오버레이 */}
          <div 
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* 색상 선택 패널 */}
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-20">
            <div className="p-3">
              <div className="text-xs font-medium text-gray-700 mb-2">색상 선택</div>
              <div className="grid grid-cols-5 gap-2">
                {COLOR_PRESETS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => handleColorSelect(color.value)}
                    className={`
                      relative w-8 h-8 rounded border-2 transition-all
                      ${value === color.value ? 'border-gray-800 scale-110' : 'border-gray-300 hover:border-gray-400'}
                    `}
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  >
                    {/* 선택된 색상 체크 표시 */}
                    {value === color.value && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg className="w-4 h-4 text-white drop-shadow-sm" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
} 