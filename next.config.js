/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // TypeScript 타입 체크를 빌드 시 수행
    tsconfigPath: './tsconfig.json',
  },
  env: {
    // 환경변수 설정
    DATABASE_URL: process.env.DATABASE_URL,
  },
}

module.exports = nextConfig 