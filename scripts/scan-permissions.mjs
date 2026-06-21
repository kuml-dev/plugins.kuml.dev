#!/usr/bin/env node
/**
 * Scan all plugin manifests for unknown or high-risk permissions.
 * Fails (exit 1) if any manifest declares a permission not in the known set.
 *
 * Usage: node scripts/scan-permissions.mjs
 *
 * Keep KNOWN_PERMISSIONS in sync with dev.kuml.plugin.api.core.PluginPermission (V3.0.27).
 */
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

// Must match PluginPermission enum in kuml-plugin-api-core
const KNOWN_PERMISSIONS = new Set([
  'READ_MODEL',
  'WRITE_MODEL',
  'READ_FS',
  'WRITE_FS',
  'NETWORK',
  'EXEC_SUBPROCESS',
  'READ_CONFIG',
  'WRITE_CONFIG',
]);

// Permissions that require a manual review comment in the PR
const HIGH_RISK = new Set(['EXEC_SUBPROCESS', 'WRITE_FS', 'NETWORK']);

const pluginsDir = resolve(process.cwd(), 'public/plugins');
let errors = 0;
let warnings = 0;

for (const entry of readdirSync(pluginsDir).sort()) {
  const dir = join(pluginsDir, entry);
  if (!statSync(dir).isDirectory()) continue;

  const manifestPath = join(dir, 'kuml-plugin.json');
  if (!existsSync(manifestPath)) continue;

  let manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
  } catch (e) {
    console.error(`❌ ${entry} — cannot parse: ${e.message}`);
    errors++;
    continue;
  }

  const permissions = manifest.permissions ?? [];

  if (permissions.length === 0) {
    console.log(`✅ ${manifest.id} — no permissions requested`);
    continue;
  }

  let pluginOk = true;
  for (const perm of permissions) {
    if (!KNOWN_PERMISSIONS.has(perm)) {
      console.error(`❌ ${manifest.id} — UNKNOWN permission: "${perm}" (not in PluginPermission enum)`);
      errors++;
      pluginOk = false;
    } else if (HIGH_RISK.has(perm)) {
      console.warn(`⚠️  ${manifest.id} — HIGH-RISK permission: "${perm}" — manual review required`);
      warnings++;
    }
  }

  if (pluginOk) {
    console.log(`✅ ${manifest.id} — permissions: [${permissions.join(', ')}]`);
  }
}

if (errors > 0) {
  console.error(`\n❌ Permission scan FAILED — ${errors} error(s), ${warnings} warning(s)`);
  process.exit(1);
} else {
  console.log(`\n✅ Permission scan PASSED — ${warnings} high-risk permission(s) require manual review`);
  process.exit(0);
}
