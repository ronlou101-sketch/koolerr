import type { NextConfig } from 'next'
import path from 'path'

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  outputFileTracingIncludes: {
    '/tracker': ['./docs/KOOLERR_MASTER_TRACKER.md'],
  },
}

export default nextConfig
