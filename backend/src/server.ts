import { createApp } from './app';
import { connectDatabase, disconnectDatabase } from './config/db';
import { env } from './config/env';

async function main() {
  console.log(`Starting botszam API (${env.NODE_ENV})…`);
  await connectDatabase();

  const app = createApp();
  // Bind all interfaces so Render (and similar hosts) can reach the process on process.env.PORT.
  const server = app.listen(env.PORT, '0.0.0.0', () => {
    console.log('');
    console.log(`  botszam API running on http://localhost:${env.PORT}`);
    console.log(`  Health: http://localhost:${env.PORT}/api/health`);
    console.log(`  Frontend CORS: ${env.FRONTEND_URL}`);
    console.log('');
  });

  const shutdown = (signal: string) => {
    console.log(`${signal} received, shutting down...`);
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
});

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
