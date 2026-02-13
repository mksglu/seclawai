import React, { type ReactNode } from "react";
import { renderToString } from "react-dom/server";

interface LayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

/* Critical inline CSS — prevents FOUC by styling the page before external CSS loads */
const CRITICAL_CSS = `
html{background:#0a0a0a;color:#fff;-webkit-font-smoothing:antialiased}
body{margin:0;font-family:Inter,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif}
nav{position:fixed;top:0;z-index:50;width:100%;border-bottom:1px solid #262626;background:rgba(10,10,10,.8);-webkit-backdrop-filter:blur(16px);backdrop-filter:blur(16px)}
nav>div{max-width:72rem;margin:0 auto;display:flex;align-items:center;justify-content:space-between;padding:.875rem 1.5rem}
nav a{color:#a3a3a3;font-size:.875rem;text-decoration:none}
nav a:first-child{color:#fff;font-weight:700;font-family:JetBrains Mono,ui-monospace,monospace}
`.trim();

function Nav() {
  return (
    <nav>
      <div>
        <a href="/">seclaw</a>
        <div className="flex items-center gap-6">
          <a
            href="/templates"
            className="hidden sm:block"
          >
            Templates
          </a>
          <a
            href="/docs"
            className="hidden sm:block"
          >
            Docs
          </a>
          <a
            href="https://github.com/mksglu/seclawai"
            className="hidden sm:block"
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
        <title>{title || "seclaw — Secure AI Agents in 60 Seconds"}</title>
        <meta
          name="description"
          content={description || "The OpenClaw alternative that doesn't compromise your security. Autonomous AI agents with Docker isolation, hard guardrails, and 60-second setup."}
        />
        <meta property="og:title" content={title || "seclaw — Secure AI Agents in 60s"} />
        <meta
          property="og:description"
          content={description || "RIP OpenClaw. Secure autonomous AI agents with hard guardrails. Setup in 60 seconds."}
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
