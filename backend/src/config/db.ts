import mongoose from 'mongoose';
import { env } from './env';

mongoose.set('strictQuery', true);

function describeMongoTarget(uri: string): string {
  try {
    const parsed = new URL(uri.replace('mongodb+srv://', 'https://').replace('mongodb://', 'http://'));
    const host = parsed.hostname || 'unknown-host';
    const db = parsed.pathname.replace(/^\//, '') || '(default)';
    if (uri.includes('mongodb+srv://')) return `MongoDB Atlas · ${host} · db ${db}`;
    return `MongoDB · ${host}${parsed.port ? `:${parsed.port}` : ''} · db ${db}`;
  } catch {
    return 'MongoDB';
  }
}

export async function connectDatabase(): Promise<typeof mongoose> {
  const connection = await mongoose.connect(env.MONGODB_URI, {
    serverSelectionTimeoutMS: 10_000,
  });
  const name = connection.connection.name || 'unknown';
  console.log(`Connected to MongoDB (${name}) — ${describeMongoTarget(env.MONGODB_URI)}`);
  return connection;
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}

export function isDatabaseConnected(): boolean {
  return mongoose.connection.readyState === 1;
}
