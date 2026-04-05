import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      'ts-md5/dist/md5': resolve(__dirname, 'node_modules/ts-md5/dist/md5.js'),
      '@linkit/components': resolve(__dirname, 'projects/apicat-app/src/lib/index'),
      '@linkit/validators': resolve(__dirname, 'projects/apicat-app/src/validators/index'),
      '@app': resolve(__dirname, 'projects/apicat-app/src'),
      '@env': resolve(__dirname, 'projects/apicat-app/src/environments/environment'),
      '@services': resolve(__dirname, 'projects/apicat-app/src/services'),
    },
  },
  test: {
    setupFiles: ['./vitest-setup.ts'],
    server: {
      deps: {
        inline: ['ngx-gravatar'],
      },
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'html'],
      reportsDirectory: './coverage',
      include: ['projects/apicat-app/src/**/*.ts'],
      exclude: [
        '**/*.spec.ts',
        '**/*.module.ts',
        '**/index.ts',
        '**/model/**',
        '**/environments/**',
        '**/main.ts',
        '**/bootstrap.ts',
        '**/*.routes.ts',
      ],
    },
  },
});
