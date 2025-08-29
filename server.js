import { serve } from 'bun';
import { readFileSync } from 'fs';
import { join } from 'path';

const PORT = 3000;
const PUBLIC_DIR = import.meta.dir; // Current directory where server.js is located

serve({
  port: PORT,
  fetch(request) {
    const url = new URL(request.url);
    let filePath = join(PUBLIC_DIR, url.pathname);

    // Serve index.html for the root path
    if (url.pathname === '/') {
      filePath = join(PUBLIC_DIR, 'index.html');
    }

    // Determine content type
    let contentType = 'text/plain';
    if (filePath.endsWith('.html')) {
      contentType = 'text/html';
    } else if (filePath.endsWith('.js')) {
      contentType = 'text/javascript';
    } else if (filePath.endsWith('.css')) {
      contentType = 'text/css';
    } else if (filePath.endsWith('.wav')) {
      contentType = 'audio/wav';
    } else if (filePath.endsWith('.mp3')) {
      contentType = 'audio/mpeg';
    } else if (filePath.endsWith('.png')) {
      contentType = 'image/png';
    } else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
      contentType = 'image/jpeg';
    }

    try {
      const file = readFileSync(filePath);
      return new Response(file, {
        headers: {
          'Content-Type': contentType,
        },
      });
    } catch (e) {
      console.error(`Error serving ${filePath}:`, e);
      return new Response('Not Found', { status: 404 });
    }
  },
  error(error) {
    console.error('Server error:', error);
    return new Response('<pre>Server Error</pre>', { status: 500 });
  },
});

console.log(`Bun server listening on http://localhost:${PORT}`);
console.log(`Serving files from: ${PUBLIC_DIR}`);
