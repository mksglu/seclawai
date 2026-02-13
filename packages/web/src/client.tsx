import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider, useQuery, useMutation } from "@tanstack/react-query";
import { authClient } from "./lib/auth-client.js";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./components/ui/dialog.js";
import { Button } from "./components/ui/button.js";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
});

const API = ""; // same-origin — single worker serves both pages and API

// --- Google SVG Icon ---

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

// --- Hooks ---

function useSession() {
  const { data, isPending, error } = authClient.useSession();
  return {
    data: data?.user ? data : null,
    isPending,
    error,
  };
}

interface CheckoutResponse {
  url?: string;
  error?: string;
  dev?: boolean;
  token?: string;
  message?: string;
}

function useCheckout() {
  return useMutation({
    mutationFn: async (templateId: string): Promise<CheckoutResponse> => {
      const res = await fetch(API + "/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ templateId }),
      });
      return res.json();
    },
  });
}

interface TokenSessionResponse {
  token?: string;
  templateId?: string;
  templateName?: string;
  error?: string;
}

function useTokenSession(sessionId: string | null) {
  return useQuery<TokenSessionResponse>({
    queryKey: ["token-session", sessionId],
    queryFn: async () => {
      const res = await fetch(API + "/api/templates/session/" + sessionId);
      return res.json();
    },
    enabled: !!sessionId,
  });
}

// --- Components ---

function AuthModal({
  open,
  onOpenChange,
  templateId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateId: string | null;
}) {
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const callbackURL = templateId
        ? "/templates?buy=" + encodeURIComponent(templateId)
        : "/dashboard";
      await authClient.signIn.social({
        provider: "google",
        callbackURL,
      });
    } catch {
      alert("Failed to connect. Try again.");
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <p className="font-mono text-sm font-bold text-green-400">seclaw</p>
          <DialogTitle className="mt-4">Sign in to continue</DialogTitle>
          <DialogDescription className="mt-2">
            Create an account to purchase templates and manage your token.
          </DialogDescription>
        </DialogHeader>

        <Button
          variant="outline"
          className="mt-8 w-full rounded-xl py-3"
          onClick={handleGoogleSignIn}
          disabled={loading}
        >
          <GoogleIcon />
          {loading ? "Connecting..." : "Continue with Google"}
        </Button>

        <p className="mt-6 text-center text-xs text-neutral-600">
          By continuing, you agree to our Terms of Service.
        </p>
      </DialogContent>
    </Dialog>
  );
}

