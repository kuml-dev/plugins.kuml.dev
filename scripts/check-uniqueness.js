#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const VALID_CATEGORIES = new Set(['theme', 'renderer', 'layout', 'codegen', 'reverse']);
const REQUIRED_FIELDS = ['id', 'category', 'name', 'version', 'manifest', 'downloads'];

const indexPath = path.resolve(__dirname, '../public/plugins/index.json');
const publicDir = path.resolve(__dirname, '../public');

let hasErrors = false;

function error(msg) {
  console.error(`[ERROR] ${msg}`);
  hasErrors = true;
}

function ok(msg) {
  console.log(`[OK]    ${msg}`);
}

// 1. Load index.json
let registry;
try {
  const raw = fs.readFileSync(indexPath, 'utf-8');
  registry = JSON.parse(raw);
} catch (e) {
  error(`Cannot read/parse ${indexPath}: ${e.message}`);
  process.exit(1);
}

const plugins = registry.plugins;
if (!Array.isArray(plugins)) {
  error('registry.plugins is not an array');
  process.exit(1);
}

ok(`Loaded index.json — ${plugins.length} plugin(s) found`);

// 2. Check for duplicate IDs
const seenIds = new Set();
for (const plugin of plugins) {
  if (seenIds.has(plugin.id)) {
    error(`Duplicate plugin ID: "${plugin.id}"`);
  } else {
    seenIds.add(plugin.id);
  }
}
if (seenIds.size === plugins.length) {
  ok('All plugin IDs are unique');
}

// 3. Check required fields and category validity
for (const plugin of plugins) {
  for (const field of REQUIRED_FIELDS) {
    if (plugin[field] === undefined || plugin[field] === null || plugin[field] === '') {
      error(`Plugin "${plugin.id}" is missing required field: "${field}"`);
    }
  }

  if (!VALID_CATEGORIES.has(plugin.category)) {
    error(`Plugin "${plugin.id}" has invalid category: "${plugin.category}" (must be one of: ${[...VALID_CATEGORIES].join(', ')})`);
  } else {
    ok(`Plugin "${plugin.id}" — category "${plugin.category}" is valid`);
  }
}

// 4. Check that referenced manifest paths exist in public/
for (const plugin of plugins) {
  if (!plugin.manifest) continue;
  const manifestPath = path.resolve(publicDir, plugin.manifest);
  if (!fs.existsSync(manifestPath)) {
    error(`Plugin "${plugin.id}" — manifest file not found: public/${plugin.manifest}`);
  } else {
    ok(`Plugin "${plugin.id}" — manifest exists at public/${plugin.manifest}`);
  }
}

// Result
if (hasErrors) {
  console.error('\nRegistry check FAILED. Fix the errors above before merging.');
  process.exit(1);
} else {
  console.log('\nRegistry check PASSED.');
  process.exit(0);
}
