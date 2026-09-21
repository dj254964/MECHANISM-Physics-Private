import express, { Request, Response } from 'express';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';
import { app } from './server/app.ts';
import { CURRENT_MODEL } from './server/gemini.ts';

const PORT = 3000;

// Vite middleware in development vs static serving in production
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`MECHANISM server running on http://0.0.0.0:${PORT} [Model: ${CURRENT_MODEL}]`);
    });
  }
}

// In local dev and standalone Node containers, start the server
if (!process.env.VERCEL) {
  startServer();
}

export { app };
export default app;
