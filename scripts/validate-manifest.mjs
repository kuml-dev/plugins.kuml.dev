#!/usr/bin/env node
/**
 * Validate one or more kuml-plugin.json manifests against the v1 JSON Schema.
 *
 * Usage:
 *   node scripts/validate-manifest.mjs public/plugins/dev.kuml.plugin.theme.pdv/kuml-plugin.json
 *   node scripts/validate-manifest.mjs "public/plugins/<id>/kuml-plugin.json"
 *   (shell glob: public/plugins/*\/kuml-plugin.json)
 */
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const schemaPath = resolve(process.cwd(), 'schema/v1/kuml-plugin.schema.json');
const schema = JSON.parse(readFileSync(schemaPath, 'utf-8'));

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
const validate = ajv.compile(schema);

// Accept glob-expanded paths from shell or direct paths
const targets = process.argv.slice(2);
if (targets.length === 0) {
  console.error('Usage: node scripts/validate-manifest.mjs <path/to/kuml-plugin.json> ...');
  process.exit(1);
}

let errors = 0;

for (const target of targets) {
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(resolve(process.cwd(), target), 'utf-8'));
  } catch (e) {
    console.error(`❌ ${target} — cannot read/parse: ${e.message}`);
    errors++;
    continue;
  }

  if (validate(manifest)) {
    console.log(`✅ ${target}`);
  } else {
    console.error(`❌ ${target}`);
    for (const err of validate.errors ?? []) {
      console.error(`   ${err.instancePath || '(root)'} ${err.message}`);
    }
    errors++;
  }
}

process.exit(errors > 0 ? 1 : 0);
