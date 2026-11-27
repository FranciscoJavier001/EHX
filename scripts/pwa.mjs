import { createHash } from 'node:crypto'
import { readdir, readFile, writeFile } from 'node:fs/promises'

const paths = (await readdir('dist', { recursive: true, withFileTypes: true }))
  .filter(entry => entry.isFile() && entry.name !== 'sw.js')
  .map(entry => entry.parentPath.replace(/^dist/, '.') + '/' + entry.name).sort()
const hash = createHash('sha256')
hash.update(await readFile(new URL(import.meta.url)))
for (const path of paths) hash.update(await readFile('dist/' + path))
await writeFile('dist/sw.js', `
const assets = ${JSON.stringify(paths)};
const cacheName = 'ehx-shell-' + '${hash.digest('hex').slice(0, 16)}';
self.addEventListener('install', event => event.waitUntil(caches.open(cacheName).then(cache => cache.addAll(assets))));
self.addEventListener('message', event => { if (event.data === 'ACTIVATE') event.waitUntil(self.skipWaiting()); });
self.addEventListener('activate', event => event.waitUntil((async () => {
  for (const name of await caches.keys()) if (name.startsWith('ehx-shell-') && name !== cacheName) await caches.delete(name);
  await self.clients.claim();
})()));
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || !url.href.startsWith(self.registration.scope)) return;
  event.respondWith((async () => {
    const cache = await caches.open(cacheName);
    return await cache.match(event.request.mode === 'navigate' ? './index.html' : url.href, { ignoreVary: true }) ?? fetch(event.request);
  })());
});
`)
