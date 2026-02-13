import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider, useQuery, useMutation } from "@tanstack/react-query";
import { authClient } from "./lib/auth-client.js";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./components/ui/dialog.js";
import { Button } from "./components/ui/button.js";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
});

const API = (window as any).__API_URL || "";

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

function useCheckout() {
  return useMutation({
    mutationFn: async (templateId: string) => {
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

function useLicenseSession(sessionId: string | null) {
  return useQuery({
    queryKey: ["license", sessionId],
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
            Create an account to purchase templates and manage your licenses.
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

function LicenseDisplay({ sessionId }: { sessionId: string }) {
  const { data } = useLicenseSession(sessionId);

  if (!data?.licenseKey) {
    return <p className="text-neutral-500">Loading license...</p>;
  }

  return (
    <div>
      <p className="text-xs text-neutral-500 mb-2">{data.templateName}</p>
      <code className="text-green-400 text-lg select-all">{data.licenseKey}</code>
      <p className="mt-4 text-sm text-neutral-400">
        npx seclaw add {data.templateId} --key {data.licenseKey}
      </p>
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

// License display on success page
const params = new URLSearchParams(window.location.search);
const sessionId = params.get("session_id");
if (window.location.pathname === "/success" && sessionId) {
  mountTo("license-display", <LicenseDisplay sessionId={sessionId} />);
}

// Auto-buy after auth redirect
if (window.location.pathname === "/templates" && params.get("buy")) {
  mountTo("auto-buy-root", <AutoBuy />);
}
