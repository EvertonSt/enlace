import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'prisma/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Use DATABASE_URL env var if it's a PostgreSQL connection (for Railway/Docker)
const envUrl = process.env.DATABASE_URL;
const isPostgres = envUrl?.startsWith('postgresql://') || envUrl?.startsWith('postgres://');

let datasourceUrl: string;
if (isPostgres && envUrl) {
  datasourceUrl = envUrl;
} else {
  // Default to SQLite for local development
  const dbPath = path.resolve(__dirname, 'prisma', 'dev.db').replace(/\\\\/g, '/');
  datasourceUrl = `file:${dbPath}`;
}

export default defineConfig({
  earlyAccess: true,
  schema: path.join(__dirname, 'prisma', 'schema.prisma'),
  datasource: {
    url: datasourceUrl,
  },
  seed: {
    command: 'npx tsx prisma/seed.ts',
  },
});
