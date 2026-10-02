import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@zavlio/automation/protocol': path.join(root, 'packages/automation/src/protocol.ts'),
      '@zavlio/config': path.join(root, 'packages/config/src/index.ts'),
      '@zavlio/crm': path.join(root, 'packages/crm/src/index.ts'),
      '@zavlio/analytics': path.join(root, 'packages/analytics/src/index.ts'),
      '@zavlio/automation': path.join(root, 'packages/automation/src/index.ts'),
      '@zavlio/ui': path.join(root, 'packages/ui/src/index.tsx'),
      '@zavlio/validation': path.join(root, 'packages/validation/src/index.ts'),
    },
  },
  test: {
    environment: 'jsdom',
    include: ['tests/unit/**/*.test.{ts,tsx}', 'services/*/src/**/*.test.ts'],
    setupFiles: ['./tests/setup.ts'],
  },
});
