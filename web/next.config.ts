import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/postular',
        destination: '/postular.html',
      },
      {
        source: '/cliente',
        destination: '/cliente.html',
      },
      {
        source: '/demo',
        destination: '/demo.html',
      },
      {
        source: '/presentacion',
        destination: '/presentacion.html',
      }
    ]
  }
}

export default nextConfig
