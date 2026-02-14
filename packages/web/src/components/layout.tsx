import React, { type ReactNode } from "react";
import { renderToString } from "react-dom/server";

interface LayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  path?: string;
  jsonLd?: Record<string, unknown>;
}

/* Critical inline CSS — only html/body to prevent FOUC */
const CRITICAL_CSS = `html{background:#0a0a0a;color:#fff;-webkit-font-smoothing:antialiased}body{margin:0;font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}`;

function Nav() {
  return (
    <nav className="fixed top-0 z-50 w-full border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-lg">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <a href="/" className="font-mono text-sm font-bold text-white">
          seclaw
        </a>
        <div className="flex items-center gap-6">
          <a
            href="/templates"
            className="hidden text-sm text-neutral-400 transition hover:text-white sm:block"
          >
            Templates
          </a>
          <a
            href="/docs"
            className="hidden text-sm text-neutral-400 transition hover:text-white sm:block"
          >
            Docs
          </a>
          <a
            href="https://github.com/mksglu/seclawai"
            className="hidden text-sm text-neutral-400 transition hover:text-white sm:block"
            target="_blank"
          >
            GitHub
          </a>
          <span id="nav-auth" />
        </div>
      </div>
    </nav>
  );
}

function Layout({ children, title, description, path, jsonLd }: LayoutProps) {
  const SITE = "https://seclawai.com";
  const pageTitle = title || "seclawai.com — Agentic AI on Your Machine";
  const pageDesc = description || "Deploy secure, autonomous AI agents on your machine in 60 seconds. Multiple agents, one Telegram bot. Docker-isolated, self-hosted.";
  const canonicalUrl = `${SITE}${path || "/"}`;

  return (
    <html lang="en" className="bg-neutral-950 text-white antialiased">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style dangerouslySetInnerHTML={{ __html: CRITICAL_CSS }} />
        <title>{pageTitle}</title>
        <meta name="description" content={pageDesc} />
        <link rel="canonical" href={canonicalUrl} />
        <meta name="robots" content="index, follow" />

        {/* Open Graph */}
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDesc} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:site_name" content="seclawai.com" />
{/*        <meta property="og:image" content={`${SITE}/static/og.png`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" /> */}

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDesc} />
{/*        <meta name="twitter:image" content={`${SITE}/static/og.png`} /> */}

        {/* JSON-LD */}
        {jsonLd && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
        )}

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="preload" href="/static/output.css" as="style" />
        <link rel="stylesheet" href="/static/output.css" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans">
        <Nav />
        {children}

        {/* Hidden mount points for client-side React */}
        <div id="auto-buy-root" />

        <script src="/static/client.js" defer />
      </body>
    </html>
  );
}

export function renderPage(
  content: React.ReactElement,
  props?: { title?: string; description?: string; path?: string; jsonLd?: Record<string, unknown> },
): string {
  const html = renderToString(
    <Layout title={props?.title} description={props?.description} path={props?.path} jsonLd={props?.jsonLd}>
      {content}
    </Layout>,
  );
  return `<!DOCTYPE html>${html}`;
}
