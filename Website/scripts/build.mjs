import { mkdir, cp, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const project = fileURLToPath(new URL('../', import.meta.url));
const output = resolve(project, 'dist');
await mkdir(output, { recursive: true });
await cp(resolve(project, 'src'), resolve(output, 'src'), { recursive: true });
await cp(resolve(project, 'public'), output, { recursive: true });
await writeFile(resolve(output, 'index.html'), await readFile(resolve(project, 'index.html')));
console.log('ModelWing API built successfully → dist/');
console.log('Deploy dist/ to any static host, or run npm run preview.');
