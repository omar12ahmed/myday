// Bundles a TypeScript entry (ai-eval/run.ts, ai-eval/kit.ts) for Node with Vite, from the app's own source, so the
// evaluation and the tests use exactly the code the app runs. Vite comes from the app's packages (app/node_modules).
//   node ai-eval/build.mjs <entry.ts> <out-dir>      →  <out-dir>/<entry>.mjs
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const appDir = path.join(here, '..', 'app');

export async function bundle(entry, outDir) {
  const vitePath = createRequire(path.join(appDir, 'package.json')).resolve('vite');
  const { build } = await import(pathToFileURL(vitePath).href);
  await build({
    configFile: false,
    root: appDir,
    logLevel: 'warn',
    define: { 'import.meta.env.VITE_AI': '""' },
    ssr: { noExternal: true },
    build: {
      ssr: path.resolve(entry),
      outDir: path.resolve(outDir),
      emptyOutDir: true,
      target: 'node22',
      minify: false,
      rollupOptions: { output: { format: 'esm', entryFileNames: '[name].mjs' } },
    },
  });
  return path.join(path.resolve(outDir), path.basename(entry).replace(/\.ts$/, '.mjs'));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const [entry, outDir] = process.argv.slice(2);
  if (!entry || !outDir) { console.log('Usage: node ai-eval/build.mjs <entry.ts> <out-dir>'); process.exit(2); }
  console.log(await bundle(entry, outDir));
}
