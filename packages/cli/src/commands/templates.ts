import { resolve } from "node:path";
import { existsSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import * as p from "@clack/prompts";
import pc from "picocolors";

interface Manifest {
  id: string;
  name: string;
  description: string;
  price: number;
  tier: string;
  hook: string;
}

// Catalog of all templates — used as fallback when manifests are not on disk
const TEMPLATES: Manifest[] = [
  { id: "productivity-agent", name: "Productivity Agent", price: 0, tier: "free", description: "Personal assistant — task management, daily reports, email drafting, file organization", hook: "npx seclaw add productivity-agent" },
  { id: "data-analyst", name: "Data Analyst", price: 0, tier: "free", description: "Privacy-first local data analysis — drop CSV/JSON files, ask questions, get Python-powered insights", hook: "npx seclaw add data-analyst" },
  { id: "inbox-agent", name: "Inbox Agent", price: 19, tier: "paid", description: "AI inbox manager that categorizes, summarizes, and triages your email", hook: "3 urgent, 5 action needed, 12 FYI, 8 newsletter" },
  { id: "reddit-hn-digest", name: "Reddit & HN Digest", price: 19, tier: "paid", description: "Daily curated digest from Reddit and Hacker News", hook: "Never miss what matters on Reddit and HN" },
  { id: "youtube-digest", name: "YouTube Digest", price: 19, tier: "paid", description: "Morning summary of new videos from favorite channels", hook: "Your YouTube feed, distilled to what matters" },
  { id: "health-tracker", name: "Health Tracker", price: 29, tier: "paid", description: "Food & symptom tracking with weekly correlation analysis", hook: "Understand what your body is telling you" },
  { id: "earnings-tracker", name: "Earnings Tracker", price: 29, tier: "paid", description: "Tech/AI earnings reports with beat/miss analysis", hook: "Every earnings call, analyzed in minutes" },
  { id: "research-agent", name: "Research Agent", price: 39, tier: "paid", description: "AI research analyst that monitors competitors, trends, and industry news", hook: "Know when competitors change anything -- in 5 minutes" },
  { id: "knowledge-base", name: "Knowledge Base", price: 39, tier: "paid", description: "Personal knowledge management from URLs, articles, tweets", hook: "Your second brain, always organized" },
  { id: "family-calendar", name: "Family Calendar", price: 39, tier: "paid", description: "Household coordination with calendar aggregation", hook: "Everyone in sync, nothing forgotten" },
  { id: "content-agent", name: "Content Agent", price: 49, tier: "paid", description: "AI content strategist that researches trends, drafts posts in your voice, and tracks engagement", hook: "Your X account grows while you sleep" },
  { id: "personal-crm", name: "Personal CRM", price: 49, tier: "paid", description: "Contact management with auto-discovery from email", hook: "Never lose touch with anyone important" },
  { id: "youtube-creator", name: "YouTube Creator", price: 69, tier: "paid", description: "Content pipeline for YouTube creators", hook: "From idea to upload, fully assisted" },
  { id: "devops-agent", name: "DevOps Agent", price: 79, tier: "paid", description: "Infrastructure monitoring + self-healing", hook: "Sleep through incidents, wake up to fixes" },
  { id: "customer-service", name: "Customer Service", price: 79, tier: "paid", description: "Multi-channel customer support with knowledge base", hook: "24/7 support without the headcount" },
  { id: "sales-agent", name: "Sales Agent", price: 79, tier: "paid", description: "AI-powered B2B sales development representative", hook: "Find leads overnight, inbox full by morning" },
  { id: "six-agent-company", name: "Six Agent Company", price: 149, tier: "paid", description: "6 AI agents running your company: CEO, Engineer, QA, Data, Marketing, Growth", hook: "6 AI agents running your company for $8/month" },
];

export async function templates() {
  p.intro(`${pc.bgCyan(pc.black(" seclaw "))} Available Templates`);

  const all = await loadManifests();

  if (all.length === 0) {
    p.log.warn("No templates found. Try updating: npm i -g seclaw");
    return;
  }

  const free = all.filter((t) => t.tier === "free");
  const paid = all.filter((t) => t.tier === "paid");

  if (free.length > 0) {
    p.log.info(pc.bold("Free"));
    for (const t of free) {
      p.log.message(
        `  ${pc.green(t.id)}\n` +
        `  ${t.description}\n` +
        `  ${pc.dim(t.hook)}`
      );
    }
  }

  if (paid.length > 0) {
    p.log.info(pc.bold("Paid"));
    for (const t of paid) {
      p.log.message(
        `  ${pc.yellow(t.id)} ${pc.dim(`$${t.price}`)}\n` +
        `  ${t.description}\n` +
        `  ${pc.dim(t.hook)}`
      );
    }
  }

  p.log.info("");
  p.log.info(pc.bold("Usage:"));
  p.log.message(`  ${pc.cyan("npx seclaw add productivity-agent")}          ${pc.dim("free")}`);
  p.log.message(`  ${pc.cyan("npx seclaw add content-agent --key KEY")}     ${pc.dim("paid")}`);

  p.outro(`${pc.dim("Browse:")} https://seclawai.com/templates`);
}

async function loadManifests(): Promise<Manifest[]> {
  const manifests: Manifest[] = [];
  const seen = new Set<string>();

  // Bundled (npm package) paths + local dev paths
  const searchRoots = [
    resolve(import.meta.dirname, "templates"),
    resolve(process.cwd(), "packages", "cli", "templates"),
  ];

  for (const root of searchRoots) {
    for (const tier of ["free", "paid"]) {
      const base = resolve(root, tier);
      if (!existsSync(base)) continue;
      let entries;
      try { entries = await readdir(base, { withFileTypes: true }); } catch { continue; }
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        if (seen.has(entry.name)) continue;
        const manifestPath = resolve(base, entry.name, "manifest.json");
        if (!existsSync(manifestPath)) continue;
        try {
          const raw = await readFile(manifestPath, "utf-8");
          manifests.push(JSON.parse(raw));
          seen.add(entry.name);
        } catch {
          // skip malformed manifests
        }
      }
    }
  }

  // Merge catalog entries that were not found on disk
  for (const t of TEMPLATES) {
    if (!seen.has(t.id)) {
      manifests.push(t);
      seen.add(t.id);
    }
  }

  // Sort: free first, then by price ascending
  manifests.sort((a, b) => a.price - b.price);
  return manifests;
}
