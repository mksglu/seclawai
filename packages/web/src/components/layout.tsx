import React, { type ReactNode } from "react";
import { renderToString } from "react-dom/server";

interface LayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
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

function Layout({ children, title, description }: LayoutProps) {
  return (
    <html lang="en" className="bg-neutral-950 text-white antialiased">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style dangerouslySetInnerHTML={{ __html: CRITICAL_CSS }} />
        <title>{title || "seclaw — Agentic AI on Your Machine"}</title>
        <meta
          name="description"
          content={description || "RIP OpenClaw. Deploy secure, autonomous AI agents on your machine in 60 seconds. Multiple agents, one Telegram bot. Docker-isolated, self-hosted, agentic by design."}
        />
        <meta property="og:title" content={title || "seclaw — Agentic AI on Your Machine"} />
        <meta
          property="og:description"
          content={description || "RIP OpenClaw. Secure autonomous AI agents with Docker isolation and hard guardrails. 17 templates, Auto Mode, 60-second setup."}
        />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
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
  props?: { title?: string; description?: string },
): string {
  const html = renderToString(
    <Layout title={props?.title} description={props?.description}>
      {content}
    </Layout>,
  );
  return `<!DOCTYPE html>${html}`;
}