function BuyButton({ templateId, label }: { templateId: string; label: string }) {
  const session = useSession();
  const checkout = useCheckout();
  const [showModal, setShowModal] = useState(false);

  const handleClick = () => {
    if (session.error) {
      // Auth not available — redirect to detail page
      window.location.href = `/templates/${templateId}`;
      return;
    }
    if (session.data?.user) {
      checkout.mutate(templateId, {
        onSuccess: (data) => {
          if (data.url) window.location.href = data.url;
          else if (data.error?.includes("already own")) alert(data.error);
          else alert(data.error || "Checkout failed");
        },
        onError: () => alert("Network error. Try again."),
      });
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      <Button size="lg" onClick={handleClick} disabled={checkout.isPending}>
        {checkout.isPending ? "Redirecting..." : label}
      </Button>
      <AuthModal
        open={showModal}
        onOpenChange={setShowModal}
        templateId={templateId}
      />
    </>
  );
}

function NavAuth() {
  const session = useSession();
  const [showModal, setShowModal] = useState(false);

  if (session.data?.user) {
    return (
      <a
        href="/dashboard"
        className="rounded-lg bg-green-500 px-4 py-2 text-sm font-semibold text-neutral-950 transition hover:bg-green-400"
      >
        Dashboard
      </a>
    );
  }

  return (
    <>
      <Button size="sm" onClick={() => setShowModal(true)}>
        Login
      </Button>
      <AuthModal
        open={showModal}
        onOpenChange={setShowModal}
        templateId={null}
      />
    </>
  );
}

function TokenDisplay({ sessionId }: { sessionId: string }) {
  const { data } = useTokenSession(sessionId);

  if (!data?.token) {
    return <p className="text-neutral-500">Loading your token...</p>;
  }

  const command = `npx seclaw add ${data.templateId} --key ${data.token}`;

  const copyCommand = () => {
    navigator.clipboard.writeText(command);
  };

  const copyToken = () => {
    navigator.clipboard.writeText(data.token!);
  };

  return (
    <div>
      <p className="text-xs text-neutral-500 mb-2">{data.templateName}</p>
      <div
        className="flex items-center gap-2 cursor-pointer group"
        onClick={copyToken}
      >
        <code className="text-green-400 text-lg select-all">{data.token}</code>
        <span className="text-neutral-600 group-hover:text-green-400 transition text-xs">copy</span>
      </div>
      <p className="mt-2 text-xs text-neutral-600">This token never expires. Use it for all your purchased templates.</p>
      <div
        className="mt-4 flex items-center gap-2 rounded-lg bg-neutral-900 border border-neutral-800 px-4 py-3 cursor-pointer hover:border-neutral-700 transition"
        onClick={copyCommand}
      >
        <code className="text-sm text-neutral-300 flex-1 select-all">{command}</code>
        <button className="shrink-0 text-neutral-500 hover:text-green-400 transition" title="Copy">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function AutoBuy() {
  const session = useSession();
  const checkout = useCheckout();
  const params = new URLSearchParams(window.location.search);
  const buyTemplate = params.get("buy");
  const [triggered, setTriggered] = useState(false);

  useEffect(() => {
    if (buyTemplate && session.data?.user && !triggered) {
      setTriggered(true);
      window.history.replaceState({}, "", "/templates");
      checkout.mutate(buyTemplate, {
        onSuccess: (data) => {
          if (data.url) window.location.href = data.url;
        },
      });
    }
  }, [buyTemplate, session.data, triggered]);

  return null;
}

// --- Dashboard ---

interface OwnedTemplate {
  id: string;
  name: string;
  description: string;
  purchased_at: string;
}

interface MyTokenResponse {
  token: string | null;
  templates: OwnedTemplate[];
}

function useMyToken(enabled: boolean) {
  return useQuery<MyTokenResponse>({
    queryKey: ["my-token"],
    queryFn: async () => {
      const res = await fetch(API + "/api/templates/my-token", {
        credentials: "include",
      });
      return res.json();
    },
    enabled,
  });
}

function DashboardContent() {
  const session = useSession();
  const [tokenVisible, setTokenVisible] = useState(false);
  const myToken = useMyToken(!!session.data?.user);

  if (session.isPending) {
    return <div className="text-center text-neutral-500">Loading...</div>;
  }

  if (!session.data?.user) {
    return (
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-12 text-center">
        <p className="text-neutral-400">Sign in to view your dashboard.</p>
        <a
          href="/"
          className="mt-4 inline-block rounded-lg bg-green-500 px-6 py-2.5 text-sm font-semibold text-neutral-950 transition hover:bg-green-400"
        >
          Go Home
        </a>
      </div>
    );
  }

  const user = session.data.user;
  const token = myToken.data?.token || null;
  const templates = myToken.data?.templates || [];

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleSignOut = () => {
    fetch("/api/auth/sign-out", { method: "POST", credentials: "include" })
      .then(() => { window.location.href = "/"; });
  };

  const handleRegenerate = () => {
    if (!confirm("Regenerate your token? Your old token will stop working.")) return;
    fetch(API + "/api/templates/regenerate", {
      method: "POST",
      credentials: "include",
    })
      .then((r) => r.json() as Promise<{ token?: string; error?: string }>)
      .then((data) => {
        if (data.token) {
          myToken.refetch();
          alert("Token regenerated.");
        } else {
          alert(data.error || "Failed to regenerate.");
        }
      });
  };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Welcome back, {user.name?.split(" ")[0] || "there"}
          </h1>
          <p className="mt-1 text-sm text-neutral-400">{user.email}</p>
        </div>
        <button
          onClick={handleSignOut}
          className="text-xs text-neutral-500 transition hover:text-white"
        >
          Sign out
        </button>
      </div>

      {token && (
        <div className="mb-8 rounded-xl border border-neutral-800 bg-neutral-900/50 p-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-neutral-400">Your Token</p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setTokenVisible(!tokenVisible)}
                className="text-xs text-neutral-500 transition hover:text-white"
              >
                {tokenVisible ? "Hide" : "Reveal"}
              </button>
              <button
                onClick={() => copyText(token)}
                className="text-xs text-neutral-500 transition hover:text-white"
              >
                Copy
              </button>
              <button
                onClick={handleRegenerate}
                className="text-xs text-neutral-500 transition hover:text-white"
              >
                Regenerate
              </button>
            </div>
          </div>
          <code className="block rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 font-mono text-sm text-green-400">
            {tokenVisible ? token : "••••••••••••••••••••••••••••••••"}
          </code>
          <p className="mt-2 text-xs text-neutral-600">
            This token never expires. Use it to download all your purchased templates.
          </p>
        </div>
      )}

      {templates.length === 0 ? (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-12 text-center">
          <p className="text-neutral-400">No templates purchased yet.</p>
          <a
            href="/templates"
            className="mt-4 inline-block rounded-lg bg-green-500 px-6 py-2.5 text-sm font-semibold text-neutral-950 transition hover:bg-green-400"
          >
            Browse Templates
          </a>
        </div>
      ) : (
        <div>
          <h2 className="mb-4 text-sm font-medium text-neutral-400">
            Your Templates ({templates.length})
          </h2>
          <div className="space-y-4">
            {templates.map((t) => (
              <div key={t.id} className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-6">
                <h3 className="text-lg font-semibold text-white">{t.name}</h3>
                <p className="mt-1 text-sm text-neutral-400">{t.description}</p>
                {token && (
                  <div className="mt-4">
                    <p className="mb-1 text-xs text-neutral-500">Install Command</p>
                    <div
                      className="flex items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 cursor-pointer hover:border-neutral-600 transition"
                      onClick={() => copyText(`npx seclaw add ${t.id} --key ${token}`)}
                    >
                      <code className="flex-1 font-mono text-xs text-green-400 select-all">
                        npx seclaw add {t.id} --key {tokenVisible ? token : "YOUR_TOKEN"}
                      </code>
                      <span className="text-xs text-neutral-600">copy</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DashboardNavAuth() {
  const session = useSession();

  if (!session.data?.user) return null;

  const user = session.data.user;
  return (
    <div className="flex items-center gap-3">
      {user.image ? (
        <img
          src={user.image}
          alt=""
          className="h-7 w-7 rounded-full border border-neutral-700"
        />
      ) : (
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-green-500/10 text-xs font-semibold text-green-400">
          {(user.name || "U").charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  );
}

// --- Mount ---

function mountTo(id: string, component: React.ReactElement) {
  const el = document.getElementById(id);
  if (el) {
    createRoot(el).render(
      <QueryClientProvider client={queryClient}>{component}</QueryClientProvider>,
    );
  }
}

// Nav auth
mountTo("nav-auth", <NavAuth />);

// Buy buttons
document.querySelectorAll<HTMLElement>("[data-buy-root]").forEach((el) => {
  const templateId = el.dataset.templateId!;
  const label = el.dataset.buyLabel || "Buy";
  createRoot(el).render(
    <QueryClientProvider client={queryClient}>
      <BuyButton templateId={templateId} label={label} />
    </QueryClientProvider>,
  );
});

// Token display on success page
const params = new URLSearchParams(window.location.search);
const sessionId = params.get("session_id");
if (window.location.pathname === "/success" && sessionId) {
  mountTo("license-display", <TokenDisplay sessionId={sessionId} />);
}

// Auto-buy after auth redirect
if (window.location.pathname === "/templates" && params.get("buy")) {
  mountTo("auto-buy-root", <AutoBuy />);
}

// Dashboard
if (window.location.pathname === "/dashboard") {
  mountTo("dashboard-content", <DashboardContent />);
  mountTo("dashboard-nav-auth", <DashboardNavAuth />);
}
