import { registerHooks } from 'node:module';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const rootDir = dirname(fileURLToPath(import.meta.url));

if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, val) => store.set(key, String(val)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
    key: (idx) => Array.from(store.keys())[idx] ?? null,
    get length() {
      return store.size;
    },
  };
}

function resolveWithExtension(basePath) {
  const candidates = [basePath, `${basePath}.ts`, `${basePath}.tsx`, `${basePath}.js`];
  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return pathToFileURL(candidate).href;
    }
  }
  return null;
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('@/')) {
      const target = resolve(rootDir, specifier.slice(2));
      const resolvedUrl = resolveWithExtension(target);
      if (resolvedUrl) {
        return { url: resolvedUrl, shortCircuit: true };
      }
    }
    if (specifier.startsWith('.') && context.parentURL?.startsWith('file://')) {
      const parentDir = dirname(fileURLToPath(context.parentURL));
      const target = resolve(parentDir, specifier);
      const resolvedUrl = resolveWithExtension(target);
      if (resolvedUrl) {
        return { url: resolvedUrl, shortCircuit: true };
      }
    }
    return nextResolve(specifier, context);
  },
});
