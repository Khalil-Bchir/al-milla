import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const unifiedPath = path.join(repoRoot, '.env.unified');

const ENVIRONMENTS = ['development', 'staging', 'production'];

function parseUnifiedEnv(content) {
  const sections = {
    common: {},
    development: {},
    staging: {},
    production: {},
  };

  let currentSection = 'common';
  const lines = content.split(/\r?\n/);

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const sectionMatch = trimmed.match(/^\[(common|development|staging|production)\]$/);
    if (sectionMatch) {
      currentSection = sectionMatch[1];
      continue;
    }

    const eqIndex = rawLine.indexOf('=');
    if (eqIndex <= 0) continue;

    const key = rawLine.slice(0, eqIndex).trim();
    const val = rawLine.slice(eqIndex + 1).trim();
    if (!key) continue;

    sections[currentSection][key] = val;
  }

  return sections;
}

function serializeEnv(record, headerComment) {
  const keys = Object.keys(record).sort();
  const lines = [`# ${headerComment}`, '# Generated from .env.unified via scripts/sync-env.mjs', ''];
  for (const key of keys) {
    lines.push(`${key}=${record[key]}`);
  }
  return `${lines.join('\n')}\n`;
}

function pickKeys(source, keys) {
  const out = {};
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      out[key] = source[key];
    }
  }
  return out;
}

function main() {
  if (!fs.existsSync(unifiedPath)) {
    console.error('Missing .env.unified at repo root. Copy .env.unified.example to .env.unified first.');
    process.exit(1);
  }

  const envArg = process.argv.find((arg) => arg.startsWith('--env='));
  const targetArg = envArg ? envArg.slice('--env='.length) : 'all';

  if (targetArg !== 'all' && !ENVIRONMENTS.includes(targetArg)) {
    console.error(`Invalid --env value "${targetArg}". Use development, staging, production, or all.`);
    process.exit(1);
  }

  const parsed = parseUnifiedEnv(fs.readFileSync(unifiedPath, 'utf8'));
  const targetEnvs = targetArg === 'all' ? ENVIRONMENTS : [targetArg];

  for (const envName of targetEnvs) {
    const merged = { ...parsed.common, ...parsed[envName] };
    const rootOutPath = path.join(repoRoot, `.env.${envName}`);
    fs.writeFileSync(
      rootOutPath,
      serializeEnv(merged, `Environment: ${envName} (root / api / database)`),
      'utf8',
    );
    console.log(`Wrote .env.${envName} (${Object.keys(merged).length} keys)`);
  }

  const activeLocalEnv = targetArg === 'all' ? 'development' : targetArg;
  const activeMerged = { ...parsed.common, ...parsed[activeLocalEnv] };

  const webKeys = [
    'NEXT_PUBLIC_API_URL',
    'NEXT_PUBLIC_APP_URL',
    'NEXT_PUBLIC_DEFAULT_THEME',
    'NEXT_PUBLIC_APP_PREFERENCES_STORAGE_KEY',
    'NEXT_PUBLIC_APP_AUTH_STORAGE_KEY',
    'NEXT_PUBLIC_DEFAULT_SIGNUP_ROLE',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ];
  const webEnv = pickKeys(activeMerged, webKeys);
  fs.writeFileSync(
    path.join(repoRoot, 'apps/web/.env.local'),
    serializeEnv(webEnv, `apps/web local (${activeLocalEnv})`),
    'utf8',
  );
  console.log(`Wrote apps/web/.env.local (${Object.keys(webEnv).length} keys, env=${activeLocalEnv})`);

  const landingKeys = ['NEXT_PUBLIC_SITE_URL', 'NEXT_PUBLIC_APP_URL'];
  const landingEnv = pickKeys(activeMerged, landingKeys);
  fs.writeFileSync(
    path.join(repoRoot, 'apps/landing/.env.local'),
    serializeEnv(landingEnv, `apps/landing local (${activeLocalEnv})`),
    'utf8',
  );
  console.log(`Wrote apps/landing/.env.local (${Object.keys(landingEnv).length} keys, env=${activeLocalEnv})`);

  const mobileKeys = ['EXPO_PUBLIC_API_URL'];
  for (const envName of targetEnvs) {
    const merged = { ...parsed.common, ...parsed[envName] };
    const envMobile = pickKeys(merged, mobileKeys);
    fs.writeFileSync(
      path.join(repoRoot, `apps/mobile/.env.${envName}`),
      serializeEnv(envMobile, `apps/mobile ${envName}`),
      'utf8',
    );
  }
  const mobileEnv = pickKeys(activeMerged, mobileKeys);
  fs.writeFileSync(
    path.join(repoRoot, 'apps/mobile/.env.local'),
    serializeEnv(mobileEnv, `apps/mobile local (${activeLocalEnv})`),
    'utf8',
  );
  console.log(`Wrote apps/mobile/.env.local (${Object.keys(mobileEnv).length} keys, env=${activeLocalEnv})`);
}

main();
