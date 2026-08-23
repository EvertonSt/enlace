import { PrismaClient } from '../generated/prisma/client.js';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

let _prisma: PrismaClient | null = null;

export function getPrisma(): PrismaClient {
  if (_prisma) return _prisma;

  const rawUrl = process.env.DATABASE_URL;
  const isPostgres = rawUrl?.startsWith('postgresql://') || rawUrl?.startsWith('postgres://');

  if (isPostgres && rawUrl) {
    const { PrismaPg } = require('@prisma/adapter-pg') as typeof import('@prisma/adapter-pg');
    const adapter = new PrismaPg({ connectionString: rawUrl });
    _prisma = new PrismaClient({ adapter });
  } else {
    // Resolve SQLite path to absolute (prisma/dev.db relative to server root)
    const here = path.dirname(fileURLToPath(import.meta.url));
    const serverRoot = path.resolve(here, '..', '..');
    const dbPath = path.resolve(serverRoot, 'prisma', 'dev.db').replace(/\\/g, '/');
    const url = `file:${dbPath}`;
    const adapter = new PrismaLibSql({ url });
    _prisma = new PrismaClient({ adapter });
  }

  return _prisma;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrisma();
    const val = (client as unknown as Record<string | symbol, unknown>)[prop];
    if (typeof val === 'function') {
      return val.bind(client);
    }
    return val;
  },
});
