import { createServer } from 'node:http';
import { handleRequest } from './routes.js';

const port = Number(process.env.PORT ?? 8787);

createServer((req, res) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);
  const result = handleRequest(url.pathname);
  res.writeHead(result.status, { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*' });
  res.end(JSON.stringify(result.body));
}).listen(port, () => console.log(`Cronos Launchpad API listening on :${port}`));
