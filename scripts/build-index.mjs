#!/usr/bin/env node
/**
 * Regenerate public/plugins/index.json from all public/plugins/<id>/kuml-plugin.json files.
 *
 * The index preserves any extra fields that exist in the current index.json
 * (e.g. homepage, signaturePublicKey, downloads) from the individual manifests
 * plus the registry-level metadata.
 *
 * Usage: node scripts/build-index.mjs
 */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const publicDir = resolve(process.cwd(), 'public');
const pluginsDir = join(publicDir, 'plugins');
const indexPath = join(pluginsDir, 'index.json');

const baseUrl = 'https://plugins.kuml.dev';

// Load existing index to carry over fields not in individual manifests
let existingById = {};
if (existsSync(indexPath)) {
  try {
    const existing = JSON.parse(readFileSync(indexPath, 'utf-8'));
    for (const p of existing.plugins ?? []) {
      existingById[p.id] = p;
    }
  } catch {
    // will rebuild from scratch
  }
}

const plugins = [];

for (const entry of readdirSync(pluginsDir).sort()) {
  const dir = join(pluginsDir, entry);
  if (!statSync(dir).isDirectory()) continue;

  const manifestPath = join(dir, 'kuml-plugin.json');
  if (!existsSync(manifestPath)) continue;

  let manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
  } catch (e) {
    console.error(`❌ Skipping ${entry} — cannot parse manifest: ${e.message}`);
    continue;
  }

  // Derive category from extensions[0] if not in existing index
  const category = manifest.extensions?.[0]?.category
    ?? existingById[manifest.id]?.category
    ?? 'unknown';

  const existingEntry = existingById[manifest.id] ?? {};

  plugins.push({
    id: manifest.id,
    category,
    name: manifest.name,
    version: manifest.version,
    kumlVersionRange: manifest.kumlVersionRange,
    manifest: `plugins/${entry}/kuml-plugin.json`,
    downloads: existingEntry.downloads ?? `plugins/${entry}/releases/`,
    signaturePublicKey: existingEntry.signaturePublicKey ?? null,
    licenseSpdx: manifest.licenseSpdx,
    maintainer: manifest.maintainer,
    homepage: manifest.homepage ?? existingEntry.homepage ?? null,
  });

  console.log(`✅ ${manifest.id} (${category}) v${manifest.version}`);
}

const index = {
  schemaVersion: 1,
  baseUrl,
  plugins,
};

writeFileSync(indexPath, JSON.stringify(index, null, 2) + '\n');
console.log(`\n✅ index.json rebuilt — ${plugins.length} plugin(s)`);
