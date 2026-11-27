#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const packRoots = [
  path.join(root, "packs", "behavior_pack"),
  path.join(root, "packs", "resource_pack"),
];
const errors = [];
const warnings = [];
const manifests = [];
const allJson = [];
const allScripts = [];

async function walk(dir) {
  let entries;
  try { entries = await fs.readdir(dir, { withFileTypes: true }); }
  catch (error) {
    if (error.code === "ENOENT") return;
    throw error;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full);
    else if (entry.isFile()) {
      if (entry.name.endsWith(".json")) allJson.push(full);
      if (/\.(mjs|cjs|js)$/.test(entry.name)) allScripts.push(full);
      if (entry.name === "manifest.json") manifests.push(full);
    }
  }
}

for (const dir of packRoots) await walk(dir);

if (allJson.length === 0 && manifests.length === 0) {
  console.log("No pack source files found yet; static validation infrastructure is ready.");
  if (!process.argv.includes("--allow-empty")) {
    errors.push("No pack source files found. Use --allow-empty only during the documentation phase.");
  }
}

for (const file of allJson) {
  try { JSON.parse(await fs.readFile(file, "utf8")); }
  catch (error) { errors.push(`Invalid JSON: ${path.relative(root, file)}: ${error.message}`); }
}

const seenUuids = new Map();
const packHeaderUuids = new Set();
const manifestByUuid = new Map();

for (const file of manifests) {
  let data;
  try { data = JSON.parse(await fs.readFile(file, "utf8")); }
  catch { continue; }
  const rel = path.relative(root, file);
  if (!data.format_version || !data.header || !data.modules) {
    errors.push(`Manifest missing format_version/header/modules: ${rel}`);
    continue;
  }
  const headerUuid = data.header.uuid;
  if (!isUuid(headerUuid)) errors.push(`Invalid header UUID: ${rel}`);
  else manifestByUuid.set(headerUuid, { file, rel, data });
  else {
    if (packHeaderUuids.has(headerUuid)) errors.push(`Duplicate pack header UUID: ${headerUuid}`);
    packHeaderUuids.add(headerUuid);
  }
  for (const [index, module] of data.modules.entries()) {
    if (!isUuid(module.uuid)) errors.push(`Invalid module UUID at modules[${index}]: ${rel}`);
    else registerUuid(module.uuid, `${rel} modules[${index}]`);
    if (!module.type) errors.push(`Missing module type at modules[${index}]: ${rel}`);
  }
  if (headerUuid) registerUuid(headerUuid, `${rel} header`);
  for (const dependency of data.dependencies ?? []) {
    if (dependency.uuid && !isUuid(dependency.uuid)) {
      errors.push(`Invalid dependency UUID in ${rel}: ${dependency.uuid}`);
    } else if (dependency.uuid && !manifestByUuid.has(dependency.uuid)) {
      // Pack dependencies can be declared before their target manifest is visited.
      // Resolve all UUID references in a second pass below.
    }
    if (dependency.module_name && !dependency.version) {
      errors.push(`Module dependency has no version in ${rel}: ${dependency.module_name}`);
    }
  }
  for (const module of data.modules) {
    if (module.type === "script") {
      if (typeof module.entry !== "string" || !module.entry.endsWith(".js")) {
        errors.push(`Script module must declare a .js entry point: ${rel}`);
      } else {
        const packRoot = path.dirname(file);
        try { await fs.access(path.join(packRoot, module.entry)); }
        catch { errors.push(`Missing script entry ${module.entry}: ${rel}`); }
      }
      if (module.language !== "javascript") errors.push(`Script module language must be javascript: ${rel}`);
    }
  }
  if (data.header.min_engine_version && !Array.isArray(data.header.min_engine_version)) {
    errors.push(`min_engine_version must be an array in ${rel}`);
  }
}

function isUuid(value) {
  return typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function registerUuid(uuid, source) {
  const prior = seenUuids.get(uuid);
  if (prior) errors.push(`Duplicate UUID ${uuid}: ${prior} and ${source}`);
  else seenUuids.set(uuid, source);
}

for (const file of manifests) {
  let data;
  try { data = JSON.parse(await fs.readFile(file, "utf8")); } catch { continue; }
  for (const dependency of data.dependencies ?? []) {
    if (dependency.uuid && isUuid(dependency.uuid) && !manifestByUuid.has(dependency.uuid)) {
      errors.push(`Unresolved pack dependency UUID in ${path.relative(root, file)}: ${dependency.uuid}`);
    }
  }
}

for (const dir of packRoots) {
  const manifestPath = path.join(dir, "manifest.json");
  try { await fs.access(manifestPath); }
  catch { errors.push(`Missing root manifest: ${path.relative(root, manifestPath)}`); }
}

console.log(`JSON files checked: ${allJson.length}`);
console.log(`Manifest files checked: ${manifests.length}`);
console.log(`JavaScript files discovered: ${allScripts.length}`);
for (const warning of warnings) console.warn(`WARNING: ${warning}`);
for (const error of errors) console.error(`ERROR: ${error}`);
if (errors.length) process.exit(1);
console.log("Static pack validation passed. This does not replace in-game testing.");
