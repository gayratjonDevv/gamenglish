import { createReadStream } from 'node:fs';
import { realpath, stat } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';
import type { Plugin } from 'vite';
/** Development only: serve the ignored staging directory, never bundle multi-GB assets. */
export function devAssets(): Plugin {
  return {
    name: 'local-asset-staging',
    apply: 'serve',
    configureServer(server) {
      const root = resolve(import.meta.dirname, '../../asset-source');
      server.middlewares.use('/assets', async (req, res, next) => {
        try {
          if (req.method !== 'GET' && req.method !== 'HEAD') {
            next();
            return;
          }
          const path = decodeURIComponent((req.url ?? '').split('?')[0]!);
          if (!/^\/[a-zA-Z0-9_./-]+$/.test(path)) {
            res.statusCode = 400;
            res.end();
            return;
          }
          const file = await realpath(resolve(root, '.' + path));
          if (!file.startsWith(root + sep)) {
            res.statusCode = 403;
            res.end();
            return;
          }
          const info = await stat(file);
          if (!info.isFile()) {
            next();
            return;
          }
          const mime: Record<string, string> = {
            '.glb': 'model/gltf-binary',
            '.mp3': 'audio/mpeg',
            '.ogg': 'audio/ogg',
            '.m4a': 'audio/mp4',
          };
          res.setHeader('Content-Type', mime[extname(file)] ?? 'application/octet-stream');
          res.setHeader('Accept-Ranges', 'bytes');
          res.setHeader('Cache-Control', 'no-cache');
          const range = req.headers.range;
          let start = 0,
            end = info.size - 1;
          if (range) {
            const match = /^bytes=(\d+)-(\d*)$/.exec(range);
            if (!match) {
              res.statusCode = 416;
              res.end();
              return;
            }
            start = Number(match[1]);
            end = match[2] ? Number(match[2]) : end;
            if (start > end || start >= info.size || end >= info.size) {
              res.statusCode = 416;
              res.setHeader('Content-Range', `bytes */${info.size}`);
              res.end();
              return;
            }
            res.statusCode = 206;
            res.setHeader('Content-Range', `bytes ${start}-${end}/${info.size}`);
          }
          res.setHeader('Content-Length', end - start + 1);
          if (req.method === 'HEAD') {
            res.end();
            return;
          }
          const stream = createReadStream(file, { start, end });
          stream.on('error', () => res.destroy());
          res.on('close', () => stream.destroy());
          stream.pipe(res);
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            next();
            return;
          }
          res.statusCode = 500;
          res.end('Asset read failed');
        }
      });
    },
  };
}
