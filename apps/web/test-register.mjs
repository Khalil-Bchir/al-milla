import { registerHooks } from 'node:module';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const rootDir = dirname(fileURLToPath(import.meta.url));

const memoryStore = new Map();
const mockStorage = {
  getItem: (key) => memoryStore.get(key) ?? null,
  setItem: (key, val) => memoryStore.set(key, String(val)),
  removeItem: (key) => memoryStore.delete(key),
  clear: () => memoryStore.clear(),
  key: (idx) => Array.from(memoryStore.keys())[idx] ?? null,
  get length() {
    return memoryStore.size;
  },
};

Object.defineProperty(globalThis, 'localStorage', {
  value: mockStorage,
  configurable: true,
  writable: true,
});

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
