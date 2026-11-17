import express, { type Request, type Response } from 'express';
import fs from 'fs';
import helmet from 'helmet';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { env } from './backend/config/env';
import apiRoutes from './backend/routes/apiRoutes';
import { runMigrations } from './database/migrate';
import { seedDatabase } from './database/seed/seedData';

export async function createApp(options?: { attachFrontend?: boolean }) {
  runMigrations();
  seedDatabase();

  const app = express();
  app.set('trust proxy', 1);

  // Security headers (frameguard disabled to support preview iframes)
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      frameguard: false,
    })
  );

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Serve uploaded media assets safely
  if (!fs.existsSync(env.uploadsDir)) {
    fs.mkdirSync(env.uploadsDir, { recursive: true });
  }
  app.use(
    '/uploads',
    express.static(env.uploadsDir, {
      setHeaders: (res) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Cache-Control', 'public, max-age=86400');
      },
    })
  );

  // Mount REST API
  app.use('/api', apiRoutes);

  // 404 for unknown API routes
  app.use('/api', (_req: Request, res: Response) => {
    res.status(404).json({ error: 'API endpoint not found.' });
  });

  if (options?.attachFrontend !== false) {
    if (env.nodeEnv !== 'production') {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } else {
      const distDir = path.resolve(process.cwd(), 'dist');
      app.use(express.static(distDir));
      app.get('*', (_req: Request, res: Response) => {
        res.sendFile(path.join(distDir, 'index.html'));
      });
    }
  }

  return app;
}

const isEntrypoint = process.argv[1] && path.resolve(process.argv[1]).endsWith('server.ts');
if (isEntrypoint) {
  createApp()
    .then((app) => {
      app.listen(env.port, '0.0.0.0', () => {
        console.log(`[Casid Pharma] Server listening on http://localhost:${env.port} (${env.nodeEnv})`);
      });
    })
    .catch((err) => {
      console.error('[Casid Pharma] Fatal startup error:', err);
      process.exit(1);
    });
}
