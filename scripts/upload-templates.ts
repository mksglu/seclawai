#!/usr/bin/env npx tsx

/**
 * Upload paid templates to Cloudflare R2.
 *
 * Reads every directory under packages/cli/templates/paid/,
 * bundles the files into a single JSON object, writes a temp file,
 * and uploads it to the seclaw-templates R2 bucket via wrangler CLI.
 *
 * Usage:
 *   npx tsx scripts/upload-templates.ts              # local (miniflare)
 *   npx tsx scripts/upload-templates.ts --production  # production R2
 */

import { readdirSync, readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { join, resolve, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, "..");
const PAID_DIR = join(ROOT, "packages", "cli", "templates", "paid");
const API_DIR = join(ROOT, "packages", "api");
const BUCKET = "seclaw-templates";

const isProduction = process.argv.includes("--production");

// Binary extensions to skip
const BINARY_EXTS = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".ico",
  ".woff", ".woff2", ".ttf", ".eot",
  ".zip", ".tar", ".gz", ".bz2",
  ".pdf", ".mp3", ".mp4", ".mov", ".avi",
  ".exe", ".dll", ".so", ".dylib",
]);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isBinary(filePath: string): boolean {
  return BINARY_EXTS.has(extname(filePath).toLowerCase());
}

/**
 * Recursively collect all files in a directory, returning paths relative
 * to the directory root.
 */
function collectFiles(dir: string, base: string = ""): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const relative = base ? `${base}/${entry.name}` : entry.name;
    const full = join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...collectFiles(full, relative));
    } else if (entry.isFile()) {
      files.push(relative);
    }
  }

  return files;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

console.log(`\nMode: ${isProduction ? "PRODUCTION" : "LOCAL (miniflare)"}`);
console.log(`Paid templates dir: ${PAID_DIR}\n`);

const templateDirs = readdirSync(PAID_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();

if (templateDirs.length === 0) {
  console.log("No template directories found. Nothing to upload.");
  process.exit(0);
}

console.log(`Found ${templateDirs.length} template(s):\n`);

let totalUploaded = 0;

for (const templateId of templateDirs) {
  const templateDir = join(PAID_DIR, templateId);
  const allFiles = collectFiles(templateDir);

  // Build the bundle
  const bundle: Record<string, string> = {};
  let skippedBinary = 0;

  for (const relPath of allFiles) {
    const fullPath = join(templateDir, relPath);

    if (isBinary(fullPath)) {
      skippedBinary++;
      continue;
    }

    bundle[relPath] = readFileSync(fullPath, "utf-8");
  }

  const json = JSON.stringify(bundle, null, 2);
  const byteSize = Buffer.byteLength(json, "utf-8");
  const fileCount = Object.keys(bundle).length;

  // Write temp file
  const tmpPath = join(API_DIR, `.tmp-template-${templateId}.json`);
  writeFileSync(tmpPath, json, "utf-8");

  // Upload via wrangler
  const r2Key = `templates/${templateId}.json`;
  const localFlag = isProduction ? "" : " --local";
  const cmd = `npx wrangler r2 object put "${BUCKET}/${r2Key}" --file="${tmpPath}" --content-type="application/json"${localFlag}`;

  try {
    execSync(cmd, { cwd: API_DIR, stdio: "pipe" });

    const sizeKB = (byteSize / 1024).toFixed(1);
    console.log(
      `  ${templateId}` +
        `  |  ${fileCount} file(s)` +
        `  |  ${sizeKB} KB` +
        (skippedBinary > 0 ? `  |  ${skippedBinary} binary skipped` : "")
    );

    totalUploaded++;
  } catch (err: any) {
    console.error(`  FAILED: ${templateId}`);
    console.error(`    ${err.stderr?.toString().trim() || err.message}`);
  } finally {
    // Clean up temp file
    try {
      unlinkSync(tmpPath);
    } catch {
      // ignore
    }
  }
}

console.log(`\nDone. ${totalUploaded}/${templateDirs.length} template(s) uploaded to R2.\n`);
