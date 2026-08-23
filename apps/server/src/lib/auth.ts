import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from './prisma.js';

const JWT_SECRET = process.env.JWT_SECRET ?? 'enlace-dev-secret-change-in-prod';
const JWT_EXPIRES_IN = '7d';

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  phone?: string;
  address?: string;
  planId: string;
}

export async function register(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new ApiAuthError('Email already registered', 409);

  const hashedPassword = await bcrypt.hash(input.password, 12);
  const user = await prisma.user.create({
    data: { email: input.email, password: hashedPassword, name: input.name, role: 'customer' },
  });
  const customer = await prisma.customer.create({
    data: { userId: user.id, name: input.name, email: input.email, phone: input.phone, address: input.address, planId: input.planId },
  });
  const token = signToken({ sub: user.id, email: user.email, role: user.role, customerId: customer.id });
  return { token, user: { id: user.id, email: user.email, name: user.name, role: user.role }, customer: { id: customer.id, name: customer.name, planId: customer.planId } };
}

export interface LoginInput { email: string; password: string; }

export async function login(input: LoginInput) {
  const user = await prisma.user.findUnique({ where: { email: input.email }, include: { customer: true } });
  if (!user) throw new ApiAuthError('Invalid email or password', 401);

  const valid = await bcrypt.compare(input.password, user.password);
  if (!valid) throw new ApiAuthError('Invalid email or password', 401);

  const token = signToken({ sub: user.id, email: user.email, role: user.role, customerId: user.customer?.id });
  return {
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    customer: user.customer ? { id: user.customer.id, name: user.customer.name, planId: user.customer.planId } : null,
  };
}

interface TokenPayload { sub: string; email: string; role: string; customerId?: string; }

function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}

export async function authenticate(
  this: FastifyInstance,
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return reply.status(401).send({ error: 'Missing or invalid Authorization header' });
    }
    const token = authHeader.slice(7);
    const payload = verifyToken(token);
    (request as AuthenticatedRequest).user = payload;
  } catch {
    return reply.status(401).send({ error: 'Invalid or expired token' });
  }
}

export interface AuthenticatedRequest extends FastifyRequest {
  user: TokenPayload;
}

export class ApiAuthError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'ApiAuthError';
  }
}
