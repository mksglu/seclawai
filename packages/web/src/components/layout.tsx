import React, { type ReactNode } from "react";
import { renderToString } from "react-dom/server";

interface LayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

function Layout({ children, title, description }: LayoutProps) {
  return (
    <html lang="en" className="bg-neutral-950 text-white antialiased">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
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
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <link rel="stylesheet" href="/static/output.css" />
      </head>
      <body className="font-sans">
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
