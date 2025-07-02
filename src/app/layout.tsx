import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '우리학원시간표 - 학원 시간표 관리',
  description: '학원 시간표를 한눈에 확인하고 관리할 수 있는 웹 서비스',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-gray-50">
        {children}
      </body>
    </html>
  )
} 