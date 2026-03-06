// eslint-disable-next-line @typescript-eslint/no-require-imports
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
})

import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // config options here
}

module.exports = withPWA(nextConfig)
