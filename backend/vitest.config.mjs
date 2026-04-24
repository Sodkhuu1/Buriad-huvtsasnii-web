// Vitest iin tohirgoo — tests/ folder ruu haraad, node dotor ajillana
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
    globals: true,
  },
})
