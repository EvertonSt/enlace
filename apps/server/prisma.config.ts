import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'prisma/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, 'prisma', 'dev.db').replace(/\\/g, '/');

export default defineConfig({
  earlyAccess: true,
  schema: path.join(__dirname, 'prisma', 'schema.prisma'),
  datasource: {
    url: `file:${dbPath}`,
  },
  seed: {
    command: 'npx tsx prisma/seed.ts',
  },
});
